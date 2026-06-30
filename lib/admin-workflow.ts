import type { MappedBooking } from "@/lib/cliniko-mappers";
import { getSafeDemoPatientLabel } from "@/lib/cliniko-demo-appointments";

export type WorkflowActionKind =
  | "note"
  | "payment"
  | "invoice"
  | "insurance"
  | "followup"
  | "stock"
  | "price"
  | "none";

export interface WorkflowActionChip {
  kind: WorkflowActionKind;
  label: string;
  inferred?: boolean;
}

export type DataSourcePillKind =
  | "cliniko-test"
  | "demo"
  | "inferred"
  | "future";

export interface WorkflowAppointmentView {
  id: string;
  patient: string;
  appointmentType: string;
  time: string;
  endTime: string;
  date: string;
  practitioner: string;
  location: string;
  sourcePill: DataSourcePillKind;
  sourceLabel: string;
  actions: WorkflowActionChip[];
  confidenceNotes: string[];
}

export function dataSourcePillLabel(kind: DataSourcePillKind): string {
  switch (kind) {
    case "cliniko-test":
      return "Cliniko test account";
    case "demo":
      return "Demo example";
    case "inferred":
      return "Inferred workflow";
    case "future":
      return "Future integration";
  }
}

export function deriveWorkflowActions(booking: MappedBooking): WorkflowActionChip[] {
  const actions: WorkflowActionChip[] = [];

  if (booking.noteStatus === "not-started" || booking.noteStatus === "draft-needed") {
    actions.push({ kind: "note", label: "Treatment note needed" });
  }

  if (booking.paymentStatus === "unpaid" || booking.paymentStatus === "cash-approval-required") {
    actions.push({ kind: "payment", label: "Payment check", inferred: true });
  }

  if (booking.invoiceStatus === "draft-needed" || booking.invoiceStatus === "ready-to-send") {
    actions.push({ kind: "invoice", label: "Invoice check needed", inferred: true });
  }

  if (booking.workstream === "insurance" || booking.insuranceContext) {
    actions.push({ kind: "insurance", label: "Insurance details missing", inferred: true });
  }

  if (booking.priceSource === "missing") {
    actions.push({
      kind: "price",
      label: "Missing price for appointment type",
      inferred: true,
    });
  }

  if (booking.stockImpact.length > 0) {
    actions.push({ kind: "stock", label: "Stock impact", inferred: true });
  }

  if (actions.length === 0) {
    actions.push({ kind: "none", label: "No action needed" });
  }

  return actions;
}

export function deriveConfidenceNotes(booking: MappedBooking): string[] {
  const notes: string[] = [];

  if (booking.priceSource === "fallback") {
    notes.push("Inferred from appointment type");
  }
  if (booking.priceSource === "missing") {
    notes.push("Missing price setup");
  }
  if (!booking.practitionerMatched) {
    notes.push("Practitioner name not matched to Command Hub roster");
  }
  if (booking.stockImpact.length > 0) {
    notes.push("Stock estimate only");
  }
  if (booking.workstream === "insurance") {
    notes.push("Insurance details not captured yet");
  }
  if (booking.paymentRule.includes("not configured")) {
    notes.push("Payment rule not configured");
  }

  return notes;
}

export function mappedBookingToWorkflowView(booking: MappedBooking): WorkflowAppointmentView {
  const patient =
    getSafeDemoPatientLabel({
      patientName: booking.clientName,
      patientLabel: booking.clientName,
    }) || "DEMO patient";

  return {
    id: booking.id,
    patient,
    appointmentType: booking.appointmentTypeName || "Unknown appointment type",
    time: booking.time || "Time not returned",
    endTime: booking.endTime || "",
    date: booking.date,
    practitioner: booking.practitionerName || "Unknown practitioner",
    location: booking.locationLabel || booking.businessName || "Unknown clinic",
    sourcePill: booking.dataSource === "demo" ? "demo" : "cliniko-test",
    sourceLabel: dataSourcePillLabel(
      booking.dataSource === "demo" ? "demo" : "cliniko-test"
    ),
    actions: deriveWorkflowActions(booking),
    confidenceNotes: deriveConfidenceNotes(booking),
  };
}

export function countTodayWorkflowMetrics(appointments: MappedBooking[], todayIso: string) {
  const today = appointments.filter((a) => a.date === todayIso);
  return {
    appointments: today.length,
    notesToComplete: today.filter(
      (a) => a.noteStatus === "not-started" || a.noteStatus === "draft-needed"
    ).length,
    paymentsToCheck: today.filter(
      (a) => a.paymentStatus === "unpaid" || a.paymentStatus === "cash-approval-required"
    ).length,
    invoicesToSend: today.filter(
      (a) => a.invoiceStatus === "draft-needed" || a.invoiceStatus === "ready-to-send"
    ).length,
  };
}
