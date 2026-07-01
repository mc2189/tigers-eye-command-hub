# Command Hub workflow storage

Command Hub stores **operational demo workflow state** separately from Cliniko. Cliniko remains the system of record for patients, appointments and treatment notes (where safely written).

**One-line boundary:** Clinical truth in Cliniko; operational workflow state in Command Hub; no duplicate patient database.

## What is stored in Command Hub workflow state

- Invoice prepared flags
- Note/follow-up workflow flags
- Linked patient decisions (Cliniko IDs + DEMO labels)
- Insurance demo case details (DEMO labels only)
- Demo week preview preference
- Operational workflow completion state
- `storageHealthCheckAt` (storage probe timestamp only)

## What stays in Cliniko

- Patient records
- Appointments
- Treatment notes (when safely written to the sterile test account)
- Follow-up appointments (when safely written)

## Storage adapter architecture

```
lib/command-hub-workflow-store.ts
lib/workflow-storage/resolve-workflow-store.ts
lib/workflow-storage/file-workflow-store.ts
lib/workflow-storage/supabase-workflow-store.ts
lib/workflow-storage/vercel-kv-workflow-store.ts
lib/workflow-storage/vercel-blob-workflow-store.ts
lib/validate-command-hub-workflow-state.ts
```

`COMMAND_HUB_WORKFLOW_STORAGE` selects the provider:

| Value | Behaviour |
|-------|-----------|
| `auto` (default) | Supabase → Vercel KV → Vercel Blob → file/tmp fallback |
| `file` | Local `.data/` or Vercel `/tmp` only |
| `supabase` | Supabase only — **no silent fallback** if misconfigured |
| `vercel-kv` | Vercel KV / Upstash REST |
| `vercel-blob` | Vercel Blob |

## Supported modes

| Mode | Durability | When active |
|------|------------|-------------|
| `local-file` | `local-dev` | Local `.data/command-hub-workflow.json` |
| `vercel-tmp` | `ephemeral` | Vercel `/tmp` when no durable provider configured |
| `supabase` | `durable` | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + working table |
| `vercel-kv` | `durable` | `KV_REST_API_URL` + `KV_REST_API_TOKEN` |
| `vercel-blob` | `durable` | `BLOB_READ_WRITE_TOKEN` |

**Honest limitation:** If no durable provider env vars are configured on Vercel, workflow state remains **server-side but ephemeral** (`/tmp`).

---

## Supabase durable workflow storage

### What Supabase stores

A **single JSON workflow document** per environment (`COMMAND_HUB_WORKFLOW_STORE_ID`). This is operational metadata only — not patients, notes or clinical history.

### SQL setup

Run in the Supabase SQL editor:

```sql
create table if not exists command_hub_workflow_state (
  id text primary key,
  store jsonb not null,
  updated_at timestamptz not null default now()
);

alter table command_hub_workflow_state enable row level security;
```

The service-role key must only be configured in Vercel/server env vars. It must never be exposed to the browser. The table stores Command Hub workflow metadata only, not clinical records.

### Environment variables

```env
COMMAND_HUB_WORKFLOW_STORAGE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
COMMAND_HUB_SUPABASE_TABLE=command_hub_workflow_state
COMMAND_HUB_WORKFLOW_STORE_ID=tigers-eye-demo
```

Do not commit real values.

### Vercel configuration

1. Vercel Project → **Settings** → **Environment Variables**
2. Add the variables above for **Production** (and Preview if needed)
3. Set `COMMAND_HUB_WORKFLOW_STORAGE=supabase`
4. **Redeploy** production
5. Run production smoke:
   ```bash
   DEMO_STAFF_PASSWORD=<password> npm run smoke:prod
   ```
6. Confirm status API:
   ```bash
   npm run check:workflow-storage:prod
   ```
   Expect `mode=supabase`, `durability=durable`, `canRead=yes`, `canWrite=yes`

### Strict durable verification

```bash
EXPECT_DURABLE_WORKFLOW_STORAGE=true DEMO_STAFF_PASSWORD=<password> npm run smoke:prod
```

Or:

```bash
DEMO_STAFF_PASSWORD=<password> node scripts/check-workflow-storage.mjs --base-url=https://tigers-eye-command-hub.vercel.app --expect-durable
```

### Supabase adapter behaviour

| Case | `auto` mode | `supabase` explicit mode |
|------|-------------|--------------------------|
| Env vars missing | Falls back to KV/Blob/file | Returns unavailable Supabase adapter (not durable) |
| Table missing / auth error | Falls back to file/tmp | Status shows Supabase unavailable |
| Empty table | Default workflow store | Default workflow store |
| Upsert succeeds | Durable active | Durable active + read-back verify |

---

## Environment variables

See `.env.local.example`. Never commit real credentials.

## API

- `GET/PATCH /api/command-hub/workflow-state` — returns `{ ok, store, storage }`
- `GET /api/command-hub/workflow-storage/status` — returns `{ ok, storage, canRead, canWrite, lastChecked, message }`

Both routes are protected by demo staff middleware. Storage-boundary validation runs before every write.

## Security

- Durable provider credentials are server-side only
- Workflow JSON must not contain API keys, secrets, demographics or note bodies
- Public pages never expose workflow state

## Legacy migration

On first authenticated admin load, `CommandHubWorkflowProvider` migrates one-time legacy browser `localStorage` keys when the server store is empty, then clears local keys after a successful PATCH.

## Cliniko-first boundary enforcement

Durable adapters store **workflow metadata only** — not a clinical database. See [CLINIKO_FIRST_STORAGE_POLICY.md](./CLINIKO_FIRST_STORAGE_POLICY.md).
