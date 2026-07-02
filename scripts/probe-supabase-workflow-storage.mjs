#!/usr/bin/env node
/**
 * Preflight Supabase workflow storage before Vercel deploy.
 * Reads .env.local server-side keys only — never prints secret values.
 *
 * Usage:
 *   node scripts/probe-supabase-workflow-storage.mjs
 */

import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = join(ROOT, ".env.local");

const REQUIRED_SECRET_KEYS = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"];
const REQUIRED_URL_KEYS = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"];

const OPTIONAL_DEFAULTS = {
  COMMAND_HUB_SUPABASE_TABLE: "command_hub_workflow_state",
  COMMAND_HUB_WORKFLOW_STORE_ID: "tigers-eye-demo",
};

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

function classifyError(status, bodyText) {
  const snippet = bodyText.slice(0, 200);
  if (status === 401 || status === 403) {
    return "Supabase authentication failed — check SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.";
  }
  if (status === 404 || /PGRST205/i.test(snippet) || /relation .* does not exist/i.test(snippet)) {
    return "Supabase table missing — run the SQL in docs/WORKFLOW_STORAGE.md.";
  }
  if (status >= 500) {
    return "Supabase server error — check project status.";
  }
  return `Supabase request failed (HTTP ${status}).`;
}

const env = parseEnvFile(ENV_PATH);

function firstEnvValue(keys) {
  for (const key of keys) {
    const val = env[key]?.trim();
    if (val) return val;
  }
  return null;
}

const missing = [];
if (!firstEnvValue(REQUIRED_URL_KEYS)) missing.push("SUPABASE_URL");
if (!firstEnvValue(REQUIRED_SECRET_KEYS)) {
  missing.push("SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)");
}

if (!existsSync(ENV_PATH)) {
  console.error("No .env.local found.");
  process.exit(1);
}

if (missing.length > 0) {
  console.error("Missing required Supabase env vars in .env.local:");
  for (const key of missing) console.error(`  • ${key}`);
  console.error("\nAlso set:");
  console.error("  • COMMAND_HUB_WORKFLOW_STORAGE=supabase");
  console.error("  • COMMAND_HUB_SUPABASE_TABLE=command_hub_workflow_state (optional)");
  console.error("  • COMMAND_HUB_WORKFLOW_STORE_ID=tigers-eye-demo (optional)");
  console.error("\nSee docs/WORKFLOW_STORAGE.md for setup SQL and Vercel guidance.");
  process.exit(1);
}

const url = firstEnvValue(REQUIRED_URL_KEYS).replace(/\/$/, "");
const serviceKey = firstEnvValue(REQUIRED_SECRET_KEYS);
const table = env.COMMAND_HUB_SUPABASE_TABLE?.trim() || OPTIONAL_DEFAULTS.COMMAND_HUB_SUPABASE_TABLE;
const storeId = env.COMMAND_HUB_WORKFLOW_STORE_ID?.trim() || OPTIONAL_DEFAULTS.COMMAND_HUB_WORKFLOW_STORE_ID;
const restUrl = `${url}/rest/v1/${table}`;
const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
};

console.log("Supabase workflow storage preflight");
console.log(`  project:   ${url}`);
console.log(`  table:     ${table}`);
console.log(`  store id:  ${storeId}`);

let canRead = false;
let canWrite = false;

try {
  const readRes = await fetch(`${restUrl}?id=eq.${encodeURIComponent(storeId)}&select=id,updated_at`, {
    headers: { ...headers, Accept: "application/json" },
    cache: "no-store",
  });
  const readBody = await readRes.text();
  if (!readRes.ok) {
    console.error(`\nFAIL read: ${classifyError(readRes.status, readBody)}`);
    process.exit(1);
  }
  canRead = true;
  const rows = readBody.trim() ? JSON.parse(readBody) : [];
  console.log(`  read:      ok (${rows.length ? "row exists" : "no row yet — will seed on first write"})`);
} catch (err) {
  console.error("\nFAIL read:", err instanceof Error ? err.message : err);
  process.exit(1);
}

try {
  const probeAt = new Date().toISOString();
  const body = {
    id: storeId,
    store: {
      version: 1,
      storageHealthCheckAt: probeAt,
      appointmentRecords: {},
      insuranceCases: {},
      demoWeekPreview: false,
    },
    updated_at: probeAt,
  };

  const writeRes = await fetch(restUrl, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!writeRes.ok) {
    const writeBody = await writeRes.text().catch(() => "");
    console.error(`\nFAIL write: ${classifyError(writeRes.status, writeBody)}`);
    process.exit(1);
  }

  const verifyRes = await fetch(
    `${restUrl}?id=eq.${encodeURIComponent(storeId)}&select=store->storageHealthCheckAt`,
    { headers: { ...headers, Accept: "application/json" }, cache: "no-store" }
  );
  const verifyBody = await verifyRes.text();
  if (!verifyRes.ok) {
    console.error(`\nFAIL read-back: ${classifyError(verifyRes.status, verifyBody)}`);
    process.exit(1);
  }

  const verifyRows = JSON.parse(verifyBody);
  if (verifyRows[0]?.storageHealthCheckAt !== probeAt) {
    console.error("\nFAIL read-back: storageHealthCheckAt mismatch after write.");
    process.exit(1);
  }

  canWrite = true;
  console.log("  write:     ok (health-check upsert + read-back verified)");
} catch (err) {
  console.error("\nFAIL write:", err instanceof Error ? err.message : err);
  process.exit(1);
}

if (canRead && canWrite) {
  console.log("\nPASS — Supabase is ready for COMMAND_HUB_WORKFLOW_STORAGE=supabase");
  console.log("Next: node scripts/sync-vercel-env.mjs --supabase && npx vercel --prod");
  process.exit(0);
}

process.exit(1);
