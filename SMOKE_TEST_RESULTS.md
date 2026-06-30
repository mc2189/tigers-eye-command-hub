# Smoke test results

| Field | Value |
|-------|-------|
| **Last updated** | 2026-06-30 (Insurance session tracking — commit `fa031d5`) |
| **Local smoke** | **28/28 PASS** |
| **Production smoke** | **28/28 PASS** (2026-06-30, post `fa031d5` deploy) |
| **Base URL (prod)** | https://tigers-eye-command-hub.vercel.app |

## Latest run summary

| Environment | Result | Passed | Failed | Notes |
|-------------|--------|--------|--------|-------|
| Local (fresh build) | **PASS** | 28 | 0 | Insurance session tracking smoke checks |
| Production (Vercel) | **PASS** | 28 | 0 | Post `fa031d5` — insurance case tracker |

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

_None — all routes passed locally and on production (2026-06-30, post `fa031d5`)._

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
