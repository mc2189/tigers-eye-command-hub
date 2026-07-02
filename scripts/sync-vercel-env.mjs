#!/usr/bin/env node
/**
 * Sync server env vars from .env.local to Vercel.
 *
 * Requires: npx vercel login && npx vercel link (once per machine)
 * Usage:    node scripts/sync-vercel-env.mjs
 *           node scripts/sync-vercel-env.mjs --dry-run
 *           node scripts/sync-vercel-env.mjs --supabase
 *           node scripts/sync-vercel-env.mjs --supabase --dry-run
 *
 * Copies server-side keys for Cliniko, demo auth, and optionally Supabase workflow storage.
 * Never prints secret values.
 */

import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = join(ROOT, ".env.local");
const dryRun = process.argv.includes("--dry-run");
const includeSupabase = process.argv.includes("--supabase");

const BASE_KEYS = [
  "CLINIKO_API_KEY",
  "CLINIKO_SHARD",
  "CLINIKO_USER_AGENT",
  "CLINIKO_ENABLE_WRITES",
  "DEMO_STAFF_PASSWORD",
  "DEMO_SESSION_SECRET",
  "NEXT_PUBLIC_DEMO_MODE",
];

const SUPABASE_KEYS = [
  "COMMAND_HUB_WORKFLOW_STORAGE",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "COMMAND_HUB_SUPABASE_TABLE",
  "COMMAND_HUB_WORKFLOW_STORE_ID",
];

const KEYS = includeSupabase ? [...BASE_KEYS, ...SUPABASE_KEYS] : BASE_KEYS;

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
let missing = KEYS.filter((k) => !env[k]?.trim());

if (includeSupabase) {
  const hasUrl = Boolean(env.SUPABASE_URL?.trim() || env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const hasSecret = Boolean(
    env.SUPABASE_SECRET_KEY?.trim() || env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
  missing = KEYS.filter((k) => !env[k]?.trim()).filter((k) => {
    if (k === "SUPABASE_URL") return !hasUrl;
    if (k === "SUPABASE_SECRET_KEY" || k === "SUPABASE_SERVICE_ROLE_KEY") return !hasSecret;
    return true;
  });
}

if (!existsSync(ENV_PATH)) {
  console.error("No .env.local found. Copy .env.local.example and add your Cliniko test account key.");
  process.exit(1);
}

if (missing.length > 0) {
  console.error(`Missing in .env.local: ${missing.join(", ")}`);
  if (includeSupabase) {
    console.error("\nFor Supabase durable storage, add:");
    console.error("  COMMAND_HUB_WORKFLOW_STORAGE=supabase");
    console.error("  SUPABASE_URL=https://<project-ref>.supabase.co");
    console.error("  SUPABASE_SECRET_KEY=<secret key from Connect dialog — not publishable>");
    console.error("  COMMAND_HUB_SUPABASE_TABLE=command_hub_workflow_state");
    console.error("  COMMAND_HUB_WORKFLOW_STORE_ID=tigers-eye-demo");
    console.error("\nRun: node scripts/probe-supabase-workflow-storage.mjs");
  }
  process.exit(1);
}

if (includeSupabase && env.COMMAND_HUB_WORKFLOW_STORAGE?.trim() !== "supabase") {
  console.warn(
    "Warning: COMMAND_HUB_WORKFLOW_STORAGE is not 'supabase' — production may not use durable storage."
  );
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
  if (!env[key]?.trim()) continue;
  if (
    includeSupabase &&
    key === "SUPABASE_SERVICE_ROLE_KEY" &&
    env.SUPABASE_SECRET_KEY?.trim()
  ) {
    continue;
  }
  if (
    includeSupabase &&
    key === "SUPABASE_SECRET_KEY" &&
    !env.SUPABASE_SECRET_KEY?.trim() &&
    env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  ) {
    continue;
  }
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
