# Build notes — Tigers Eye Command Hub

## Architecture

- **Framework:** Next.js 15 (App Router), React 19, Tailwind CSS 4
- **Deployment:** Vercel — https://tigers-eye-command-hub.vercel.app
- **Route groups:** Public site `app/(public)/`, admin hub `app/admin/`, API `app/api/cliniko/`
- **Content:** Central copy in `lib/tigers-eye-content.ts`; demo objects in `lib/demo-data.ts`

## Public website

- Marketing pages: home, services, locations, team, insurance, telehealth, contact
- **Location-first booking gateway** at `/book` — patient chooses Dundee or Aviemore, then appointment type
- Both locations route to **Cliniko**; Setmore is not part of the patient journey
- Subtle Command Hub notes on book, insurance, telehealth, contact pages
- Footer includes “Command Hub (demo)” for internal demo access

## Admin Command Hub

- Shell: sidebar, demo banner, dashboard, walkthrough at `/admin/demo-walkthrough`
- Modules: calendar, bookings, payments, finance, invoices, insurance, stock, notes, settings, healthcode
- Demo data fallbacks everywhere Cliniko is unavailable
- Demo action buttons show toasts instead of appearing dead

## Cliniko integration

- **Server-only** client in `lib/cliniko.ts` — API key never sent to browser
- API routes: status, businesses, practitioners, appointment types, bookings, treatment-note-draft
- Mapping layer `lib/cliniko-mappers.ts` feeds bookings, calendar, finance, insurance, invoices, stock, notes
- Writes gated by `CLINIKO_ENABLE_WRITES=false` by default
- No patient-note database; transcripts purged on save/discard

## Dundee / Aviemore Cliniko-first booking strategy

**Problem:** Patients booked the wrong clinic when Dundee (Cliniko) and Aviemore (Setmore) used different systems.

**Solution:** Both locations use Cliniko. The website asks for **location first**, then appointment type, routing to the correct Cliniko booking link.

| Location | Provider | Status |
|----------|----------|--------|
| Dundee | Cliniko | Active |
| Aviemore | Cliniko | Planned / sandbox (separate Cliniko location) |
| Setmore | Legacy | Retire after Aviemore fully in Cliniko |

Configured in `lib/tigers-eye-content.ts` → `bookingLinks`, `bookingStrategy`.

## Demo data / fallback behaviour

- If `CLINIKO_API_KEY` is missing or Cliniko unreachable → API returns `source: "demo"` and UI shows demo data
- Friendly loading/error/empty states on Cliniko panels
- `NEXT_PUBLIC_DEMO_MODE=true` in env template

## Setmore legacy note

Setmore (`https://tigerseye.setmore.com/`) is documented only as the **previous** Aviemore booking tool. It appears in:

- `bookingLinks.legacySetmore` in content file
- Locations page transition note (if shown)
- Admin settings (legacy / transition card)
- Admin Cliniko Aviemore migration panel

It must **not** appear as the active Aviemore booking provider on `/book`.

## Demo staff authentication

- `/admin/*` (except `/admin/login`) and `/api/cliniko/*` require demo staff login
- Set `DEMO_STAFF_PASSWORD` and `DEMO_SESSION_SECRET` in environment (never commit real values)
- Public website remains open

## Cliniko test lab

- Sterile Cliniko test account only — fake `DEMO` patients and appointments
- Controlled writes when `CLINIKO_ENABLE_WRITES=true`
- Independent proof steps on `/admin/cliniko`: patient create/update/archive, appointment create/cancel/read-back, explicit cleanup
- API: `GET/POST /api/cliniko/test-data` (staff auth required) with explicit snake_case actions and `proofStatus` responses
- Live Cliniko panels show real sandbox data only; demo examples are in a separate section
- Appointment creation uses practitioner IDs from `/practitioners` (not `/users`); preflight checks run before writes

## Live Cliniko test data versus demo examples

- Live test lab appointments must come only from Cliniko `/individual_appointments`
- Each displayed appointment requires a real numeric Cliniko id linked to a DEMO-prefixed patient
- Demo fallback appointments are never shown in the test lab live list
- Demo examples (static walkthrough data) live in a separate clearly labelled section
- Local proof state (`localStorage`) stores proof badge status only — never appointment rows
- Cleanup refreshes from Cliniko and does not repopulate placeholder appointments
- Patient labels use full DEMO patient names — not abbreviated labels like `DEMO 0.`

## Cliniko appointment discovery

- Manual appointments can exist in Cliniko but not appear if the API query/filter is wrong
- Discovery probes live on **`/admin/cliniko/test-lab`** (developer proof area)
- Read-back prefers `patient_id:=` filters for each DEMO patient, then merges unique appointment ids
- Direct appointment ID lookup via `/individual_appointments/{id}` proves API visibility for a specific row
- Date filters use proper Cliniko `q[]` syntax with ISO UTC datetimes (`field:>=`, `field:<=`, `field:=`)

## Command Hub daily workflow

- `CommandHubAppointmentsProvider` auto-loads live Cliniko appointments when connected and shares them across dashboard, calendar, bookings and notes
- `/admin/cliniko` — daily integration (connection, Aviemore, roadmap); link to test lab for proof tools
- `/admin/cliniko/test-lab` — DEMO CRUD, discovery probes, mapping health, diagnostics
- Calendar keeps demo external-work/admin overlays alongside live Cliniko appointments

## Cliniko appointment proof update

- Manual Cliniko appointments are read from `/individual_appointments`
- `/bookings` may be empty even when manual individual appointments exist (online booking records only)
- Online booking `next_available_time` checks are **soft warnings** in the test lab — they do not block direct appointment creation
- Direct DEMO individual appointment creation posts to `/individual_appointments` with `starts_at` + `ends_at`
- Safe manual test time is generated when online availability returns 404/empty
- Command Hub maps individual appointments into bookings, calendar, finance, notes, invoices, insurance and stock via `lib/cliniko-mappers.ts`

### Appointment proof troubleshooting

| Step | Status (sterile uk3 test account) |
|------|-----------------------------------|
| DEMO patient create | Proven |
| DEMO patient update | Proven |
| DEMO patient archive / cleanup | Proven when manually triggered |
| DEMO appointment create | Pending — depends on practitioner availability and Cliniko validation |
| Manual Cliniko appointment read-back | Use “Check for DEMO appointments” after creating in Cliniko UI |
| Command Hub mapping | Verify bookings/calendar after read-back succeeds |

Possible setup causes when appointment create fails:

- Practitioner missing or resolved from `/users` instead of `/practitioners`
- Appointment type missing or not bookable
- Practitioner daily availability not configured
- Online booking / available-times constraints
- Payload rejected by Cliniko (422) — see diagnostics panel on `/admin/cliniko`

## Environment variables

Copy `.env.local.example` to `.env.local` (never commit `.env.local`):

```
CLINIKO_API_KEY=your-sandbox-key-here
CLINIKO_SHARD=uk1
CLINIKO_USER_AGENT=Tigers Eye Command Hub Demo / built by Mike Currie
CLINIKO_ENABLE_WRITES=true
NEXT_PUBLIC_DEMO_MODE=true
DEMO_STAFF_PASSWORD=change-me-before-deploy
DEMO_SESSION_SECRET=change-me-use-long-random-string
```

## Quality commands

```bash
npm run lint
npm run build
npm run smoke:local   # dev server required
npm run smoke:prod    # production URL
```

## Known limitations

- Aviemore Cliniko URL is a placeholder until separate location/business is configured in Cliniko
- Finance figures are estimated — not accounting records
- Insurance cases from Cliniko are inferred, not stored
- Healthcode / Xero not connected
- Contact form is demo-only (no email send)
- Browser dictation demo only — no cloud transcription

## Recommended next steps (post-demo)

1. Configure Aviemore as separate Cliniko business/location with filtered booking links
2. Retire Setmore once Aviemore bookings confirmed in Cliniko
3. Enable Cliniko custom fields for insurance claim/session capture
4. Connect Healthcode when George confirms workflow
5. Xero integration for reconciliation
6. Expand Cliniko test lab once Aviemore location is live in sandbox
