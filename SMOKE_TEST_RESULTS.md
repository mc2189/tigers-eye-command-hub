# Smoke test results

| Field | Value |
|-------|-------|
| **Last updated** | 2026-06-29 (staff auth + Cliniko test lab) |
| **Local smoke** | **25/25 PASS** (with `DEMO_STAFF_PASSWORD` matching server env) |
| **Production smoke** | Requires `DEMO_STAFF_PASSWORD` in Vercel env + local smoke runner |
| **Base URL (prod)** | https://tigers-eye-command-hub.vercel.app |

## Latest run summary

| Environment | Result | Passed | Failed | Notes |
|-------------|--------|--------|--------|-------|
| Local (`localhost:3000`) | **PASS** | 25 | 0 | Auth env required — see `.env.local.example` |
| Production (Vercel) | _Pending_ | — | — | Set `DEMO_STAFF_PASSWORD` + `DEMO_SESSION_SECRET` on Vercel first |

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
