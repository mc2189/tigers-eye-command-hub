/**
 * Shared Command Hub workflow state — persisted server-side (not browser localStorage).
 */

import type { DemoInsuranceCaseDetail } from "@/lib/demo-insurance-cases";

export type RecordStatusLabel =
  | "Saved to Cliniko test account"
  | "Prepared for Cliniko"
  | "Suggested by Command Hub"
  | "Command Hub demo case"
  | "Needs staff confirmation"
  | "Future integration";

export interface AppointmentRecordState {
  linkedPatientId?: string;
  linkedPatientLabel?: string;
  noteSavedToCliniko?: boolean;
  noteClinikoId?: string;
  invoicePrepared?: boolean;
  followUpPrepared?: boolean;
  followUpBookedInCliniko?: boolean;
  followUpClinikoAppointmentId?: string;
  matchStatus?: string;
  lastPatientCreateResult?: {
    savedFieldLabels?: string[];
    verified?: boolean;
  };
  lastPatientUpdateResult?: {
    savedFieldLabels?: string[];
    verified?: boolean;
    uiLabel?: string;
  };
  lastNoteSaveResult?: {
    status?: string;
    uiLabel?: string;
    verified?: boolean;
    linkStatusMessage?: string;
    blocked?: boolean;
  };
}

/** Operational invoice workflow flags only — not full draft payloads. */
export interface InvoiceDraftWorkflowState {
  invoiceDraftPrepared?: boolean;
  invoiceDraftExported?: boolean;
  invoiceDraftCopiedAt?: string;
  invoiceDraftExportedAt?: string;
  invoiceDraftLastAction?: string;
  invoiceDraftPreparedAt?: string;
  invoiceDraftPreparedByDemoStaff?: boolean;
}

export interface CommandHubWorkflowStore {
  version: 1;
  updatedAt: string;
  demoWeekPreview: boolean;
  appointments: Record<string, AppointmentRecordState>;
  patients: Record<string, { clinikoPatientId?: string; createdAt?: string }>;
  insuranceCases: Record<string, DemoInsuranceCaseDetail>;
  invoiceDrafts: Record<string, InvoiceDraftWorkflowState>;
  /** Operational metadata — storage health probe timestamp only */
  storageHealthCheckAt?: string;
}

export interface WorkflowStatePatch {
  demoWeekPreview?: boolean;
  appointmentId?: string;
  appointmentPatch?: Partial<AppointmentRecordState>;
  insuranceCase?: DemoInsuranceCaseDetail;
  resetInsuranceCases?: boolean;
  invoiceDraftId?: string;
  invoiceDraftPatch?: Partial<InvoiceDraftWorkflowState>;
  /** One-time merge from legacy browser localStorage */
  migrateFromBrowser?: {
    appointments?: Record<string, AppointmentRecordState>;
    patients?: Record<string, { clinikoPatientId?: string; createdAt?: string }>;
    insuranceCases?: Record<string, DemoInsuranceCaseDetail>;
    invoiceDrafts?: Record<string, InvoiceDraftWorkflowState>;
    demoWeekPreview?: boolean;
  };
}
