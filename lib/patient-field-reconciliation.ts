/**
 * Compare website/intake fields against a Cliniko (or demo) patient record.
 */

import {
  CLINIKO_PATIENT_FIELD_MAP,
  type ClinikoPatientFieldDefinition,
} from "@/lib/cliniko-patient-field-map";
import { isDemoSafeFirstName } from "@/lib/demo-write-safety";
import type { CreateDemoPatientInput } from "@/lib/demo-patient-create";
import type { BookingIntakeInput } from "@/lib/cliniko-patient-matching";

export type ReconciliationStatus =
  | "matches"
  | "missing-in-cliniko"
  | "different"
  | "prepared-only"
  | "not-supported"
  | "not-safe";

export type IntakeSnapshot = BookingIntakeInput &
  Partial<CreateDemoPatientInput> & {
    address?: string;
    marketingSource?: string;
    medicalWarning?: string;
    occupationOrActivity?: string;
    approvedSessions?: number;
  };

export interface ClinikoPatientSnapshot {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  emergencyContact?: string;
  gpOrReferrer?: string;
  reasonForVisit?: string;
  occupationOrActivity?: string;
  medicalWarning?: string;
  marketingSource?: string;
  insuranceProvider?: string;
  policyNumber?: string;
  claimNumber?: string;
  authorisationNumber?: string;
  approvedSessions?: string;
  preferredLocation?: string;
  preferredPractitioner?: string;
}

export interface FieldReconciliationRow {
  fieldKey: string;
  label: string;
  intakeValue?: string;
  clinikoValue?: string;
  status: ReconciliationStatus;
  canUpdateNow: boolean;
  requiresStaffConfirmation: boolean;
  reason?: string;
  recommendedAction: string;
}

export interface ReconciliationSummary {
  matches: number;
  missingInCliniko: number;
  different: number;
  preparedOnly: number;
  notSafe: number;
  total: number;
}

export interface PatientFieldReconciliationResult {
  rows: FieldReconciliationRow[];
  summary: ReconciliationSummary;
  demoSafe: boolean;
  canUpdateAny: boolean;
  blockedReason?: string;
}

function normalizeEmail(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizePhone(value?: string): string {
  return (value ?? "").replace(/\D/g, "");
}

function normalizeText(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}

function getIntakeValue(
  field: ClinikoPatientFieldDefinition,
  intake: IntakeSnapshot
): string | undefined {
  const raw = intake[field.sourceField as keyof IntakeSnapshot];
  if (raw === undefined || raw === null || raw === "") {
    if (field.fieldName === "addressLine1" && intake.address?.trim()) {
      return intake.address.trim();
    }
    return undefined;
  }
  return String(raw).trim();
}

function getClinikoValue(
  field: ClinikoPatientFieldDefinition,
  cliniko: ClinikoPatientSnapshot
): string | undefined {
  const raw = cliniko[field.sourceField as keyof ClinikoPatientSnapshot];
  if (raw === undefined || raw === null || raw === "") return undefined;
  return String(raw).trim();
}

function valuesMatch(fieldKey: string, intake?: string, cliniko?: string): boolean {
  if (!intake && !cliniko) return true;
  if (!intake || !cliniko) return false;
  if (fieldKey === "email") {
    return normalizeEmail(intake) === normalizeEmail(cliniko);
  }
  if (fieldKey === "phone") {
    const a = normalizePhone(intake);
    const b = normalizePhone(cliniko);
    return a.length > 0 && a === b;
  }
  return normalizeText(intake) === normalizeText(cliniko);
}

function classifyField(
  field: ClinikoPatientFieldDefinition,
  intake: IntakeSnapshot,
  cliniko: ClinikoPatientSnapshot,
  options: { demoSafe: boolean; staffConfirmationRequired: boolean }
): FieldReconciliationRow {
  const intakeValue = getIntakeValue(field, intake);
  const clinikoValue = getClinikoValue(field, cliniko);

  if (!options.demoSafe) {
    return {
      fieldKey: field.fieldName,
      label: field.displayLabel,
      intakeValue,
      clinikoValue,
      status: "not-safe",
      canUpdateNow: false,
      requiresStaffConfirmation: true,
      reason: "Blocked for safety — non-DEMO patient records cannot be updated.",
      recommendedAction: "Do not update — use DEMO-prefixed test patients only.",
    };
  }

  if (!field.canWriteNow) {
    const status: ReconciliationStatus =
      field.writeMode === "not-supported" ? "not-supported" : "prepared-only";
    return {
      fieldKey: field.fieldName,
      label: field.displayLabel,
      intakeValue,
      clinikoValue,
      status,
      canUpdateNow: false,
      requiresStaffConfirmation: options.staffConfirmationRequired,
      reason:
        field.preparedOnlyReason ??
        "Prepared for Cliniko — field not currently written by this integration",
      recommendedAction:
        status === "not-supported"
          ? "Keep in Command Hub demo case or future integration."
          : "Review in Command Hub — not written to Cliniko by this integration.",
    };
  }

  if (!intakeValue && !clinikoValue) {
    return {
      fieldKey: field.fieldName,
      label: field.displayLabel,
      intakeValue,
      clinikoValue,
      status: "matches",
      canUpdateNow: false,
      requiresStaffConfirmation: options.staffConfirmationRequired,
      recommendedAction: "No value on intake or Cliniko — nothing to update.",
    };
  }

  if (intakeValue && !clinikoValue) {
    return {
      fieldKey: field.fieldName,
      label: field.displayLabel,
      intakeValue,
      clinikoValue,
      status: "missing-in-cliniko",
      canUpdateNow: true,
      requiresStaffConfirmation: options.staffConfirmationRequired,
      recommendedAction: "Select to add this value to the DEMO Cliniko record.",
    };
  }

  if (valuesMatch(field.fieldName, intakeValue, clinikoValue)) {
    return {
      fieldKey: field.fieldName,
      label: field.displayLabel,
      intakeValue,
      clinikoValue,
      status: "matches",
      canUpdateNow: false,
      requiresStaffConfirmation: false,
      recommendedAction: "Already matches Cliniko — no update needed.",
    };
  }

  return {
    fieldKey: field.fieldName,
    label: field.displayLabel,
    intakeValue,
    clinikoValue,
    status: "different",
    canUpdateNow: true,
    requiresStaffConfirmation: true,
    reason: "Intake value differs from Cliniko — staff must confirm before updating.",
    recommendedAction: "Select only if you intend to replace the Cliniko value.",
  };
}

export function reconcilePatientFields(
  intake: IntakeSnapshot,
  cliniko: ClinikoPatientSnapshot,
  options?: {
    staffConfirmationRequired?: boolean;
    demoSafe?: boolean;
    linkedToCliniko?: boolean;
  }
): PatientFieldReconciliationResult {
  const demoSafe =
    options?.demoSafe ??
    (cliniko.firstName ? isDemoSafeFirstName(cliniko.firstName) : isDemoSafeFirstName(intake.firstName));
  const staffConfirmationRequired = options?.staffConfirmationRequired ?? false;

  const rows = CLINIKO_PATIENT_FIELD_MAP.map((field) =>
    classifyField(field, intake, cliniko, { demoSafe, staffConfirmationRequired })
  );

  const summary: ReconciliationSummary = {
    matches: rows.filter((r) => r.status === "matches").length,
    missingInCliniko: rows.filter((r) => r.status === "missing-in-cliniko").length,
    different: rows.filter((r) => r.status === "different").length,
    preparedOnly: rows.filter(
      (r) => r.status === "prepared-only" || r.status === "not-supported"
    ).length,
    notSafe: rows.filter((r) => r.status === "not-safe").length,
    total: rows.length,
  };

  const canUpdateAny =
    demoSafe &&
    (options?.linkedToCliniko ?? true) &&
    rows.some((r) => r.canUpdateNow);

  let blockedReason: string | undefined;
  if (!demoSafe) {
    blockedReason =
      "Blocked for safety — This protects real patient records. Only DEMO-prefixed test patients can be updated from this demo.";
  } else if (options?.linkedToCliniko === false) {
    blockedReason = "Demo week preview — not linked to Cliniko unless seeded.";
  }

  return { rows, summary, demoSafe, canUpdateAny, blockedReason };
}

export function groupRowsByStatus(rows: FieldReconciliationRow[]) {
  return {
    matches: rows.filter((r) => r.status === "matches"),
    missingInCliniko: rows.filter((r) => r.status === "missing-in-cliniko"),
    different: rows.filter((r) => r.status === "different"),
    preparedOnly: rows.filter(
      (r) => r.status === "prepared-only" || r.status === "not-supported"
    ),
    notSafe: rows.filter((r) => r.status === "not-safe"),
  };
}

export function profileToClinikoSnapshot(
  profile: {
    patientLabel: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    emergencyContact?: string;
    gpOrReferrer?: string;
    reasonForVisit?: string;
    occupationOrSport?: string;
    medicalWarning?: string;
    marketingSource?: string;
    insurer?: string;
    policyNumber?: string;
    claimNumber?: string;
    authorisationNumber?: string;
    approvedSessions?: number;
    preferredLocation?: string;
    preferredPractitioner?: string;
  }
): ClinikoPatientSnapshot {
  const nameParts = profile.patientLabel.replace(/^DEMO\s+/i, "").split(/\s+/);
  const postcode = profile.address?.match(/\b([A-Z]{1,2}\d[\dA-Z]?\s*\d[A-Z]{2})\b/i)?.[1];
  return {
    firstName: `DEMO ${nameParts[0] ?? "Patient"}`,
    lastName: nameParts.slice(1).join(" ") || "Week",
    email: profile.email,
    phone: profile.phone,
    dateOfBirth: profile.dateOfBirth,
    addressLine1: profile.address,
    postcode,
    emergencyContact: profile.emergencyContact,
    gpOrReferrer: profile.gpOrReferrer,
    reasonForVisit: profile.reasonForVisit,
    occupationOrActivity: profile.occupationOrSport,
    medicalWarning: profile.medicalWarning,
    marketingSource: profile.marketingSource,
    insuranceProvider: profile.insurer,
    policyNumber: profile.policyNumber,
    claimNumber: profile.claimNumber,
    authorisationNumber: profile.authorisationNumber,
    approvedSessions: profile.approvedSessions?.toString(),
    preferredLocation: profile.preferredLocation,
    preferredPractitioner: profile.preferredPractitioner,
  };
}
