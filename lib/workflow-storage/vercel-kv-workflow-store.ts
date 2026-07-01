import "server-only";

import {
  createDefaultWorkflowStore,
  normalizeWorkflowStore,
  stampWorkflowStore,
} from "@/lib/workflow-storage/store-utils";
import type { CommandHubWorkflowStore } from "@/lib/command-hub-workflow-types";
import type { WorkflowStorageInfo, WorkflowStoreAdapter } from "@/lib/workflow-storage/types";

const DEFAULT_KV_KEY = "tigers-eye-command-hub-workflow-state";

export function isVercelKvWorkflowStorageConfigured(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL?.trim() && process.env.KV_REST_API_TOKEN?.trim()
  );
}

function kvInfo(configured: boolean): WorkflowStorageInfo {
  return {
    mode: "vercel-kv",
    durability: "durable",
    label: "Durable workflow storage",
    description: configured
      ? "Command Hub workflow state is using durable Vercel KV storage."
      : "Vercel KV workflow storage is not configured (missing KV_REST_API_URL or KV_REST_API_TOKEN).",
    configured,
  };
}

async function kvCommand<T>(command: (string | number)[]): Promise<T> {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) {
    throw new Error("Vercel KV is not configured.");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Vercel KV command failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as { result?: T };
  return json.result as T;
}

export function createVercelKvWorkflowStore(): WorkflowStoreAdapter | null {
  if (!isVercelKvWorkflowStorageConfigured()) return null;

  const key = process.env.COMMAND_HUB_WORKFLOW_KV_KEY?.trim() || DEFAULT_KV_KEY;

  return {
    getInfo() {
      return kvInfo(true);
    },

    async read() {
      const raw = await kvCommand<string | null>(["GET", key]);
      if (!raw) return createDefaultWorkflowStore();
      try {
        return normalizeWorkflowStore(JSON.parse(raw));
      } catch {
        return createDefaultWorkflowStore();
      }
    },

    async write(store: CommandHubWorkflowStore) {
      const payload = JSON.stringify(stampWorkflowStore(store));
      await kvCommand(["SET", key, payload]);
    },
  };
}
