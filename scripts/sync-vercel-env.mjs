#!/usr/bin/env node
/**
 * Sync Cliniko + demo auth env vars from .env.local to Vercel.
 *
 * Requires: npx vercel login && npx vercel link (once per machine)
 * Usage:    node scripts/sync-vercel-env.mjs
 *           node scripts/sync-vercel-env.mjs --dry-run
 *
 * Copies only server-side keys needed for the Cliniko test account and staff gate.
 * Never prints secret values.
 */

import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = join(ROOT, ".env.local");
const dryRun = process.argv.includes("--dry-run");

const KEYS = [
  "CLINIKO_API_KEY",
  "CLINIKO_SHARD",
  "CLINIKO_USER_AGENT",
  "CLINIKO_ENABLE_WRITES",
  "DEMO_STAFF_PASSWORD",
  "DEMO_SESSION_SECRET",
  "NEXT_PUBLIC_DEMO_MODE",
];

function parseEnvFile(path) {
  /** @type {Record<string, string>} */
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = parseEnvFile(ENV_PATH);
const missing = KEYS.filter((k) => !env[k]?.trim());

if (!existsSync(ENV_PATH)) {
  console.error("No .env.local found. Copy .env.local.example and add your Cliniko test account key.");
  process.exit(1);
}

if (missing.length > 0) {
  console.error(`Missing in .env.local: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(
  dryRun
    ? "Dry run — would sync these keys to Vercel (production + preview):"
    : "Syncing to Vercel (production + preview):"
);
for (const key of KEYS) console.log(`  • ${key}`);

if (dryRun) {
  console.log("\nRun without --dry-run after: npx vercel login && npx vercel link");
  process.exit(0);
}

for (const key of KEYS) {
  for (const target of ["production", "preview"]) {
    const result = spawnSync(
      "npx",
      ["vercel", "env", "add", key, target, "--force"],
      {
        cwd: ROOT,
        input: env[key],
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    );
    if (result.status !== 0) {
      console.error(`Failed to set ${key} (${target}): ${result.stderr || result.stdout}`);
      console.error("Run: npx vercel login && npx vercel link");
      process.exit(1);
    }
  }
}

console.log("\nDone. Redeploy production for changes to take effect:");
console.log("  npx vercel --prod");
