# Tigers Eye — Demo QA Checklist

Use this before showing George. Tick each item after verifying in the browser.

**Recommended demo path:** `/admin` → **Start walkthrough** → follow steps 1–11.

---

## Public website

### Homepage (`/`)
- [ ] Hero explains Tigers Eye clearly with book + services CTAs
- [ ] Clinics section mentions Cliniko and location-first booking
- [ ] Insurance and telehealth sections visible
- [ ] Footer links work; Command Hub labelled “(demo)”

### Location-first booking (`/book`)
- [ ] Step 1 asks for location before appointment type
- [ ] Dundee shows Cliniko
- [ ] Aviemore shows Cliniko (not Setmore as active provider)
- [ ] Confirm step shows Command Hub connection note
- [ ] Aviemore may show subtle legacy Setmore transition note only

### Dundee booking route
- [ ] Dundee card routes to Cliniko URL on confirm (private route)
- [ ] Insurance route goes to `/insurance`
- [ ] Telehealth route goes to `/telehealth`

### Aviemore booking route
- [ ] Aviemore treated equally to Dundee (not a workaround)
- [ ] “Configuring in Cliniko” status shown if sandbox not live
- [ ] No Setmore button in main booking journey

### Services (`/services`)
- [ ] All services readable on mobile
- [ ] Steroid injection and telehealth notes clear

### Insurance (`/insurance`)
- [ ] Provider guidance (Aviva, Vitality, other)
- [ ] Liability notice visible
- [ ] Command Hub note present

### Telehealth (`/telehealth`)
- [ ] Marked as proposed/demo service
- [ ] Payment and workflow notes clear

### Locations (`/locations`)
- [ ] Dundee and Aviemore both show Cliniko
- [ ] Setmore only as legacy/transition note if present
- [ ] Booking gateway CTA works

### Team (`/team`)
- [ ] George and Jamie Lee profiles render
- [ ] Placeholder practitioner labelled clearly

### Contact (`/contact`)
- [ ] Form submits demo success message
- [ ] Command Hub follow-up explained

### Footer / admin link
- [ ] “Command Hub (demo)” in footer — subtle, not patient-facing feature

---

## Admin Command Hub

### Today (`/admin`)
- [ ] Page title reads **Today** with a clear purpose line
- [ ] Summary cards: appointments, notes, payments, invoices, insurance, stock
- [ ] Command list shows workflow actions from live Cliniko appointments (Today or Upcoming)
- [ ] Clinic status panel: Cliniko connected, demo mode, no real patient data

### Bookings (`/admin/bookings`)
- [ ] Tabs: All, Needs attention, Ready, Missing setup
- [ ] Each card shows primary action, why it matters, suggested next step
- [ ] Live Cliniko appointments use workflow bundles

### Notes (`/admin/notes`)
- [ ] Appointments needing notes queue from live Cliniko data
- [ ] Suggested note template per appointment type
- [ ] Safety copy: no audio stored, Cliniko remains clinical record

### Payments (`/admin/payments`)
- [ ] Does not pretend real payment status is connected
- [ ] Payment checks queue from workflow engine

### Proof (`/admin/proof`)
- [ ] Working now / Inferred workflow / Future integrations sections
- [ ] Insurance session tracking listed under Working now

### Insurance cases (`/admin/insurance`)
- [ ] Page reads as insurance case tracker with session progress
- [ ] Summary cards: open cases, sessions remaining, missing details, ready to invoice
- [ ] Demo case controls (collapsed) — save Aviva demo case for DEMO patient
- [ ] Sessions used / remaining display correctly after demo case saved
- [ ] Tabs: All cases, Needs details, Ready to invoice, Sessions used

### Walkthrough (`/admin/demo-walkthrough`)
- [ ] All 11 steps present with Open page buttons
- [ ] Location-first booking step mentions Dundee, Aviemore, Cliniko

### Cliniko (`/admin/cliniko`)
- [ ] Clean integration overview — not a developer console
- [ ] Connection status, live appointment feed, businesses, practitioners, types
- [ ] “Cliniko remains the diary and clinical record” messaging
- [ ] **Open technical test lab** link visible
- [ ] No endpoint diagnostics or raw test actions on this page

### Cliniko test lab (`/admin/cliniko/test-lab`)
- [ ] **Technical test lab** banner at top
- [ ] DEMO patient/appointment CRUD and discovery probes still work
- [ ] Mapping health and diagnostics present
- [ ] **Live Cliniko DEMO appointments** section shows only real Cliniko rows (numeric id)
- [ ] No phantom rows like `DEMO 0.` or `DEMO (.`
- [ ] **Appointment source diagnostics** panel visible after refresh
- [ ] **Clear local proof state** clears badges only (does not change Cliniko)
- [ ] **Run appointment discovery** button returns probe cards with counts
- [ ] **Lookup appointment by ID** works for a Cliniko appointment ID copied from Cliniko

### Bookings (`/admin/bookings`)
- [ ] Purpose line: review appointments from Cliniko
- [ ] Live Cliniko appointments use consistent workflow cards
- [ ] Helpful empty state when no live appointments

### Calendar (`/admin/calendar`)
- [ ] Weekly view readable on mobile
- [ ] Cliniko load button works

### Practitioner calendars
- [ ] George calendar (`/admin/calendar/george`)
- [ ] Jamie Lee calendar (`/admin/calendar/practitioner-2`) — Cliniko only wording

### Notes (`/admin/notes`)
- [ ] Safe notes workflow panel visible
- [ ] Data handling panel visible
- [ ] Save draft shows dry-run / safety-gated badges

### Payments (`/admin/payments`)
- [ ] Payment rules readable

### Finance (`/admin/finance`)
- [ ] Clearly not accounting software
- [ ] Estimated income disclaimer visible

### Invoices (`/admin/invoices`)
- [ ] Invoice queue loads or shows empty/error state
- [ ] Demo invoice actions respond

### Insurance (`/admin/insurance`)
- [ ] Inferred cases callout — not stored
- [ ] Cliniko panel loads or falls back

### Stock (`/admin/stock`)
- [ ] Stock estimate panel works

### Settings (`/admin/settings`)
- [ ] Cliniko, Aviemore, Setmore legacy cards visible
- [ ] No API key in UI

### Healthcode (`/admin/healthcode`)
- [ ] Future integration placeholder clearly stated

---

## Mobile

- [ ] No sideways scrolling on public or admin pages
- [ ] Admin hamburger menu opens and closes
- [ ] Booking gateway easy on phone (large tap targets)
- [ ] Calendar cards readable on phone
- [ ] Notes assistant usable on tablet/phone
- [ ] Finance panels stack cleanly

---

## Data safety

- [ ] Demo banner visible on all admin pages
- [ ] Demo staff login required for Command Hub
- [ ] Cliniko test lab only creates DEMO-prefixed fake patients
- [ ] Patient actions (create/update/archive) are separate from appointment actions
- [ ] Appointment create does not run cleanup automatically
- [ ] Cleanup requires explicit confirmation
- [ ] Live Cliniko panels do not show demo bookings when connected with zero bookings
- [ ] “Check for DEMO appointments” finds manually created Cliniko bookings for DEMO patients
- [ ] Appointment preflight and diagnostics visible when create fails

### Cliniko appointment proof update

- [ ] Manual Cliniko appointments read from `/individual_appointments`
- [ ] `/bookings` may be empty while individual appointments exist
- [ ] Online available-time 404 treated as soft warning, not hard block
- [ ] Direct DEMO appointment create uses safe future time + `ends_at`
- [ ] Individual appointments visible on `/admin/cliniko`, bookings, calendar after load

### Appointment proof troubleshooting

- [ ] DEMO patient create/update/archive proven in test lab
- [ ] Cleanup proven when manually triggered
- [ ] DEMO appointment create — pending or proven with diagnostics if failed
- [ ] Manual Cliniko appointment read-back test documented and working
- [ ] Possible causes understood: practitioner, appointment type, availability, online booking, payload rejected
- [ ] No real patient names from production (sandbox/demo only)
- [ ] No API key visible in browser or page source
- [ ] Notes: no audio/transcript stored messaging clear
- [ ] Writes gated unless `CLINIKO_ENABLE_WRITES=true` server-side
- [ ] Cliniko described as system of record throughout
- [ ] Setmore appears only as legacy/transitional text

---

## Demo Clinic Week and client journey

- [ ] Preview demo clinic week toggle works on Settings and Proof pages
- [ ] Demo week preview banner shows when preview is active
- [ ] `/admin/clients` shows DEMO client journeys with notes/invoice/follow-up status
- [ ] Today page groups Urgent / Ready / Money / Insurance / Client journey / Setup
- [ ] Bookings page groups Today / Tomorrow / Later this week
- [ ] Insurance page shows Sessions remaining, liability agreement, invoice readiness
- [ ] Invoices page shows insurance invoice drafts and Prepared invoice draft
- [ ] Notes page shows note templates and safety copy
- [ ] Follow-ups page shows Suggested by Command Hub actions
- [ ] Test lab Demo Clinic Week panel: preview, seed, check, cleanup
- [ ] Seeding creates DEMO-prefixed patients only
- [ ] Preview data labelled Demo week preview — not confused with live Cliniko

---

## Command Hub GUI polish (live labels + daily workflow)

- [ ] `/admin/bookings` shows full DEMO patient names (not `DEMO 0.` or `DEMO (.`)
- [ ] Appointment type, practitioner and location show real Cliniko values or explicit not-returned labels
- [ ] Booking cards show time first, one Cliniko test account pill, primary action before setup warnings
- [ ] “Show all workflow actions” disclosure works
- [ ] Today page groups Needs attention / Ready / Setup to improve
- [ ] Sidebar no longer lists Proof or Demo Proof as primary daily nav
- [ ] `/admin/cliniko` links to Technical Cliniko test lab
- [ ] `/admin/settings` links to Demo proof page and Technical Cliniko test lab
- [ ] Incognito `/admin` and `/admin/bookings` redirect to login
- [ ] Banner reads “sterile Cliniko test account only”

---

## Appointment actions and patient matching

- [ ] Today cards have **Open record** button
- [ ] Booking cards have **Open record** button
- [ ] `/admin/appointments/[id]` opens appointment detail with client, note, follow-up, invoice sections
- [ ] `/admin/clients` cards have **Open client record**
- [ ] `/admin/clients/[id]` shows full client journey
- [ ] `/admin/intake` shows exact/possible/no/unsafe match scenarios
- [ ] Unsafe/non-DEMO input cannot write (403 / blocked label)
- [ ] New DEMO patient creation gated and honest (Saved vs Prepared for Cliniko)
- [ ] Possible match requires staff confirmation unless exact DEMO match
- [ ] Treatment note save does not fake Cliniko success
- [ ] Invoice draft does not claim Xero/Healthcode integration
- [ ] Mobile layout usable on appointment and client detail pages

---

## Cliniko patient record completeness and follow-up booking

- [ ] `/admin/intake` shows saved vs prepared field behaviour after patient create
- [ ] New DEMO patient creation writes phone, DOB, address when provided
- [ ] Non-DEMO patient creation blocked with clear message
- [ ] Read-back verification message is honest (verified vs not completed)
- [ ] `/admin/appointments/dcw-001` shows Record completeness panel
- [ ] Follow-up booking button works when DEMO-linked and writes enabled, or shows prepared-only
- [ ] Duplicate follow-up is detected and not recreated
- [ ] `/admin/clients/demo-alex-wilson` shows Record completeness
- [ ] Calendar has Open record on appointment cards
- [ ] Test lab shows Patient record write proof

---

## Automated smoke tests

```bash
npm run test
npm run lint
npm run build
npm run dev          # terminal 1
npm run smoke:local  # terminal 2 — includes unauthenticated auth checks
npm run smoke:prod   # after Vercel deploy (47 checks)
```
