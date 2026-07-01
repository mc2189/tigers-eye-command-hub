import "server-only";

import { clinikoFetch, getClinikoConfig } from "@/lib/cliniko";
import { CLINIKO_PATIENT_FIELD_MAP } from "@/lib/cliniko-patient-field-map";
import { DEMO_CLINIC_WEEK_SCENARIOS } from "@/lib/demo-clinic-week";
import {
  buildClinikoPatientPayload,
  type CreateDemoPatientInput,
} from "@/lib/demo-patient-create";
import { isDemoSafeFirstName, validateDemoWriteInput } from "@/lib/demo-write-safety";
import type { ClinikoPatientSnapshot, IntakeSnapshot } from "@/lib/patient-field-reconciliation";
import { profileToClinikoSnapshot } from "@/lib/patient-field-reconciliation";

export type DemoPatientUpdateStatus =
  | "updated"
  | "prepared-only"
  | "blocked"
  | "failed"
  | "verification-incomplete";

export interface DemoPatientUpdateInput {
  patientId: string;
  selectedFieldsToUpdate: string[];
  intakeSnapshot: IntakeSnapshot;
  staffConfirmed: boolean;
}

export interface UpdatedPatientField {
  label: string;
  oldValue?: string;
  newValue: string;
}

export interface UnchangedPatientField {
  label: string;
  value: string;
}

export interface PreparedOnlyUpdateField {
  label: string;
  value: string;
  reason: string;
}

export interface FailedUpdateField {
  label: string;
  value: string;
  reason: string;
}

export interface DemoPatientUpdateResult {
  ok: boolean;
  status: DemoPatientUpdateStatus;
  uiLabel: string;
  message: string;
  patientId?: string;
  savedFields: UpdatedPatientField[];
  unchangedFields: UnchangedPatientField[];
  preparedOnlyFields: PreparedOnlyUpdateField[];
  failedFields: FailedUpdateField[];
  warnings: string[];
  verification: {
    attempted: boolean;
    verified: boolean;
    message: string;
  };
}

interface ClinikoPatientRaw {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  date_of_birth?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  post_code?: string;
  emergency_contact?: string;
  referral_source?: string;
  appointment_notes?: string;
  occupation?: string;
  notes?: string;
  patient_phone_numbers?: Array<{ number?: string; phone_type?: string }>;
}

function isNumericClinikoId(id?: string | null): boolean {
  return Boolean(id?.trim() && /^\d+$/.test(id.trim()));
}

function rawToSnapshot(raw: ClinikoPatientRaw): ClinikoPatientSnapshot {
  return {
    firstName: raw.first_name,
    lastName: raw.last_name,
    email: raw.email,
    phone: raw.patient_phone_numbers?.[0]?.number ?? undefined,
    dateOfBirth: raw.date_of_birth,
    addressLine1: raw.address_1,
    addressLine2: raw.address_2,
    city: raw.city,
    postcode: raw.post_code,
    emergencyContact: raw.emergency_contact,
    gpOrReferrer: raw.referral_source,
    reasonForVisit: raw.appointment_notes,
    occupationOrActivity: raw.occupation,
    medicalWarning: raw.notes,
  };
}

function demoWeekSnapshot(patientId: string): ClinikoPatientSnapshot | null {
  const scenarioId = patientId.replace(/^demo-week-/, "");
  const scenario = DEMO_CLINIC_WEEK_SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) return null;
  return profileToClinikoSnapshot(scenario.clientProfile);
}

export async function fetchPatientSnapshot(
  patientId: string
): Promise<{ ok: boolean; snapshot?: ClinikoPatientSnapshot; message?: string }> {
  if (patientId.startsWith("demo-week-")) {
    const snapshot = demoWeekSnapshot(patientId);
    return snapshot
      ? { ok: true, snapshot }
      : { ok: false, message: "Demo week patient not found." };
  }

  if (!isNumericClinikoId(patientId)) {
    return { ok: false, message: "Invalid Cliniko patient ID." };
  }

  const config = getClinikoConfig();
  if (!config.apiKey) {
    return { ok: false, message: "Cliniko not configured." };
  }

  try {
    const raw = await clinikoFetch<{ patient?: ClinikoPatientRaw }>(`/patients/${patientId}`);
    const patient = raw.patient;
    if (!patient?.id) {
      return { ok: false, message: "Patient not found in Cliniko test account." };
    }
    if (!isDemoSafeFirstName(patient.first_name ?? "")) {
      return {
        ok: false,
        message: "Blocked for safety — Cliniko patient is not DEMO-prefixed.",
      };
    }
    return { ok: true, snapshot: rawToSnapshot(patient) };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Could not read patient from Cliniko.",
    };
  }
}

function buildPartialUpdatePayload(
  intake: IntakeSnapshot,
  selectedFieldKeys: string[],
  currentSnapshot: ClinikoPatientSnapshot
): {
  payload: Record<string, unknown>;
  savedFields: UpdatedPatientField[];
  preparedOnlyFields: PreparedOnlyUpdateField[];
  failedFields: FailedUpdateField[];
} {
  const full = buildClinikoPatientPayload(intake as CreateDemoPatientInput);
  const payload: Record<string, unknown> = {};
  const savedFields: UpdatedPatientField[] = [];
  const preparedOnlyFields: PreparedOnlyUpdateField[] = [...full.skippedFields];
  const failedFields: FailedUpdateField[] = [];

  const selected = new Set(selectedFieldKeys);

  for (const field of CLINIKO_PATIENT_FIELD_MAP) {
    if (!selected.has(field.fieldName)) continue;

    if (!field.canWriteNow) {
      const value =
        String(intake[field.sourceField as keyof IntakeSnapshot] ?? "").trim() || "—";
      preparedOnlyFields.push({
        label: field.displayLabel,
        value,
        reason:
          field.preparedOnlyReason ??
          "Prepared for Cliniko — field not currently written by this integration",
      });
      continue;
    }

    const attempted = full.attemptedFields.find((f) => f.label === field.displayLabel);
    if (!attempted) {
      failedFields.push({
        label: field.displayLabel,
        value: "—",
        reason: "No intake value provided for this field.",
      });
      continue;
    }

    switch (field.clinikoField) {
      case "first_name":
        payload.first_name = attempted.value;
        break;
      case "last_name":
        payload.last_name = attempted.value;
        break;
      case "email":
        payload.email = attempted.value;
        break;
      case "date_of_birth":
        payload.date_of_birth = attempted.value;
        break;
      case "address_1":
        payload.address_1 = attempted.value;
        break;
      case "address_2":
        payload.address_2 = attempted.value;
        break;
      case "city":
        payload.city = attempted.value;
        break;
      case "post_code":
        payload.post_code = attempted.value;
        break;
      case "emergency_contact":
        payload.emergency_contact = attempted.value;
        break;
      case "referral_source":
        payload.referral_source = attempted.value;
        break;
      case "appointment_notes":
        payload.appointment_notes = attempted.value;
        break;
      case "occupation":
        payload.occupation = attempted.value;
        break;
      case "notes":
        payload.notes = attempted.value;
        break;
      case "patient_phone_numbers[].number":
        payload.patient_phone_numbers = [{ number: attempted.value, phone_type: "Mobile" }];
        break;
      default:
        failedFields.push({
          label: field.displayLabel,
          value: attempted.value,
          reason: "Field not mapped for Cliniko update.",
        });
        continue;
    }

    const oldValue = currentSnapshot[field.sourceField as keyof ClinikoPatientSnapshot];
    savedFields.push({
      label: field.displayLabel,
      oldValue: oldValue ? String(oldValue) : undefined,
      newValue: attempted.value,
    });
  }

  return { payload, savedFields, preparedOnlyFields, failedFields };
}

function verifyUpdateReadBack(
  sent: Record<string, unknown>,
  read: ClinikoPatientRaw
): { verified: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (sent.first_name && read.first_name !== sent.first_name) {
    warnings.push("Read-back: first name mismatch");
  }
  if (sent.last_name && read.last_name !== sent.last_name) {
    warnings.push("Read-back: last name mismatch");
  }
  if (sent.email && read.email && read.email !== sent.email) {
    warnings.push("Read-back: email mismatch");
  }
  if (sent.date_of_birth && read.date_of_birth && read.date_of_birth !== sent.date_of_birth) {
    warnings.push("Read-back: date of birth mismatch");
  }

  return { verified: warnings.length === 0 && Boolean(read.id), warnings };
}

export async function updateDemoPatientWithVerification(
  input: DemoPatientUpdateInput
): Promise<DemoPatientUpdateResult> {
  const emptyVerification = {
    attempted: false,
    verified: false,
    message: "No update attempted",
  };

  if (!input.staffConfirmed) {
    return {
      ok: false,
      status: "blocked",
      uiLabel: "Blocked for safety",
      message: "Staff confirmation is required before updating patient fields.",
      savedFields: [],
      unchangedFields: [],
      preparedOnlyFields: [],
      failedFields: [],
      warnings: ["staffConfirmed must be true"],
      verification: emptyVerification,
    };
  }

  const safety = validateDemoWriteInput({
    firstName: input.intakeSnapshot.firstName,
    lastName: input.intakeSnapshot.lastName,
  });
  if (!safety.ok) {
    return {
      ok: false,
      status: "blocked",
      uiLabel: "Blocked for safety",
      message: safety.reason,
      savedFields: [],
      unchangedFields: [],
      preparedOnlyFields: [],
      failedFields: [],
      warnings: [safety.reason],
      verification: emptyVerification,
    };
  }

  if (!input.selectedFieldsToUpdate.length) {
    return {
      ok: false,
      status: "blocked",
      uiLabel: "Blocked for safety",
      message: "Select at least one field to update.",
      savedFields: [],
      unchangedFields: [],
      preparedOnlyFields: [],
      failedFields: [],
      warnings: ["No fields selected"],
      verification: emptyVerification,
    };
  }

  if (!isNumericClinikoId(input.patientId)) {
    return {
      ok: false,
      status: "blocked",
      uiLabel: "Blocked for safety",
      message:
        "Demo week preview — not linked to Cliniko unless seeded. Link a numeric Cliniko patient ID first.",
      savedFields: [],
      unchangedFields: [],
      preparedOnlyFields: [],
      failedFields: [],
      warnings: ["Patient ID is not a numeric Cliniko ID"],
      verification: emptyVerification,
    };
  }

  const config = getClinikoConfig();
  if (!config.apiKey) {
    return {
      ok: false,
      status: "prepared-only",
      uiLabel: "Prepared for Cliniko — not saved yet",
      message: "Cliniko not configured — update prepared only.",
      savedFields: [],
      unchangedFields: [],
      preparedOnlyFields: input.selectedFieldsToUpdate.map((key) => {
        const field = CLINIKO_PATIENT_FIELD_MAP.find((f) => f.fieldName === key);
        return {
          label: field?.displayLabel ?? key,
          value: String(input.intakeSnapshot[field?.sourceField as keyof IntakeSnapshot] ?? ""),
          reason: "Cliniko API key not configured",
        };
      }),
      failedFields: [],
      warnings: ["Cliniko API key not configured"],
      verification: emptyVerification,
    };
  }

  if (!config.writesEnabled) {
    return {
      ok: false,
      status: "prepared-only",
      uiLabel: "Prepared for Cliniko — not saved yet",
      message: "Cliniko writes disabled — update prepared only.",
      savedFields: [],
      unchangedFields: [],
      preparedOnlyFields: input.selectedFieldsToUpdate.map((key) => {
        const field = CLINIKO_PATIENT_FIELD_MAP.find((f) => f.fieldName === key);
        return {
          label: field?.displayLabel ?? key,
          value: String(input.intakeSnapshot[field?.sourceField as keyof IntakeSnapshot] ?? ""),
          reason: "CLINIKO_ENABLE_WRITES is false",
        };
      }),
      failedFields: [],
      warnings: ["CLINIKO_ENABLE_WRITES is false"],
      verification: emptyVerification,
    };
  }

  const readBefore = await fetchPatientSnapshot(input.patientId);
  if (!readBefore.ok || !readBefore.snapshot) {
    return {
      ok: false,
      status: "blocked",
      uiLabel: "Blocked for safety",
      message: readBefore.message ?? "Patient read-back failed before update.",
      savedFields: [],
      unchangedFields: [],
      preparedOnlyFields: [],
      failedFields: [],
      warnings: [readBefore.message ?? "Read-back failed"],
      verification: {
        attempted: true,
        verified: false,
        message: "Patient update blocked — read-back before update failed",
      },
    };
  }

  const { payload, savedFields, preparedOnlyFields, failedFields } = buildPartialUpdatePayload(
    input.intakeSnapshot,
    input.selectedFieldsToUpdate,
    readBefore.snapshot
  );

  if (savedFields.length === 0) {
    return {
      ok: false,
      status: preparedOnlyFields.length > 0 ? "prepared-only" : "failed",
      uiLabel:
        preparedOnlyFields.length > 0
          ? "Prepared for Cliniko — field not currently written by this integration"
          : "Blocked for safety",
      message:
        preparedOnlyFields.length > 0
          ? "Selected fields are prepared-only — nothing written to Cliniko."
          : "No writable fields selected for update.",
      patientId: input.patientId,
      savedFields: [],
      unchangedFields: [],
      preparedOnlyFields,
      failedFields,
      warnings: [],
      verification: emptyVerification,
    };
  }

  try {
    await clinikoFetch<{ patient?: ClinikoPatientRaw }>(`/patients/${input.patientId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    let verified = false;
    let verificationMessage =
      "Update request succeeded, but read-back verification was not completed";
    const warnings: string[] = [];

    try {
      const readAfter = await clinikoFetch<{ patient?: ClinikoPatientRaw }>(
        `/patients/${input.patientId}`
      );
      const patient = readAfter.patient;
      if (patient?.id) {
        const check = verifyUpdateReadBack(payload, patient);
        verified = check.verified;
        warnings.push(...check.warnings);
        verificationMessage = verified
          ? "Updated and verified in Cliniko test account"
          : "Update request succeeded, but read-back verification was not completed";
      }
    } catch {
      warnings.push("Read-back GET /patients/{id} failed after update");
    }

    const unchangedFields = CLINIKO_PATIENT_FIELD_MAP.filter(
      (f) => !input.selectedFieldsToUpdate.includes(f.fieldName)
    )
      .map((f) => {
        const value = readBefore.snapshot?.[f.sourceField as keyof ClinikoPatientSnapshot];
        return value ? { label: f.displayLabel, value: String(value) } : null;
      })
      .filter((x): x is UnchangedPatientField => x !== null);

    return {
      ok: true,
      status: verified ? "updated" : "verification-incomplete",
      uiLabel: verified
        ? "Updated and verified in Cliniko test account"
        : "Update request succeeded, but read-back verification was not completed",
      message: verified
        ? "Patient fields updated and verified in Cliniko test account"
        : "Patient fields updated in Cliniko test account",
      patientId: input.patientId,
      savedFields,
      unchangedFields,
      preparedOnlyFields,
      failedFields,
      warnings,
      verification: {
        attempted: true,
        verified,
        message: verificationMessage,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Patient update failed.";
    return {
      ok: false,
      status: "failed",
      uiLabel: "Blocked for safety",
      message,
      patientId: input.patientId,
      savedFields: [],
      unchangedFields: [],
      preparedOnlyFields: savedFields.map((f) => ({
        label: f.label,
        value: f.newValue,
        reason: "Prepared for Cliniko — Cliniko update request failed",
      })),
      failedFields: [
        ...failedFields,
        ...savedFields.map((f) => ({
          label: f.label,
          value: f.newValue,
          reason: message,
        })),
      ],
      warnings: [message],
      verification: {
        attempted: true,
        verified: false,
        message: "Update failed before verification",
      },
    };
  }
}
