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
- `/admin` — **Today** command screen: summary cards, action list, clinic status, quick actions
- `/admin/cliniko` — clean integration overview (connection, live feed, businesses, practitioners, types)
- `/admin/cliniko/test-lab` — DEMO CRUD, discovery probes, mapping health, diagnostics (technical proof only)
- Calendar keeps demo external-work/admin overlays alongside live Cliniko appointments

## Admin UX and workflow refactor

- Sidebar simplified into workflow groups: **Daily Work**, **Money**, **Operations**, **Setup & Proof**
- `/admin` visually labelled **Today** — main daily command screen for George
- Shared workflow UI: `WorkflowPageHeader`, `WorkflowSummaryCard`, `AppointmentWorkflowCard`, `ActionQueue`, `ActionChip`, `DataSourcePill`, `PlainEmptyState`, `WorkflowHelpPanel`, `SectionTabs`
- Live Cliniko appointments power workflow cards and action chips across Today, bookings, payments, invoices, insurance and stock
- Demo examples remain separate from live data with clear source pills
- Technical API language (`patient_id`, `q[]`, raw payloads) hidden from normal clinic workflow pages — only on `/admin/cliniko/test-lab`
- Normal Cliniko page uses plain clinic language: “Cliniko test account”, not “sandbox”
- Each admin page has a plain-English purpose line answering “what do I need to do next?”

## Workflow intelligence layer

- `lib/admin-workflow.ts` builds **workflow bundles** per live Cliniko appointment: note, payment, invoice, insurance, stock, follow-up and setup actions
- `lib/appointment-rules.ts` — keyword-based appointment type detection (initial, follow-up, massage, telehealth, insurance, etc.)
- `lib/clinic-commercial-rules.ts` — demo-safe price/payment/invoice configuration (not George's live prices)
- Today command list driven by `getTodayCommandItems` — adapts to **Upcoming command list** when no appointments are today
- Queue helpers: `getNotesQueue`, `getPaymentQueue`, `getInvoiceQueue`, `getInsuranceQueue`, `getStockQueue`, `getFollowUpQueue`
- `/admin/proof` — honest status of what works now vs inferred workflow vs future integrations
- No real payment, accounting or clinical-note status is claimed unless integrated
- Cliniko remains the system of record

## Insurance session tracking workflow

- Insurance cases inferred from appointment types plus **Command Hub demo case** details (server-side demo workflow state)
- Approved sessions, sessions used and sessions remaining calculated per case
- Missing claim, authorisation, liability and invoice details surfaced via checklist
- `/admin/insurance` rebuilt as case tracker with tabs: All cases, Needs details, Ready to invoice, Sessions used
- Demo case controls collapsed by default — DEMO patient labels only, no Cliniko writes
- Insurance invoice readiness queue on `/admin/invoices` — Healthcode remains future integration
- Today, bookings and workflow bundles enriched with insurance-specific action chips when cases exist
- No real patient insurance data should be entered

## Demo Clinic Week and full DEMO client journey

- `lib/demo-clinic-week.ts` — 12 DEMO clients, 12 appointment scenarios (private, insurance, telehealth, external, stock, follow-up)
- Full fake client profiles: DOB, contact, GP, insurance details, treatment plans
- `lib/demo-week-to-mapped.ts` — maps scenarios to `MappedBooking` for workflow engine
- `lib/demo-client-journey.ts` — client journey view data with honest source labels
- `lib/demo-clinic-week-seed.ts` — Cliniko test-lab seeding (DEMO patients + appointments only)
- Demo week preview mode (server-side demo workflow state) — rich layout without mixing unlabelled data
- `/admin/clients` — client journey page under Clinic sidebar group
- Test lab: Demo Clinic Week panel (preview, seed, check, cleanup)
- Today/Bookings/Insurance/Invoices/Notes/Follow-ups enriched with scenario data
- `WhatThisShows` helper on key workflow pages
- Entity audit: patients/appointments writable to Cliniko; notes/invoices/follow-ups prepared only
- Smoke expanded to 35 checks including `/admin/clients`

## Appointment actions and patient matching

- Appointment cards on Today, Bookings, Insurance invoice queue, Notes and Follow-ups include **Open record** (primary) and secondary actions (Add note, Prepare invoice, Review follow-up)
- `/admin/appointments/[appointmentId]` — appointment detail: client profile, Cliniko record status, treatment note, follow-up, invoice/payment, insurance, source summary
- `/admin/clients/[clientId]` — client detail journey at person level
- `/admin/intake` — booking intake demo with exact/possible/none/unsafe match scenarios
- `lib/cliniko-patient-matching.ts` — scoring rules (email, phone, name+DOB, policy number)
- `lib/demo-write-safety.ts` — server-side DEMO prefix validation; blocks non-DEMO writes
- API: `POST /api/cliniko/patient-match`, `POST /api/cliniko/create-demo-patient-intake`
- `PatientMatchPanel` — run match, staff confirm, create DEMO patient (honest labels)
- Treatment note save reuses `/api/cliniko/treatment-note-draft` — only claims success when API returns `mode: created`
- Invoice drafts and follow-up booking remain prepared/demo-only unless Cliniko write path exists
- Smoke expanded for Open record, intake, and appointment detail routes

## Cliniko patient record completeness and inline follow-up booking

- `lib/cliniko-patient-field-map.ts` — audited field capability map (writable vs prepared-only)
- `lib/demo-patient-create.ts` — maximum safe Cliniko patient create with read-back verification
- `lib/demo-followup-booking.ts` + `POST /api/cliniko/create-demo-followup` — inline DEMO follow-up booking with duplicate detection
- `lib/record-completeness.ts` + `RecordCompletenessPanel` on appointment and client detail pages
- Patient create API returns `savedFields`, `preparedOnlyFields`, `verified`, and honest status labels
- Intake page shows saved-vs-prepared field behaviour and blocked non-DEMO writes
- Calendar cards include **Open record** linking to appointment detail
- Test lab: **Patient record write proof** section with field map summary

## Treatment note hardening and insurance storage audit

- `lib/demo-treatment-note-safety.ts` — server-side note save safety: DEMO patient/appointment validation, appointment ownership via `GET /individual_appointments/{id}`, read-back via `GET /treatment_notes/{id}`
- `lib/treatment-note-safety-checks.ts` — shared check labels for test lab (client-safe)
- `lib/treatment-note-eligibility.ts` — client-side eligibility mirror for UI
- `lib/cliniko-insurance-field-audit.ts` — insurance field storage audit (Cliniko vs Command Hub demo vs future integration)
- `/api/cliniko/treatment-note-draft` — returns `saved`, `prepared-only`, `blocked`, `failed`, or `verification-incomplete` with honest UI labels
- Appointment detail: note status, patient/appointment link status, can save?, reason if blocked, last save result
- Client detail: **Clinical record** section (prepared/saved notes, blocked writes)
- Notes page: DEMO-linked save safety copy; each card shows can save? and reason
- Insurance page: **Insurance storage audit** banner; per-case **Where this is stored**
- Record completeness panels: insurance fields with storage location labels; note status includes Blocked for safety
- Test lab: **Treatment note safety proof** and **Insurance field storage audit** panels
- Mobile/responsive QA documented in `DEMO_QA_CHECKLIST.md` (375px admin routes)
- Smoke checks expanded for note safety, clinical record, insurance audit, test-lab proof panels

## Existing patient reconciliation and safe DEMO patient update

- `lib/patient-field-reconciliation.ts` — compares intake vs Cliniko patient per field (matches, missing, different, prepared-only, not-safe)
- `lib/demo-patient-update.ts` + `POST /api/cliniko/update-demo-patient-intake` — staff-confirmed, selected-field-only PATCH with read-back verification
- `POST /api/cliniko/patient-reconciliation` — server-side field comparison for linked DEMO patients
- `/admin/intake` — Field comparison panel with selectable updates after match confirmation
- `/admin/clients/[clientId]` — Client record reconciliation summary + link to intake
- `/admin/appointments/[appointmentId]` — Patient details status + Review patient details link
- Test lab: **Patient update safety proof** panel
- Writable fields: name, email, phone, DOB, address, emergency contact, GP, reason, occupation, medical notes
- Prepared-only: insurance fields, marketing source, preferred location/practitioner (Command Hub demo case)

## Command Hub server-side demo workflow state

- Pluggable storage adapters in `lib/workflow-storage/` — file, Supabase, Vercel KV, Vercel Blob
- Resolver: `COMMAND_HUB_WORKFLOW_STORAGE=auto|file|supabase|vercel-kv|vercel-blob`
- Local dev: `.data/command-hub-workflow.json` (`local-file`) or **Supabase** when env vars set; legacy fallback `/tmp` (`vercel-tmp`) when no durable provider
- API: `GET/PATCH /api/command-hub/workflow-state` returns `{ ok, store, storage }`; `GET /api/command-hub/workflow-storage/status` for diagnostics
- `CommandHubWorkflowProvider` loads state, migrates legacy localStorage once, exposes `storage` + `migration` metadata
- UI: `WorkflowStorageProofPanel` on proof, settings and test lab
- See `docs/WORKFLOW_STORAGE.md` for durable provider setup — **no durable persistence unless env vars are configured**
- Still browser-only: Cliniko test lab proof badge cards (`localStorage` in `ClinikoTestLabPanel.tsx`)

## Cliniko-first storage policy and workflow boundary enforcement

- `docs/CLINIKO_FIRST_STORAGE_POLICY.md` — formal storage policy
- `lib/storage-boundary-policy.ts` — field classification registry
- `lib/validate-command-hub-workflow-state.ts` — server-side validation before workflow store writes
- Forbidden in workflow store: demographics, treatment note body, raw Cliniko payloads, secrets
- `StorageBoundaryPolicyPanel` on proof, settings and test lab
- Insurance fields remain Command Hub demo case data — not Cliniko-saved unless integrations are wired
- One-line policy: clinical truth in Cliniko; operational workflow state in Command Hub; no duplicate patient database

## Supabase durable workflow storage

- `lib/workflow-storage/supabase-workflow-store.ts` — PostgREST read/upsert with read-back verification
- Explicit `COMMAND_HUB_WORKFLOW_STORAGE=supabase` does not silently fall back to `/tmp`
- `GET /api/command-hub/workflow-storage/status` — `canRead`, `canWrite`, `message`, durable checklist UI
- `scripts/check-workflow-storage.mjs` — `--expect-durable` for Supabase verification
- `EXPECT_DURABLE_WORKFLOW_STORAGE=true` optional strict smoke flag
- `lib/workflow-storage/supabase-env.ts` — `SUPABASE_SECRET_KEY` or legacy `SUPABASE_SERVICE_ROLE_KEY`
- `scripts/probe-supabase-workflow-storage.mjs` — local preflight before Vercel deploy
- `npm run sync:vercel-env:supabase` — sync Supabase env vars from `.env.local` to Vercel (never prints secrets)
- Production **active** (2026-07-02): `mode=supabase`, `durability=durable`, `canRead` + `canWrite` verified

## Insurance invoice draft model (Part A)

- `lib/invoice-draft-types.ts` — `InsuranceInvoiceDraft`, session lines, export pack, readiness
- `lib/demo-invoice-drafts.ts` — DEMO policy/session seeds for default insurance cases
- `lib/build-insurance-invoice-draft.ts` — builds draft + plain-text export pack from `InsuranceCase` (read-only derivation)
- Not Xero/Healthcode integration — export pack is for staff copy/review; Cliniko remains clinical system of record

## Insurance invoice preparation workflow (Parts B–J)

- `/admin/invoices` — insurance invoice preparation hub: Ready to invoice, Needs missing details, Prepared drafts, private checks, external work, future integrations
- `/admin/invoices/[invoiceDraftId]` — invoice draft detail; stable smoke route `/admin/invoices/demo-aviva` (DEMO Sarah McKay / Aviva)
- `components/admin/InsuranceInvoicePreparationHub.tsx`, `InvoiceDraftCard.tsx`, `InvoiceDraftDetail.tsx`, `InvoiceDraftActions.tsx`
- `lib/invoice-draft-registry.ts`, `lib/invoice-draft-ids.ts`, `lib/invoice-export-formatters.ts`, `lib/invoice-defaults.ts`
- Copy/export actions (summary, details, session table, CSV, JSON) — client-side only; labelled **Prepared invoice draft — not sent**
- Workflow flags in Supabase (`store.invoiceDrafts[invoiceDraftId]`): prepared, exported, copied/exported timestamps, last action — **not** full draft objects
- Appointment (`/admin/appointments/[id]`), client (`/admin/clients/[slug]`) and insurance pages link to invoice drafts
- Storage-boundary validation extended for invoice draft workflow fields; forbidden PATCH still returns 403
- Xero and Healthcode remain future integrations; no real invoice submission

## Command Hub GUI polish and live data display fix

- **Root cause:** `toPatientLabel()` in `lib/cliniko.ts` abbreviated full DEMO names (e.g. `DEMO Test Patient 001` → `DEMO 0.`)
- `lib/cliniko-workflow-enrichment.ts` enriches live appointments server-side with appointment type, practitioner, business and DEMO patient labels
- `getSafeDemoPatientLabel()` rejects broken abbreviated labels; tests in `lib/cliniko-demo-appointments.test.ts`
- Generic fallbacks replaced with explicit not-returned labels when Cliniko data is missing
- `WorkflowBundleCard` — calmer hierarchy: time, patient, type, practitioner/location, one source pill, primary/secondary actions, setup section subdued
- Today and Bookings — status row, grouped command list (needs attention / ready / setup), data quality banner when needed
- Sidebar — Daily / Money / Clinic / Setup; proof and test lab moved to Cliniko + Settings pages
- Smoke — unauthenticated redirect/401 checks plus bookings label quality checks
- Public pages — Cliniko-first Dundee/Aviemore; Setmore legacy only

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

## Cliniko test account (pre-production system of record)

The sterile Cliniko **test account** is a real Cliniko environment — not synthetic demo JSON. Command Hub uses it to validate every workflow (bookings, notes, payments, insurance, stock, writes) before switching to the live business Cliniko account. DEMO-labelled patients/appointments in that account are safe to create and use; there is no negative impact on production Cliniko data.

| Layer | Purpose |
|-------|---------|
| **Cliniko test account** | Live API — diary, patients, appointments, notes (configured via `CLINIKO_API_KEY`) |
| **Demo examples** | Static fallback in code only when Cliniko is unreachable or not configured |

**Local:** `.env.local` (gitignored) — read automatically by Next.js dev/build on your machine.

**Production (Vercel):** same keys must be set in Vercel → Project → Settings → Environment Variables, or run `node scripts/sync-vercel-env.mjs` after `npx vercel link`.

## Environment variables

Copy `.env.local.example` to `.env.local` (never commit `.env.local`):

```
CLINIKO_API_KEY=your-sandbox-key-here
# Shard must match API key suffix (e.g. ...-uk3 → uk3)
CLINIKO_SHARD=uk3
CLINIKO_USER_AGENT=Tigers Eye Command Hub Demo / built by Mike Currie
CLINIKO_ENABLE_WRITES=true
NEXT_PUBLIC_DEMO_MODE=true
DEMO_STAFF_PASSWORD=change-me-before-deploy
DEMO_SESSION_SECRET=change-me-use-long-random-string
```

Sync local → Vercel: `node scripts/sync-vercel-env.mjs` (requires Vercel CLI login + link).

## Quality commands

```bash
npm run lint
npm run build
npm run smoke:local   # dev server required
npm run smoke:prod    # production URL
npm run check:workflow-storage        # local status probe
npm run check:workflow-storage:prod   # production status probe
npm run probe:supabase                # local Supabase table read/write preflight
npm run sync:vercel-env:supabase      # push Supabase env vars to Vercel (requires CLI login)
# Strict durable (only when Supabase env vars configured):
EXPECT_DURABLE_WORKFLOW_STORAGE=true npm run smoke:prod
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
