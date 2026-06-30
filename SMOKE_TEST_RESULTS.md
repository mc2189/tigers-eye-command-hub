# Smoke test results

| Field | Value |
|-------|-------|
| **Last updated** | 2026-06-30 (Cliniko record completeness — commit `8a18395`) |
| **Feature commit** | `8a18395` — Improve Cliniko record completeness and follow-up booking |
| **Smoke record commit** | `cca288f` |
| **Local lint** | **PASS** |
| **Local build** | **PASS** |
| **Local smoke** | **38/38 PASS** (production build on port 3013) |
| **Production smoke** | **38/38 PASS** (2026-06-30, post `8a18395` deploy) |
| **Base URL (prod)** | https://tigers-eye-command-hub.vercel.app |

## Latest run summary

| Environment | Result | Passed | Failed | Notes |
|-------------|--------|--------|--------|-------|
| Local lint | **PASS** | — | 0 | `npm run lint` |
| Local build | **PASS** | — | 0 | `npm run build` |
| Local smoke | **PASS** | 38 | 0 | `BASE_URL=http://127.0.0.1:3013 node scripts/smoke-check.mjs` |
| Production (Vercel) | **PASS** | 38 | 0 | Record completeness + follow-up booking checks |

## Cliniko patient record completeness and follow-up booking (`8a18395`)

- Patient field write audit in `lib/cliniko-patient-field-map.ts`
- Expanded DEMO patient create with phone, DOB, address, emergency contact, referral, occupation, notes
- Read-back verification after patient create (`lib/demo-patient-create.ts`)
- Record completeness panels on appointment and client detail pages
- Inline follow-up booking via `POST /api/cliniko/create-demo-followup` with duplicate detection
- Calendar **Open record** links on appointment cards
- Test lab **Patient record write proof** section
- Smoke expanded to 38 checks (includes `/admin/clients/demo-alex-wilson`)

| Route | Content check | Result |
|-------|---------------|--------|
| `/admin/intake` | Saved/Prepared/Blocked field behaviour | PASS |
| `/admin/appointments/dcw-001` | Record completeness, follow-up booking | PASS |
| `/admin/clients/demo-alex-wilson` | Record completeness, Future integration | PASS |
| `/admin/calendar` | Open record or appointment detail link | PASS |
| `/admin/cliniko/test-lab` | Patient record write proof | PASS |

## Appointment actions and patient matching (`2854dce`)

- Appointment cards include **Open record** on Today, Bookings, Notes, Follow-ups, Insurance invoice queue
- `/admin/appointments/[appointmentId]` — appointment detail (client, Cliniko status, note, follow-up, invoice)
- `/admin/clients/[clientId]` — client journey detail page
- `/admin/intake` — booking intake with exact/possible/none/unsafe match scenarios
- `lib/cliniko-patient-matching.ts` — patient matching scoring and recommended actions
- `POST /api/cliniko/patient-match` and `POST /api/cliniko/create-demo-patient-intake` (DEMO-only writes)
- Smoke expanded to 37 checks (includes `/admin/intake`, `/admin/appointments/dcw-001`, Open record actions)

| Route | Content check | Result |
|-------|---------------|--------|
| `/admin` | Open record action | PASS |
| `/admin/bookings` | Open record action | PASS |
| `/admin/clients` | Open client record | PASS |
| `/admin/intake` | Booking intake, match scenarios, DEMO patient creation | PASS |
| `/admin/appointments/dcw-001` | Treatment note, invoice draft, patient match status | PASS |

## Demo Clinic Week and client journey (`581a7b6`)

- 12 DEMO clients with full fake profiles and appointment scenarios
- Demo week preview mode with honest source labels
- `/admin/clients` client journey page
- Cliniko test-lab seeding (DEMO patients/appointments only)
- Today/Bookings/Insurance/Invoices/Notes/Follow-ups enriched
- WhatThisShows helper on key pages
- Smoke expanded to 35 checks (includes `/admin/clients`)

| Route | Content check | Result |
|-------|---------------|--------|
| `/admin` | Today at a glance, Urgent / needs action, Client journey | PASS |
| `/admin/clients` | Client journeys, Notes/Invoice/Follow-up status | PASS |
| `/admin/cliniko/test-lab` | Demo Clinic Week, Seed demo clinic week | PASS |
| `/admin/bookings` | Note needed, Follow-up suggested, day grouping | PASS |
| `/admin/insurance` | Sessions remaining, Patient liability agreement | PASS |
| `/admin/invoices` | Insurance invoice draft, Prepared invoice draft | PASS |

## Unauthenticated auth smoke (production)

| Check | Result |
|-------|--------|
| `/admin` redirects to `/admin/login` | PASS |
| `/admin/bookings` redirects to `/admin/login` | PASS |
| `/admin/cliniko/test-lab` redirects to `/admin/login` | PASS |
| `/api/cliniko/status` returns 401 | PASS |
| `/api/cliniko/test-data` returns 401 | PASS |

## Authenticated content smoke (production)

| Route | Content check | Result |
|-------|---------------|--------|
| `/admin/bookings` | No `DEMO 0.` / `DEMO (.`; disclosure copy present | PASS |
| `/api/cliniko/individual-appointments?perPage=10` | No broken DEMO labels in JSON | PASS |
| `/admin/cliniko` | Technical Cliniko test lab link | PASS |
| `/admin/settings` | Demo proof page link | PASS |
| `/admin` | Today command list | PASS |
| `/admin/cliniko/test-lab` | Technical test lab | PASS |
| `/admin/proof` | Proof page still reachable | PASS |

## Command Hub GUI polish and live data display fix (`4515ab0`, `8ee9cf2`)

- **Root cause:** `toPatientLabel()` abbreviated full DEMO names (`DEMO Test Patient 001` → `DEMO 0.`); mapper used generic fallbacks before ID-based enrichment
- Fixed `getSafeDemoPatientLabel()` — rejects broken abbreviated labels; unit tests in `lib/cliniko-demo-appointments.test.ts`
- Server-side enrichment via `lib/cliniko-workflow-enrichment.ts` (appointment type, practitioner, business, DEMO patient by ID)
- Generic fallbacks replaced with explicit not-returned labels when Cliniko data is missing
- `WorkflowBundleCard` — calmer hierarchy; setup warnings subdued; “Show all workflow actions” disclosure
- Today and Bookings — status row, grouped command list, data quality banner when needed
- Sidebar — Daily / Money / Clinic / Setup; proof and test lab moved to Cliniko + Settings pages
- Demo banner — “sterile Cliniko test account only. No real patient data is stored in this app.”
- Public pages — Cliniko-first Dundee/Aviemore; Setmore legacy only

| Route | Content check | Result |
|-------|---------------|--------|
| `/book` | Cliniko-first; Setmore not active Aviemore provider | PASS |
| `/locations` | Dundee, Aviemore, Cliniko | PASS |
| `/admin/settings` | Demo proof page, Cliniko | PASS |

## Cliniko test account system of record (`6a635e0`)

## Cliniko test account system of record (`6a635e0`)

- Rate-limit retries and sequential status probes to avoid false "not connected"
- `configured` flag separates API key present vs live connection
- Bookings shows "Cliniko test account" pill when configured
- `npm run sync:vercel-env` to mirror `.env.local` → Vercel

## Cliniko connection empty state (`f606408`)

- Bookings page distinguishes server not configured vs connection error vs missing appointments
- Guidance points to Vercel environment variables when `CLINIKO_API_KEY` is absent on production

## Cliniko live feed fix (`bbb1094`)

- Auto-correct `CLINIKO_SHARD` from API key suffix when mismatched
- Widen appointment load window to 14 days back / 90 days forward
- Split `isLive` vs `hasLiveAppointments` — clearer empty states on Today, Bookings, Cliniko overview

| Route | Content check | Result |
|-------|---------------|--------|
| `/admin/bookings` | Bookings purpose line | PASS |
| `/admin` | Today command list | PASS |
| `/api/cliniko/status` | Cliniko status JSON | PASS |

## Insurance session tracking workflow (`fa031d5`)

- `lib/insurance-session-workflow.ts` — case/session types, approved/used/remaining counting, next actions
- `lib/demo-insurance-cases.ts` — DEMO-only case details with browser `localStorage` controls
- `/admin/insurance` rebuilt as case tracker with summary cards, tabs, session history, missing checklist
- Insurance invoice queue on `/admin/invoices` — Healthcode remains future integration
- Today and bookings enriched with insurance-specific workflow chips when cases exist
- Proof page updated with insurance session tracking status

| Route | Content check | Result |
|-------|---------------|--------|
| `/admin/insurance` | Insurance cases, approved sessions, Demo case controls, Ready to invoice | PASS |
| `/admin/invoices` | Insurance invoice queue | PASS |
| `/admin/proof` | Insurance session tracking | PASS |
| `/admin` | Insurance items | PASS |

## Workflow intelligence layer (`0e6ea69`)

- Live Cliniko appointments generate workflow bundles (note, payment, invoice, insurance, stock, follow-up, setup)
- Today command list driven by `getTodayCommandItems` — uses **Upcoming command list** when no appointments today
- Queue pages: notes, payments, invoices, insurance, stock, follow-ups use dedicated workflow helpers
- `lib/appointment-rules.ts` and `lib/clinic-commercial-rules.ts` for demo-safe type/commercial inference
- `/admin/proof` — working now vs inferred vs future integrations
- New routes in smoke: `/admin/followups`, `/admin/proof` (28 routes total)

## Admin UX and workflow refactor (`2306aa0`)

- Sidebar simplified into workflow groups: Daily Work, Money, Operations, Setup & Proof
- `/admin` now acts as **Today** command screen with summary cards, action list, clinic status, quick actions
- `/admin/cliniko` is now clean integration overview (connection, live feed, businesses, practitioners, types)
- `/admin/cliniko/test-lab` contains technical proof tools with **Technical test lab** banner
- Live Cliniko appointments power shared `AppointmentWorkflowCard` / `ActionQueue` across workflow pages
- Demo examples remain separate from live data with source pills
- Technical API language hidden from normal clinic workflow pages
- New smoke content checks: Today command list, page purpose lines, test lab separation

| Route | Content check | Result |
|-------|---------------|--------|
| `/admin` | Today's command list, Cliniko connected | PASS |
| `/admin/cliniko` | Open technical test lab | PASS |
| `/admin/cliniko/test-lab` | Technical test lab banner | PASS |
| `/admin/bookings` | Review appointments from Cliniko | PASS |
| `/admin/notes` | Cliniko remains the clinical record | PASS |
| `/admin/finance` | Not accounting software | PASS |
| `/admin/invoices` | Invoice or payment check | PASS |
| `/admin/insurance` | Authorised sessions | PASS |
| `/admin/stock` | Consumables | PASS |

## Command Hub daily workflow (`ac3a1d1`)

- Shared `CommandHubAppointmentsProvider` auto-loads Cliniko appointments when connected
- Dashboard, calendar, bookings and notes use live Cliniko as primary source
- `/admin/cliniko` — daily integration page; `/admin/cliniko/test-lab` — proof tools and discovery

## Cliniko appointment discovery (`826d68d`)

Production probe run (read-only, uk3 shard):

| Probe | Returned | DEMO matches | Notes |
|-------|----------|--------------|-------|
| Unfiltered | 4 | 0* | Appointments visible with DEMO patient labels |
| Future window | 4 | 0* | Date q[] filters working |
| Patient DEMO Test Patient 001 | 2 | 0* | Manual appointments found by `patient_id` filter |
| Business | 4 | 0* | |
| Practitioner | 4 | 0* | |
| Created recently | 4 | 0* | |

\*Initial deploy (`826d68d`): `demoMatchCount` was 0 because Cliniko list responses omit top-level `patient_id` — nested `patient.links.self` must be parsed. Fix in `fd0ae57` adds `extractResourceId` and inferred patient_id on patient-filtered merges.

**Post-fix verification (`fd0ae57`):** Patient probe returns 2 DEMO matches; `check_demo_appointments` reports **2 live DEMO appointments**.

**Conclusion from probes:** Cliniko is returning appointments; read-back failed on patient_id extraction, not query filters. Patient-specific probe is the reliable path for DEMO appointment read-back.

**Appointment ID lookup:** ID `1983559512753187169` readable via `/individual_appointments/{id}`; maps once patient_id is extracted.

## Live Cliniko test data versus demo examples (`124ff00`)

| Route | Check | Expected |
|-------|-------|----------|
| `/book` | Dundee, Aviemore, Cliniko present | PASS |
| `/book` | Location-first wording | PASS |
| `/book` | Setmore not active Aviemore provider | PASS |
| `/locations` | Dundee, Aviemore, Cliniko | PASS |
| `/locations` | Setmore only with legacy label | PASS |
| `/admin/cliniko` | Aviemore + system of record | PASS |
| `/admin/settings` | Cliniko, Aviemore, Setmore legacy | PASS |
| `/admin/demo-walkthrough` | Location-first + both locations | PASS |

## Live Cliniko test data versus demo examples (`124ff00`)

- Test lab appointments come only from `/individual_appointments` with numeric Cliniko ids
- Strict patient_id match to DEMO patients — no label-only or demo fallback rows
- Full DEMO patient names shown (no `DEMO 0.` abbreviated labels)
- Appointment source diagnostics panel added; local proof state stores badges only

## Client crash fix (`7c3c8e0`)

- Root cause: unsafe assumptions on Cliniko API/partial JSON and corrupted `localStorage` proof cards
- Added `lib/safe-data.ts` helpers, admin error boundaries, defensive rendering in Cliniko panels
- `/api/cliniko/test-data` always returns predictable array fields even on errors

## Cliniko appointment discovery

- Manual appointments can exist in Cliniko but not appear in Command Hub if the API query/filter is wrong
- Discovery probes: unfiltered, future window, patient-specific, business-specific, practitioner-specific, created-recently
- Read-back prefers `patient_id:=` filters for each DEMO patient, then merges unique appointment ids
- Direct appointment ID lookup via `/individual_appointments/{id}` proves API visibility for a specific row
- Run **Run appointment discovery** on `/admin/cliniko` when Cliniko UI shows appointments but the test lab list is empty

## Cliniko appointment proof update

- Manual Cliniko appointments read from `/individual_appointments`
- `/bookings` may be empty while individual appointments exist
- Online available-time 404 is a soft warning in test lab preflight
- Command Hub loads individual appointments into bookings/calendar/finance/notes panels

## Failed routes (if any)

_None — all routes passed on production (2026-06-30, post `8a18395`)._

## How to run

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run smoke:local

# After deploy
npm run smoke:prod
```

Exit code `0` = all routes passed. Non-zero = one or more failures (see console output).
