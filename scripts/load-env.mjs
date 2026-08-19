#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const [environment, command, ...args] = process.argv.slice(2);

if (!environment || !command) {
  console.error("Usage: node scripts/load-env.mjs <qa|prod> <command> [...args]");
  process.exit(1);
}

if (!["qa", "prod"].includes(environment)) {
  console.error(`Unknown environment "${environment}". Use "qa" or "prod".`);
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
  const key = trimmed.slice(0, index);
  const value = trimmed.slice(index + 1);
  env[key] = value;
}

const result = spawnSync(command, args, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env
});

process.exit(result.status ?? 1);
