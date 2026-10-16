#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";

const CONFIRMATION = "DELETE_TRANSACTIONAL_DATA";
const BATCH_LIMIT = 400;
const TARGET_COLLECTIONS = [
  "bookingDrafts",
  "bookings",
  "payments",
  "transactions",
  "quotations",
  "quotationItems",
  "documentBins",
  "emailLogs",
];
const ACTIVITY_MODULES = new Set(["bookings", "payments", "quotations", "documents"]);
const PROTECTED_COLLECTIONS = ["websiteContent", "packages", "paymentMethods", "users", "airlines"];

const args = process.argv.slice(2);
const environment = args.find((arg) => !arg.startsWith("--"));
const apply = args.includes("--apply");
const deleteR2 = args.includes("--delete-r2");
const confirmation = args.find((arg) => arg.startsWith("--confirm="))?.slice("--confirm=".length);
const restorePath = args.find((arg) => arg.startsWith("--restore="))?.slice("--restore=".length);
const help = args.includes("--help") || args.includes("-h");

function usage() {
  console.log(`
Usage:
  node scripts/cleanup-transactional-data.mjs <qa|prod>
  node scripts/cleanup-transactional-data.mjs <qa|prod> --apply --confirm=${CONFIRMATION}
  node scripts/cleanup-transactional-data.mjs <qa|prod> --apply --delete-r2 --confirm=${CONFIRMATION}
  node scripts/cleanup-transactional-data.mjs <qa|prod> --restore=/absolute/path/to/backup.json --apply --confirm=${CONFIRMATION}

Modes:
  default       Dry run only. Lists affected Firestore documents and eligible R2 objects.
  --apply       Creates a local JSON backup, then deletes only transactional Firestore records.
  --delete-r2   With --apply, deletes only verified transactional R2 objects after Firestore cleanup.
  --restore     Restores Firestore documents from a backup created by this script. It never restores R2 objects.

Protected collections, Firebase Authentication users, and all website/package/payment-method data are never modified.
`);
}

if (help) {
  usage();
  process.exit(0);
}

if (!['qa', 'prod'].includes(environment || '')) {
  usage();
  process.exit(1);
}

if ((apply || restorePath) && confirmation !== CONFIRMATION) {
  console.error(`Refusing destructive operation. Pass --apply --confirm=${CONFIRMATION}.`);
  process.exit(1);
}

if (restorePath && deleteR2) {
  console.error("--delete-r2 cannot be used with --restore.");
  process.exit(1);
}

if (restorePath && !apply) {
  console.error("--restore requires --apply and the explicit confirmation token.");
  process.exit(1);
}

if (deleteR2 && !apply) {
  console.error("--delete-r2 requires --apply and the explicit confirmation token.");
  process.exit(1);
}

function loadEnv(environmentName) {
  const envFile = `.env.${environmentName}`;
  if (!existsSync(envFile)) throw new Error(`Missing ${envFile}.`);

  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index > 0) process.env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function initializeFirestore() {
  const app = getApps()[0] || initializeApp({
    credential: cert({
      projectId: required("FIREBASE_PROJECT_ID"),
      clientEmail: required("FIREBASE_CLIENT_EMAIL"),
      privateKey: required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  });
  return getFirestore(app);
}

function r2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${required("CLOUDFLARE_R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: required("CLOUDFLARE_R2_ACCESS_KEY_ID"),
      secretAccessKey: required("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
    },
  });
}

function serializeValue(value) {
  if (value instanceof Date) return { __viajeType: "date", value: value.toISOString() };
  if (value && typeof value === "object" && typeof value.toDate === "function" && typeof value.seconds === "number") {
    return { __viajeType: "timestamp", seconds: value.seconds, nanoseconds: value.nanoseconds || 0 };
  }
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializeValue(item)]));
  return value;
}

function deserializeValue(value) {
  if (Array.isArray(value)) return value.map(deserializeValue);
  if (!value || typeof value !== "object") return value;
  if (value.__viajeType === "timestamp") return new Timestamp(value.seconds, value.nanoseconds);
  if (value.__viajeType === "date") return new Date(value.value);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deserializeValue(item)]));
}

function rootCollection(path) {
  return path.split("/")[0];
}

function pathDepth(path) {
  return path.split("/").length;
}

function collectStrings(value, values = []) {
  if (typeof value === "string") values.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, values));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectStrings(item, values));
  return values;
}

function r2KeyFromUrl(url) {
  const baseUrl = String(process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  if (!baseUrl || !url.startsWith(`${baseUrl}/`)) return "";
  return url.slice(baseUrl.length).replace(/^\/+/, "");
}

function addR2Candidate(candidates, bucket, key, source, allowedPrefix) {
  if (!key || !key.startsWith(allowedPrefix)) return;
  const id = `${bucket}:${key}`;
  const existing = candidates.get(id) || { bucket, key, sources: [] };
  existing.sources.push(source);
  candidates.set(id, existing);
}

function collectR2Candidates(record, candidates) {
  const { path, data } = record;
  if (rootCollection(path) === "payments") {
    const key = r2KeyFromUrl(String(data.receiptUrl || ""));
    for (const prefix of ["payment-proofs/", "booking-payment-proofs/", "quotation-payment-proofs/"]) {
      addR2Candidate(candidates, "paymentReceipts", key, path, prefix);
    }
  }

  if (rootCollection(path) === "bookings") {
    const paymentKey = r2KeyFromUrl(String(data.paymentInfo?.receiptUrl || ""));
    for (const prefix of ["payment-proofs/", "booking-payment-proofs/", "quotation-payment-proofs/"]) {
      addR2Candidate(candidates, "paymentReceipts", paymentKey, path, prefix);
    }
    for (const requirement of Array.isArray(data.documentRequirements) ? data.documentRequirements : []) {
      const key = r2KeyFromUrl(String(requirement.uploadedFileUrl || ""));
      addR2Candidate(candidates, "travelDocuments", key, path, `booking-documents/${path.split("/")[1]}/`);
    }
  }

  if (rootCollection(path) === "documentBins") {
    for (const requirement of Array.isArray(data.requirements) ? data.requirements : []) {
      for (const upload of Array.isArray(requirement.uploads) ? requirement.uploads : []) {
        const id = path.split("/")[1];
        const key = String(upload.storageKey || "") || r2KeyFromUrl(String(upload.fileUrl || ""));
        addR2Candidate(candidates, "travelDocuments", key, path, `document-bins/${id}/`);
      }
    }
  }
}

async function scanDocument(doc, records) {
  records.push({ path: doc.ref.path, data: doc.data() });
  const subcollections = await doc.ref.listCollections();
  for (const subcollection of subcollections) {
    const snapshot = await subcollection.get();
    for (const child of snapshot.docs) await scanDocument(child, records);
  }
}

async function scanTargetedData(db, includeSubcollections) {
  const records = [];
  for (const collectionName of TARGET_COLLECTIONS) {
    const snapshot = await db.collection(collectionName).get();
    for (const doc of snapshot.docs) {
      if (includeSubcollections) await scanDocument(doc, records);
      else records.push({ path: doc.ref.path, data: doc.data() });
    }
  }

  const activities = await db.collection("activityLogs").get();
  for (const doc of activities.docs) {
    if (ACTIVITY_MODULES.has(String(doc.data().module || "").toLowerCase())) {
      if (includeSubcollections) await scanDocument(doc, records);
      else records.push({ path: doc.ref.path, data: doc.data() });
    }
  }
  return records;
}

async function scanProtectedReferences(db) {
  const references = new Set();
  for (const collectionName of PROTECTED_COLLECTIONS) {
    const snapshot = await db.collection(collectionName).get();
    for (const doc of snapshot.docs) {
      for (const value of collectStrings(doc.data())) {
        const key = r2KeyFromUrl(value);
        if (key) references.add(key);
      }
    }
  }
  return references;
}

function summaryByCollection(records) {
  return Object.fromEntries([...new Set([...TARGET_COLLECTIONS, "activityLogs"])]
    .map((collectionName) => [collectionName, records.filter((record) => rootCollection(record.path) === collectionName).length]));
}

async function writeBackup(environmentName, records, r2Candidates) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = resolve("backups", "transactional-cleanup", environmentName, `${stamp}.json`);
  await mkdir(dirname(backupPath), { recursive: true });
  const backup = {
    version: 1,
    environment: environmentName,
    createdAt: new Date().toISOString(),
    note: "Firestore backup before transactional cleanup. R2 objects are listed as metadata only.",
    documents: records.map((record) => ({ path: record.path, data: serializeValue(record.data) })),
    r2Candidates,
  };
  await writeFile(backupPath, `${JSON.stringify(backup, null, 2)}\n`, { mode: 0o600 });
  return backupPath;
}

async function deleteDocuments(db, records) {
  const ordered = [...records].sort((a, b) => pathDepth(b.path) - pathDepth(a.path));
  let deleted = 0;
  const failures = [];
  for (let start = 0; start < ordered.length; start += BATCH_LIMIT) {
    const batchRecords = ordered.slice(start, start + BATCH_LIMIT);
    const batch = db.batch();
    for (const record of batchRecords) batch.delete(db.doc(record.path));
    try {
      await batch.commit();
      deleted += batchRecords.length;
    } catch (error) {
      for (const record of batchRecords) {
        try {
          await db.doc(record.path).delete();
          deleted += 1;
        } catch (documentError) {
          failures.push({ path: record.path, error: documentError instanceof Error ? documentError.message : String(documentError) });
        }
      }
    }
  }
  return { deleted, failures };
}

async function deleteR2Candidates(candidates) {
  const client = r2Client();
  const bucketEnv = {
    paymentReceipts: "CLOUDFLARE_R2_PAYMENT_RECEIPTS_BUCKET",
    travelDocuments: "CLOUDFLARE_R2_TRAVEL_DOCUMENTS_BUCKET",
  };
  const failures = [];
  let deleted = 0;
  for (const bucket of Object.keys(bucketEnv)) {
    const keys = candidates.filter((candidate) => candidate.bucket === bucket).map((candidate) => candidate.key);
    for (let start = 0; start < keys.length; start += 1000) {
      const chunk = keys.slice(start, start + 1000);
      try {
        const response = await client.send(new DeleteObjectsCommand({
          Bucket: required(bucketEnv[bucket]),
          Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
        }));
        deleted += chunk.length - (response.Errors?.length || 0);
        for (const error of response.Errors || []) failures.push({ key: error.Key || "", error: error.Message || "R2 deletion failed" });
      } catch (error) {
        for (const key of chunk) failures.push({ key, error: error instanceof Error ? error.message : String(error) });
      }
    }
  }
  return { deleted, failures };
}

async function restoreBackup(db, backupFile) {
  const backup = JSON.parse(await readFile(resolve(backupFile), "utf8"));
  if (backup.version !== 1 || !Array.isArray(backup.documents)) throw new Error("Unsupported cleanup backup file.");
  if (backup.environment !== environment) throw new Error(`Backup belongs to ${backup.environment}, not ${environment}.`);
  for (const record of backup.documents) {
    if (!TARGET_COLLECTIONS.includes(rootCollection(record.path)) && rootCollection(record.path) !== "activityLogs") {
      throw new Error(`Backup contains a protected path: ${record.path}`);
    }
  }
  let restored = 0;
  for (let start = 0; start < backup.documents.length; start += BATCH_LIMIT) {
    const batch = db.batch();
    for (const record of backup.documents.slice(start, start + BATCH_LIMIT)) batch.set(db.doc(record.path), deserializeValue(record.data));
    await batch.commit();
    restored += backup.documents.slice(start, start + BATCH_LIMIT).length;
  }
  console.log(`Restored ${restored} Firestore documents from ${resolve(backupFile)}.`);
}

loadEnv(environment);
const db = initializeFirestore();

try {
  console.log(`Starting ${apply ? "apply" : "dry run"} scan for ${environment}.`);
  if (restorePath) {
    await restoreBackup(db, restorePath);
  } else {
    const records = await scanTargetedData(db, apply);
    const protectedReferences = await scanProtectedReferences(db);
    const r2CandidateMap = new Map();
    for (const record of records) collectR2Candidates(record, r2CandidateMap);
    const r2Candidates = [...r2CandidateMap.values()].filter((candidate) => !protectedReferences.has(candidate.key));
    const skippedSharedR2 = [...r2CandidateMap.values()].filter((candidate) => protectedReferences.has(candidate.key));

    console.log(`Transactional cleanup - ${apply ? "APPLY" : "DRY RUN"}`);
    console.log(`Environment: ${environment}`);
    console.log(`Firestore documents targeted: ${records.length}`);
    console.log(JSON.stringify(summaryByCollection(records), null, 2));
    if (!apply) console.log("Dry-run counts cover top-level transactional records. Apply mode recursively discovers and deletes any subcollections first.");
    console.log(`Eligible R2 objects: ${r2Candidates.length}`);
    for (const candidate of r2Candidates) console.log(`R2 candidate: ${candidate.bucket}/${candidate.key} (${candidate.sources.join(", ")})`);
    console.log(`Shared/protected R2 objects skipped: ${skippedSharedR2.length}`);
    console.log(`Protected collections untouched: ${PROTECTED_COLLECTIONS.join(", ")}`);
    console.log("Firebase Authentication users are untouched.");

    if (!apply) {
      console.log(`Dry run complete. No Firestore or R2 data was modified. To apply, rerun with --apply --confirm=${CONFIRMATION}.`);
    } else {
      const backupPath = await writeBackup(environment, records, r2Candidates);
      console.log(`Backup written: ${backupPath}`);
      const firestoreResult = await deleteDocuments(db, records);
      console.log(`Firestore documents deleted: ${firestoreResult.deleted}`);
      if (firestoreResult.failures.length) console.error(JSON.stringify({ firestoreFailures: firestoreResult.failures }, null, 2));

      if (deleteR2) {
        const r2Result = await deleteR2Candidates(r2Candidates);
        console.log(`R2 objects deleted: ${r2Result.deleted}`);
        if (r2Result.failures.length) console.error(JSON.stringify({ r2Failures: r2Result.failures }, null, 2));
      }

      if (firestoreResult.failures.length) process.exitCode = 2;
    }
  }
} finally {
  await db.terminate();
}
