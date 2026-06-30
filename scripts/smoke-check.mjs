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
  "/admin/insurance",
  "/admin/notes",
  "/admin/stock",
  "/admin/followups",
  "/admin/proof",
  "/admin/settings",
  "/api/cliniko/status",
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
    if (!/Today'?s command/i.test(body)) return "missing Today's command";
    if (!/Notes to complete/i.test(body)) return "missing Notes to complete";
    if (!/Insurance items/i.test(body)) return "missing Insurance items";
    if (!/Cliniko connected/i.test(body)) return "missing Cliniko connected status";
    return null;
  },
  "/admin/bookings": (body) => {
    if (!/Review appointments coming from Cliniko/i.test(body)) {
      return "missing bookings purpose line";
    }
    if (!/Needs attention/i.test(body)) return "missing Needs attention tab";
    return null;
  },
  "/admin/notes": (body) => {
    if (!/Cliniko remains the clinical record/i.test(body)) {
      return "missing notes purpose line";
    }
    if (!/Appointments needing notes/i.test(body)) {
      return "missing Appointments needing notes section";
    }
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
    if (!/Insurance invoice queue/i.test(body)) {
      return "missing Insurance invoice queue section";
    }
    return null;
  },
  "/admin/insurance": (body) => {
    if (!/Insurance cases/i.test(body)) return "missing Insurance cases title";
    if (!/approved sessions/i.test(body)) return "missing approved sessions wording";
    if (!/Demo case controls/i.test(body)) return "missing Demo case controls";
    if (!/Ready to invoice/i.test(body)) return "missing Ready to invoice tab";
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
    return null;
  },
  "/admin/proof": (body) => {
    if (!/Insurance session tracking/i.test(body)) {
      return "missing Insurance session tracking on proof page";
    }
    return null;
  },
  "/admin/calendar": (body) => {
    if (!/Note needed/i.test(body)) return "missing Note needed calendar wording";
    return null;
  },
  "/admin/cliniko": (body) => {
    if (!body.includes("Cliniko")) return 'missing "Cliniko"';
    if (!/system of record|diary and clinical record/i.test(body)) {
      return "missing system-of-record wording";
    }
    if (!/Open technical test lab/i.test(body)) {
      return "missing Open technical test lab link";
    }
    return null;
  },
  "/admin/cliniko/test-lab": (body) => {
    if (!/Technical test lab/i.test(body)) {
      return "missing Technical test lab banner";
    }
    if (!/Cliniko appointment discovery|Run appointment discovery|Live Cliniko DEMO appointments/i.test(body)) {
      return "missing Cliniko test lab discovery sections";
    }
    return null;
  },
  "/admin/settings": (body) => {
    for (const term of ["Cliniko", "Aviemore", "Setmore"]) {
      if (!body.includes(term)) return `missing "${term}"`;
    }
    if (!/legacy|transition/i.test(body)) {
      return 'missing "legacy" or "transition" for Setmore';
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
};

let passCount = 0;
let failCount = 0;
let skipCount = 0;
/** @type {string | null} */
let authCookie = null;

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

console.log(`\nTigers Eye smoke check — ${BASE_URL}\n`);

for (const route of publicRoutes) {
  await checkRoute(route, false);
}

await checkRoute("/admin/login", false);

if (STAFF_PASSWORD) {
  const loggedIn = await staffLogin();
  console.log(loggedIn ? "Auth: demo staff login OK\n" : "Auth: login failed — protected routes may fail\n");
} else {
  console.log("Auth: DEMO_STAFF_PASSWORD not set — protected routes will be skipped\n");
}

for (const route of protectedRoutes.filter((r) => r !== "/admin/login")) {
  await checkRoute(route, true);
}

const total = publicRoutes.length + protectedRoutes.length;
console.log(
  `\nSummary: ${passCount} passed, ${failCount} failed, ${skipCount} skipped, ${total} total\n`
);

if (failCount > 0) {
  process.exit(1);
}
