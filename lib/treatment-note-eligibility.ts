/**
 * Client-side treatment note save eligibility (mirrors server rules for UI).
 */

import type { AppointmentRecordView } from "@/lib/appointment-records";
import type { AppointmentRecordState } from "@/lib/demo-record-state";

export interface TreatmentNoteEligibility {
  canSave: boolean;
  uiLabel: string;
  reason?: string;
  linkStatus: string;
}

function isNumericClinikoId(id?: string | null): boolean {
  return Boolean(id?.trim() && /^\d+$/.test(id.trim()));
}

export function getTreatmentNoteEligibility(
  record: AppointmentRecordView,
  recordState: AppointmentRecordState,
  options?: { writesEnabled?: boolean; configured?: boolean }
): TreatmentNoteEligibility {
  const linkedPatientId = recordState.linkedPatientId ?? record.clinikoPatientId ?? undefined;
  const appointmentId =
    record.clinikoAppointmentId ??
    (isNumericClinikoId(record.appointmentId) ? record.appointmentId : null);

  if (!options?.configured) {
    return {
      canSave: false,
      uiLabel: "Prepared for Cliniko — not saved yet",
      reason: "Cliniko not configured",
      linkStatus: "Not linked",
    };
  }

  if (!options?.writesEnabled) {
    return {
      canSave: false,
      uiLabel: "Prepared for Cliniko — not saved yet",
      reason: "Writes are disabled",
      linkStatus: linkedPatientId ? "Patient linked" : "Patient not linked",
    };
  }

  if (!linkedPatientId) {
    return {
      canSave: false,
      uiLabel: "Blocked for safety",
      reason: "Patient is not DEMO-linked",
      linkStatus: "Patient not linked",
    };
  }

  if (!appointmentId) {
    return {
      canSave: false,
      uiLabel: "Blocked for safety",
      reason: "Preview-only appointment is not linked to Cliniko",
      linkStatus: "Appointment not linked to Cliniko",
    };
  }

  if (record.isDemoWeekPreview && !recordState.linkedPatientId && !record.isLiveCliniko) {
    return {
      canSave: false,
      uiLabel: "Blocked for safety",
      reason: "Preview-only appointment is not linked to Cliniko",
      linkStatus: "Demo week preview — not linked",
    };
  }

  return {
    canSave: true,
    uiLabel: "Saved to Cliniko test account",
    linkStatus: "Ready — DEMO patient and appointment IDs present",
  };
}
