import type { MappedBooking } from "@/lib/cliniko-mappers";
import { getSafeDemoPatientLabel } from "@/lib/cliniko-demo-appointments";
import { detectAppointmentCategory } from "@/lib/appointment-rules";
import type { DemoInsuranceCaseDetail } from "@/lib/demo-insurance-cases";
import { safeString } from "@/lib/safe-data";

export type InsuranceProvider =
  | "Aviva"
  | "Vitality"
  | "Bupa"
  | "AXA"
  | "WPA"
  | "Other"
  | "Unknown";

export type InsuranceCaseStatus =
  | "needs-details"
  | "ready"
  | "in-progress"
  | "sessions-used"
  | "needs-invoice"
  | "closed";

export type InsuranceSessionStatus =
  | "booked"
  | "attended"
  | "cancelled"
  | "did-not-attend"
  | "invoiced"
  | "not-invoiced";

export type InsuranceCase = {
  id: string;
  patientLabel: string;
  patientId?: string;
  insurer: InsuranceProvider;
  claimNumber?: string;
  authorisationNumber?: string;
  approvedSessions?: number;
  sessionsUsed: number;
  sessionsRemaining?: number;
  liabilityAccepted: boolean;
  invoiceStatus: "not-ready" | "ready-to-invoice" | "invoiced" | "part-invoiced";
  status: InsuranceCaseStatus;
  source: "cliniko-test" | "demo-case" | "inferred";
  missingFields: string[];
  sessions: InsuranceSession[];
  nextAction: string;
};

export type InsuranceSession = {
  appointmentId: string;
  startsAt: string | null;
  appointmentType: string;
  practitioner: string;
  status: InsuranceSessionStatus;
  invoiceStatus: "not-invoiced" | "invoiced" | "not-required";
  date?: string;
  time?: string;
};

export type InsuranceCaseSummary = {
  openCases: number;
  sessionsRemainingTotal: number | null;
  missingDetails: number;
  readyToInvoice: number;
};

const PROVIDER_KEYWORDS: { provider: InsuranceProvider; keywords: string[] }[] = [
  { provider: "Aviva", keywords: ["aviva"] },
  { provider: "Vitality", keywords: ["vitality"] },
  { provider: "Bupa", keywords: ["bupa"] },
  { provider: "AXA", keywords: ["axa", "axa ppp"] },
  { provider: "WPA", keywords: ["wpa"] },
];

const INSURANCE_APPOINTMENT_KEYWORDS = [
  "insurance",
  "aviva",
  "vitality",
  "claim",
  "authorisation",
  "authorised",
  "bupa",
  "axa",
  "wpa",
];

export function detectInsuranceProvider(text: string): InsuranceProvider {
  const lower = safeString(text).toLowerCase();
  for (const { provider, keywords } of PROVIDER_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) return provider;
  }
  if (/insurance/i.test(lower)) return "Other";
  return "Unknown";
}

export function isInsuranceAppointment(input: unknown): boolean {
  if (!input || typeof input !== "object") return false;
  const booking = input as MappedBooking;
  const typeName = safeString(booking.appointmentTypeName);
  const category = detectAppointmentCategory(typeName);
  if (category === "insurance-initial" || category === "insurance-follow-up") return true;
  if (booking.workstream === "insurance") return true;
  if (booking.insuranceContext?.likelyInsurance) return true;
  const lower = typeName.toLowerCase();
  return INSURANCE_APPOINTMENT_KEYWORDS.some((kw) => lower.includes(kw));
}

export function calculateSessionsRemaining(
  approved?: number,
  used?: number
): number | undefined {
  if (approved === undefined || approved === null || Number.isNaN(approved)) return undefined;
  const usedCount = used ?? 0;
  return Math.max(0, approved - usedCount);
}

function patientLabelFromBooking(booking: MappedBooking): string {
  return (
    getSafeDemoPatientLabel({
      patientName: booking.clientName,
      patientLabel: booking.clientName,
    }) || "DEMO patient"
  );
}

function sessionStatusForBooking(booking: MappedBooking): InsuranceSessionStatus {
  if (booking.isPast) return "attended";
  return "booked";
}

function sessionInvoiceStatus(
  booking: MappedBooking,
  caseInvoiceStatus: InsuranceCase["invoiceStatus"]
): InsuranceSession["invoiceStatus"] {
  if (caseInvoiceStatus === "invoiced") return "invoiced";
  if (booking.invoiceStatus === "paid" || booking.invoiceStatus === "submitted") return "invoiced";
  return "not-invoiced";
}

function mapSession(booking: MappedBooking, caseInvoiceStatus: InsuranceCase["invoiceStatus"]): InsuranceSession {
  return {
    appointmentId: booking.id,
    startsAt: booking.date && booking.time ? `${booking.date}T${booking.time}` : null,
    date: booking.date,
    time: booking.time,
    appointmentType: booking.appointmentTypeName || "Unknown appointment type",
    practitioner: booking.practitionerName || "Unknown practitioner",
    status: sessionStatusForBooking(booking),
    invoiceStatus: sessionInvoiceStatus(booking, caseInvoiceStatus),
  };
}

export function getInsuranceMissingFields(insuranceCase: InsuranceCase): string[] {
  const missing: string[] = [];
  if (insuranceCase.insurer === "Unknown") missing.push("Insurer");
  if (!insuranceCase.claimNumber?.trim()) missing.push("Claim number");
  if (!insuranceCase.authorisationNumber?.trim()) missing.push("Authorisation number");
  if (insuranceCase.approvedSessions === undefined) missing.push("Approved sessions");
  if (!insuranceCase.liabilityAccepted) missing.push("Patient liability agreement");
  if (insuranceCase.invoiceStatus === "not-ready") missing.push("Invoice details");
  return missing;
}

export function getInsuranceNextAction(insuranceCase: InsuranceCase): string {
  const missing = getInsuranceMissingFields(insuranceCase);
  if (missing.length > 0) {
    return `Add ${missing.slice(0, 2).join(", ")}${missing.length > 2 ? " and other details" : ""} before invoicing.`;
  }
  if (insuranceCase.invoiceStatus === "ready-to-invoice") {
    return "All required demo case details are present. Prepare insurer invoice.";
  }
  if (
    insuranceCase.approvedSessions !== undefined &&
    insuranceCase.sessionsRemaining === 0
  ) {
    return "Approved sessions used — review whether the case should be closed or re-authorised.";
  }
  if (insuranceCase.sessionsUsed > 0) {
    return "Session count check — confirm sessions used matches Cliniko appointments.";
  }
  return "Review insurance case details and upcoming appointments.";
}

function deriveCaseStatus(
  missing: string[],
  invoiceStatus: InsuranceCase["invoiceStatus"],
  sessionsRemaining?: number
): InsuranceCaseStatus {
  if (missing.length > 0) return "needs-details";
  if (invoiceStatus === "ready-to-invoice") return "needs-invoice";
  if (sessionsRemaining === 0) return "sessions-used";
  if (missing.length === 0) return "ready";
  return "in-progress";
}

function mergeDemoDetail(
  patientLabel: string,
  demoCaseDetails?: Record<string, DemoInsuranceCaseDetail>
): DemoInsuranceCaseDetail | undefined {
  if (!demoCaseDetails) return undefined;
  return demoCaseDetails[patientLabel];
}

function buildCaseForPatient(
  patientLabel: string,
  bookings: MappedBooking[],
  demoCaseDetails?: Record<string, DemoInsuranceCaseDetail>
): InsuranceCase {
  const demo = mergeDemoDetail(patientLabel, demoCaseDetails);
  const first = bookings[0];
  const inferredInsurer =
    demo?.insurer ??
    detectInsuranceProvider(
      bookings.map((b) => b.appointmentTypeName).join(" ") +
        " " +
        (first?.insuranceContext?.likelyInsurer ?? "")
    );

  const sessions = bookings
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""))
    .map((b) => mapSession(b, demo?.invoiceStatus ?? "not-ready"));

  const sessionsUsed = sessions.filter(
    (s) => s.status === "attended" || s.status === "invoiced"
  ).length;

  const approvedSessions = demo?.approvedSessions;
  const sessionsRemaining = calculateSessionsRemaining(approvedSessions, sessionsUsed);

  const invoiceStatus = demo?.invoiceStatus ?? "not-ready";
  const liabilityAccepted = demo?.liabilityAccepted ?? false;

  const draft: InsuranceCase = {
    id: `insurance-case-${patientLabel.replace(/\s+/g, "-").toLowerCase()}`,
    patientLabel,
    patientId: first?.clinikoId,
    insurer: inferredInsurer,
    claimNumber: demo?.claimNumber,
    authorisationNumber: demo?.authorisationNumber,
    approvedSessions,
    sessionsUsed,
    sessionsRemaining,
    liabilityAccepted,
    invoiceStatus,
    status: "in-progress",
    source: demo ? "demo-case" : first?.dataSource === "demo" ? "demo-case" : "inferred",
    missingFields: [],
    sessions,
    nextAction: "",
  };

  draft.missingFields = getInsuranceMissingFields(draft);
  draft.status = deriveCaseStatus(draft.missingFields, draft.invoiceStatus, draft.sessionsRemaining);
  draft.nextAction = getInsuranceNextAction(draft);

  if (demo && bookings.some((b) => b.dataSource === "cliniko-test" || b.dataSource === "cliniko")) {
    draft.source = "demo-case";
  } else if (bookings.some((b) => b.dataSource === "cliniko-test" || b.dataSource === "cliniko")) {
    draft.source = "cliniko-test";
  }

  return draft;
}

export function buildInsuranceCasesFromAppointments(
  appointments: MappedBooking[],
  demoCaseDetails?: Record<string, DemoInsuranceCaseDetail>
): InsuranceCase[] {
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const insuranceAppointments = safeAppointments.filter(isInsuranceAppointment);

  const byPatient = new Map<string, MappedBooking[]>();
  for (const booking of insuranceAppointments) {
    const label = patientLabelFromBooking(booking);
    const list = byPatient.get(label) ?? [];
    list.push(booking);
    byPatient.set(label, list);
  }

  for (const [patientLabel] of Object.entries(demoCaseDetails ?? {})) {
    if (!byPatient.has(patientLabel)) {
      byPatient.set(patientLabel, []);
    }
  }

  return [...byPatient.entries()].map(([label, bookings]) =>
    buildCaseForPatient(label, bookings, demoCaseDetails)
  );
}

export function summariseInsuranceCases(cases: InsuranceCase[]): InsuranceCaseSummary {
  const openCases = cases.filter((c) => c.status !== "closed").length;
  const withApproved = cases.filter((c) => c.approvedSessions !== undefined);
  const sessionsRemainingTotal =
    withApproved.length > 0
      ? withApproved.reduce((sum, c) => sum + (c.sessionsRemaining ?? 0), 0)
      : null;
  const missingDetails = cases.filter((c) => c.missingFields.length > 0).length;
  const readyToInvoice = cases.filter(
    (c) => c.invoiceStatus === "ready-to-invoice" && c.missingFields.length === 0
  ).length;

  return { openCases, sessionsRemainingTotal, missingDetails, readyToInvoice };
}

export function filterInsuranceCasesByTab(
  cases: InsuranceCase[],
  tab: "all" | "needs-details" | "ready-to-invoice" | "sessions-used"
): InsuranceCase[] {
  switch (tab) {
    case "needs-details":
      return cases.filter((c) => c.status === "needs-details" || c.missingFields.length > 0);
    case "ready-to-invoice":
      return cases.filter(
        (c) => c.invoiceStatus === "ready-to-invoice" && c.missingFields.length === 0
      );
    case "sessions-used":
      return cases.filter(
        (c) => c.sessionsRemaining === 0 && c.approvedSessions !== undefined
      );
    default:
      return cases;
  }
}

export function findInsuranceCaseForPatient(
  cases: InsuranceCase[],
  patientLabel: string
): InsuranceCase | undefined {
  return cases.find((c) => c.patientLabel === patientLabel);
}

export function findInsuranceCaseForAppointment(
  cases: InsuranceCase[],
  appointmentId: string
): InsuranceCase | undefined {
  return cases.find((c) => c.sessions.some((s) => s.appointmentId === appointmentId));
}

export type InsuranceWorkflowChip = {
  label: string;
  suggestedNextStep: string;
};

export function getInsuranceWorkflowChipsForCase(
  insuranceCase: InsuranceCase | undefined
): InsuranceWorkflowChip[] {
  if (!insuranceCase) {
    return [
      {
        label: "Insurance details missing",
        suggestedNextStep:
          "Add claim number, authorisation number and approved session count before invoicing.",
      },
    ];
  }

  const chips: InsuranceWorkflowChip[] = [];
  const missing = insuranceCase.missingFields;

  if (missing.includes("Authorisation number")) {
    chips.push({
      label: "Authorisation needed",
      suggestedNextStep: "Capture the authorisation number before further sessions are invoiced.",
    });
  }
  if (missing.includes("Approved sessions")) {
    chips.push({
      label: "Session count check",
      suggestedNextStep: "Approved sessions not captured yet — add the approved session count.",
    });
  }
  if (missing.length > 0) {
    chips.push({
      label: "Insurance details missing",
      suggestedNextStep:
        "Add claim number, authorisation number and approved session count before invoicing.",
    });
  } else if (insuranceCase.invoiceStatus === "ready-to-invoice") {
    chips.push({
      label: "Ready to invoice insurer",
      suggestedNextStep: "All required demo case details are present. Prepare insurer invoice.",
    });
  }
  if (
    insuranceCase.approvedSessions !== undefined &&
    insuranceCase.sessionsRemaining === 0
  ) {
    chips.push({
      label: "Approved sessions used",
      suggestedNextStep: "Review whether re-authorisation is needed for further treatment.",
    });
  }

  return chips.length > 0 ? chips : [];
}
