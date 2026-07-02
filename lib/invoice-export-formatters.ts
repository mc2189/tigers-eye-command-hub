import type { InsuranceInvoiceDraft } from "@/lib/invoice-draft-types";
import { INVOICE_HONESTY_FOOTER } from "@/lib/invoice-defaults";

export function formatInvoiceSummaryText(draft: InsuranceInvoiceDraft): string {
  return [
    INVOICE_HONESTY_FOOTER,
    `Invoice ref: ${draft.invoiceRef}`,
    `Patient label: ${draft.patientLabel}`,
    `Insurer: ${draft.insurer}`,
    `Sessions to invoice: ${draft.sessionsToInvoice}`,
    `Total: £${draft.totalAmount.toFixed(2)}`,
    draft.suggestedNextStep,
  ].join("\n");
}

export function formatInvoiceDetailsText(draft: InsuranceInvoiceDraft): string {
  return draft.exportPack.plainText;
}

export function formatSessionTableText(draft: InsuranceInvoiceDraft): string {
  const header = [
    INVOICE_HONESTY_FOOTER,
    "Session table",
    "Session,Date,Time,Type,Practitioner,Status,Included,Amount",
  ];
  const rows = draft.sessionLines.map((line) =>
    [
      line.sessionNumber,
      line.treatmentDate,
      line.treatmentTime ?? "",
      line.appointmentType,
      line.practitioner,
      line.status,
      line.includedOnInvoice ? "yes" : "no",
      line.amount.toFixed(2),
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [...header, ...rows].join("\n");
}

export function formatInvoiceDraftCsv(draft: InsuranceInvoiceDraft): string {
  const lines: string[] = [
    INVOICE_HONESTY_FOOTER,
    "field,value",
    `invoiceRef,${csvCell(draft.invoiceRef)}`,
    `patientLabel,${csvCell(draft.patientLabel)}`,
    `insurer,${csvCell(draft.insurer)}`,
    `policyNumber,${csvCell(draft.policyNumber ?? "")}`,
    `claimNumber,${csvCell(draft.claimNumber ?? "")}`,
    `authorisationNumber,${csvCell(draft.authorisationNumber ?? "")}`,
    `approvedSessions,${csvCell(draft.approvedSessions ?? "")}`,
    `sessionsUsed,${csvCell(draft.sessionsUsed)}`,
    `sessionsRemaining,${csvCell(draft.sessionsRemaining ?? "")}`,
    `sessionsToInvoice,${csvCell(draft.sessionsToInvoice)}`,
    `amountPerSession,${csvCell(draft.amountPerSession.toFixed(2))}`,
    `totalAmount,${csvCell(draft.totalAmount.toFixed(2))}`,
    `draftStatus,${csvCell(draft.draftStatus)}`,
    `missingFields,${csvCell(draft.missingFields.join("; "))}`,
    "",
    "sessionNumber,treatmentDate,treatmentTime,appointmentType,practitioner,status,includedOnInvoice,amount",
  ];

  for (const line of draft.sessionLines) {
    lines.push(
      [
        line.sessionNumber,
        csvCell(line.treatmentDate),
        csvCell(line.treatmentTime ?? ""),
        csvCell(line.appointmentType),
        csvCell(line.practitioner),
        csvCell(line.status),
        line.includedOnInvoice ? "yes" : "no",
        line.amount.toFixed(2),
      ].join(",")
    );
  }

  return lines.join("\n");
}

function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function formatInvoiceDraftJson(draft: InsuranceInvoiceDraft): string {
  const payload = {
    label: INVOICE_HONESTY_FOOTER,
    generatedAt: draft.exportPack.generatedAt,
    invoiceRef: draft.invoiceRef,
    patientLabel: draft.patientLabel,
    insurer: draft.insurer,
    policyNumber: draft.policyNumber,
    claimNumber: draft.claimNumber,
    authorisationNumber: draft.authorisationNumber,
    approvedSessions: draft.approvedSessions,
    sessionsUsed: draft.sessionsUsed,
    sessionsRemaining: draft.sessionsRemaining,
    sessionsToInvoice: draft.sessionsToInvoice,
    liabilityAccepted: draft.liabilityAccepted,
    amountPerSession: draft.amountPerSession,
    totalAmount: draft.totalAmount,
    currency: draft.currency,
    draftStatus: draft.draftStatus,
    missingFields: draft.missingFields,
    suggestedNextStep: draft.suggestedNextStep,
    honestyNote: draft.honestyNote,
    sessionLines: draft.sessionLines,
    readiness: draft.readiness,
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  return false;
}
