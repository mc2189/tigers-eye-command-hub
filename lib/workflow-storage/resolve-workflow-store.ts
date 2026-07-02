import "server-only";

import { createFileWorkflowStore } from "@/lib/workflow-storage/file-workflow-store";
import {
  createSupabaseWorkflowStore,
  createUnavailableSupabaseAdapter,
  isSupabaseWorkflowStorageConfigured,
} from "@/lib/workflow-storage/supabase-workflow-store";
import { createVercelBlobWorkflowStore } from "@/lib/workflow-storage/vercel-blob-workflow-store";
import { createVercelKvWorkflowStore } from "@/lib/workflow-storage/vercel-kv-workflow-store";
import type { WorkflowStorageInfo, WorkflowStoreAdapter } from "@/lib/workflow-storage/types";
import { validateCommandHubWorkflowStore } from "@/lib/validate-command-hub-workflow-state";

export type WorkflowStoragePreference =
  | "auto"
  | "file"
  | "supabase"
  | "vercel-kv"
  | "vercel-blob";

export function readWorkflowStoragePreference(): WorkflowStoragePreference {
  const raw = process.env.COMMAND_HUB_WORKFLOW_STORAGE?.trim().toLowerCase();
  if (
    raw === "file" ||
    raw === "supabase" ||
    raw === "vercel-kv" ||
    raw === "vercel-blob" ||
    raw === "auto"
  ) {
    return raw;
  }
  return "auto";
}

async function createFileAdapter(): Promise<WorkflowStoreAdapter> {
  return createFileWorkflowStore();
}

async function trySupabaseAdapter(
  preference: WorkflowStoragePreference
): Promise<WorkflowStoreAdapter | null> {
  const supabase = createSupabaseWorkflowStore();
  if (!supabase) {
    if (preference === "supabase") {
      return createUnavailableSupabaseAdapter(
        "Missing SUPABASE_URL or SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY."
      );
    }
    return null;
  }

  try {
    await supabase.read();
    return supabase;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Supabase read failed.";
    if (preference === "supabase") {
      return createUnavailableSupabaseAdapter(message);
    }
    console.warn("[workflow-storage] Supabase probe failed in auto mode:", message);
    return null;
  }
}

async function tryOtherDurableAdapter(
  preference: WorkflowStoragePreference
): Promise<WorkflowStoreAdapter | null> {
  if (preference === "vercel-kv" || preference === "auto") {
    const kv = createVercelKvWorkflowStore();
    if (kv) {
      try {
        await kv.read();
        return kv;
      } catch (err) {
        if (preference === "vercel-kv") throw err;
        console.warn(
          "[workflow-storage] Vercel KV probe failed:",
          err instanceof Error ? err.message : err
        );
      }
    } else if (preference === "vercel-kv") {
      console.warn(
        "[workflow-storage] COMMAND_HUB_WORKFLOW_STORAGE=vercel-kv but KV env vars are missing."
      );
    }
  }

  if (preference === "vercel-blob" || preference === "auto") {
    const blob = createVercelBlobWorkflowStore();
    if (blob) {
      try {
        await blob.read();
        return blob;
      } catch (err) {
        if (preference === "vercel-blob") throw err;
        console.warn(
          "[workflow-storage] Vercel Blob probe failed:",
          err instanceof Error ? err.message : err
        );
      }
    } else if (preference === "vercel-blob") {
      console.warn(
        "[workflow-storage] COMMAND_HUB_WORKFLOW_STORAGE=vercel-blob but Blob token is missing."
      );
    }
  }

  return null;
}

let cachedAdapter: WorkflowStoreAdapter | null = null;

export async function resolveWorkflowStoreAdapter(): Promise<WorkflowStoreAdapter> {
  if (cachedAdapter) return cachedAdapter;

  const preference = readWorkflowStoragePreference();

  if (preference === "file") {
    cachedAdapter = await createFileAdapter();
    return cachedAdapter;
  }

  if (preference === "supabase") {
    cachedAdapter = (await trySupabaseAdapter("supabase"))!;
    return cachedAdapter;
  }

  const supabase = await trySupabaseAdapter("auto");
  if (supabase) {
    cachedAdapter = supabase;
    return supabase;
  }

  const otherDurable = await tryOtherDurableAdapter(preference);
  if (otherDurable) {
    cachedAdapter = otherDurable;
    return otherDurable;
  }

  if (preference === "vercel-kv" || preference === "vercel-blob") {
    cachedAdapter = await createFileAdapter();
    return cachedAdapter;
  }

  cachedAdapter = await createFileAdapter();
  return cachedAdapter;
}

export async function getWorkflowStorageInfo(): Promise<WorkflowStorageInfo> {
  const adapter = await resolveWorkflowStoreAdapter();
  return adapter.getInfo();
}

function buildStatusMessage(
  storage: WorkflowStorageInfo,
  canRead: boolean,
  canWrite: boolean,
  preference: WorkflowStoragePreference
): string {
  if (storage.mode === "supabase" && storage.configured && canRead && canWrite) {
    return "Command Hub workflow state is stored in Supabase. Cliniko remains the system of record for patients, appointments and clinical notes.";
  }

  if (storage.mode === "supabase" && !storage.configured) {
    return "Supabase workflow storage is configured but could not be verified. Check the table, service-role key and environment variables.";
  }

  if (isSupabaseWorkflowStorageConfigured() && storage.mode !== "supabase" && preference !== "file") {
    return "Supabase env vars are present but the active adapter fell back — check COMMAND_HUB_WORKFLOW_STORAGE, table SQL and connectivity.";
  }

  if (storage.durability === "ephemeral") {
    return "Command Hub workflow state is server-side for this demo, but may reset after deploys or cold starts.";
  }

  if (storage.durability === "local-dev") {
    return "Command Hub workflow state is stored in a local development file.";
  }

  if (canRead && !canWrite) {
    return "Workflow storage read succeeded but write verification did not complete.";
  }

  if (!canRead) {
    return storage.warning ?? "Workflow storage could not be read.";
  }

  return storage.description;
}

export async function probeWorkflowStorage(): Promise<{
  storage: WorkflowStorageInfo;
  canRead: boolean;
  canWrite: boolean;
  lastChecked: string;
  message: string;
}> {
  const preference = readWorkflowStoragePreference();
  const adapter = await resolveWorkflowStoreAdapter();
  const storage = adapter.getInfo();
  let canRead = false;
  let canWrite = false;

  try {
    const store = await adapter.read();
    canRead = true;

    if (storage.configured && storage.durability === "durable") {
      try {
        const healthCheckStore = {
          ...store,
          storageHealthCheckAt: new Date().toISOString(),
        };
        validateCommandHubWorkflowStore(healthCheckStore);
        await adapter.write(healthCheckStore);
        canWrite = true;
      } catch (err) {
        console.warn(
          "[workflow-storage] Write verification failed:",
          err instanceof Error ? err.message : err
        );
        canWrite = false;
      }
    } else {
      canWrite = storage.configured;
    }
  } catch (err) {
    console.warn(
      "[workflow-storage] Storage probe read failed:",
      err instanceof Error ? err.message : err
    );
    canRead = false;
    canWrite = false;
  }

  const message = buildStatusMessage(storage, canRead, canWrite, preference);

  return {
    storage,
    canRead,
    canWrite,
    lastChecked: new Date().toISOString(),
    message,
  };
}

/** Test helper — reset cached adapter between tests. */
export function resetWorkflowStoreAdapterCache(): void {
  cachedAdapter = null;
}
