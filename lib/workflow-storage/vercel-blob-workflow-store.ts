import "server-only";

import {
  createDefaultWorkflowStore,
  normalizeWorkflowStore,
  stampWorkflowStore,
} from "@/lib/workflow-storage/store-utils";
import type { CommandHubWorkflowStore } from "@/lib/command-hub-workflow-types";
import type { WorkflowStorageInfo, WorkflowStoreAdapter } from "@/lib/workflow-storage/types";

const DEFAULT_BLOB_PATH = "tigers-eye-command-hub-workflow-state.json";

export function isVercelBlobWorkflowStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function blobInfo(configured: boolean): WorkflowStorageInfo {
  return {
    mode: "vercel-blob",
    durability: "durable",
    label: "Durable workflow storage",
    description: configured
      ? "Command Hub workflow state is using durable Vercel Blob storage."
      : "Vercel Blob workflow storage is not configured (missing BLOB_READ_WRITE_TOKEN).",
    configured,
  };
}

export function createVercelBlobWorkflowStore(): WorkflowStoreAdapter | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return null;

  const pathname =
    process.env.COMMAND_HUB_WORKFLOW_BLOB_PATH?.trim() || DEFAULT_BLOB_PATH;

  async function readBlobJson(): Promise<unknown | null> {
    const listRes = await fetch(
      `https://blob.vercel-storage.com?prefix=${encodeURIComponent(pathname)}&limit=1`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    if (!listRes.ok) {
      if (listRes.status === 404) return null;
      const text = await listRes.text().catch(() => "");
      throw new Error(`Vercel Blob list failed (${listRes.status}): ${text.slice(0, 200)}`);
    }

    const listJson = (await listRes.json()) as {
      blobs?: Array<{ downloadUrl?: string; pathname?: string }>;
    };
    const blob = listJson.blobs?.find((b) => b.pathname === pathname) ?? listJson.blobs?.[0];
    if (!blob?.downloadUrl) return null;

    const getRes = await fetch(blob.downloadUrl, { cache: "no-store" });
    if (!getRes.ok) {
      throw new Error(`Vercel Blob download failed (${getRes.status}).`);
    }

    return getRes.json();
  }

  return {
    getInfo() {
      return blobInfo(true);
    },

    async read() {
      const raw = await readBlobJson();
      if (raw == null) return createDefaultWorkflowStore();
      return normalizeWorkflowStore(raw);
    },

    async write(store: CommandHubWorkflowStore) {
      const payload = JSON.stringify(stampWorkflowStore(store));
      const res = await fetch(
        `https://blob.vercel-storage.com/upload?pathname=${encodeURIComponent(pathname)}&allowOverwrite=true`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "x-api-version": "7",
          },
          body: payload,
          cache: "no-store",
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Vercel Blob upload failed (${res.status}): ${text.slice(0, 200)}`);
      }
    },
  };
}
