import "server-only";

import type {
  AppointmentRecordState,
  CommandHubWorkflowStore,
  WorkflowStatePatch,
} from "@/lib/command-hub-workflow-types";
import {
  applyWorkflowPatch,
  getAppointmentStateFromStore,
} from "@/lib/workflow-storage/store-utils";
import {
  getWorkflowStorageInfo,
  resolveWorkflowStoreAdapter,
} from "@/lib/workflow-storage/resolve-workflow-store";
import {
  validateCommandHubWorkflowStore,
  validateWorkflowStatePatch,
} from "@/lib/validate-command-hub-workflow-state";

export { getAppointmentStateFromStore };

export async function readCommandHubWorkflowStore(): Promise<CommandHubWorkflowStore> {
  const adapter = await resolveWorkflowStoreAdapter();
  return adapter.read();
}

export async function patchCommandHubWorkflowStore(
  patch: WorkflowStatePatch
): Promise<CommandHubWorkflowStore> {
  validateWorkflowStatePatch(patch);
  const adapter = await resolveWorkflowStoreAdapter();
  const current = await adapter.read();
  const next = applyWorkflowPatch(current, patch);
  validateCommandHubWorkflowStore(next);
  await adapter.write(next);
  return next;
}

export { getWorkflowStorageInfo };
