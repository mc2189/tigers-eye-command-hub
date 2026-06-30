/**
 * Record completeness summaries for appointment and client detail pages.
 */

import type { DemoClinicWeekScenario } from "@/lib/demo-clinic-week";
import type { AppointmentRecordView } from "@/lib/appointment-records";
import type { AppointmentRecordState } from "@/lib/demo-record-state";
import { CLINIKO_PATIENT_FIELD_MAP } from "@/lib/cliniko-patient-field-map";
import {
  INSURANCE_FIELD_AUDIT,
  insuranceStorageLabel,
} from "@/lib/cliniko-insurance-field-audit";

export type CompletenessStatus =
  | "Saved to Cliniko test account"
  | "Prepared for Cliniko"
  | "Suggested by Command Hub"
  | "Demo-only browser state"
  | "Future integration"
  | "Needs staff confirmation"
  | "Blocked for safety";

export interface CompletenessRow {
  label: string;
  status: CompletenessStatus;
  detail?: string;
}

export interface RecordCompletenessSummary {
  sections: CompletenessRow[];
  savedFields: Array<{ label: string; value?: string }>;
  preparedOnlyFields: Array<{ label: string; reason: string }>;
  missingFields: string[];
  futureIntegrations: string[];
}

function profileFieldRows(
  profile: DemoClinicWeekScenario["clientProfile"] | undefined,
  linkedPatientId?: string
): { saved: Array<{ label: string; value?: string }>; prepared: Array<{ label: string; reason: string }> } {
  const saved: Array<{ label: string; value?: string }> = [];
  const prepared: Array<{ label: string; reason: string }> = [];

  if (linkedPatientId) {
    saved.push({ label: "DEMO patient record", value: `Cliniko ID ${linkedPatientId}` });
  } else if (profile) {
    prepared.push({
      label: "DEMO patient record",
      reason: "Prepared for Cliniko — link or create patient via intake",
    });
  }

  if (!profile) return { saved, prepared };

  const writableValues: Record<string, string | undefined> = {
    firstName: profile.patientLabel.replace(/^DEMO\s+/i, "").split(" ")[0],
    lastName: profile.patientLabel.replace(/^DEMO\s+/i, "").split(" ").slice(1).join(" "),
    email: profile.email,
    phone: profile.phone,
    dateOfBirth: profile.dateOfBirth,
    addressLine1: profile.address,
    emergencyContact: profile.emergencyContact,
    gpOrReferrer: profile.gpOrReferrer,
    reasonForVisit: profile.reasonForVisit,
    occupationOrActivity: profile.occupationOrSport,
    medicalWarning: profile.medicalWarning,
    insuranceProvider: profile.insurer,
    policyNumber: profile.policyNumber,
    claimNumber: profile.claimNumber,
    authorisationNumber: profile.authorisationNumber,
    approvedSessions: profile.approvedSessions?.toString(),
    marketingSource: profile.marketingSource,
    preferredLocation: profile.preferredLocation,
    preferredPractitioner: profile.preferredPractitioner,
  };

  for (const field of CLINIKO_PATIENT_FIELD_MAP) {
    const value = writableValues[field.sourceField];
    if (!value) continue;
    if (field.canWriteNow && linkedPatientId) {
      saved.push({ label: field.displayLabel, value });
    } else if (field.canWriteNow) {
      prepared.push({
        label: field.displayLabel,
        reason: "Prepared for Cliniko — patient not yet linked in Cliniko",
      });
    } else {
      prepared.push({
        label: field.displayLabel,
        reason:
          field.preparedOnlyReason ??
          "Prepared for Cliniko — not currently written by this integration",
      });
    }
  }

  return { saved, prepared };
}

export function buildAppointmentCompleteness(
  record: AppointmentRecordView,
  recordState: AppointmentRecordState,
  options?: { writesEnabled?: boolean }
): RecordCompletenessSummary {
  const scenario = record.scenario;
  const profile = scenario?.clientProfile;
  const { saved, prepared } = profileFieldRows(profile, recordState.linkedPatientId);

  const noteStatus: CompletenessStatus = recordState.lastNoteSaveResult?.blocked
    ? "Blocked for safety"
    : recordState.noteSavedToCliniko
      ? "Saved to Cliniko test account"
      : recordState.lastNoteSaveResult?.uiLabel?.includes("Prepared")
        ? "Prepared for Cliniko"
        : scenario?.noteDraft.status === "prepared-for-cliniko"
          ? "Prepared for Cliniko"
          : "Suggested by Command Hub";

  const followUpStatus: CompletenessStatus = recordState.followUpBookedInCliniko
    ? "Saved to Cliniko test account"
    : scenario?.followUpScenario?.bookedInCliniko
      ? "Saved to Cliniko test account"
      : recordState.followUpPrepared
        ? "Prepared for Cliniko"
        : scenario?.followUpScenario
          ? "Suggested by Command Hub"
          : "Prepared for Cliniko";

  const invoiceStatus: CompletenessStatus = recordState.invoicePrepared
    ? "Demo-only browser state"
    : "Prepared for Cliniko";

  const insuranceStatus: CompletenessStatus = profile?.insurer
    ? "Demo-only browser state"
    : "Prepared for Cliniko";

  if (profile?.insurer) {
    for (const field of INSURANCE_FIELD_AUDIT.filter(
      (f) => f.fieldName !== "patientAndAppointment"
    )) {
      const value =
        field.fieldName === "insuranceProvider"
          ? profile.insurer
          : field.fieldName === "policyNumber"
            ? profile.policyNumber
            : field.fieldName === "claimNumber"
              ? profile.claimNumber
              : field.fieldName === "authorisationNumber"
                ? profile.authorisationNumber
                : field.fieldName === "approvedSessions"
                  ? profile.approvedSessions?.toString()
                  : undefined;
      if (!value && field.fieldName !== "invoiceReadiness") continue;
      prepared.push({
        label: `${field.displayLabel} (${insuranceStorageLabel(field.currentStorage)})`,
        reason: field.reason,
      });
    }
  }

  const matchStatus: CompletenessStatus = recordState.linkedPatientId
    ? "Saved to Cliniko test account"
    : record.isDemoWeekPreview
      ? "Needs staff confirmation"
      : record.isLiveCliniko
        ? "Saved to Cliniko test account"
        : "Needs staff confirmation";

  const sections: CompletenessRow[] = [
    {
      label: "Client profile",
      status: recordState.linkedPatientId || record.isLiveCliniko
        ? "Saved to Cliniko test account"
        : "Prepared for Cliniko",
    },
    {
      label: "Patient match",
      status: matchStatus,
    },
    {
      label: "Appointment",
      status: record.isLiveCliniko || scenario?.clinikoSaved.appointment
        ? "Saved to Cliniko test account"
        : "Prepared for Cliniko",
    },
    { label: "Treatment note", status: noteStatus },
    { label: "Follow-up appointment", status: followUpStatus },
    { label: "Invoice", status: invoiceStatus },
    {
      label: "Insurance details",
      status: profile?.insurer ? insuranceStatus : "Prepared for Cliniko",
      detail: profile?.insurer
        ? "Command Hub demo case — not saved to Cliniko"
        : undefined,
    },
    { label: "Payment status", status: "Future integration" },
    {
      label: "Stock/treatment impact",
      status: scenario?.stockScenario?.length ? "Suggested by Command Hub" : "Prepared for Cliniko",
    },
  ];

  const missingFields: string[] = [];
  if (!recordState.linkedPatientId && !record.isLiveCliniko) {
    missingFields.push("Cliniko patient link");
  }
  if (profile?.insurer && !profile.claimNumber) {
    missingFields.push("Insurance claim number");
  }

  const futureIntegrations = [
    "Xero invoice posting",
    "Healthcode submission",
    "Real payment status",
  ];

  if (!options?.writesEnabled) {
    prepared.push({
      label: "Cliniko writes",
      reason: "Prepared for Cliniko — CLINIKO_ENABLE_WRITES is false on server",
    });
  }

  return {
    sections,
    savedFields: saved,
    preparedOnlyFields: prepared,
    missingFields,
    futureIntegrations,
  };
}

export function buildClientCompleteness(
  journey: {
    patientLabel: string;
    notesStatus: string;
    noteRecordStatus: string;
    followUpStatus: string;
    followUpRecordStatus: string;
    invoiceRecordStatus: string;
    paymentStatus: string;
    insuranceStatus?: string | null;
  },
  scenarios: DemoClinicWeekScenario[],
  linkedPatientId?: string
): RecordCompletenessSummary {
  const profile = scenarios[0]?.clientProfile;
  const { saved, prepared } = profileFieldRows(profile, linkedPatientId);

  const anySavedAppt = scenarios.some((s) => s.clinikoSaved.appointment);
  const anySavedNote = scenarios.some((s) => s.clinikoSaved.note);
  const anyBookedFollowUp = scenarios.some((s) => s.followUpScenario?.bookedInCliniko);

  const sections: CompletenessRow[] = [
    {
      label: "Cliniko patient record",
      status: linkedPatientId || anySavedAppt ? "Saved to Cliniko test account" : "Prepared for Cliniko",
    },
    {
      label: "Appointments linked/saved",
      status: anySavedAppt ? "Saved to Cliniko test account" : "Prepared for Cliniko",
    },
    {
      label: "Treatment notes prepared/saved",
      status: anySavedNote
        ? "Saved to Cliniko test account"
        : journey.noteRecordStatus.includes("Prepared")
          ? "Prepared for Cliniko"
          : "Suggested by Command Hub",
    },
    {
      label: "Follow-ups suggested/booked",
      status: anyBookedFollowUp
        ? "Saved to Cliniko test account"
        : journey.followUpRecordStatus.includes("Suggested")
          ? "Suggested by Command Hub"
          : "Prepared for Cliniko",
    },
    {
      label: "Invoice drafts prepared",
      status: journey.invoiceRecordStatus.includes("Prepared")
        ? "Prepared for Cliniko"
        : "Demo-only browser state",
    },
    {
      label: "Insurance details",
      status: journey.insuranceStatus ? "Prepared for Cliniko" : "Prepared for Cliniko",
      detail: journey.insuranceStatus ?? undefined,
    },
    { label: "Payment status", status: "Future integration" },
  ];

  return {
    sections,
    savedFields: saved,
    preparedOnlyFields: prepared,
    missingFields: linkedPatientId ? [] : ["Cliniko patient link"],
    futureIntegrations: ["Xero invoice posting", "Healthcode submission", "Real payment status"],
  };
}
