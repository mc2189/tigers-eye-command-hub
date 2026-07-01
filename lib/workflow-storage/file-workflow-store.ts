import "server-only";

import { access, mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  createDefaultWorkflowStore,
  normalizeWorkflowStore,
  stampWorkflowStore,
} from "@/lib/workflow-storage/store-utils";
import type { CommandHubWorkflowStore } from "@/lib/command-hub-workflow-types";
import type { WorkflowStorageInfo, WorkflowStoreAdapter } from "@/lib/workflow-storage/types";

type FileStoreVariant = "local-file" | "vercel-tmp";

async function resolveFileStoreVariant(): Promise<{
  variant: FileStoreVariant;
  filePath: string;
}> {
  if (process.env.COMMAND_HUB_WORKFLOW_STATE_PATH?.trim()) {
    const filePath = process.env.COMMAND_HUB_WORKFLOW_STATE_PATH.trim();
    return { variant: "local-file", filePath };
  }

  const dataPath = path.join(process.cwd(), ".data", "command-hub-workflow.json");
  try {
    await mkdir(path.dirname(dataPath), { recursive: true });
    await access(path.dirname(dataPath));
    return { variant: "local-file", filePath: dataPath };
  } catch {
    return {
      variant: "vercel-tmp",
      filePath: path.join("/tmp", "tigers-eye-command-hub-workflow.json"),
    };
  }
}

function infoForVariant(variant: FileStoreVariant, filePath: string): WorkflowStorageInfo {
  if (variant === "local-file") {
    return {
      mode: "local-file",
      durability: "local-dev",
      label: "Local workflow storage",
      description: `Command Hub workflow state is stored in a local development file (${filePath}).`,
      configured: true,
    };
  }

  return {
    mode: "vercel-tmp",
    durability: "ephemeral",
    label: "Ephemeral workflow storage",
    description:
      "Command Hub workflow state is stored server-side for this demo, but this environment is ephemeral and may reset after deploys or cold starts.",
    warning:
      "Vercel /tmp storage can reset across deployments, cold starts or runtime changes. Configure Supabase, Vercel KV or Vercel Blob for durable storage.",
    configured: true,
  };
}

export async function createFileWorkflowStore(): Promise<WorkflowStoreAdapter> {
  const { variant, filePath } = await resolveFileStoreVariant();
  const info = infoForVariant(variant, filePath);

  return {
    getInfo() {
      return info;
    },

    async read() {
      try {
        const raw = await readFile(filePath, "utf8");
        return normalizeWorkflowStore(JSON.parse(raw));
      } catch {
        return createDefaultWorkflowStore();
      }
    },

    async write(store: CommandHubWorkflowStore) {
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, JSON.stringify(stampWorkflowStore(store), null, 2), "utf8");
    },
  };
}
