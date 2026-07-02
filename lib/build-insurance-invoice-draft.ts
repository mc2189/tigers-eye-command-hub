import type { DemoInvoiceDraft, DemoClinicWeekScenario } from "@/lib/demo-clinic-week";
import type { DemoInsuranceCaseDetail } from "@/lib/demo-insurance-cases";
import {
  DEMO_INSURANCE_SESSION_INVOICE_AMOUNT,
  getDemoInvoiceDraftSeed,
  type DemoInsuranceInvoiceDraftSeed,
} from "@/lib/demo-invoice-drafts";
import type {
  BuildInsuranceInvoiceDraftOptions,
  InsuranceInvoiceDraft,
  InsuranceInvoiceDraftReadiness,
  InsuranceInvoiceDraftStatus,
  InsuranceInvoiceExportPack,
  InsuranceInvoiceExportSection,
  InsuranceInvoiceRecordStatus,
  InsuranceInvoiceSessionLine,
  InsuranceInvoiceSessionLineStatus,
} from "@/lib/invoice-draft-types";
import type { InsuranceCase, InsuranceSession } from "@/lib/insurance-session-workflow";
import { getInsuranceMissingFields } from "@/lib/insurance-session-workflow";

const DEFAULT_BUSINESS_NAME = "Tigers Eye Physiotherapy and Massage";

function mapSessionStatus(status: InsuranceSession["status"]): InsuranceInvoiceSessionLineStatus {
  if (status === "invoiced") return "invoiced";
  if (status === "did-not-attend") return "did-not-attend";
  if (status === "cancelled") return "cancelled";
  if (status === "booked") return "booked";
  return "attended";
}

function formatTreatmentDate(session: InsuranceSession): string {
  if (session.date?.trim()) return session.date;
  if (session.startsAt) {
    const parsed = session.startsAt.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) return parsed;
  }
  return "Date not returned";
}

function sessionsToInvoiceCount(
  insuranceCase: InsuranceCase,
  override?: number
): number {
  if (override !== undefined) return Math.max(0, override);
  const billable = insuranceCase.sessions.filter(
    (s) =>
      (s.status === "attended" || s.status === "not-invoiced") &&
      s.invoiceStatus !== "invoiced"
  );
  if (billable.length > 0) return billable.length;
  if (insuranceCase.invoiceStatus === "ready-to-invoice") return 1;
  return 0;
}

function buildSessionLines(
  insuranceCase: InsuranceCase,
  amountPerSession: number,
  sessionsToInvoice: number
): InsuranceInvoiceSessionLine[] {
  const candidates = insuranceCase.sessions.filter(
    (s) => s.status !== "cancelled" && s.invoiceStatus !== "invoiced"
  );

  const attended = candidates.filter((s) => s.status === "attended" || s.status === "not-invoiced");
  const source = attended.length > 0 ? attended : candidates;

  let includedRemaining = sessionsToInvoice;

  return source.map((session, index) => {
    const includedOnInvoice =
      includedRemaining > 0 &&
      (session.status === "attended" ||
        session.status === "not-invoiced" ||
        session.invoiceStatus === "not-invoiced");

    if (includedOnInvoice) includedRemaining -= 1;

    return {
      sessionNumber: index + 1,
      appointmentId: session.appointmentId,
      treatmentDate: formatTreatmentDate(session),
      treatmentTime: session.time,
      appointmentType: session.appointmentType,
      practitioner: session.practitioner,
      status: mapSessionStatus(session.status),
      amount: amountPerSession,
      includedOnInvoice,
    };
  });
}

function deriveDraftStatus(
  missingFields: string[],
  invoiceStatus: InsuranceCase["invoiceStatus"],
  invoicePrepared?: boolean
): InsuranceInvoiceDraftStatus {
  if (missingFields.length > 0) return "blocked";
  if (invoiceStatus === "invoiced") return "invoiced";
  if (invoiceStatus === "part-invoiced") return "part-invoiced";
  if (invoicePrepared) return "prepared";
  if (invoiceStatus === "ready-to-invoice") return "ready-to-export";
  return "draft";
}

function deriveRecordStatus(invoicePrepared?: boolean): InsuranceInvoiceRecordStatus {
  if (invoicePrepared) return "command-hub-demo-case";
  return "not-prepared";
}

function buildReadiness(
  missingFields: string[],
  draftStatus: InsuranceInvoiceDraftStatus,
  sessionsToInvoice: number
): InsuranceInvoiceDraftReadiness {
  const blockers = [...missingFields];
  const warnings: string[] = [];

  if (sessionsToInvoice === 0 && draftStatus !== "invoiced") {
    warnings.push("No attended sessions marked for invoicing yet.");
  }

  warnings.push("Not connected to Xero or Healthcode — export is for staff copy/review only.");

  const readyToInvoice =
    missingFields.length === 0 && insuranceInvoiceStatusAllowsExport(draftStatus);
  const readyToExport = readyToInvoice && sessionsToInvoice > 0;

  return {
    readyToExport,
    readyToInvoice,
    missingFields,
    blockers,
    warnings,
  };
}

function insuranceInvoiceStatusAllowsExport(status: InsuranceInvoiceDraftStatus): boolean {
  return status === "ready-to-export" || status === "prepared" || status === "part-invoiced";
}

function buildInvoiceRef(patientLabel: string): string {
  const year = new Date().getFullYear();
  const slug = patientLabel
    .replace(/^DEMO\s+/i, "")
    .replace(/[^a-z0-9]+/gi, "")
    .slice(0, 8)
    .toUpperCase();
  return `TE-${year}-DEMO-${slug || "CASE"}`;
}

function defaultHonestyNote(draftStatus: InsuranceInvoiceDraftStatus): string {
  if (draftStatus === "blocked") {
    return "Command Hub demo case — complete missing insurer fields before exporting an invoice pack.";
  }
  if (draftStatus === "invoiced") {
    return "Demo case marked invoiced in Command Hub workflow — not a real insurer submission.";
  }
  return "Prepared in Command Hub for staff review — not posted to Xero, Healthcode or the insurer.";
}

export function buildInsuranceInvoiceExportPack(
  draft: Pick<
    InsuranceInvoiceDraft,
    | "invoiceRef"
    | "patientLabel"
    | "insurer"
    | "policyNumber"
    | "claimNumber"
    | "authorisationNumber"
    | "approvedSessions"
    | "sessionsUsed"
    | "sessionsRemaining"
    | "sessionsToInvoice"
    | "sessionLines"
    | "amountPerSession"
    | "totalAmount"
    | "currency"
    | "missingFields"
    | "suggestedNextStep"
    | "honestyNote"
    | "readiness"
  >,
  businessName = DEFAULT_BUSINESS_NAME
): InsuranceInvoiceExportPack {
  const generatedAt = new Date().toISOString();

  const sections: InsuranceInvoiceExportSection[] = [
    {
      id: "summary",
      heading: "Insurance invoice preparation pack",
      lines: [
        `Business: ${businessName}`,
        `Patient label: ${draft.patientLabel}`,
        `Invoice ref: ${draft.invoiceRef}`,
        `Status: ${draft.readiness.readyToExport ? "Ready to export" : "Not ready to export"}`,
        draft.suggestedNextStep,
      ],
    },
    {
      id: "insurer",
      heading: "Insurer details",
      lines: [
        `Insurer: ${draft.insurer}`,
        `Policy number: ${draft.policyNumber ?? "—"}`,
        `Claim number: ${draft.claimNumber ?? "—"}`,
        `Authorisation number: ${draft.authorisationNumber ?? "—"}`,
        `Approved sessions: ${draft.approvedSessions ?? "—"}`,
        `Sessions used: ${draft.sessionsUsed}`,
        `Sessions remaining: ${draft.sessionsRemaining ?? "—"}`,
      ],
    },
    {
      id: "sessions",
      heading: "Sessions on this invoice pack",
      lines:
        draft.sessionLines.length > 0
          ? draft.sessionLines.flatMap((line) => [
              `Session ${line.sessionNumber}: ${line.treatmentDate}${line.treatmentTime ? ` ${line.treatmentTime}` : ""} — ${line.appointmentType}`,
              `  Practitioner: ${line.practitioner} · Status: ${line.status}${
                line.includedOnInvoice ? " · Included on invoice" : ""
              }`,
            ])
          : ["No session lines available — link insurance appointments in Cliniko or demo week."],
    },
    {
      id: "amounts",
      heading: "Amounts (demo)",
      lines: [
        `Sessions to invoice: ${draft.sessionsToInvoice}`,
        `Amount per session: £${draft.amountPerSession.toFixed(2)}`,
        `Total: £${draft.totalAmount.toFixed(2)} ${draft.currency}`,
      ],
    },
    {
      id: "missing",
      heading: "Missing fields and blockers",
      lines:
        draft.missingFields.length > 0
          ? draft.missingFields.map((field) => `Missing: ${field}`)
          : ["All required demo insurer fields are present."],
    },
    {
      id: "honesty",
      heading: "Command Hub honesty note",
      lines: [draft.honestyNote, ...draft.readiness.warnings],
    },
  ];

  const plainText = sections
    .map((section) => [section.heading, ...section.lines.map((line) => `  ${line}`)].join("\n"))
    .join("\n\n");

  return {
    title: `Insurance invoice pack — ${draft.patientLabel}`,
    generatedAt,
    invoiceRef: draft.invoiceRef,
    sections,
    plainText,
  };
}

export type BuildInsuranceInvoiceDraftInput = {
  insuranceCase: InsuranceCase;
  demoCaseDetail?: DemoInsuranceCaseDetail;
  demoSeed?: DemoInsuranceInvoiceDraftSeed;
  scenarioInvoiceDraft?: DemoInvoiceDraft;
  scenarioRecordStatus?: DemoClinicWeekScenario["invoiceDraft"]["status"];
  options?: BuildInsuranceInvoiceDraftOptions;
};

export function buildInsuranceInvoiceDraft(
  input: BuildInsuranceInvoiceDraftInput
): InsuranceInvoiceDraft {
  const { insuranceCase, demoCaseDetail, demoSeed, scenarioInvoiceDraft, options } = input;
  const seed = demoSeed ?? getDemoInvoiceDraftSeed(insuranceCase.patientLabel);

  const policyNumber = scenarioInvoiceDraft?.policyNumber ?? seed?.policyNumber;
  const claimNumber =
    demoCaseDetail?.claimNumber ?? insuranceCase.claimNumber ?? scenarioInvoiceDraft?.claimNumber;
  const authorisationNumber =
    demoCaseDetail?.authorisationNumber ??
    insuranceCase.authorisationNumber ??
    scenarioInvoiceDraft?.authorisationNumber;
  const approvedSessions =
    demoCaseDetail?.approvedSessions ??
    insuranceCase.approvedSessions ??
    scenarioInvoiceDraft?.approvedSessions;
  const liabilityAccepted =
    demoCaseDetail?.liabilityAccepted ?? insuranceCase.liabilityAccepted;

  const amountPerSession =
    options?.amountPerSession ??
    seed?.amountPerSession ??
    scenarioInvoiceDraft?.amount ??
    DEMO_INSURANCE_SESSION_INVOICE_AMOUNT;

  const sessionsToInvoice = sessionsToInvoiceCount(
    insuranceCase,
    seed?.sessionsToInvoiceOverride ?? scenarioInvoiceDraft?.sessionsToInvoice
  );

  const mergedCase: InsuranceCase = {
    ...insuranceCase,
    claimNumber,
    authorisationNumber,
    approvedSessions,
    liabilityAccepted,
    invoiceStatus: demoCaseDetail?.invoiceStatus ?? insuranceCase.invoiceStatus,
  };

  const missingFields = [
    ...getInsuranceMissingFields(mergedCase),
    ...(scenarioInvoiceDraft?.missingDetails ?? []),
  ].filter((field, index, all) => all.indexOf(field) === index);

  const draftStatus = deriveDraftStatus(
    missingFields,
    insuranceCase.invoiceStatus,
    options?.invoicePrepared
  );
  const recordStatus = deriveRecordStatus(options?.invoicePrepared);
  const sessionLines = buildSessionLines(insuranceCase, amountPerSession, sessionsToInvoice);
  const totalAmount = sessionsToInvoice * amountPerSession;

  const suggestedNextStep =
    scenarioInvoiceDraft?.suggestedNextStep ??
    (missingFields.length > 0
      ? `Add ${missingFields.slice(0, 2).join(", ")} before exporting the invoice pack.`
      : sessionsToInvoice > 0
        ? "Insurance case is ready to invoice — review sessions and export the preparation pack."
        : insuranceCase.nextAction);

  const honestyNote =
    seed?.honestyNote ??
    (scenarioInvoiceDraft?.missingDetails?.length
      ? `Missing: ${scenarioInvoiceDraft.missingDetails.join(", ")} — Command Hub demo case only.`
      : defaultHonestyNote(draftStatus));

  const readiness = buildReadiness(missingFields, draftStatus, sessionsToInvoice);

  const draft: InsuranceInvoiceDraft = {
    id: `invoice-draft-${insuranceCase.id}`,
    patientLabel: insuranceCase.patientLabel,
    patientId: insuranceCase.patientId,
    insurer: insuranceCase.insurer,
    policyNumber,
    claimNumber,
    authorisationNumber,
    approvedSessions,
    sessionsUsed: insuranceCase.sessionsUsed,
    sessionsRemaining: insuranceCase.sessionsRemaining,
    sessionsToInvoice,
    liabilityAccepted,
    invoiceRef: buildInvoiceRef(insuranceCase.patientLabel),
    draftStatus,
    recordStatus,
    amountPerSession,
    totalAmount,
    currency: "GBP",
    sessionLines,
    missingFields,
    suggestedNextStep,
    readiness,
    honestyNote,
    exportPack: { title: "", generatedAt: "", invoiceRef: "", sections: [], plainText: "" },
    source: insuranceCase.source,
    scenarioRecordStatus: input.scenarioRecordStatus ?? scenarioInvoiceDraft?.status,
    invoicePrepared: options?.invoicePrepared,
  };

  draft.exportPack = buildInsuranceInvoiceExportPack(draft, options?.businessName);

  return draft;
}

export function buildInsuranceInvoiceDraftFromCase(
  insuranceCase: InsuranceCase,
  options?: BuildInsuranceInvoiceDraftOptions & {
    demoCaseDetail?: DemoInsuranceCaseDetail;
    scenario?: Pick<DemoClinicWeekScenario, "invoiceDraft">;
  }
): InsuranceInvoiceDraft {
  return buildInsuranceInvoiceDraft({
    insuranceCase,
    demoCaseDetail: options?.demoCaseDetail,
    scenarioInvoiceDraft: options?.scenario?.invoiceDraft,
    scenarioRecordStatus: options?.scenario?.invoiceDraft.status,
    options,
  });
}
