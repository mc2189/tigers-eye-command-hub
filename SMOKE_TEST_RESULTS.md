# Smoke test results

| Field | Value |
|-------|-------|
| **Last updated** | 2026-06-29 (live appointment source fix — commit `124ff00`) |
| **Local smoke** | **25/25 PASS** |
| **Production smoke** | **25/25 PASS** (2026-06-29, post `124ff00` deploy) |
| **Base URL (prod)** | https://tigers-eye-command-hub.vercel.app |

## Latest run summary

| Environment | Result | Passed | Failed | Notes |
|-------------|--------|--------|--------|-------|
| Local (`localhost:3000`) | **PASS** | 25 | 0 | Live-only Cliniko DEMO appointments |
| Production (Vercel) | **PASS** | 25 | 0 | Post `124ff00` deploy — truthful test lab list |

## Cliniko-first Aviemore checks

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

_None — all routes passed locally and on production (2026-06-29)._

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
