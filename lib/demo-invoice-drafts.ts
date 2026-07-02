/**
 * DEMO insurance invoice draft seeds — supplemental metadata for export packs.
 * Merged with live insurance cases; not a substitute for Cliniko patient records.
 */

import { isDemoPatientLabel } from "@/lib/demo-insurance-cases";

/** Demo insurer session line amount when Cliniko appointment fee is £0. */
export const DEMO_INSURANCE_SESSION_INVOICE_AMOUNT = 55;

export type DemoInsuranceInvoiceDraftSeed = {
  patientLabel: string;
  policyNumber?: string;
  amountPerSession: number;
  /** Optional override when case sessions differ from attended-not-invoiced count. */
  sessionsToInvoiceOverride?: number;
  honestyNote?: string;
};

export const DEFAULT_DEMO_INSURANCE_INVOICE_DRAFT_SEEDS: DemoInsuranceInvoiceDraftSeed[] = [
  {
    patientLabel: "DEMO Test Patient 001",
    policyNumber: "DEMO-POL-001",
    amountPerSession: DEMO_INSURANCE_SESSION_INVOICE_AMOUNT,
    sessionsToInvoiceOverride: 1,
  },
  {
    patientLabel: "DEMO Sarah McKay",
    policyNumber: "DEMO-POL-AVIVA-001",
    amountPerSession: DEMO_INSURANCE_SESSION_INVOICE_AMOUNT,
    sessionsToInvoiceOverride: 1,
    honestyNote:
      "Prepared in Command Hub for DEMO review — not submitted to Aviva or posted to Xero.",
  },
  {
    patientLabel: "DEMO Jamie Ross",
    policyNumber: "DEMO-POL-VIT-002",
    amountPerSession: DEMO_INSURANCE_SESSION_INVOICE_AMOUNT,
    honestyNote:
      "Authorisation missing — invoice export blocked until DEMO case details are complete.",
  },
  {
    patientLabel: "DEMO Fiona Stewart",
    policyNumber: "DEMO-POL-BUPA-010",
    amountPerSession: DEMO_INSURANCE_SESSION_INVOICE_AMOUNT,
    honestyNote:
      "Patient liability not accepted — complete DEMO case checklist before invoicing.",
  },
  {
    patientLabel: "DEMO Callum Reid",
    policyNumber: "DEMO-POL-AVIVA-011",
    amountPerSession: DEMO_INSURANCE_SESSION_INVOICE_AMOUNT,
    sessionsToInvoiceOverride: 1,
    honestyNote:
      "Approved sessions used — re-authorisation may be needed before further insurer invoices.",
  },
];

export function getDemoInvoiceDraftSeedsByPatient(): Record<string, DemoInsuranceInvoiceDraftSeed> {
  return Object.fromEntries(
    DEFAULT_DEMO_INSURANCE_INVOICE_DRAFT_SEEDS.map((seed) => [seed.patientLabel, seed])
  );
}

export function getDemoInvoiceDraftSeed(patientLabel: string): DemoInsuranceInvoiceDraftSeed | undefined {
  if (!isDemoPatientLabel(patientLabel)) return undefined;
  return getDemoInvoiceDraftSeedsByPatient()[patientLabel];
}
