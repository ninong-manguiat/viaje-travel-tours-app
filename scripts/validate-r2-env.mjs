#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const [environment] = process.argv.slice(2);

if (!["qa", "prod"].includes(environment)) {
  console.error("Usage: node scripts/validate-r2-env.mjs <qa|prod>");
  process.exit(1);
}

const envFile = `.env.${environment}`;

if (!existsSync(envFile)) {
  console.error(`Missing ${envFile}. Copy ${envFile}.example and fill in the Cloudflare R2 values.`);
  process.exit(1);
}

const values = new Map();

for (const line of readFileSync(envFile, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  const index = trimmed.indexOf("=");
  if (index === -1) continue;

  values.set(trimmed.slice(0, index), trimmed.slice(index + 1));
}

const required = [
  "CLOUDFLARE_R2_ACCOUNT_ID",
  "CLOUDFLARE_R2_ACCESS_KEY_ID",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  "CLOUDFLARE_R2_PUBLIC_BASE_URL",
  "CLOUDFLARE_R2_PACKAGE_MEDIA_BUCKET",
  "CLOUDFLARE_R2_PAYMENT_RECEIPTS_BUCKET",
  "CLOUDFLARE_R2_TRAVEL_DOCUMENTS_BUCKET",
  "CLOUDFLARE_R2_GENERATED_PDFS_BUCKET",
  "CLOUDFLARE_R2_SITE_MEDIA_BUCKET"
];

const missing = required.filter((key) => !values.get(key));

if (missing.length) {
  console.error(`Missing Cloudflare R2 values in ${envFile}:`);
  for (const key of missing) console.error(`- ${key}`);
  process.exit(1);
}

console.log(`Cloudflare R2 env looks complete for ${environment}.`);
