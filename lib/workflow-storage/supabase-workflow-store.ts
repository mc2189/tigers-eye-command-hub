import "server-only";

import {
  createDefaultWorkflowStore,
  normalizeWorkflowStore,
  stampWorkflowStore,
} from "@/lib/workflow-storage/store-utils";
import type { CommandHubWorkflowStore } from "@/lib/command-hub-workflow-types";
import type { WorkflowStorageInfo, WorkflowStoreAdapter } from "@/lib/workflow-storage/types";

const DEFAULT_TABLE = "command_hub_workflow_state";
const DEFAULT_STORE_ID = "tigers-eye-demo";

export function isSupabaseWorkflowStorageConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

function supabaseInfo(configured: boolean): WorkflowStorageInfo {
  return {
    mode: "supabase",
    durability: "durable",
    label: "Durable workflow storage",
    description: configured
      ? "Command Hub workflow state is using durable Supabase/Postgres storage."
      : "Supabase workflow storage is not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).",
    configured,
  };
}

export function createSupabaseWorkflowStore(): WorkflowStoreAdapter | null {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;

  const supabaseUrl = url;
  const supabaseKey = serviceKey;
  const table = process.env.COMMAND_HUB_SUPABASE_TABLE?.trim() || DEFAULT_TABLE;
  const storeId = process.env.COMMAND_HUB_WORKFLOW_STORE_ID?.trim() || DEFAULT_STORE_ID;
  const restUrl = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}`;

  async function fetchRow(): Promise<unknown | null> {
    const res = await fetch(`${restUrl}?id=eq.${encodeURIComponent(storeId)}&select=store`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (res.status === 404 || res.status === 406) return null;
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Supabase workflow read failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const rows = (await res.json()) as Array<{ store?: unknown }>;
    return rows[0]?.store ?? null;
  }

  return {
    getInfo() {
      return supabaseInfo(true);
    },

    async read() {
      try {
        const row = await fetchRow();
        if (row == null) return createDefaultWorkflowStore();
        return normalizeWorkflowStore(row);
      } catch (err) {
        console.warn(
          "[workflow-storage] Supabase read failed:",
          err instanceof Error ? err.message : err
        );
        throw err;
      }
    },

    async write(store: CommandHubWorkflowStore) {
      const payload = stampWorkflowStore(store);
      const body = {
        id: storeId,
        store: payload,
        updated_at: new Date().toISOString(),
      };

      const res = await fetch(`${restUrl}?on_conflict=id`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Supabase workflow write failed (${res.status}): ${text.slice(0, 200)}`);
      }
    },
  };
}
