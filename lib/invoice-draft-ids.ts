import type { InsuranceCase } from "@/lib/insurance-session-workflow";

/** Stable smoke/demo route for Aviva insurance invoice (DEMO Sarah McKay). */
export const DEMO_AVIVA_INVOICE_DRAFT_ID = "demo-aviva";

const AVIVA_DEMO_PATIENT_LABEL = "DEMO Sarah McKay";

export function getStableInvoiceDraftId(insuranceCase: InsuranceCase): string {
  if (insuranceCase.patientLabel === AVIVA_DEMO_PATIENT_LABEL) {
    return DEMO_AVIVA_INVOICE_DRAFT_ID;
  }
  return insuranceCase.id.replace(/^insurance-case-/, "invoice-");
}

export function invoiceDraftDetailPath(draftId: string): string {
  return `/admin/invoices/${encodeURIComponent(draftId)}`;
}
