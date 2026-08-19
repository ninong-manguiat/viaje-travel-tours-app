#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

const releaseType = process.argv[2];

if (!["minor", "major"].includes(releaseType)) {
  console.error("Usage: node scripts/bump-version.mjs <minor|major>");
  process.exit(1);
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const [major, minor] = pkg.version.split(".").map(Number);

pkg.version = releaseType === "major" ? `${major + 1}.1.0` : `${major}.${minor + 1}.0`;

writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`Version bumped to ${pkg.version}`);
