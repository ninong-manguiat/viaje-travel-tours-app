#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const OLD_DOMAIN = "https://pub-0330102d080f445d890536175c67ae34.r2.dev";
const NEW_DOMAIN = "https://media.viajetravelandtours.com";
const BATCH_LIMIT = 400;

const SEEDED_COLLECTIONS = [
  "bookingDrafts",
  "bookings",
  "documentBins",
  "emailLogs",
  "packages",
  "paymentMethods",
  "payments",
  "quotationItems",
  "quotations",
  "transactions",
  "users",
  "websiteContent",
];

const args = process.argv.slice(2);
const environment = args.find((arg) => !arg.startsWith("--"));
const apply = args.includes("--apply");
const verify = args.includes("--verify");
const help = args.includes("--help") || args.includes("-h");
const explicitCollections = args
  .find((arg) => arg.startsWith("--collections="))
  ?.slice("--collections=".length)
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

function usage() {
  console.log(`
Usage:
  node scripts/migrate-r2-public-domain.mjs <qa|prod> [--apply|--verify] [--collections=name,name]

Modes:
  default     Dry run only. No Firestore writes are performed.
  --apply    Apply the exact domain replacement to matching documents.
  --verify   Scan only and exit 1 if old-domain occurrences still exist.

Replacement:
  ${OLD_DOMAIN}
  -> ${NEW_DOMAIN}
`);
}

if (help) {
  usage();
  process.exit(0);
}

if (!["qa", "prod"].includes(environment || "")) {
  usage();
  process.exit(1);
}

if (apply && verify) {
  console.error("Choose only one mode: --apply or --verify.");
  process.exit(1);
}

function loadEnv(environmentName) {
  const envFile = `.env.${environmentName}`;
  if (!existsSync(envFile)) {
    console.error(`Missing ${envFile}. Copy ${envFile}.example and fill in the values first.`);
    process.exit(1);
  }

  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    process.env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function initializeFirestore() {
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: required("FIREBASE_PROJECT_ID"),
          clientEmail: required("FIREBASE_CLIENT_EMAIL"),
          privateKey: required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
        }),
      });

  return getFirestore(app);
}

function isPlainObject(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  return Object.getPrototypeOf(value) === Object.prototype;
}

function replaceString(value) {
  return value.includes(OLD_DOMAIN) ? value.split(OLD_DOMAIN).join(NEW_DOMAIN) : value;
}

function inspectValue(value, path) {
  if (typeof value === "string") {
    const next = replaceString(value);
    return {
      changed: next !== value,
      value: next,
      occurrences: next !== value ? value.split(OLD_DOMAIN).length - 1 : 0,
      matches: next !== value ? [{ fieldPath: path || "(document)", oldValue: value, newValue: next }] : [],
    };
  }

  if (Array.isArray(value)) {
    let changed = false;
    let occurrences = 0;
    const matches = [];
    const next = value.map((item, index) => {
      const result = inspectValue(item, `${path}[${index}]`);
      if (result.changed) changed = true;
      occurrences += result.occurrences;
      matches.push(...result.matches);
      return result.value;
    });
    return { changed, value: changed ? next : value, occurrences, matches };
  }

  if (isPlainObject(value)) {
    let changed = false;
    let occurrences = 0;
    const matches = [];
    const next = {};
    for (const [key, item] of Object.entries(value)) {
      const childPath = path ? `${path}.${key}` : key;
      const result = inspectValue(item, childPath);
      if (result.changed) changed = true;
      occurrences += result.occurrences;
      matches.push(...result.matches);
      next[key] = result.value;
    }
    return { changed, value: changed ? next : value, occurrences, matches };
  }

  return { changed: false, value, occurrences: 0, matches: [] };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function changedTopLevelFields(data) {
  const updates = {};
  const matches = [];
  let occurrences = 0;

  for (const [key, value] of Object.entries(data)) {
    const result = inspectValue(value, key);
    if (result.changed) updates[key] = result.value;
    occurrences += result.occurrences;
    matches.push(...result.matches);
  }

  return { updates, matches, occurrences };
}

async function discoverCollections(db) {
  if (explicitCollections?.length) return explicitCollections;

  const discovered = await db.listCollections();
  return [...new Set([...SEEDED_COLLECTIONS, ...discovered.map((collection) => collection.id)])].sort();
}

async function scanCollectionRef(collectionRef, context) {
  const snapshot = await collectionRef.get();
  context.documentsScanned += snapshot.size;

  for (const doc of snapshot.docs) {
    const collectionPath = collectionRef.path;
    const docPath = doc.ref.path;
    const data = doc.data();
    const result = changedTopLevelFields(data);

    if (result.matches.length) {
      context.documentsWithMatches += 1;
      context.documentsToUpdate += 1;
      context.totalOccurrences += result.occurrences;

      for (const match of result.matches) {
        console.log(JSON.stringify({
          collection: collectionPath,
          documentId: doc.id,
          documentPath: docPath,
          fieldPath: match.fieldPath,
          oldValue: match.oldValue,
          proposedNewValue: match.newValue,
        }));
      }

      if (apply) {
        context.pendingBatch.update(doc.ref, result.updates);
        context.pendingDocuments.push({ ref: doc.ref, collection: collectionPath, documentId: doc.id, updates: result.updates });
        context.pendingWrites += 1;
        if (context.pendingWrites >= BATCH_LIMIT) await commitBatch(context);
      }
    }

    const subcollections = await doc.ref.listCollections();
    for (const subcollection of subcollections) {
      await scanCollectionRef(subcollection, context);
    }
  }
}

async function commitBatch(context) {
  if (!context.pendingWrites) return;
  const pendingDocuments = context.pendingDocuments;
  try {
    await context.pendingBatch.commit();
    context.documentsUpdated += context.pendingWrites;
  } catch (error) {
    console.error(`[batch failure] ${error instanceof Error ? error.message : String(error)}`);
    console.error("Retrying failed batch one document at a time to identify exact failures.");

    for (const item of pendingDocuments) {
      try {
        await item.ref.update(item.updates);
        context.documentsUpdated += 1;
      } catch (documentError) {
        const message = documentError instanceof Error ? documentError.message : String(documentError);
        context.failures.push({
          collection: item.collection,
          documentId: item.documentId,
          error: message,
        });
        console.error(`[document failure] ${item.collection}/${item.documentId}: ${message}`);
      }
    }
  }
  context.pendingBatch = context.db.batch();
  context.pendingDocuments = [];
  context.pendingWrites = 0;
}

loadEnv(environment);
const db = initializeFirestore();
const collections = await discoverCollections(db);

const mode = apply ? "APPLY" : verify ? "VERIFY" : "DRY RUN";
console.log(`R2 public domain migration - ${mode}`);
console.log(`Environment: ${environment}`);
console.log(`Old domain: ${OLD_DOMAIN}`);
console.log(`New domain: ${NEW_DOMAIN}`);
console.log(`Collections: ${collections.join(", ")}`);
console.log("");

const context = {
  db,
  documentsScanned: 0,
  documentsWithMatches: 0,
  documentsToUpdate: 0,
  documentsUpdated: 0,
  totalOccurrences: 0,
  failures: [],
  pendingBatch: db.batch(),
  pendingDocuments: [],
  pendingWrites: 0,
};

for (const collectionName of collections) {
  try {
    await scanCollectionRef(db.collection(collectionName), context);
  } catch (error) {
    context.failures.push({
      collection: collectionName,
      documentId: "(collection scan)",
      error: error instanceof Error ? error.message : String(error),
    });
    console.error(`[collection failure] ${collectionName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (apply) await commitBatch(context);

console.log("");
console.log("Summary");
console.log(`Documents scanned: ${context.documentsScanned}`);
console.log(`Documents containing old R2 URLs: ${context.documentsWithMatches}`);
console.log(`Total URL occurrences found: ${context.totalOccurrences}`);
console.log(`Documents that would be updated: ${context.documentsToUpdate}`);
if (apply) console.log(`Documents updated: ${context.documentsUpdated}`);
console.log(`Failures: ${context.failures.length}`);

if (context.failures.length) {
  for (const failure of context.failures) {
    console.error(JSON.stringify(failure));
  }
}

if (verify && context.totalOccurrences !== 0) {
  console.error(`Verification failed: ${context.totalOccurrences} old-domain occurrence(s) remain.`);
  process.exit(2);
}

if (verify) console.log("Verification passed: 0 old-domain occurrences found.");
