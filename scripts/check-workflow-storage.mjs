#!/usr/bin/env node
/**
 * Command Hub workflow storage verification.
 *
 * Usage:
 *   DEMO_STAFF_PASSWORD=... node scripts/check-workflow-storage.mjs
 *   DEMO_STAFF_PASSWORD=... node scripts/check-workflow-storage.mjs --base-url=https://tigers-eye-command-hub.vercel.app --expect-durable
 */

import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

function loadDemoStaffPasswordFromEnvLocal() {
  if (process.env.DEMO_STAFF_PASSWORD?.trim()) return;
  const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== "DEMO_STAFF_PASSWORD") continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (val) process.env.DEMO_STAFF_PASSWORD = val;
    break;
  }
}

function parseArgs(argv) {
  let baseUrl = process.env.BASE_URL || "http://localhost:3000";
  let expectDurable = process.env.EXPECT_DURABLE_WORKFLOW_STORAGE === "true";

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--expect-durable") {
      expectDurable = true;
      continue;
    }
    if (arg.startsWith("--base-url=")) {
      baseUrl = arg.slice("--base-url=".length);
    }
  }

  return { baseUrl: baseUrl.replace(/\/$/, ""), expectDurable };
}

function parseSetCookie(setCookie) {
  if (!setCookie) return null;
  const parts = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const part of parts) {
    const match = part.match(/demo_staff_session=([^;]+)/);
    if (match) return `demo_staff_session=${match[1]}`;
  }
  return null;
}

async function staffLogin(baseUrl, password) {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) return null;
  const setCookie =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie");
  return parseSetCookie(setCookie);
}

loadDemoStaffPasswordFromEnvLocal();
const { baseUrl, expectDurable } = parseArgs(process.argv);
const password = process.env.DEMO_STAFF_PASSWORD?.trim() || "";

if (!password) {
  console.error("DEMO_STAFF_PASSWORD is required.");
  process.exit(1);
}

const cookie = await staffLogin(baseUrl, password);
if (!cookie) {
  console.error("Staff login failed.");
  process.exit(1);
}

const res = await fetch(`${baseUrl}/api/command-hub/workflow-storage/status`, {
  headers: { Cookie: cookie, Accept: "application/json" },
  cache: "no-store",
});

const json = await res.json();
if (!res.ok || json.ok !== true) {
  console.error("Workflow storage status request failed:", json.message ?? res.status);
  process.exit(1);
}

const { storage, canRead, canWrite, lastChecked, message } = json;

console.log(`Workflow storage check — ${baseUrl}`);
console.log(`  mode:        ${storage?.mode ?? "unknown"}`);
console.log(`  durability:  ${storage?.durability ?? "unknown"}`);
console.log(`  configured:  ${storage?.configured ? "yes" : "no"}`);
console.log(`  canRead:     ${canRead ? "yes" : "no"}`);
console.log(`  canWrite:    ${canWrite ? "yes" : "no"}`);
console.log(`  lastChecked: ${lastChecked ?? "unknown"}`);
console.log(`  message:     ${message ?? storage?.description ?? ""}`);

if (expectDurable) {
  if (storage?.durability !== "durable") {
    console.error("\nFAIL: EXPECT_DURABLE_WORKFLOW_STORAGE requires storage.durability === durable");
    process.exit(1);
  }
  if (storage?.mode !== "supabase") {
    console.error("\nFAIL: EXPECT_DURABLE_WORKFLOW_STORAGE requires storage.mode === supabase");
    process.exit(1);
  }
  if (!canRead || !canWrite) {
    console.error("\nFAIL: durable Supabase storage must pass read and write verification");
    process.exit(1);
  }
}

console.log("\nPASS");
