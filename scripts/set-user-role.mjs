#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const [environment, email, role] = process.argv.slice(2);

if (!["qa", "prod"].includes(environment) || !email || !["admin", "client"].includes(role)) {
  console.error("Usage: node scripts/set-user-role.mjs <qa|prod> <email> <admin|client>");
  process.exit(1);
}

const envFile = `.env.${environment}`;

if (!existsSync(envFile)) {
  console.error(`Missing ${envFile}.`);
  process.exit(1);
}

for (const line of readFileSync(envFile, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  const index = trimmed.indexOf("=");
  if (index === -1) continue;

  process.env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: required("FIREBASE_PROJECT_ID"),
        clientEmail: required("FIREBASE_CLIENT_EMAIL"),
        privateKey: required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n")
      })
    });

const auth = getAuth(app);
const db = getFirestore(app);
const user = await auth.getUserByEmail(email);
const currentClaims = user.customClaims ?? {};

await auth.setCustomUserClaims(user.uid, { ...currentClaims, role });
await db.collection("users").doc(user.uid).set(
  {
    email: user.email,
    fullName: user.displayName ?? user.email ?? "",
    role,
    accountStatus: "active",
    updatedAt: new Date().toISOString()
  },
  { merge: true }
);

console.log(`Set ${email} (${user.uid}) role to ${role} in ${environment}.`);
