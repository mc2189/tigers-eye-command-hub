import "server-only";

import { createFileWorkflowStore } from "@/lib/workflow-storage/file-workflow-store";
import { createSupabaseWorkflowStore } from "@/lib/workflow-storage/supabase-workflow-store";
import { createVercelBlobWorkflowStore } from "@/lib/workflow-storage/vercel-blob-workflow-store";
import { createVercelKvWorkflowStore } from "@/lib/workflow-storage/vercel-kv-workflow-store";
import type { WorkflowStorageInfo, WorkflowStoreAdapter } from "@/lib/workflow-storage/types";

export type WorkflowStoragePreference =
  | "auto"
  | "file"
  | "supabase"
  | "vercel-kv"
  | "vercel-blob";

function readPreference(): WorkflowStoragePreference {
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

async function tryDurableAdapter(
  preference: WorkflowStoragePreference
): Promise<WorkflowStoreAdapter | null> {
  if (preference === "supabase" || preference === "auto") {
    const supabase = createSupabaseWorkflowStore();
    if (supabase) return supabase;
    if (preference === "supabase") {
      console.warn(
        "[workflow-storage] COMMAND_HUB_WORKFLOW_STORAGE=supabase but Supabase env vars are missing."
      );
    }
  }

  if (preference === "vercel-kv" || preference === "auto") {
    const kv = createVercelKvWorkflowStore();
    if (kv) return kv;
    if (preference === "vercel-kv") {
      console.warn(
        "[workflow-storage] COMMAND_HUB_WORKFLOW_STORAGE=vercel-kv but KV env vars are missing."
      );
    }
  }

  if (preference === "vercel-blob" || preference === "auto") {
    const blob = createVercelBlobWorkflowStore();
    if (blob) return blob;
    if (preference === "vercel-blob") {
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

  const preference = readPreference();

  if (preference === "file") {
    cachedAdapter = await createFileAdapter();
    return cachedAdapter;
  }

  const durable = await tryDurableAdapter(preference);
  if (durable) {
    try {
      await durable.read();
      cachedAdapter = durable;
      return durable;
    } catch (err) {
      console.warn(
        "[workflow-storage] Durable adapter failed read probe; falling back to file/tmp:",
        err instanceof Error ? err.message : err
      );
      if (preference !== "auto") {
        console.warn(
          "[workflow-storage] Explicit durable provider failed — using file/tmp fallback."
        );
      }
    }
  }

  cachedAdapter = await createFileAdapter();
  return cachedAdapter;
}

export async function getWorkflowStorageInfo(): Promise<WorkflowStorageInfo> {
  const adapter = await resolveWorkflowStoreAdapter();
  return adapter.getInfo();
}

export async function probeWorkflowStorage(): Promise<{
  storage: WorkflowStorageInfo;
  canRead: boolean;
  canWrite: boolean;
  lastChecked: string;
}> {
  const adapter = await resolveWorkflowStoreAdapter();
  const storage = adapter.getInfo();
  let canRead = false;
  let canWrite = false;

  try {
    await adapter.read();
    canRead = true;
    canWrite = storage.configured;
  } catch {
    canRead = false;
    canWrite = false;
  }

  return {
    storage,
    canRead,
    canWrite,
    lastChecked: new Date().toISOString(),
  };
}

/** Test helper — reset cached adapter between tests. */
export function resetWorkflowStoreAdapterCache(): void {
  cachedAdapter = null;
}
