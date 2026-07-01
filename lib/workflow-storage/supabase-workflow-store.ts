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

export function getSupabaseWorkflowConfig() {
  return {
    table: process.env.COMMAND_HUB_SUPABASE_TABLE?.trim() || DEFAULT_TABLE,
    storeId: process.env.COMMAND_HUB_WORKFLOW_STORE_ID?.trim() || DEFAULT_STORE_ID,
  };
}

function supabaseInfo(configured: boolean, description?: string, warning?: string): WorkflowStorageInfo {
  return {
    mode: "supabase",
    durability: configured ? "durable" : "ephemeral",
    label: configured ? "Durable workflow storage" : "Supabase workflow storage unavailable",
    description:
      description ??
      (configured
        ? "Command Hub workflow state is stored in Supabase. Cliniko remains the system of record for patients, appointments and clinical notes."
        : "Supabase workflow storage is not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)."),
    warning,
    configured,
  };
}

function classifySupabaseHttpError(status: number, bodyText: string): string {
  const snippet = bodyText.slice(0, 200);
  if (status === 401 || status === 403) {
    return "Supabase authentication failed — check SUPABASE_SERVICE_ROLE_KEY.";
  }
  if (status === 404 || /PGRST205/i.test(snippet) || /relation .* does not exist/i.test(snippet)) {
    return "Supabase table missing — run the SQL in docs/WORKFLOW_STORAGE.md.";
  }
  if (status >= 500) {
    return "Supabase server error — try again or check project status.";
  }
  return `Supabase request failed (HTTP ${status}).`;
}

export function createUnavailableSupabaseAdapter(reason: string): WorkflowStoreAdapter {
  const info = supabaseInfo(
    false,
    "Supabase workflow storage is configured but could not be verified. Check the table, service-role key and environment variables.",
    reason
  );

  return {
    getInfo() {
      return info;
    },
    async read() {
      throw new Error(`Supabase workflow storage unavailable — ${reason}`);
    },
    async write() {
      throw new Error(`Supabase workflow storage unavailable — ${reason}`);
    },
  };
}

export function createSupabaseWorkflowStore(): WorkflowStoreAdapter | null {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;

  const { table, storeId } = getSupabaseWorkflowConfig();
  const restUrl = `${url.replace(/\/$/, "")}/rest/v1/${table}`;
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  async function fetchRow(): Promise<unknown | null> {
    const res = await fetch(`${restUrl}?id=eq.${encodeURIComponent(storeId)}&select=store`, {
      headers: { ...headers, Accept: "application/json" },
      cache: "no-store",
    });

    if (res.status === 404) return null;

    const bodyText = await res.text();
    if (!res.ok) {
      const reason = classifySupabaseHttpError(res.status, bodyText);
      console.warn("[workflow-storage] Supabase read failed:", reason);
      throw new Error(reason);
    }

    if (!bodyText.trim()) return null;
    const rows = JSON.parse(bodyText) as Array<{ store?: unknown }>;
    return rows[0]?.store ?? null;
  }

  async function upsertRow(store: CommandHubWorkflowStore): Promise<void> {
    const payload = stampWorkflowStore(store);
    const body = {
      id: storeId,
      store: payload,
      updated_at: new Date().toISOString(),
    };

    const res = await fetch(restUrl, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      const reason = classifySupabaseHttpError(res.status, bodyText);
      console.warn("[workflow-storage] Supabase write failed:", reason);
      throw new Error(reason);
    }
  }

  return {
    getInfo() {
      return supabaseInfo(true);
    },

    async read() {
      const row = await fetchRow();
      if (row == null) return createDefaultWorkflowStore();
      return normalizeWorkflowStore(row);
    },

    async write(store: CommandHubWorkflowStore) {
      await upsertRow(store);
      const readBack = await fetchRow();
      if (readBack == null) {
        throw new Error("Supabase read-back after write returned no row.");
      }
    },
  };
}
