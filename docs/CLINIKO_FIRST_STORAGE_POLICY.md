# Cliniko-first storage policy

**One-line policy:** Clinical truth in Cliniko; operational workflow state in Command Hub; no duplicate patient database.

## Cliniko is the system of record for

- Patients
- Appointments
- Treatment notes
- Clinical history
- Follow-up appointments once booked
- Patient demographics where supported by the Cliniko integration

Command Hub reads from Cliniko and writes back only through safety-gated DEMO APIs. It is a workflow layer, not a second EMR.

## Command Hub workflow store may contain

- Cliniko patient ID
- Cliniko appointment ID (via appointment map keys and `followUpClinikoAppointmentId`)
- Workflow completion flags (invoice prepared, note saved status, follow-up prepared/booked)
- Invoice draft workflow metadata keyed by `invoiceDraftId` (`invoiceDraftPrepared`, `invoiceDraftExported`, copy/export timestamps, last action — **not** the full draft object)
- Staff-reviewed / match decisions (`matchStatus`, linked patient label — DEMO only)
- DEMO insurance case workflow data (insurer, claim, auth, sessions — DEMO labels only)
- Demo week preview state
- Last workflow action timestamps and result summaries (no clinical note body)

Storage backends (local file, `/tmp`, Supabase, KV, Blob) hold **workflow metadata only**. Durable storage does not make Command Hub the clinical record.

## Command Hub must not persist

- Full copied patient demographics from Cliniko
- Treatment note body as a permanent record
- Full clinical history
- Real patient information
- Real insurer eligibility data (unless a secure production design is approved)
- API keys, session secrets, or tokens
- Raw Cliniko payloads containing patient data

## Insurance grey area

Insurer, policy, claim, authorisation and session data are sensitive operational/admin data. In this demo they are **DEMO-only Command Hub workflow data** — not saved to Cliniko.

Future preferred storage:

- Cliniko custom fields (when configured)
- Healthcode / Xero integration
- A properly secured production database table with explicit approval

Do not claim insurance provider/policy/claim/auth fields are saved to Cliniko unless that integration is wired and verified.

## Enforcement

- `lib/storage-boundary-policy.ts` — field classification registry
- `lib/validate-command-hub-workflow-state.ts` — server-side validation before workflow store writes
- Staff-only APIs: `/api/command-hub/workflow-state`, `/api/command-hub/workflow-storage/status`
- Admin UI: `StorageBoundaryPolicyPanel`, `WorkflowStorageProofPanel`

## Related docs

- [WORKFLOW_STORAGE.md](./WORKFLOW_STORAGE.md) — adapter modes and env vars
