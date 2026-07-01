import "server-only";

import { isDemoPatientLabel } from "@/lib/demo-insurance-cases";
import type {
  AppointmentRecordState,
  CommandHubWorkflowStore,
  WorkflowStatePatch,
} from "@/lib/command-hub-workflow-types";
import { FORBIDDEN_WORKFLOW_STORE_KEYS } from "@/lib/storage-boundary-policy";

const ALLOWED_APPOINTMENT_STATE_KEYS = new Set<keyof AppointmentRecordState>([
  "linkedPatientId",
  "linkedPatientLabel",
  "noteSavedToCliniko",
  "noteClinikoId",
  "invoicePrepared",
  "followUpPrepared",
  "followUpBookedInCliniko",
  "followUpClinikoAppointmentId",
  "matchStatus",
  "lastPatientCreateResult",
  "lastPatientUpdateResult",
  "lastNoteSaveResult",
]);

const ALLOWED_PATIENT_ENTRY_KEYS = new Set(["clinikoPatientId", "createdAt"]);

const ALLOWED_TOP_LEVEL_PATCH_KEYS = new Set<keyof WorkflowStatePatch>([
  "demoWeekPreview",
  "appointmentId",
  "appointmentPatch",
  "insuranceCase",
  "resetInsuranceCases",
  "migrateFromBrowser",
]);

const DEMOGRAPHIC_KEYS = new Set([
  "patientName",
  "firstName",
  "lastName",
  "dateOfBirth",
  "email",
  "phone",
  "address",
  "emergencyContact",
  "medicalWarning",
  "clinicalHistory",
  "medicalNotes",
]);

const NOTE_BODY_KEYS = new Set([
  "treatmentNoteBody",
  "noteBody",
  "noteContent",
  "transcript",
  "clinicalNote",
  "noteText",
  "noteDraft",
]);

const RAW_PAYLOAD_KEY_PATTERN =
  /^(rawCliniko|clinikoPayload|fullPatient|patientDemographics|_raw)/i;

const SECRET_KEY_PATTERN =
  /^(apiKey|api_key|password|sessionSecret|serviceRole|CLINIKO_API_KEY|DEMO_SESSION_SECRET|KV_REST_API_TOKEN|SUPABASE_SERVICE_ROLE_KEY|BLOB_READ_WRITE_TOKEN)$/i;

const SECRET_VALUE_MARKERS = [
  "CLINIKO_API_KEY",
  "DEMO_SESSION_SECRET",
  "DEMO_STAFF_PASSWORD",
  "KV_REST_API_TOKEN",
  "SUPABASE_SERVICE_ROLE_KEY",
  "BLOB_READ_WRITE_TOKEN",
];

export class StorageBoundaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageBoundaryError";
  }
}

function boundaryError(detail: string): never {
  throw new StorageBoundaryError(`Blocked for storage boundary — ${detail}`);
}

function isSecretLikeString(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  for (const marker of SECRET_VALUE_MARKERS) {
    if (trimmed.includes(marker)) return true;
  }
  if (/^sk_[a-z0-9_]{10,}$/i.test(trimmed)) return true;
  return false;
}

function assertKeyAllowed(path: string, key: string): void {
  if (FORBIDDEN_WORKFLOW_STORE_KEYS.has(key)) {
    boundaryError(`forbidden field "${key}" at ${path}`);
  }
  if (DEMOGRAPHIC_KEYS.has(key)) {
    boundaryError(`patient demographics must not be stored in workflow state (${path}.${key})`);
  }
  if (NOTE_BODY_KEYS.has(key)) {
    boundaryError(`treatment note body must not be persisted in workflow store (${path}.${key})`);
  }
  if (RAW_PAYLOAD_KEY_PATTERN.test(key)) {
    boundaryError(`raw Cliniko payloads must not be stored (${path}.${key})`);
  }
  if (SECRET_KEY_PATTERN.test(key)) {
    boundaryError(`secret-like key not allowed (${path}.${key})`);
  }
}

function walkValue(path: string, value: unknown): void {
  if (value == null) return;

  if (typeof value === "string") {
    if (isSecretLikeString(value)) {
      boundaryError(`secret-like value not allowed at ${path}`);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => walkValue(`${path}[${index}]`, item));
    return;
  }

  if (typeof value === "object") {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      assertKeyAllowed(path, key);
      walkValue(`${path}.${key}`, nested);
    }
  }
}

function validateAppointmentState(path: string, state: Partial<AppointmentRecordState>): void {
  for (const key of Object.keys(state)) {
    if (!ALLOWED_APPOINTMENT_STATE_KEYS.has(key as keyof AppointmentRecordState)) {
      boundaryError(`unknown appointment workflow field "${key}" at ${path}`);
    }
  }

  if (
    state.linkedPatientLabel != null &&
    state.linkedPatientLabel.trim() &&
    !isDemoPatientLabel(state.linkedPatientLabel)
  ) {
    boundaryError("linked patient label must use DEMO prefix");
  }

  walkValue(path, state);
}

function validatePatientEntry(path: string, entry: Record<string, unknown>): void {
  for (const key of Object.keys(entry)) {
    if (!ALLOWED_PATIENT_ENTRY_KEYS.has(key)) {
      boundaryError(`patient workflow entry may only store Cliniko ID and timestamp (${path}.${key})`);
    }
  }
  walkValue(path, entry);
}

function validateInsuranceCase(path: string, detail: { patientLabel: string }): void {
  if (!isDemoPatientLabel(detail.patientLabel)) {
    boundaryError("insurance case must use DEMO patient label");
  }
  walkValue(path, detail);
}

export function validateCommandHubWorkflowStore(store: CommandHubWorkflowStore): void {
  walkValue("store", {
    demoWeekPreview: store.demoWeekPreview,
    version: store.version,
    updatedAt: store.updatedAt,
  });

  for (const [appointmentId, state] of Object.entries(store.appointments)) {
    validateAppointmentState(`store.appointments.${appointmentId}`, state);
  }

  for (const [patientKey, entry] of Object.entries(store.patients)) {
    validatePatientEntry(`store.patients.${patientKey}`, entry as Record<string, unknown>);
  }

  for (const [label, detail] of Object.entries(store.insuranceCases)) {
    validateInsuranceCase(`store.insuranceCases.${label}`, detail);
  }
}

export function validateWorkflowStatePatch(patch: WorkflowStatePatch): void {
  for (const key of Object.keys(patch)) {
    if (!ALLOWED_TOP_LEVEL_PATCH_KEYS.has(key as keyof WorkflowStatePatch)) {
      boundaryError(`unknown workflow patch field "${key}"`);
    }
  }

  walkValue("patch", {
    demoWeekPreview: patch.demoWeekPreview,
    resetInsuranceCases: patch.resetInsuranceCases,
  });

  if (patch.appointmentId && patch.appointmentPatch) {
    validateAppointmentState(
      `patch.appointments.${patch.appointmentId}`,
      patch.appointmentPatch
    );
  }

  if (patch.insuranceCase) {
    validateInsuranceCase("patch.insuranceCase", patch.insuranceCase);
  }

  if (patch.migrateFromBrowser) {
    const m = patch.migrateFromBrowser;
    for (const [appointmentId, state] of Object.entries(m.appointments ?? {})) {
      validateAppointmentState(`patch.migrateFromBrowser.appointments.${appointmentId}`, state);
    }
    for (const [patientKey, entry] of Object.entries(m.patients ?? {})) {
      validatePatientEntry(
        `patch.migrateFromBrowser.patients.${patientKey}`,
        entry as Record<string, unknown>
      );
    }
    for (const [label, detail] of Object.entries(m.insuranceCases ?? {})) {
      validateInsuranceCase(`patch.migrateFromBrowser.insuranceCases.${label}`, detail);
    }
  }
}

export function isStorageBoundaryBlockedMessage(message: string): boolean {
  return (
    message.includes("Blocked for storage boundary") ||
    message.includes("Blocked for safety")
  );
}
