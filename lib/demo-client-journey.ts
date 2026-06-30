/**
 * Client journey view data built from Demo Clinic Week scenarios.
 */

import {
  DEMO_CLINIC_WEEK_SCENARIOS,
  getDemoClinicWeekDate,
  getDemoClinicWeekEndTime,
  type DemoClinicWeekScenario,
} from "@/lib/demo-clinic-week";
import type { DemoDataSourceLabel } from "@/lib/demo-week-preview";

export interface ClientJourneyView {
  patientLabel: string;
  reasonForVisit: string;
  currentAppointment: {
    type: string;
    date: string;
    time: string;
    endTime: string;
    practitioner: string;
    location: string;
  } | null;
  treatmentPlan: string;
  notesStatus: string;
  noteRecordStatus: DemoDataSourceLabel;
  followUpStatus: string;
  followUpRecordStatus: DemoDataSourceLabel;
  paymentStatus: string;
  invoiceStatus: string;
  invoiceRecordStatus: DemoDataSourceLabel;
  insuranceStatus: string | null;
  stockImpact: string[];
  nextAction: string;
  dataSource: DemoDataSourceLabel;
  clinikoSaved: DemoClinicWeekScenario["clinikoSaved"];
}

function recordLabel(
  saved: boolean,
  prepared: boolean
): DemoDataSourceLabel {
  if (saved) return "Saved to Cliniko test account";
  if (prepared) return "Prepared for Cliniko";
  return "Suggested by Command Hub";
}

function buildJourney(
  scenario: DemoClinicWeekScenario,
  dataSource: DemoDataSourceLabel
): ClientJourneyView {
  const date = getDemoClinicWeekDate(scenario);
  return {
    patientLabel: scenario.patientLabel,
    reasonForVisit: scenario.clientProfile.reasonForVisit,
    currentAppointment: {
      type: scenario.appointmentType,
      date,
      time: scenario.time,
      endTime: getDemoClinicWeekEndTime(scenario),
      practitioner: scenario.preferredPractitioner,
      location: scenario.location,
    },
    treatmentPlan: scenario.treatmentPlan,
    notesStatus:
      scenario.noteStatus === "complete"
        ? "Note complete"
        : scenario.noteStatus === "in-progress"
          ? "Note in progress"
          : "Note needed",
    noteRecordStatus: recordLabel(
      scenario.clinikoSaved.note,
      scenario.noteDraft.status === "prepared-for-cliniko"
    ),
    followUpStatus: scenario.followUpScenario?.summary ?? "No follow-up suggested",
    followUpRecordStatus: scenario.followUpScenario?.bookedInCliniko
      ? "Saved to Cliniko test account"
      : "Suggested by Command Hub",
    paymentStatus:
      scenario.paymentScenario === "paid-in-clinic"
        ? "Paid in clinic"
        : scenario.paymentScenario === "insurance-funded"
          ? "Insurance-funded"
          : "Payment check needed",
    invoiceStatus: scenario.invoiceDraft.suggestedNextStep,
    invoiceRecordStatus: recordLabel(
      scenario.clinikoSaved.invoice,
      scenario.invoiceDraft.status === "prepared-for-cliniko"
    ),
    insuranceStatus: scenario.insuranceScenario ?? null,
    stockImpact: scenario.stockScenario ?? [],
    nextAction:
      scenario.noteStatus !== "complete"
        ? "Complete treatment note"
        : scenario.invoiceDraft.suggestedNextStep,
    dataSource,
    clinikoSaved: scenario.clinikoSaved,
  };
}

export function buildClientJourneys(
  dataSource: DemoDataSourceLabel = "Demo week preview"
): ClientJourneyView[] {
  const seen = new Set<string>();
  const journeys: ClientJourneyView[] = [];

  for (const scenario of DEMO_CLINIC_WEEK_SCENARIOS) {
    if (seen.has(scenario.patientLabel)) continue;
    seen.add(scenario.patientLabel);
    journeys.push(buildJourney(scenario, dataSource));
  }

  return journeys.sort((a, b) => a.patientLabel.localeCompare(b.patientLabel));
}

export function getClientJourneySummary(journey: ClientJourneyView): string {
  const parts: string[] = [];
  if (journey.notesStatus.includes("needed") || journey.notesStatus.includes("progress")) {
    parts.push("Note needed");
  }
  if (journey.paymentStatus.includes("check")) {
    parts.push("Payment check");
  }
  if (journey.followUpStatus.includes("suggested") || journey.followUpStatus.includes("Follow-up")) {
    parts.push("Follow-up suggested");
  }
  if (journey.insuranceStatus?.includes("invoice")) {
    parts.push("Insurance invoice");
  }
  return parts.length ? parts.join(" · ") : "Ready";
}

export function getInsuranceJourneySummary(journey: ClientJourneyView): string | null {
  if (!journey.insuranceStatus) return null;
  return journey.insuranceStatus;
}
