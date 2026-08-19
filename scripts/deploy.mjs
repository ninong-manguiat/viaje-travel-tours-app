#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const environment = process.argv[2] ?? process.env.APP_ENV;

if (!["qa", "prod"].includes(environment)) {
  console.error("Usage: npm run deploy -- <qa|prod> or npm run deploy:qa / npm run deploy:prod");
  process.exit(1);
}

const envFile = `.env.${environment}`;

if (!existsSync(envFile)) {
  console.error(`Missing ${envFile}. Copy ${envFile}.example and fill in the values first.`);
  process.exit(1);
}

const env = { ...process.env, APP_ENV: environment, NEXT_PUBLIC_APP_ENV: environment };

for (const line of readFileSync(envFile, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const index = trimmed.indexOf("=");
  if (index === -1) continue;
  env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
}

const projectId = env.FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error(`Missing FIREBASE_PROJECT_ID in ${envFile}.`);
  process.exit(1);
}

console.log(`Building Viaje for ${environment}...`);
let result = spawnSync("next", ["build"], { stdio: "inherit", shell: true, env });
if (result.status !== 0) process.exit(result.status ?? 1);

console.log(`Deploying Viaje to Firebase project ${projectId}...`);
result = spawnSync("firebase", ["deploy", "--only", "hosting,firestore:rules,firestore:indexes", "--project", projectId], {
  stdio: "inherit",
  shell: true,
  env
});

process.exit(result.status ?? 1);
