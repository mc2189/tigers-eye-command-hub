/**
 * Insurance invoice draft and export-pack types.
 * Command Hub operational metadata only — not clinical records or insurer submissions.
 */

import type { DemoRecordStatus } from "@/lib/demo-clinic-week";
import type { InsuranceProvider } from "@/lib/insurance-session-workflow";

/** Workflow readiness for insurance invoice preparation (not Xero/Healthcode posting). */
export type InsuranceInvoiceDraftStatus =
  | "blocked"
  | "draft"
  | "ready-to-export"
  | "prepared"
  | "part-invoiced"
  | "invoiced";

export type InsuranceInvoiceRecordStatus =
  | "command-hub-demo-case"
  | "prepared-for-cliniko"
  | "not-prepared";

export type InsuranceInvoiceSessionLineStatus =
  | "attended"
  | "booked"
  | "cancelled"
  | "did-not-attend"
  | "invoiced";

/** One billable or trackable insurance session line on the draft. */
export type InsuranceInvoiceSessionLine = {
  sessionNumber: number;
  appointmentId?: string;
  treatmentDate: string;
  treatmentTime?: string;
  appointmentType: string;
  practitioner: string;
  status: InsuranceInvoiceSessionLineStatus;
  amount: number;
  includedOnInvoice: boolean;
};

export type InsuranceInvoiceDraftReadiness = {
  readyToExport: boolean;
  readyToInvoice: boolean;
  missingFields: string[];
  blockers: string[];
  warnings: string[];
};

export type InsuranceInvoiceExportSectionId =
  | "summary"
  | "insurer"
  | "sessions"
  | "amounts"
  | "missing"
  | "honesty";

export type InsuranceInvoiceExportSection = {
  id: InsuranceInvoiceExportSectionId;
  heading: string;
  lines: string[];
};

/** Copy/export pack for staff — plain text sections, not an external submission. */
export type InsuranceInvoiceExportPack = {
  title: string;
  generatedAt: string;
  invoiceRef: string;
  sections: InsuranceInvoiceExportSection[];
  plainText: string;
};

/**
 * Insurance invoice draft — derived from insurance cases and DEMO workflow metadata.
 * Does not duplicate full patient demographics or treatment note bodies.
 */
export type InsuranceInvoiceDraft = {
  id: string;
  patientLabel: string;
  patientId?: string;
  insurer: InsuranceProvider;
  policyNumber?: string;
  claimNumber?: string;
  authorisationNumber?: string;
  approvedSessions?: number;
  sessionsUsed: number;
  sessionsRemaining?: number;
  sessionsToInvoice: number;
  liabilityAccepted: boolean;
  invoiceRef: string;
  draftStatus: InsuranceInvoiceDraftStatus;
  recordStatus: InsuranceInvoiceRecordStatus;
  /** Per-session insurer invoice amount (demo default when Cliniko fee is £0). */
  amountPerSession: number;
  totalAmount: number;
  currency: "GBP";
  sessionLines: InsuranceInvoiceSessionLine[];
  missingFields: string[];
  suggestedNextStep: string;
  readiness: InsuranceInvoiceDraftReadiness;
  /** Clarifies Command Hub prepared vs posted elsewhere. */
  honestyNote: string;
  exportPack: InsuranceInvoiceExportPack;
  source: "demo-case" | "cliniko-test" | "inferred" | "demo-clinic-week";
  /** Mirrors demo clinic week record status when built from a scenario. */
  scenarioRecordStatus?: DemoRecordStatus;
  invoicePrepared?: boolean;
};

export type BuildInsuranceInvoiceDraftOptions = {
  businessName?: string;
  invoicePrepared?: boolean;
  /** Override per-session amount (defaults to demo insurance session fee). */
  amountPerSession?: number;
};
