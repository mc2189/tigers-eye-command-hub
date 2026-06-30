import "server-only";

import { clinikoFetch, getClinikoConfig } from "@/lib/cliniko";
import { createDraftTreatmentNote } from "@/lib/cliniko";
import { isDemoSafeFirstName, isDemoSafePatientLabel } from "@/lib/demo-write-safety";

export type TreatmentNoteSaveStatus =
  | "saved"
  | "prepared-only"
  | "blocked"
  | "failed"
  | "verification-incomplete";

export interface TreatmentNoteSaveInput {
  bookingId?: string;
  patientId?: string;
  patientLabel?: string;
  title?: string;
  templateName?: string;
  sections: Record<string, string>;
  isLiveCliniko?: boolean;
  isDemoWeekPreview?: boolean;
  clinikoAppointmentId?: string | null;
}

export interface TreatmentNoteSafetyCheck {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface TreatmentNoteSafetyResult {
  allowed: boolean;
  status: TreatmentNoteSaveStatus;
  uiLabel: string;
  message: string;
  reason?: string;
  checks: TreatmentNoteSafetyCheck[];
  linkVerified: boolean;
  linkStatusMessage: string;
}

export interface TreatmentNoteSaveResponse {
  ok: boolean;
  status: TreatmentNoteSaveStatus;
  mode: "created" | "dry_run" | "blocked";
  message: string;
  uiLabel: string;
  noteId?: string;
  createdAt?: string;
  verified: boolean;
  verificationMessage?: string;
  localContentStored: false;
  checks: TreatmentNoteSafetyCheck[];
  linkVerified: boolean;
  linkStatusMessage: string;
}

function isNumericClinikoId(id?: string | null): boolean {
  return Boolean(id?.trim() && /^\d+$/.test(id.trim()));
}

function validateNoteContent(
  sections: Record<string, string>,
  patientLabel?: string
): { ok: true } | { ok: false; reason: string } {
  const serialized = JSON.stringify(sections).toLowerCase();
  if (/@example\.com|@gmail\.com|@hotmail\.com|@yahoo\.com/i.test(serialized)) {
    return {
      ok: false,
      reason: "Note content may include non-DEMO email addresses — blocked for safety.",
    };
  }
  if (patientLabel && !isDemoSafePatientLabel(patientLabel)) {
    return {
      ok: false,
      reason: "Blocked for safety — patient is not DEMO-labelled.",
    };
  }
  return { ok: true };
}

async function fetchDemoPatient(patientId: string): Promise<{
  ok: boolean;
  firstName?: string;
  message?: string;
}> {
  try {
    const raw = await clinikoFetch<{ patient?: { first_name?: string; last_name?: string } }>(
      `/patients/${patientId}`
    );
    const firstName = raw.patient?.first_name ?? "";
    if (!isDemoSafeFirstName(firstName)) {
      return {
        ok: false,
        message: "Blocked for safety — Cliniko patient is not DEMO-prefixed.",
      };
    }
    return { ok: true, firstName };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "Could not read DEMO patient from Cliniko test account.",
    };
  }
}

async function verifyAppointmentOwnership(
  appointmentId: string,
  patientId: string
): Promise<{ verified: boolean; message: string }> {
  if (!isNumericClinikoId(appointmentId)) {
    return {
      verified: false,
      message:
        "Prepared for Cliniko — appointment ownership could not be verified (no Cliniko appointment ID).",
    };
  }

  try {
    const raw = await clinikoFetch<{
      individual_appointment?: {
        patient_id?: string;
        id?: string;
      };
    }>(`/individual_appointments/${appointmentId}`);

    const apptPatientId = raw.individual_appointment?.patient_id
      ? String(raw.individual_appointment.patient_id)
      : undefined;

    if (!apptPatientId) {
      return {
        verified: false,
        message:
          "Prepared for Cliniko — appointment ownership could not be verified (patient ID not returned).",
      };
    }

    if (apptPatientId !== String(patientId)) {
      return {
        verified: false,
        message:
          "Blocked for safety — this note is not safely linked to a DEMO appointment (patient mismatch).",
      };
    }

    return {
      verified: true,
      message: "DEMO patient and appointment link verified",
    };
  } catch {
    return {
      verified: false,
      message:
        "Prepared for Cliniko — appointment ownership could not be verified (read-back failed).",
    };
  }
}

async function verifyNoteReadBack(
  noteId: string,
  patientId: string
): Promise<{ verified: boolean; message: string }> {
  try {
    const raw = await clinikoFetch<{
      treatment_note?: { patient_id?: string; id?: string; draft?: boolean };
    }>(`/treatment_notes/${noteId}`);

    const notePatientId = raw.treatment_note?.patient_id
      ? String(raw.treatment_note.patient_id)
      : undefined;

    if (!notePatientId) {
      return {
        verified: false,
        message: "Saved request succeeded, but read-back verification was not completed",
      };
    }

    if (notePatientId !== String(patientId)) {
      return {
        verified: false,
        message: "Saved request succeeded, but read-back verification was not completed",
      };
    }

    return {
      verified: true,
      message: "Saved and verified in Cliniko test account",
    };
  } catch {
    return {
      verified: false,
      message: "Saved request succeeded, but read-back verification was not completed",
    };
  }
}

export function evaluateTreatmentNoteEligibility(
  input: TreatmentNoteSaveInput,
  options?: { writesEnabled?: boolean; configured?: boolean }
): TreatmentNoteSafetyResult {
  const config = getClinikoConfig();
  const writesEnabled = options?.writesEnabled ?? config.writesEnabled;
  const configured = options?.configured ?? Boolean(config.apiKey);

  const checks: TreatmentNoteSafetyCheck[] = [];
  const add = (id: string, label: string, passed: boolean, detail?: string) => {
    checks.push({ id, label, passed, detail });
  };

  add("sections", "Structured note sections present", Object.keys(input.sections).length > 0);
  add("configured", "Cliniko test account configured", configured);
  add("writes_enabled", "Cliniko writes enabled", writesEnabled);

  const appointmentId =
    input.clinikoAppointmentId ?? (isNumericClinikoId(input.bookingId) ? input.bookingId : null);

  add(
    "patient_id",
    "DEMO patient linked",
    Boolean(input.patientId?.trim()),
    input.patientId ? undefined : "Patient is not DEMO-linked"
  );

  add(
    "appointment_id",
    "Cliniko appointment ID available",
    Boolean(appointmentId),
    appointmentId ? undefined : "Preview-only appointment is not linked to Cliniko"
  );

  const contentCheck = validateNoteContent(input.sections, input.patientLabel);
  add("demo_content", "Note content is DEMO-safe", contentCheck.ok, contentCheck.ok ? undefined : contentCheck.reason);

  if (input.isDemoWeekPreview && !input.patientId?.trim()) {
    add(
      "preview_link",
      "Demo week preview linked to Cliniko",
      false,
      "Preview-only appointment is not linked to Cliniko"
    );
  }

  if (!writesEnabled) {
    return {
      allowed: false,
      status: "prepared-only",
      uiLabel: "Prepared for Cliniko — not saved yet",
      message: "Cliniko writes disabled — note prepared only.",
      reason: "Writes are disabled",
      checks,
      linkVerified: false,
      linkStatusMessage: "Not verified — writes disabled",
    };
  }

  if (!configured) {
    return {
      allowed: false,
      status: "prepared-only",
      uiLabel: "Prepared for Cliniko — not saved yet",
      message: "Cliniko not configured — note prepared only.",
      checks,
      linkVerified: false,
      linkStatusMessage: "Not verified — Cliniko not configured",
    };
  }

  if (!input.patientId?.trim()) {
    return {
      allowed: false,
      status: "blocked",
      uiLabel: "Blocked for safety",
      message: "Patient is not DEMO-linked.",
      reason: "Patient is not DEMO-linked",
      checks,
      linkVerified: false,
      linkStatusMessage: "Patient not linked",
    };
  }

  if (!appointmentId) {
    return {
      allowed: false,
      status: "blocked",
      uiLabel: "Blocked for safety",
      message: "Preview-only appointment is not linked to Cliniko.",
      reason: "Preview-only appointment is not linked to Cliniko",
      checks,
      linkVerified: false,
      linkStatusMessage: "No Cliniko appointment ID",
    };
  }

  if (!contentCheck.ok) {
    return {
      allowed: false,
      status: "blocked",
      uiLabel: "Blocked for safety",
      message: contentCheck.reason,
      reason: contentCheck.reason,
      checks,
      linkVerified: false,
      linkStatusMessage: "Content check failed",
    };
  }

  return {
    allowed: true,
    status: "saved",
    uiLabel: "Saved to Cliniko test account",
    message: "Ready to save DEMO note to Cliniko test account.",
    checks,
    linkVerified: false,
    linkStatusMessage: "Pending server verification",
  };
}

export async function saveTreatmentNoteSafely(
  input: TreatmentNoteSaveInput
): Promise<TreatmentNoteSaveResponse> {
  const config = getClinikoConfig();
  const eligibility = evaluateTreatmentNoteEligibility(input);

  if (!eligibility.allowed) {
    return {
      ok: eligibility.status !== "blocked",
      status: eligibility.status,
      mode: eligibility.status === "blocked" ? "blocked" : "dry_run",
      message: eligibility.message,
      uiLabel: eligibility.uiLabel,
      verified: false,
      localContentStored: false,
      checks: eligibility.checks,
      linkVerified: false,
      linkStatusMessage: eligibility.linkStatusMessage,
    };
  }

  const patientId = input.patientId!.trim();
  const appointmentId =
    input.clinikoAppointmentId ?? (isNumericClinikoId(input.bookingId) ? input.bookingId! : null)!;

  const patientCheck = await fetchDemoPatient(patientId);
  if (!patientCheck.ok) {
    return {
      ok: false,
      status: "blocked",
      mode: "blocked",
      message: patientCheck.message ?? "Blocked for safety",
      uiLabel: "Blocked for safety",
      verified: false,
      localContentStored: false,
      checks: eligibility.checks,
      linkVerified: false,
      linkStatusMessage: patientCheck.message ?? "Patient check failed",
    };
  }

  const linkCheck = await verifyAppointmentOwnership(appointmentId, patientId);
  if (!linkCheck.verified) {
    const blocked = linkCheck.message.startsWith("Blocked");
    return {
      ok: false,
      status: blocked ? "blocked" : "prepared-only",
      mode: blocked ? "blocked" : "dry_run",
      message: linkCheck.message,
      uiLabel: blocked ? "Blocked for safety" : "Prepared for Cliniko — not saved yet",
      verified: false,
      localContentStored: false,
      checks: eligibility.checks,
      linkVerified: false,
      linkStatusMessage: linkCheck.message,
    };
  }

  const createResult = await createDraftTreatmentNote({
    bookingId: appointmentId,
    patientId,
    title: input.title,
    templateName: input.templateName,
    sections: input.sections,
  });

  if (!createResult.ok || createResult.mode !== "created") {
    return {
      ok: createResult.mode === "dry_run",
      status: createResult.mode === "dry_run" ? "prepared-only" : "failed",
      mode: createResult.mode === "dry_run" ? "dry_run" : "blocked",
      message: createResult.message,
      uiLabel:
        createResult.mode === "dry_run"
          ? "Prepared for Cliniko — not saved yet"
          : "Could not verify save",
      verified: false,
      localContentStored: false,
      checks: eligibility.checks,
      linkVerified: true,
      linkStatusMessage: linkCheck.message,
    };
  }

  if (!createResult.noteId) {
    return {
      ok: true,
      status: "verification-incomplete",
      mode: "created",
      message: "Saved request succeeded, but read-back verification was not completed",
      uiLabel: "Could not verify save",
      verified: false,
      verificationMessage: "Saved request succeeded, but read-back verification was not completed",
      localContentStored: false,
      checks: eligibility.checks,
      linkVerified: true,
      linkStatusMessage: linkCheck.message,
    };
  }

  const readBack = await verifyNoteReadBack(createResult.noteId, patientId);

  return {
    ok: true,
    status: readBack.verified ? "saved" : "verification-incomplete",
    mode: "created",
    message: readBack.message,
    uiLabel: readBack.verified
      ? "Saved to Cliniko test account"
      : "Could not verify save",
    noteId: createResult.noteId,
    createdAt: createResult.createdAt,
    verified: readBack.verified,
    verificationMessage: readBack.message,
    localContentStored: false,
    checks: eligibility.checks,
    linkVerified: true,
    linkStatusMessage: linkCheck.message,
  };
}
