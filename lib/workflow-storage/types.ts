import type { CommandHubWorkflowStore } from "@/lib/command-hub-workflow-types";

export type WorkflowStorageMode =
  | "local-file"
  | "vercel-tmp"
  | "vercel-kv"
  | "vercel-blob"
  | "supabase"
  | "memory-fallback";

export type WorkflowStorageDurability = "durable" | "ephemeral" | "local-dev";

export interface WorkflowStorageInfo {
  mode: WorkflowStorageMode;
  durability: WorkflowStorageDurability;
  label: string;
  description: string;
  warning?: string;
  configured: boolean;
}

export interface WorkflowStoreAdapter {
  read(): Promise<CommandHubWorkflowStore>;
  write(store: CommandHubWorkflowStore): Promise<void>;
  getInfo(): WorkflowStorageInfo;
}

export interface WorkflowMigrationStatus {
  attempted: boolean;
  migrated: boolean;
  source: "legacy-localStorage" | "none";
  message: string;
}
