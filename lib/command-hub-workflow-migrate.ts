/**
 * Collect legacy browser localStorage workflow state for one-time server migration.
 */

import type { DemoInsuranceCaseDetail } from "@/lib/demo-insurance-cases";
import type {
  AppointmentRecordState,
  CommandHubWorkflowStore,
  WorkflowStatePatch,
} from "@/lib/command-hub-workflow-types";

const LEGACY_RECORD_KEY = "tigers-eye-demo-record-state-v1";
const LEGACY_INSURANCE_KEY = "tigers-eye-demo-insurance-cases-v1";
const LEGACY_PREVIEW_KEY = "tigers-eye-demo-week-preview-v1";

export function collectLegacyBrowserWorkflowState(): WorkflowStatePatch["migrateFromBrowser"] | null {
  if (typeof window === "undefined") return null;

  let hasData = false;
  const migrate: NonNullable<WorkflowStatePatch["migrateFromBrowser"]> = {};

  try {
    const recordRaw = localStorage.getItem(LEGACY_RECORD_KEY);
    if (recordRaw) {
      const parsed = JSON.parse(recordRaw) as {
        appointments?: Record<string, AppointmentRecordState>;
        patients?: Record<string, { clinikoPatientId?: string; createdAt?: string }>;
      };
      if (parsed.appointments && Object.keys(parsed.appointments).length > 0) {
        migrate.appointments = parsed.appointments;
        hasData = true;
      }
      if (parsed.patients && Object.keys(parsed.patients).length > 0) {
        migrate.patients = parsed.patients;
        hasData = true;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const insuranceRaw = localStorage.getItem(LEGACY_INSURANCE_KEY);
    if (insuranceRaw) {
      const parsed = JSON.parse(insuranceRaw) as Record<string, DemoInsuranceCaseDetail>;
      if (parsed && Object.keys(parsed).length > 0) {
        migrate.insuranceCases = parsed;
        hasData = true;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const preview = localStorage.getItem(LEGACY_PREVIEW_KEY);
    if (preview === "inactive") {
      migrate.demoWeekPreview = false;
      hasData = true;
    } else if (preview === "active") {
      migrate.demoWeekPreview = true;
      hasData = true;
    }
  } catch {
    /* ignore */
  }

  return hasData ? migrate : null;
}

export function clearLegacyBrowserWorkflowState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_RECORD_KEY);
    localStorage.removeItem(LEGACY_INSURANCE_KEY);
    localStorage.removeItem(LEGACY_PREVIEW_KEY);
  } catch {
    /* ignore */
  }
}

export function isWorkflowStoreEmptyForMigration(store: CommandHubWorkflowStore): boolean {
  return (
    Object.keys(store.appointments).length === 0 && Object.keys(store.patients).length === 0
  );
}
