import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

/**
 * Tigers Eye Command Hub — route smoke checker.
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/smoke-check.mjs
 *   BASE_URL=https://tigers-eye-command-hub.vercel.app node scripts/smoke-check.mjs
 *
 * Admin and Cliniko API routes require demo staff auth when configured.
 * Set DEMO_STAFF_PASSWORD (and ensure the server has matching auth env).
 * For local runs, DEMO_STAFF_PASSWORD is read from .env.local when not set in the shell.
 */

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

loadDemoStaffPasswordFromEnvLocal();

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const STAFF_PASSWORD = process.env.DEMO_STAFF_PASSWORD?.trim() || "";

const publicRoutes = [
  "/",
  "/book",
  "/services",
  "/locations",
  "/team",
  "/insurance",
  "/telehealth",
  "/contact",
];

const protectedRoutes = [
  "/admin/login",
  "/admin",
  "/admin/demo-walkthrough",
  "/admin/cliniko",
  "/admin/cliniko/test-lab",
  "/admin/calendar",
  "/admin/calendar/george",
  "/admin/calendar/practitioner-2",
  "/admin/bookings",
  "/admin/payments",
  "/admin/finance",
  "/admin/invoices",
  "/admin/invoices/demo-aviva",
  "/admin/insurance",
  "/admin/notes",
  "/admin/stock",
  "/admin/followups",
  "/admin/clients",
  "/admin/clients/demo-alex-wilson",
  "/admin/clients/demo-sarah-mckay",
  "/admin/intake",
  "/admin/appointments/dcw-001",
  "/admin/proof",
  "/admin/settings",
  "/api/command-hub/workflow-state",
  "/api/command-hub/workflow-storage/status",
  "/api/cliniko/status",
  "/api/cliniko/individual-appointments?perPage=10",
  "/api/cliniko/test-data",
];

/** @type {Record<string, (body: string) => string | null>} */
const contentChecks = {
  "/book": (body) => {
    const required = ["Dundee", "Aviemore", "Cliniko"];
    for (const term of required) {
      if (!body.includes(term)) return `missing "${term}"`;
    }
    const locationFirst =
      /location first|choose your clinic|where would you like/i.test(body);
    if (!locationFirst) return "missing location-first booking wording";
    if (/Book via\s*<strong>Setmore<\/strong>|uses Setmore|Aviemore uses Setmore/i.test(body)) {
      return "Setmore presented as active Aviemore booking provider";
    }
    if (body.includes("Setmore")) {
      const legacy = /legacy|transition|previous|retire|Previous Aviemore/i.test(body);
      if (!legacy) return "Setmore present without legacy/transition labelling";
    }
    return null;
  },
  "/locations": (body) => {
    for (const term of ["Dundee", "Aviemore", "Cliniko"]) {
      if (!body.includes(term)) return `missing "${term}"`;
    }
    if (body.includes("Setmore")) {
      const legacy = /legacy|transition|previous|retire|Previous Aviemore/i.test(body);
      if (!legacy) return "Setmore present without legacy/transition labelling";
    }
    return null;
  },
  "/admin/login": (body) => {
    if (!/staff login|Sign in to Command Hub|Command Hub/i.test(body)) {
      return "missing staff login wording";
    }
    return null;
  },
  "/admin": (body) => {
    if (!/Today at a glance/i.test(body)) return "missing Today at a glance";
    if (!/Urgent \/ needs action/i.test(body)) return "missing Urgent / needs action section";
    if (!/What this shows/i.test(body)) return "missing What this shows helper";
    if (!/Client journey/i.test(body)) return "missing Client journey section";
    if (!/Open record/i.test(body)) return "missing Open record action";
    return null;
  },
  "/admin/bookings": (body) => {
    if (!/Review appointments from Cliniko/i.test(body)) {
      return "missing bookings purpose line";
    }
    if (!/Needs attention/i.test(body)) return "missing Needs attention tab";
    if (!/Upcoming bookings|Today/i.test(body)) {
      return "missing Upcoming bookings or Today grouping";
    }
    if (body.includes("DEMO 0.")) return "contains broken label DEMO 0.";
    if (body.includes("DEMO (.")) return "contains broken label DEMO (.";
    if (!/Show all workflow actions/i.test(body)) {
      return "missing Show all workflow actions disclosure";
    }
    if (!/Note needed/i.test(body)) return "missing Note needed wording";
    if (!/Follow-up suggested/i.test(body)) return "missing Follow-up suggested wording";
    if (!/Open record/i.test(body)) return "missing Open record action";
    return null;
  },
  "/admin/notes": (body) => {
    if (!/Cliniko remains the clinical record/i.test(body)) {
      return "missing notes purpose line";
    }
    if (!/Appointments needing notes/i.test(body)) {
      return "missing Appointments needing notes section";
    }
    if (!/No audio stored/i.test(body)) return "missing No audio stored safety copy";
    if (!/Notes can only be saved for DEMO-linked patients/i.test(body)) {
      return "missing DEMO-linked save safety copy";
    }
    if (!/Open record/i.test(body)) return "missing Open record action";
    return null;
  },
  "/admin/payments": (body) => {
    if (!/Payment status is not connected yet/i.test(body)) {
      return "missing payment status disclaimer";
    }
    return null;
  },
  "/admin/finance": (body) => {
    if (!/operational planning only/i.test(body)) {
      return "missing operational planning disclaimer";
    }
    return null;
  },
  "/admin/invoices": (body) => {
    if (!/invoice or payment check|invoice check/i.test(body)) {
      return "missing invoices purpose/check wording";
    }
    if (!/Ready to invoice/i.test(body)) return "missing Ready to invoice section";
    if (!/Needs missing details/i.test(body)) return "missing Needs missing details section";
    if (!/Open invoice draft/i.test(body)) return "missing Open invoice draft action";
    if (!/Insurance invoice draft/i.test(body)) {
      return "missing Insurance invoice draft section";
    }
    if (!/Prepared invoice draft/i.test(body)) {
      return "missing Prepared invoice draft wording";
    }
    if (!/Future Xero integration/i.test(body)) {
      return "missing Future Xero integration wording";
    }
    if (!/Future Healthcode integration/i.test(body)) {
      return "missing Future Healthcode integration wording";
    }
    return null;
  },
  "/admin/invoices/demo-aviva": (body) => {
    if (!/Invoice draft/i.test(body)) return "missing Invoice draft heading";
    if (!/Copy invoice details/i.test(body)) return "missing Copy invoice details action";
    if (!/Download invoice draft as CSV/i.test(body)) {
      return "missing Download invoice draft as CSV action";
    }
    if (!/Prepared invoice draft/i.test(body)) {
      return "missing Prepared invoice draft wording";
    }
    return null;
  },
  "/admin/insurance": (body) => {
    if (!/Insurance cases/i.test(body)) return "missing Insurance cases title";
    if (!/approved sessions/i.test(body)) return "missing approved sessions wording";
    if (!/Sessions remaining/i.test(body)) return "missing Sessions remaining";
    if (!/Patient liability agreement/i.test(body)) {
      return "missing Patient liability agreement";
    }
    if (!/Demo case controls/i.test(body)) return "missing Demo case controls";
    if (!/Ready to invoice/i.test(body)) return "missing Ready to invoice tab";
    if (!/Insurance invoice draft/i.test(body)) {
      return "missing Insurance invoice draft wording";
    }
    if (!/Insurance storage audit/i.test(body)) return "missing Insurance storage audit";
    if (!/Command Hub demo case/i.test(body)) return "missing Command Hub demo case wording";
    if (!/Future Healthcode integration/i.test(body)) {
      return "missing Future Healthcode integration wording";
    }
    if (!/Future Xero integration/i.test(body)) {
      return "missing Future Xero integration wording";
    }
    if (!/Open invoice draft/i.test(body)) return "missing Open invoice draft action";
    if (!/server-side demo workflow state/i.test(body)) {
      return "missing server-side demo workflow state wording";
    }
    if (!/DEMO-CLAIM-001/i.test(body)) {
      return "missing saved insurance demo case (DEMO-CLAIM-001)";
    }
    return null;
  },
  "/admin/stock": (body) => {
    if (!/consumables|Estimated only/i.test(body)) {
      return "missing stock purpose/estimate wording";
    }
    return null;
  },
  "/admin/followups": (body) => {
    if (!/follow-up/i.test(body)) return "missing follow-up wording";
    if (!/Suggested by Command Hub/i.test(body)) {
      return "missing Suggested by Command Hub label";
    }
    return null;
  },
  "/admin/clients": (body) => {
    if (!/Client journeys/i.test(body)) return "missing Client journeys";
    if (!/Notes status/i.test(body)) return "missing Notes status";
    if (!/Invoice status/i.test(body)) return "missing Invoice status";
    if (!/Follow-up status/i.test(body)) return "missing Follow-up status";
    if (!/What this shows/i.test(body)) return "missing What this shows helper";
    if (!/Open client record/i.test(body)) return "missing Open client record action";
    return null;
  },
  "/admin/intake": (body) => {
    if (!/Booking intake/i.test(body)) return "missing Booking intake title";
    if (!/Saved to Cliniko test account/i.test(body)) {
      return "missing Saved to Cliniko test account wording";
    }
    if (!/Prepared for Cliniko/i.test(body)) return "missing Prepared for Cliniko wording";
    if (!/Blocked from writing/i.test(body)) return "missing Blocked from writing wording";
    if (!/field not currently written/i.test(body)) {
      return "missing field not currently written wording";
    }
    if (!/Suggested Cliniko match/i.test(body)) return "missing Suggested Cliniko match";
    if (!/Create new DEMO Cliniko patient/i.test(body)) {
      return "missing Create new DEMO Cliniko patient";
    }
    if (!/staff confirmation/i.test(body)) return "missing staff confirmation wording";
    if (!/Unsafe\/non-DEMO input blocked/i.test(body)) {
      return "missing Unsafe/non-DEMO input blocked scenario";
    }
    if (!/Field comparison/i.test(body)) return "missing Field comparison";
    if (!/Already matches Cliniko/i.test(body)) return "missing Already matches Cliniko";
    if (!/Missing in Cliniko/i.test(body)) return "missing Missing in Cliniko";
    if (!/Different from Cliniko/i.test(body)) return "missing Different from Cliniko";
    if (!/Update selected DEMO fields in Cliniko/i.test(body)) {
      return "missing Update selected DEMO fields in Cliniko";
    }
    if (!/Nothing is updated automatically/i.test(body)) {
      return "missing Nothing is updated automatically";
    }
    if (!/Blocked for safety/i.test(body)) return "missing Blocked for safety";
    return null;
  },
  "/admin/appointments/dcw-001": (body) => {
    if (!/Record completeness/i.test(body)) return "missing Record completeness section";
    if (!/Saved fields/i.test(body) && !/Saved to Cliniko test account/i.test(body)) {
      return "missing Saved fields section";
    }
    if (!/Prepared-only fields/i.test(body) && !/Prepared for Cliniko/i.test(body)) {
      return "missing Prepared-only fields section";
    }
    if (
      !/Book DEMO follow-up in Cliniko test account/i.test(body) &&
      !/Prepared follow-up appointment/i.test(body)
    ) {
      return "missing follow-up booking action";
    }
    if (!/Treatment note/i.test(body)) return "missing Treatment note section";
    if (!/Patient\/appointment link status/i.test(body)) {
      return "missing Patient/appointment link status";
    }
    if (
      !/Blocked for safety/i.test(body) &&
      !/Saved to Cliniko test account/i.test(body) &&
      !/Prepared for Cliniko/i.test(body)
    ) {
      return "missing note save status label";
    }
    if (!/Patient match status/i.test(body)) return "missing Patient match status";
    if (!/Patient details/i.test(body)) return "missing Patient details section";
    if (!/Review patient details/i.test(body)) return "missing Review patient details link";
    if (!/Follow-up/i.test(body)) return "missing Follow-up section";
    if (!/Invoice/i.test(body)) return "missing Invoice section";
    if (!/Open invoice draft/i.test(body) && !/Prepared invoice draft/i.test(body)) {
      return "missing Open invoice draft or Prepared invoice draft wording";
    }
    if (!/Command Hub demo case/i.test(body)) return "missing Command Hub demo case wording";
    if (!/server-side demo workflow state/i.test(body)) {
      return "missing server-side demo workflow state wording";
    }
    return null;
  },
  "/admin/clients/demo-alex-wilson": (body) => {
    if (!/Record completeness/i.test(body)) return "missing Record completeness section";
    if (!/Clinical record/i.test(body)) return "missing Clinical record section";
    if (!/Command Hub prepares note drafts/i.test(body)) {
      return "missing Command Hub prepares note drafts copy";
    }
    if (!/Client record reconciliation/i.test(body)) {
      return "missing Client record reconciliation";
    }
    if (!/Review intake matching and updates/i.test(body)) {
      return "missing Review intake matching and updates";
    }
    if (!/Future integration/i.test(body)) return "missing Future integration section";
    return null;
  },
  "/admin/clients/demo-sarah-mckay": (body) => {
    if (!/Invoice draft/i.test(body)) return "missing Invoice draft section";
    if (!/Open invoice draft/i.test(body)) return "missing Open invoice draft action";
    return null;
  },
  "/admin/proof": (body) => {
    if (!/Insurance session tracking/i.test(body)) {
      return "missing Insurance session tracking on proof page";
    }
    if (!/Preview demo clinic week/i.test(body)) {
      return "missing Preview demo clinic week link";
    }
    if (!/Workflow storage/i.test(body)) return "missing Workflow storage section";
    if (!/Cliniko remains the system of record/i.test(body)) {
      return "missing Cliniko remains the system of record wording";
    }
    if (!/No duplicate patient database/i.test(body)) {
      return "missing No duplicate patient database wording";
    }
    if (!/operational workflow state/i.test(body)) {
      return "missing operational workflow state wording";
    }
    if (
      !/Durable workflow storage/i.test(body) &&
      !/Ephemeral workflow storage/i.test(body) &&
      !/Local workflow storage/i.test(body) &&
      !/Supabase workflow storage unavailable/i.test(body)
    ) {
      return "missing Durable/Ephemeral/Local workflow storage label";
    }
    if (!/Durable storage checklist/i.test(body)) {
      return "missing Durable storage checklist";
    }
    return null;
  },
  "/admin/calendar": (body) => {
    if (!/Note needed/i.test(body)) return "missing Note needed calendar wording";
    if (!/Open record/i.test(body) && !/\/admin\/appointments\//i.test(body)) {
      return "missing Open record or appointment detail link";
    }
    return null;
  },
  "/admin/cliniko": (body) => {
    if (!body.includes("Cliniko")) return 'missing "Cliniko"';
    if (!/system of record|diary and clinical record/i.test(body)) {
      return "missing system-of-record wording";
    }
    if (!/Technical Cliniko test lab/i.test(body)) {
      return "missing Technical Cliniko test lab link";
    }
    return null;
  },
  "/admin/settings": (body) => {
    if (!/Demo proof page/i.test(body)) return "missing Demo proof page link";
    if (!/Technical Cliniko test lab/i.test(body)) {
      return "missing Technical Cliniko test lab link";
    }
    if (!/Preview demo clinic week/i.test(body)) {
      return "missing Preview demo clinic week link";
    }
    if (!/Workflow storage/i.test(body)) return "missing Workflow storage section";
    if (!/Cliniko remains the system of record/i.test(body)) {
      return "missing Cliniko remains the system of record wording";
    }
    if (!/Cliniko source of truth/i.test(body)) {
      return "missing Cliniko source of truth wording";
    }
    if (!/Command Hub workflow state/i.test(body)) {
      return "missing Command Hub workflow state wording";
    }
    if (
      !/Durable workflow storage/i.test(body) &&
      !/Ephemeral workflow storage/i.test(body) &&
      !/Local workflow storage/i.test(body) &&
      !/Supabase workflow storage unavailable/i.test(body)
    ) {
      return "missing Durable/Ephemeral/Local workflow storage label";
    }
    if (!/Durable storage checklist/i.test(body)) {
      return "missing Durable storage checklist";
    }
    for (const term of ["Cliniko", "Aviemore", "Setmore"]) {
      if (!body.includes(term)) return `missing "${term}"`;
    }
    if (!/legacy|transition/i.test(body)) {
      return 'missing "legacy" or "transition" for Setmore';
    }
    return null;
  },
  "/admin/cliniko/test-lab": (body) => {
    if (!/Technical test lab/i.test(body)) {
      return "missing Technical test lab banner";
    }
    if (!/Demo Clinic Week/i.test(body)) return "missing Demo Clinic Week section";
    if (!/Seed demo clinic week/i.test(body)) {
      return "missing Seed demo clinic week control";
    }
    if (!/Patient record write proof/i.test(body)) {
      return "missing Patient record write proof section";
    }
    if (!/Treatment note safety proof/i.test(body)) {
      return "missing Treatment note safety proof section";
    }
    if (!/Insurance field storage audit/i.test(body)) {
      return "missing Insurance field storage audit section";
    }
    if (!/Patient update safety proof/i.test(body)) {
      return "missing Patient update safety proof section";
    }
    if (!/Workflow storage/i.test(body)) return "missing Workflow storage section";
    if (!/Storage boundary policy/i.test(body)) {
      return "missing Storage boundary policy section";
    }
    if (!/forbidden fields/i.test(body)) return "missing forbidden fields wording";
    if (!/Cliniko remains the system of record/i.test(body)) {
      return "missing Cliniko remains the system of record wording";
    }
    if (
      !/Durable workflow storage/i.test(body) &&
      !/Ephemeral workflow storage/i.test(body) &&
      !/Local workflow storage/i.test(body)
    ) {
      return "missing Durable/Ephemeral/Local workflow storage label";
    }
    if (!/read-back verification/i.test(body)) {
      return "missing read-back verification wording";
    }
    if (!/Cliniko appointment discovery|Run appointment discovery|Live Cliniko DEMO appointments/i.test(body)) {
      return "missing Cliniko test lab discovery sections";
    }
    return null;
  },
  "/admin/demo-walkthrough": (body) => {
    if (!/location-first|location first/i.test(body)) {
      return "missing location-first booking mention";
    }
    for (const term of ["Dundee", "Aviemore", "Cliniko"]) {
      if (!body.includes(term)) return `missing "${term}"`;
    }
    return null;
  },
  "/api/cliniko/status": (body) => {
    let json;
    try {
      json = JSON.parse(body);
    } catch {
      return "response is not valid JSON";
    }
    if (typeof json.status !== "string") return "missing status field";
    if (typeof json.source !== "string") return "missing source field";
    return null;
  },
  "/api/cliniko/individual-appointments": (body) => {
    let json;
    try {
      json = JSON.parse(body);
    } catch {
      return "response is not valid JSON";
    }
    if (!Array.isArray(json.appointments)) return "missing appointments array";
    const serialized = JSON.stringify(json.appointments);
    if (serialized.includes("DEMO 0.")) return "contains broken label DEMO 0.";
    if (serialized.includes("DEMO (.")) return "contains broken label DEMO (.";
    return null;
  },
  "/api/cliniko/individual-appointments?perPage=10": (body) => {
    let json;
    try {
      json = JSON.parse(body);
    } catch {
      return "response is not valid JSON";
    }
    if (!Array.isArray(json.appointments)) return "missing appointments array";
    const serialized = JSON.stringify(json.appointments);
    if (serialized.includes("DEMO 0.")) return "contains broken label DEMO 0.";
    if (serialized.includes("DEMO (.")) return "contains broken label DEMO (.";
    return null;
  },
  "/api/cliniko/test-data": (body) => {
    let json;
    try {
      json = JSON.parse(body);
    } catch {
      return "response is not valid JSON";
    }
    if (typeof json.writesEnabled !== "boolean") return "missing writesEnabled";
    if (!Array.isArray(json.patients)) return "missing patients array";
    if (!Array.isArray(json.appointments)) return "missing appointments array";
    if (typeof json.generatedAt !== "string") return "missing generatedAt";
    if (!json.counts || typeof json.counts.patients !== "number") return "missing counts.patients";
    if (typeof json.counts.appointments !== "number") return "missing counts.appointments";
    if (typeof json.source !== "string") return "missing source";
    if (typeof json.practitionerBookable !== "boolean") return "missing practitionerBookable";
    if (typeof json.practitionerSourceLabel !== "string") return "missing practitionerSourceLabel";
    return null;
  },
  "/api/command-hub/workflow-state": (body) => {
    let json;
    try {
      json = JSON.parse(body);
    } catch {
      return "response is not valid JSON";
    }
    if (json.ok !== true) return "ok !== true";
    if (!json.store || typeof json.store !== "object") return "missing store";
    if (typeof json.store.demoWeekPreview !== "boolean") return "missing demoWeekPreview";
    if (!json.store.insuranceCases || typeof json.store.insuranceCases !== "object") {
      return "missing insuranceCases";
    }
    if (!json.storage || typeof json.storage !== "object") return "missing storage metadata";
    if (typeof json.storage.mode !== "string") return "missing storage.mode";
    if (typeof json.storage.durability !== "string") return "missing storage.durability";
    const serialized = JSON.stringify(json);
    if (serialized.includes("CLINIKO_API_KEY") || serialized.includes("DEMO_SESSION_SECRET")) {
      return "API response may leak secret env names";
    }
    if (serialized.includes("KV_REST_API_TOKEN") || serialized.includes("SUPABASE_SERVICE_ROLE_KEY") || serialized.includes("SUPABASE_SECRET_KEY")) {
      return "API response may leak durable storage credentials";
    }
    if (serialized.includes("BLOB_READ_WRITE_TOKEN")) {
      return "API response may leak blob storage token name";
    }
    return null;
  },
  "/api/command-hub/workflow-storage/status": (body) => {
    let json;
    try {
      json = JSON.parse(body);
    } catch {
      return "response is not valid JSON";
    }
    if (json.ok !== true) return "ok !== true";
    if (!json.storage || typeof json.storage !== "object") return "missing storage";
    if (typeof json.storage.mode !== "string") return "missing storage.mode";
    if (typeof json.storage.durability !== "string") return "missing storage.durability";
    if (typeof json.canRead !== "boolean") return "missing canRead";
    if (typeof json.canWrite !== "boolean") return "missing canWrite";
    if (typeof json.lastChecked !== "string") return "missing lastChecked";
    if (typeof json.message !== "string" || !json.message.trim()) return "missing message";
    const serialized = JSON.stringify(json);
    if (
      serialized.includes("KV_REST_API_TOKEN") ||
      serialized.includes("SUPABASE_SERVICE_ROLE_KEY") ||
      serialized.includes("SUPABASE_SECRET_KEY") ||
      serialized.includes("BLOB_READ_WRITE_TOKEN")
    ) {
      return "status response may leak storage credential markers";
    }
    return null;
  },
};

let passCount = 0;
let failCount = 0;
let skipCount = 0;
/** @type {string | null} */
let authCookie = null;

const SECRET_MARKERS = [
  "CLINIKO_API_KEY",
  "DEMO_SESSION_SECRET",
  "DEMO_STAFF_PASSWORD",
  "KV_REST_API_TOKEN",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "BLOB_READ_WRITE_TOKEN",
];

function assertNoSecretsInBody(body, route) {
  for (const marker of SECRET_MARKERS) {
    if (body.includes(marker)) return `${route}: exposed secret marker "${marker}"`;
  }
  if (STAFF_PASSWORD && STAFF_PASSWORD.length >= 8 && body.includes(STAFF_PASSWORD)) {
    return `${route}: exposed DEMO_STAFF_PASSWORD value`;
  }
  return null;
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

async function staffLogin() {
  if (!STAFF_PASSWORD) return false;

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: STAFF_PASSWORD }),
  });

  if (!res.ok) {
    console.log(`Auth: login failed (HTTP ${res.status})`);
    return false;
  }

  const setCookie =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie");
  const cookie = parseSetCookie(setCookie);
  authCookie = cookie;
  return Boolean(cookie);
}

async function checkUnauthenticatedRedirect(route, expectedLocationPart) {
  const label = `unauth ${route}`.padEnd(36);
  try {
    const res = await fetch(`${BASE_URL}${route}`, { redirect: "manual" });
    const location = res.headers.get("location") ?? "";
    if ((res.status === 307 || res.status === 308) && location.includes(expectedLocationPart)) {
      passCount++;
      console.log(`PASS  ${label}`);
      return;
    }
    failCount++;
    console.log(`FAIL  ${label} expected redirect to ${expectedLocationPart}, got ${res.status} ${location}`);
  } catch (err) {
    failCount++;
    console.log(`FAIL  ${label} ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function checkUnauthenticatedApi(route) {
  const label = `unauth ${route}`.padEnd(36);
  try {
    const res = await fetch(`${BASE_URL}${route}`, { redirect: "manual" });
    if (res.status === 401) {
      passCount++;
      console.log(`PASS  ${label}`);
      return;
    }
    failCount++;
    console.log(`FAIL  ${label} expected HTTP 401, got ${res.status}`);
  } catch (err) {
    failCount++;
    console.log(`FAIL  ${label} ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function checkRoute(route, requiresAuth) {
  const url = `${BASE_URL}${route}`;
  const label = route.padEnd(36);

  if (requiresAuth && !authCookie) {
    skipCount++;
    console.log(`SKIP  ${label} (no DEMO_STAFF_PASSWORD for auth)`);
    return;
  }

  try {
    const headers = { Accept: "text/html,application/json" };
    if (authCookie) headers.Cookie = authCookie;

    const res = await fetch(url, { headers, redirect: "manual" });
    let body = "";
    if (res.status !== 307 && res.status !== 308) {
      body = await res.text();
    }

    if (res.status === 307 || res.status === 308) {
      failCount++;
      console.log(`FAIL  ${label} redirect ${res.status} (auth required?)`);
      return;
    }

    if (res.status !== 200) {
      failCount++;
      console.log(`FAIL  ${label} HTTP ${res.status}`);
      return;
    }

    if (!route.startsWith("/api/")) {
      const secretError = assertNoSecretsInBody(body, route);
      if (secretError) {
        failCount++;
        console.log(`FAIL  ${label} ${secretError}`);
        return;
      }
    }

    const checker = contentChecks[route];
    if (checker) {
      const contentError = checker(body);
      if (contentError) {
        failCount++;
        console.log(`FAIL  ${label} ${contentError}`);
        return;
      }
    }

    passCount++;
    console.log(`PASS  ${label}`);
  } catch (err) {
    failCount++;
    const message = err instanceof Error ? err.message : String(err);
    console.log(`FAIL  ${label} ${message}`);
  }
}

async function checkForbiddenWorkflowPatch() {
  const label = "workflow PATCH forbidden field".padEnd(36);
  if (!authCookie) {
    skipCount++;
    console.log(`SKIP  ${label} (no DEMO_STAFF_PASSWORD for auth)`);
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/command-hub/workflow-state`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookie,
      },
      body: JSON.stringify({
        appointmentId: "dcw-001",
        appointmentPatch: {
          treatmentNoteBody: "This note must not be stored in workflow state.",
          email: "patient@example.com",
        },
      }),
    });
    const json = await res.json();
    if (res.status === 403 && json.ok === false && /Blocked for storage boundary/i.test(json.message ?? "")) {
      passCount++;
      console.log(`PASS  ${label}`);
      return;
    }
    failCount++;
    console.log(
      `FAIL  ${label} expected HTTP 403 storage boundary block, got ${res.status} ${json.message ?? ""}`
    );
  } catch (err) {
    failCount++;
    console.log(`FAIL  ${label} ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function checkExpectDurableStorage() {
  const expectDurable = process.env.EXPECT_DURABLE_WORKFLOW_STORAGE === "true";
  const label = "EXPECT_DURABLE workflow storage".padEnd(36);
  if (!expectDurable) {
    skipCount++;
    console.log(`SKIP  ${label} (EXPECT_DURABLE_WORKFLOW_STORAGE not set)`);
    return;
  }
  if (!authCookie) {
    skipCount++;
    console.log(`SKIP  ${label} (no DEMO_STAFF_PASSWORD for auth)`);
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/command-hub/workflow-storage/status`, {
      headers: { Cookie: authCookie, Accept: "application/json" },
      cache: "no-store",
    });
    const json = await res.json();
    if (!json.ok || !json.storage) {
      failCount++;
      console.log(`FAIL  ${label} status response invalid`);
      return;
    }
    if (json.storage.durability !== "durable" || json.storage.mode !== "supabase") {
      failCount++;
      console.log(
        `FAIL  ${label} expected mode=supabase durability=durable, got mode=${json.storage.mode} durability=${json.storage.durability}`
      );
      return;
    }
    if (!json.canRead || !json.canWrite) {
      failCount++;
      console.log(`FAIL  ${label} durable storage must pass read/write verification`);
      return;
    }
    passCount++;
    console.log(`PASS  ${label}`);
  } catch (err) {
    failCount++;
    console.log(`FAIL  ${label} ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log(`\nTigers Eye smoke check — ${BASE_URL}\n`);

for (const route of publicRoutes) {
  await checkRoute(route, false);
}

await checkRoute("/admin/login", false);

console.log("\nUnauthenticated auth checks\n");

await checkUnauthenticatedRedirect("/admin", "/admin/login");
await checkUnauthenticatedRedirect("/admin/bookings", "/admin/login");
await checkUnauthenticatedRedirect("/admin/cliniko/test-lab", "/admin/login");
await checkUnauthenticatedApi("/api/cliniko/status");
await checkUnauthenticatedApi("/api/cliniko/test-data");
await checkUnauthenticatedApi("/api/command-hub/workflow-state");
await checkUnauthenticatedApi("/api/command-hub/workflow-storage/status");

if (STAFF_PASSWORD) {
  const loggedIn = await staffLogin();
  console.log(loggedIn ? "Auth: demo staff login OK\n" : "Auth: login failed — protected routes may fail\n");
} else {
  console.log("Auth: DEMO_STAFF_PASSWORD not set — protected routes will be skipped\n");
}

for (const route of protectedRoutes.filter((r) => r !== "/admin/login")) {
  await checkRoute(route, true);
}

console.log("\nAuthenticated workflow boundary checks\n");
await checkForbiddenWorkflowPatch();
await checkExpectDurableStorage();

const total = publicRoutes.length + protectedRoutes.length + 9;
console.log(
  `\nSummary: ${passCount} passed, ${failCount} failed, ${skipCount} skipped, ${total} checks\n`
);

if (failCount > 0) {
  process.exit(1);
}
