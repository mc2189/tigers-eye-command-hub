# Command Hub workflow storage

Command Hub stores **operational demo workflow state** separately from Cliniko. Cliniko remains the system of record for patients, appointments and treatment notes (where safely written).

## What is stored in Command Hub workflow state

- Invoice prepared flags
- Note/follow-up workflow flags
- Linked patient decisions
- Insurance demo case details (DEMO labels only)
- Demo week preview preference
- Operational workflow completion state

## What stays in Cliniko

- Patient records
- Appointments
- Treatment notes (when safely written to the sterile test account)
- Follow-up appointments (when safely written)

## Storage adapter architecture

```
lib/command-hub-workflow-store.ts          # Public server API (read/patch)
lib/workflow-storage/resolve-workflow-store.ts
lib/workflow-storage/file-workflow-store.ts
lib/workflow-storage/supabase-workflow-store.ts
lib/workflow-storage/vercel-kv-workflow-store.ts
lib/workflow-storage/vercel-blob-workflow-store.ts
```

`COMMAND_HUB_WORKFLOW_STORAGE` selects the provider:

| Value | Behaviour |
|-------|-----------|
| `auto` (default) | Supabase → Vercel KV → Vercel Blob → file/tmp fallback |
| `file` | Local `.data/` or Vercel `/tmp` only |
| `supabase` | Supabase/Postgres (falls back to file if env missing or read fails in auto) |
| `vercel-kv` | Vercel KV / Upstash REST |
| `vercel-blob` | Vercel Blob |

## Supported modes

| Mode | Durability | When active |
|------|------------|-------------|
| `local-file` | `local-dev` | Local `.data/command-hub-workflow.json` |
| `vercel-tmp` | `ephemeral` | Vercel `/tmp` when no durable provider configured |
| `supabase` | `durable` | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` |
| `vercel-kv` | `durable` | `KV_REST_API_URL` + `KV_REST_API_TOKEN` |
| `vercel-blob` | `durable` | `BLOB_READ_WRITE_TOKEN` |

**Honest limitation:** If no durable provider env vars are configured on Vercel, workflow state remains **server-side but ephemeral** (`/tmp`). It is better than browser `localStorage`, but it is **not** production-grade persistence.

## Environment variables

See `.env.local.example`. Never commit real credentials.

### Supabase table (manual migration)

```sql
create table command_hub_workflow_state (
  id text primary key,
  store jsonb not null,
  updated_at timestamptz not null default now()
);
```

Default row id: `tigers-eye-demo` (override with `COMMAND_HUB_WORKFLOW_STORE_ID`).

## API

- `GET/PATCH /api/command-hub/workflow-state` — returns `{ ok, store, storage }`
- `GET /api/command-hub/workflow-storage/status` — staff-auth diagnostics

Both routes are protected by demo staff middleware.

## Security

- Durable provider credentials are server-side only
- Workflow JSON must not contain API keys or session secrets
- Public pages never expose workflow state

## Legacy migration

On first authenticated admin load, `CommandHubWorkflowProvider` migrates one-time legacy browser `localStorage` keys when the server store is empty, then clears local keys after a successful PATCH.
