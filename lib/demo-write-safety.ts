/**
 * DEMO-only write safety checks — server and client.
 */

import { isDemoPatientLabel } from "@/lib/demo-insurance-cases";

export function isDemoSafeFirstName(firstName: string): boolean {
  return /^DEMO\b/i.test(firstName.trim());
}

export function isDemoSafeFullName(firstName: string, lastName: string): boolean {
  return isDemoSafeFirstName(firstName);
}

export function isDemoSafePatientLabel(label: string): boolean {
  return isDemoPatientLabel(label);
}

export function validateDemoWriteInput(input: {
  firstName?: string;
  lastName?: string;
  patientLabel?: string;
}): { ok: true } | { ok: false; reason: string } {
  if (input.patientLabel && !isDemoSafePatientLabel(input.patientLabel)) {
    return { ok: false, reason: "Patient label must start with DEMO." };
  }
  if (input.firstName && !isDemoSafeFirstName(input.firstName)) {
    return {
      ok: false,
      reason: "Unsafe/non-DEMO input blocked — first name must start with DEMO.",
    };
  }
  return { ok: true };
}

export function blockNonDemoPatientRecord(patient: {
  firstName?: string;
  lastName?: string;
}): boolean {
  if (!patient.firstName) return true;
  return !isDemoSafeFirstName(patient.firstName);
}

export function validateDemoLinkedWrite(input: {
  patientId?: string;
  patientFirstName?: string;
  patientLabel?: string;
}): { ok: true } | { ok: false; reason: string } {
  if (input.patientLabel) {
    return validateDemoWriteInput({ patientLabel: input.patientLabel });
  }
  if (input.patientFirstName && !isDemoSafeFirstName(input.patientFirstName)) {
    return {
      ok: false,
      reason: "Unsafe/non-DEMO input blocked — patient must be DEMO-linked.",
    };
  }
  if (!input.patientId?.trim()) {
    return { ok: false, reason: "Patient must be linked to Cliniko before writing." };
  }
  return { ok: true };
}
