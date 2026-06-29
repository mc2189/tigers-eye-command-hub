# Smoke test results

| Field | Value |
|-------|-------|
| **Last updated** | 2026-06-29 (final QA pass — commit pending deploy) |
| **Local smoke** | **23/23 PASS** (production build on `localhost:3000`) |
| **Production smoke** | **22/23** — `/admin/cliniko` missing Aviemore until latest deploy lands |
| **Base URL (prod)** | https://tigers-eye-command-hub.vercel.app |

## Latest run summary

| Environment | Result | Passed | Failed | Notes |
|-------------|--------|--------|--------|-------|
| Local (`localhost:3000`) | **PASS** | 23 | 0 | `npm run start` + `npm run smoke:local` |
| Production (Vercel) | **PARTIAL** | 22 | 1 | `/admin/cliniko` — Aviemore panel not yet deployed; re-run after push |

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

## Failed routes (if any)

| Route | Environment | Reason |
|-------|-------------|--------|
| `/admin/cliniko` | Production (pre-deploy) | Aviemore migration panel not on live site yet |

_Re-run `npm run smoke:prod` after Vercel deploy completes._

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
