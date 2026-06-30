import type { MappedBooking } from "@/lib/cliniko-mappers";
import { getSafeDemoPatientLabel } from "@/lib/cliniko-demo-appointments";
import { GENERIC_APPOINTMENT_TYPE } from "@/lib/cliniko-display-labels";
import {
  detectAppointmentCategory,
  getFollowUpSuggestionForCategory,
  getSetupWarningsForCategory,
  getStockItemsForCategory,
  getSuggestedNoteTemplate,
  type AppointmentCategory,
} from "@/lib/appointment-rules";
import { getCommercialContext } from "@/lib/clinic-commercial-rules";
import {
  findInsuranceCaseForAppointment,
  findInsuranceCaseForPatient,
  getInsuranceWorkflowChipsForCase,
  type InsuranceCase,
} from "@/lib/insurance-session-workflow";

// ─── Types ───────────────────────────────────────────────────────────────────

export type WorkflowActionType =
  | "note"
  | "payment"
  | "invoice"
  | "insurance"
  | "stock"
  | "follow-up"
  | "setup"
  | "warning";

/** @deprecated Use WorkflowActionType */
export type WorkflowActionKind = WorkflowActionType | "followup" | "price" | "none";

export type WorkflowActionPriority = "high" | "medium" | "low";

export type WorkflowActionStatus =
  | "needs-attention"
  | "ready"
  | "missing-setup"
  | "not-required"
  | "future-integration";

export type WorkflowActionSource =
  | "cliniko-test"
  | "demo"
  | "inferred"
  | "future-integration";

export interface WorkflowAction {
  type: WorkflowActionType;
  priority: WorkflowActionPriority;
  status: WorkflowActionStatus;
  label: string;
  whyItMatters?: string;
  suggestedNextStep?: string;
  source: WorkflowActionSource;
}

export interface AppointmentWorkflowBundle {
  appointmentId: string;
  patientLabel: string;
  appointmentType: string;
  category: AppointmentCategory;
  practitioner: string;
  location: string;
  startsAt: string | null;
  date: string;
  time: string;
  endTime: string;
  source: "cliniko-test" | "demo" | "inferred";
  actions: WorkflowAction[];
  setupActions: WorkflowAction[];
  primaryAction: WorkflowAction | null;
  secondaryActions: WorkflowAction[];
  hiddenActions: WorkflowAction[];
  summary: {
    needsNote: boolean;
    needsPaymentCheck: boolean;
    needsInvoiceCheck: boolean;
    insuranceLikely: boolean;
    stockImpactLikely: boolean;
    followUpSuggested: boolean;
    missingSetup: string[];
  };
}

export type DataSourcePillKind =
  | "cliniko-test"
  | "demo"
  | "inferred"
  | "future";

/** Legacy view for existing cards */
export interface WorkflowActionChip {
  kind: WorkflowActionKind;
  label: string;
  inferred?: boolean;
}

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
  primaryAction?: string;
  secondaryActions?: string[];
}

export interface WorkflowSummaryMetrics {
  appointments: number;
  notesToComplete: number;
  paymentsToCheck: number;
  invoicesToReview: number;
  insuranceItems: number;
  stockImpacts: number;
  followUpsSuggested: number;
}

export interface NoteQueueItem {
  bundle: AppointmentWorkflowBundle;
  suggestedTemplate: string;
}

export interface PaymentQueueItem {
  bundle: AppointmentWorkflowBundle;
  paymentExpected: boolean;
  depositSuggested: boolean;
  paymentRuleMissing: boolean;
}

export interface InvoiceQueueItem {
  bundle: AppointmentWorkflowBundle;
  invoiceReason: string;
}

export interface InsuranceQueueItem {
  bundle: AppointmentWorkflowBundle;
  checklist: { field: string; value: string }[];
}

export interface StockQueueItem {
  bundle: AppointmentWorkflowBundle;
  items: string[];
}

export interface FollowUpQueueItem {
  bundle: AppointmentWorkflowBundle;
  messageType: string;
  suggestedMessage: string;
}

export interface FinanceWorkflowSummary {
  estimatedRevenue: number;
  unknownRevenueCount: number;
  missingPriceTypes: string[];
  paymentChecksRequired: number;
  invoiceChecksRequired: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function bookingSource(booking: MappedBooking): "cliniko-test" | "demo" | "inferred" {
  if (booking.dataSource === "demo") return "demo";
  return "cliniko-test";
}

function patientLabel(booking: MappedBooking): string {
  return (
    getSafeDemoPatientLabel({
      patientName: booking.clientName,
      patientLabel: booking.clientName,
    }) || "DEMO patient"
  );
}

const PRIORITY_ORDER: Record<WorkflowActionType, number> = {
  warning: 0,
  setup: 1,
  note: 2,
  payment: 3,
  invoice: 4,
  insurance: 5,
  "follow-up": 6,
  stock: 7,
};

function sortActions(actions: WorkflowAction[]): WorkflowAction[] {
  return [...actions].sort((a, b) => PRIORITY_ORDER[a.type] - PRIORITY_ORDER[b.type]);
}

function needsNote(booking: MappedBooking): boolean {
  return booking.noteStatus === "not-started" || booking.noteStatus === "draft-needed";
}

// ─── Bundle builder ──────────────────────────────────────────────────────────

export function buildAppointmentWorkflowBundle(
  booking: MappedBooking
): AppointmentWorkflowBundle {
  const typeName = booking.appointmentTypeName || GENERIC_APPOINTMENT_TYPE;
  const category = detectAppointmentCategory(typeName);
  const commercial = getCommercialContext(typeName, {
    clinikoPrice: booking.estimatedFee,
    priceSource: booking.priceSource,
    category,
  });
  const stockItems =
    booking.stockImpact.length > 0
      ? booking.stockImpact
      : getStockItemsForCategory(category);
  const followUp = getFollowUpSuggestionForCategory(category);
  const setupWarnings = getSetupWarningsForCategory(category, typeName);
  const missingSetup: string[] = [];

  const actions: WorkflowAction[] = [];
  const src: WorkflowActionSource =
    booking.dataSource === "demo" ? "demo" : "inferred";

  if (!commercial.priceConfigured && category !== "insurance-initial" && category !== "insurance-follow-up") {
    missingSetup.push("Missing price setup");
    actions.push({
      type: "setup",
      priority: "high",
      status: "missing-setup",
      label: "Missing price setup",
      whyItMatters: "Finance estimates and payment checks are clearer when a price is configured.",
      suggestedNextStep: `Add a price/payment rule for ${typeName} so finance estimates and payment checks are clearer.`,
      source: "inferred",
    });
  }

  if (booking.paymentRule.includes("not configured") || booking.paymentRule === "Review payment rule") {
    missingSetup.push("Payment rule not configured");
    actions.push({
      type: "setup",
      priority: "high",
      status: "missing-setup",
      label: "Payment rule not configured",
      whyItMatters: "Staff need to know how each appointment type should be paid.",
      suggestedNextStep: "Configure a payment rule for this appointment type in clinic settings.",
      source: "inferred",
    });
  }

  if (category === "unknown" && !followUp.suggested) {
    missingSetup.push("Follow-up rule not configured");
    actions.push({
      type: "setup",
      priority: "medium",
      status: "missing-setup",
      label: "Follow-up rule not configured",
      whyItMatters: "Follow-up prompts help keep patients on track after appointments.",
      suggestedNextStep: "Add a follow-up rule when you know the usual clinic workflow for this type.",
      source: "inferred",
    });
  }

  if (needsNote(booking)) {
    actions.push({
      type: "note",
      priority: "high",
      status: "needs-attention",
      label: "Treatment note needed",
      whyItMatters: "Clinical records should be completed after each appointment.",
      suggestedNextStep:
        "Prepare the note after the appointment. Cliniko remains the clinical record.",
      source: booking.dataSource === "demo" ? "demo" : "cliniko-test",
    });
  }

  if (
    commercial.paymentExpected &&
    (booking.paymentStatus === "unpaid" || booking.paymentStatus === "cash-approval-required")
  ) {
    actions.push({
      type: "payment",
      priority: "high",
      status: "needs-attention",
      label: commercial.depositSuggested ? "Deposit suggested" : "Payment check",
      whyItMatters: "Payment status is not connected yet. This queue shows appointments that should be checked.",
      suggestedNextStep: "Check in Cliniko whether payment was taken or is still outstanding.",
      source: "inferred",
    });
  }

  if (
    commercial.invoiceUsuallyRequired ||
    booking.invoiceStatus === "draft-needed" ||
    booking.invoiceStatus === "ready-to-send"
  ) {
    const isInsurance =
      category === "insurance-initial" || category === "insurance-follow-up" || booking.workstream === "insurance";
    actions.push({
      type: "invoice",
      priority: "medium",
      status: "needs-attention",
      label: isInsurance ? "Insurance invoice details required" : "Invoice check needed",
      whyItMatters: isInsurance
        ? "Insurance invoices need claim details before billing."
        : "Check whether payment was taken or an invoice is needed.",
      suggestedNextStep: isInsurance
        ? "Capture insurer, claim and authorisation details before drafting the invoice."
        : "Check whether payment was taken or invoice is needed.",
      source: "inferred",
    });
  }

  const insuranceLikely =
    category === "insurance-initial" ||
    category === "insurance-follow-up" ||
    booking.workstream === "insurance" ||
    Boolean(booking.insuranceContext);

  if (insuranceLikely) {
    actions.push({
      type: "insurance",
      priority: "medium",
      status: "needs-attention",
      label: "Insurance details missing",
      whyItMatters: "Insurer-funded work needs claim and session details captured.",
      suggestedNextStep: "Open the insurance checklist and capture missing fields in Cliniko.",
      source: "inferred",
    });
  }

  if (followUp.suggested) {
    actions.push({
      type: "follow-up",
      priority: "low",
      status: "needs-attention",
      label: followUp.messageType ?? "Follow-up suggested",
      whyItMatters: followUp.reason,
      suggestedNextStep: "Review the suggested message — nothing is sent automatically in this demo.",
      source: "inferred",
    });
  }

  if (stockItems.length > 0) {
    actions.push({
      type: "stock",
      priority: "low",
      status: "needs-attention",
      label: "Stock impact",
      whyItMatters: "Consumables may be needed based on appointment type.",
      suggestedNextStep: `Estimated only: ${stockItems.join(", ")}.`,
      source: "inferred",
    });
  }

  if (category === "external-corporate") {
    actions.push({
      type: "invoice",
      priority: "medium",
      status: "needs-attention",
      label: "External/corporate invoice route",
      whyItMatters: "External work often uses a separate invoicing path.",
      suggestedNextStep: "Route to the external work invoice tracker.",
      source: "inferred",
    });
  }

  const sorted = sortActions(actions);
  const setupActions = sorted.filter((a) => a.type === "setup");
  const operational = sorted.filter(
    (a) => a.type !== "setup" && a.status !== "future-integration"
  );
  const primary = operational[0] ?? null;
  const secondary = operational.slice(1, 3);
  const hiddenActions = operational.slice(3);

  const attentionActions = operational;

  const summary = {
    needsNote: needsNote(booking),
    needsPaymentCheck: attentionActions.some((a) => a.type === "payment" && a.status === "needs-attention"),
    needsInvoiceCheck: attentionActions.some((a) => a.type === "invoice"),
    insuranceLikely,
    stockImpactLikely: stockItems.length > 0,
    followUpSuggested: followUp.suggested,
    missingSetup,
  };

  return {
    appointmentId: booking.id,
    patientLabel: patientLabel(booking),
    appointmentType: typeName,
    category,
    practitioner: booking.practitionerName || "Practitioner not returned",
    location: booking.locationLabel || booking.businessName || "Clinic not returned",
    startsAt: booking.date && booking.time ? `${booking.date}T${booking.time}` : null,
    date: booking.date,
    time: booking.time || "Time not returned",
    endTime: booking.endTime || "",
    source: bookingSource(booking),
    actions: sorted,
    setupActions,
    primaryAction: primary,
    secondaryActions: secondary,
    hiddenActions,
    summary,
  };
}

export function buildWorkflowActionsForAppointments(
  appointments: MappedBooking[]
): AppointmentWorkflowBundle[] {
  return (appointments ?? []).map(buildAppointmentWorkflowBundle);
}

export function summariseWorkflowActions(
  bundles: AppointmentWorkflowBundle[]
): WorkflowSummaryMetrics {
  return {
    appointments: bundles.length,
    notesToComplete: bundles.filter((b) => b.summary.needsNote).length,
    paymentsToCheck: bundles.filter((b) => b.summary.needsPaymentCheck).length,
    invoicesToReview: bundles.filter((b) => b.summary.needsInvoiceCheck).length,
    insuranceItems: bundles.filter((b) => b.summary.insuranceLikely).length,
    stockImpacts: bundles.filter((b) => b.summary.stockImpactLikely).length,
    followUpsSuggested: bundles.filter((b) => b.summary.followUpSuggested).length,
  };
}

export function getCommandListContext(appointments: MappedBooking[], todayIso: string) {
  const today = appointments.filter((a) => a.date === todayIso);
  if (today.length > 0) {
    return { title: "Today's command list", appointments: today, isToday: true };
  }
  const upcoming = [...appointments].sort(
    (a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || "")
  );
  return { title: "Upcoming command list", appointments: upcoming, isToday: false };
}

export function getTodayCommandItems(appointments: MappedBooking[], todayIso: string) {
  const ctx = getCommandListContext(appointments, todayIso);
  return {
    ...ctx,
    bundles: buildWorkflowActionsForAppointments(ctx.appointments),
  };
}

export function getNotesQueue(appointments: MappedBooking[]): NoteQueueItem[] {
  return buildWorkflowActionsForAppointments(appointments)
    .filter((b) => b.summary.needsNote)
    .map((bundle) => ({
      bundle,
      suggestedTemplate: getSuggestedNoteTemplate(bundle.category),
    }));
}

export function getPaymentQueue(appointments: MappedBooking[]): PaymentQueueItem[] {
  return buildWorkflowActionsForAppointments(appointments)
    .filter((b) => b.summary.needsPaymentCheck || b.actions.some((a) => a.type === "payment"))
    .map((bundle) => {
      const commercial = getCommercialContext(bundle.appointmentType, {
        priceSource: bundle.summary.missingSetup.includes("Missing price setup") ? "missing" : "fallback",
        category: bundle.category,
      });
      return {
        bundle,
        paymentExpected: commercial.paymentExpected,
        depositSuggested: commercial.depositSuggested,
        paymentRuleMissing: bundle.summary.missingSetup.includes("Payment rule not configured"),
      };
    });
}

export function getInvoiceQueue(appointments: MappedBooking[]): InvoiceQueueItem[] {
  return buildWorkflowActionsForAppointments(appointments)
    .filter((b) => b.summary.needsInvoiceCheck)
    .map((bundle) => {
      const invoiceAction = bundle.actions.find((a) => a.type === "invoice");
      return {
        bundle,
        invoiceReason: invoiceAction?.whyItMatters ?? "Invoice check may be needed.",
      };
    });
}

const INSURANCE_CHECKLIST_FIELDS = [
  "Insurer",
  "Policy/member number",
  "Claim number",
  "Authorisation number",
  "Approved sessions",
  "Sessions used",
  "Sessions remaining",
  "Patient liability agreement",
  "Invoice status",
] as const;

export function getInsuranceQueue(appointments: MappedBooking[]): InsuranceQueueItem[] {
  return buildWorkflowActionsForAppointments(appointments)
    .filter((b) => b.summary.insuranceLikely)
    .map((bundle) => {
      const booking = appointments.find((a) => a.id === bundle.appointmentId);
      const insurer = booking?.insuranceContext?.likelyInsurer;
      const checklist = INSURANCE_CHECKLIST_FIELDS.map((field) => {
        if (field === "Insurer" && insurer) return { field, value: insurer };
        return { field, value: "Not captured yet" };
      });
      return { bundle, checklist };
    });
}

export function getStockQueue(appointments: MappedBooking[]): StockQueueItem[] {
  return buildWorkflowActionsForAppointments(appointments)
    .filter((b) => b.summary.stockImpactLikely)
    .map((bundle) => ({
      bundle,
      items:
        bundle.actions.find((a) => a.type === "stock")?.suggestedNextStep?.replace("Estimated only: ", "").replace(".", "").split(", ") ??
        getStockItemsForCategory(bundle.category),
    }));
}

export function getFollowUpQueue(appointments: MappedBooking[]): FollowUpQueueItem[] {
  return buildWorkflowActionsForAppointments(appointments)
    .filter((b) => b.summary.followUpSuggested || b.actions.some((a) => a.type === "follow-up"))
    .map((bundle) => {
      const followUp = getFollowUpSuggestionForCategory(bundle.category);
      const patient = bundle.patientLabel;
      return {
        bundle,
        messageType: followUp.messageType ?? "Follow-up check-in",
        suggestedMessage: `Hi ${patient}, we hope your recent appointment went well. ${followUp.reason ?? "Please let us know if you need to rebook."}`,
      };
    });
}

export function summariseFinanceWorkflow(appointments: MappedBooking[]): FinanceWorkflowSummary {
  const bundles = buildWorkflowActionsForAppointments(appointments);
  let estimatedRevenue = 0;
  let unknownRevenueCount = 0;
  const missingPriceTypes = new Set<string>();

  for (const booking of appointments) {
    const commercial = getCommercialContext(booking.appointmentTypeName, {
      clinikoPrice: booking.estimatedFee,
      priceSource: booking.priceSource,
    });
    if (commercial.priceConfigured && commercial.price !== undefined) {
      estimatedRevenue += commercial.price;
    } else {
      unknownRevenueCount += 1;
      missingPriceTypes.add(booking.appointmentTypeName || "Unknown");
    }
  }

  return {
    estimatedRevenue,
    unknownRevenueCount,
    missingPriceTypes: [...missingPriceTypes],
    paymentChecksRequired: bundles.filter((b) => b.summary.needsPaymentCheck).length,
    invoiceChecksRequired: bundles.filter((b) => b.summary.needsInvoiceCheck).length,
  };
}

export function bundleNeedsAttention(bundle: AppointmentWorkflowBundle): boolean {
  return bundle.actions.some(
    (a) =>
      a.type !== "setup" &&
      (a.status === "needs-attention" || a.type === "warning")
  );
}

export function bundleIsReady(bundle: AppointmentWorkflowBundle): boolean {
  return bundle.actions.some((a) => a.type !== "setup") && !bundleNeedsAttention(bundle);
}

export function bundleMissingSetup(bundle: AppointmentWorkflowBundle): boolean {
  return bundle.summary.missingSetup.length > 0;
}

export function enrichBundleWithInsuranceCases(
  bundle: AppointmentWorkflowBundle,
  cases: InsuranceCase[]
): AppointmentWorkflowBundle {
  if (!bundle.summary.insuranceLikely || cases.length === 0) return bundle;

  const insuranceCase =
    findInsuranceCaseForAppointment(cases, bundle.appointmentId) ??
    findInsuranceCaseForPatient(cases, bundle.patientLabel);

  const chips = getInsuranceWorkflowChipsForCase(insuranceCase);
  if (chips.length === 0) return bundle;

  const insuranceActions: WorkflowAction[] = chips.map((chip, index) => ({
    type: "insurance",
    priority: index === 0 ? "high" : "medium",
    status: "needs-attention",
    label: chip.label,
    whyItMatters: "Insurer-funded work needs accurate session and claim tracking.",
    suggestedNextStep: chip.suggestedNextStep,
    source: "inferred",
  }));

  const withoutGenericInsurance = bundle.actions.filter(
    (a) => !(a.type === "insurance" && a.label === "Insurance details missing")
  );

  const merged = [...insuranceActions, ...withoutGenericInsurance.filter((a) => a.type !== "insurance")];
  const primary = insuranceActions[0] ?? bundle.primaryAction;
  const secondary = [...insuranceActions.slice(1), ...bundle.secondaryActions].slice(0, 4);

  return {
    ...bundle,
    actions: merged,
    primaryAction: primary,
    secondaryActions: secondary,
  };
}

export function enrichBundlesWithInsuranceCases(
  bundles: AppointmentWorkflowBundle[],
  cases: InsuranceCase[]
): AppointmentWorkflowBundle[] {
  return bundles.map((b) => enrichBundleWithInsuranceCases(b, cases));
}

// ─── Legacy adapters ───────────────────────────────────────────────────────────

export function deriveWorkflowActions(booking: MappedBooking): WorkflowActionChip[] {
  const bundle = buildAppointmentWorkflowBundle(booking);
  return bundle.actions
    .filter((a) => a.status !== "future-integration")
    .slice(0, 6)
    .map((a) => ({
      kind: a.type as WorkflowActionKind,
      label: a.label,
      inferred: a.source === "inferred",
    }));
}

export function deriveConfidenceNotes(booking: MappedBooking): string[] {
  const bundle = buildAppointmentWorkflowBundle(booking);
  const notes: string[] = [];
  if (bundle.summary.missingSetup.includes("Missing price setup")) {
    notes.push("Missing price setup");
  }
  if (bundle.summary.missingSetup.includes("Payment rule not configured")) {
    notes.push("Payment rule not configured");
  }
  if (bundle.summary.stockImpactLikely) notes.push("Stock estimate only");
  if (bundle.summary.insuranceLikely) notes.push("Insurance details not captured yet");
  if (booking.priceSource === "fallback") notes.push("Inferred from appointment type");
  return notes;
}

export function mappedBookingToWorkflowView(booking: MappedBooking): WorkflowAppointmentView {
  const bundle = buildAppointmentWorkflowBundle(booking);
  return {
    id: booking.id,
    patient: bundle.patientLabel,
    appointmentType: bundle.appointmentType,
    time: bundle.time,
    endTime: bundle.endTime,
    date: bundle.date,
    practitioner: bundle.practitioner,
    location: bundle.location,
    sourcePill: booking.dataSource === "demo" ? "demo" : "cliniko-test",
    sourceLabel: dataSourcePillLabel(booking.dataSource === "demo" ? "demo" : "cliniko-test"),
    actions: deriveWorkflowActions(booking),
    confidenceNotes: deriveConfidenceNotes(booking),
    primaryAction: bundle.primaryAction?.label,
    secondaryActions: bundle.secondaryActions.map((a) => a.label),
  };
}

export function countTodayWorkflowMetrics(
  appointments: MappedBooking[],
  todayIso: string
): WorkflowSummaryMetrics {
  const ctx = getCommandListContext(appointments, todayIso);
  return summariseWorkflowActions(buildWorkflowActionsForAppointments(ctx.appointments));
}

export function getWorkflowActionChipsForBooking(
  booking: MappedBooking
): WorkflowActionChip[] {
  return buildAppointmentWorkflowBundle(booking)
    .actions.filter((a) => a.status === "needs-attention" || a.status === "missing-setup")
    .slice(0, 4)
    .map((a) => ({
      kind: a.type as WorkflowActionKind,
      label: a.label,
      inferred: a.source === "inferred",
    }));
}
