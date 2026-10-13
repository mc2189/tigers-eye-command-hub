# Tiger's Eye Command Hub

Tiger's Eye Command Hub is a **clinic-operations workflow prototype** built to explore how appointment, patient and operational information from an existing practice-management system could be turned into a clearer day-to-day command view for staff.

It is a portfolio/demo project. It is not a medical device, does not provide clinical advice and should not be connected to real patient data without a full production security/privacy review.

## What it demonstrates

- Next.js / React / TypeScript product development
- Integration design around the Cliniko API
- Server-side handling of sensitive API credentials
- Demo/sandbox fallbacks when an external service is unavailable
- Operational dashboards and workflow state
- Appointment and follow-up task concepts
- Role/staff-gated administration routes
- Supabase / KV / Blob persistence options for workflow state
- Validation designed to prevent raw provider data or secrets being persisted accidentally
- Smoke testing and deployment-readiness checks
- Thinking about privacy, clinical data boundaries and operational resilience

## Why I built it

The project came from looking at a real operational problem: staff often work across appointments, notes, follow-ups, invoices and other tasks, while the source practice-management system remains the system of record.

The prototype explores a separate "command hub" layer that summarises what needs attention without trying to replace the underlying clinical system.

## Safety and data boundaries

The repository is designed around test/demo data and server-side credentials.

- Real `CLINIKO_API_KEY` values belong only in environment variables.
- Demo mode remains available when Cliniko is not configured.
- Secret-like fields are explicitly excluded from workflow-state persistence.
- Raw provider payloads should not be used as durable workflow state.
- Production use would require appropriate authentication, access controls, audit logging, privacy impact assessment and secure hosting decisions.

## Tech stack

- Next.js
- React
- TypeScript
- Cliniko API integration
- Optional Supabase persistence
- Optional Vercel KV / Blob persistence
- Vercel deployment workflow

## Quick start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Use placeholder/test credentials only. The example environment file is intentionally non-secret.

## Useful areas of the repository

- `lib/cliniko.ts` - Cliniko connection and data-access layer
- `lib/validate-command-hub-workflow-state.ts` - workflow-state privacy/secret validation
- `docs/WORKFLOW_STORAGE.md` - durable workflow storage design
- `DEMO_QA_CHECKLIST.md` - demo and security checks
- `SMOKE_TEST_RESULTS.md` - recorded test results
- `scripts/` - smoke/deployment helper scripts

## Project status

This is an evolving portfolio prototype. The value is in the workflow design, integration boundaries, validation and operational thinking rather than in presenting it as a finished healthcare product.
