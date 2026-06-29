#!/usr/bin/env node
/**
 * Tigers Eye Command Hub — route smoke checker.
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/smoke-check.mjs
 *   BASE_URL=https://tigers-eye-command-hub.vercel.app node scripts/smoke-check.mjs
 */

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const routes = [
  "/",
  "/book",
  "/services",
  "/locations",
  "/team",
  "/insurance",
  "/telehealth",
  "/contact",
  "/admin",
  "/admin/demo-walkthrough",
  "/admin/cliniko",
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
  "/admin/settings",
  "/api/cliniko/status",
];

/** @type {Record<string, (body: string, route: string) => string | null>} */
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
  "/admin/cliniko": (body) => {
    if (!body.includes("Cliniko")) return 'missing "Cliniko"';
    if (!body.includes("Aviemore")) return 'missing "Aviemore"';
    if (!/system of record|source of truth/i.test(body)) {
      return "missing system-of-record wording";
    }
    if (!/location|migration|Aviemore/i.test(body)) {
      return "missing migration/location wording";
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
};

const results = [];
let passCount = 0;
let failCount = 0;

async function checkRoute(route) {
  const url = `${BASE_URL}${route}`;
  const label = route.padEnd(36);
  try {
    const res = await fetch(url, {
      headers: { Accept: "text/html,application/json" },
      redirect: "follow",
    });
    const body = await res.text();

    if (res.status !== 200) {
      failCount++;
      results.push({ route, ok: false, detail: `HTTP ${res.status}` });
      console.log(`FAIL  ${label} HTTP ${res.status}`);
      return;
    }

    const checker = contentChecks[route];
    if (checker) {
      const contentError = checker(body, route);
      if (contentError) {
        failCount++;
        results.push({ route, ok: false, detail: contentError });
        console.log(`FAIL  ${label} ${contentError}`);
        return;
      }
    }

    passCount++;
    results.push({ route, ok: true, detail: "OK" });
    console.log(`PASS  ${label}`);
  } catch (err) {
    failCount++;
    const message = err instanceof Error ? err.message : String(err);
    results.push({ route, ok: false, detail: message });
    console.log(`FAIL  ${label} ${message}`);
  }
}

console.log(`\nTigers Eye smoke check — ${BASE_URL}\n`);

for (const route of routes) {
  await checkRoute(route);
}

console.log(`\nSummary: ${passCount} passed, ${failCount} failed, ${routes.length} total\n`);

if (failCount > 0) {
  process.exit(1);
}
