/**
 * Appointment workflow state — persisted via Command Hub workflow API.
 * @see components/admin/CommandHubWorkflowProvider.tsx
 */

export type {
  AppointmentRecordState,
  RecordStatusLabel,
  CommandHubWorkflowStore,
} from "@/lib/command-hub-workflow-types";

/** @deprecated Use CommandHubWorkflowProvider — kept for type imports only */
export interface DemoRecordStore {
  appointments: Record<string, import("@/lib/command-hub-workflow-types").AppointmentRecordState>;
  patients: Record<string, { clinikoPatientId?: string; createdAt?: string }>;
}
