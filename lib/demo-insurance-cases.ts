/**
 * DEMO insurance case details — persisted in Command Hub workflow store (server-side).
 */

import type { InsuranceProvider } from "@/lib/insurance-session-workflow";

export type DemoInsuranceCaseDetail = {
  patientLabel: string;
  insurer: InsuranceProvider;
  claimNumber?: string;
  authorisationNumber?: string;
  approvedSessions?: number;
  liabilityAccepted: boolean;
  invoiceStatus: "not-ready" | "ready-to-invoice" | "invoiced" | "part-invoiced";
};

export const DEFAULT_DEMO_INSURANCE_CASES: DemoInsuranceCaseDetail[] = [
  {
    patientLabel: "DEMO Test Patient 001",
    insurer: "Aviva",
    claimNumber: "DEMO-CLAIM-001",
    authorisationNumber: "DEMO-AUTH-001",
    approvedSessions: 6,
    liabilityAccepted: true,
    invoiceStatus: "ready-to-invoice",
  },
  {
    patientLabel: "DEMO Sarah McKay",
    insurer: "Aviva",
    claimNumber: "DEMO-CLAIM-AVIVA-001",
    authorisationNumber: "DEMO-AUTH-AVIVA-001",
    approvedSessions: 6,
    liabilityAccepted: true,
    invoiceStatus: "ready-to-invoice",
  },
  {
    patientLabel: "DEMO Jamie Ross",
    insurer: "Vitality",
    claimNumber: "DEMO-CLAIM-VIT-002",
    approvedSessions: 4,
    liabilityAccepted: true,
    invoiceStatus: "not-ready",
  },
  {
    patientLabel: "DEMO Fiona Stewart",
    insurer: "Bupa",
    claimNumber: "DEMO-CLAIM-BUPA-010",
    liabilityAccepted: false,
    invoiceStatus: "not-ready",
  },
  {
    patientLabel: "DEMO Callum Reid",
    insurer: "Aviva",
    claimNumber: "DEMO-CLAIM-AVIVA-011",
    authorisationNumber: "DEMO-AUTH-AVIVA-011",
    approvedSessions: 6,
    liabilityAccepted: true,
    invoiceStatus: "ready-to-invoice",
  },
];

/** @deprecated Server store is source of truth — use useCommandHubWorkflow().insuranceCases */
export const DEMO_INSURANCE_STORAGE_KEY = "tigers-eye-demo-insurance-cases-v1";

const DEMO_LABEL_PATTERN = /^DEMO\b/i;

export function isDemoPatientLabel(label: string): boolean {
  return DEMO_LABEL_PATTERN.test(label.trim());
}

/** Defaults only — live data from workflow provider / API */
export function getDefaultDemoInsuranceCases(): Record<string, DemoInsuranceCaseDetail> {
  return Object.fromEntries(DEFAULT_DEMO_INSURANCE_CASES.map((c) => [c.patientLabel, c]));
}

export function getDemoPatientOptions(appointmentLabels: string[]): string[] {
  const labels = new Set<string>();
  for (const label of appointmentLabels) {
    if (isDemoPatientLabel(label)) labels.add(label);
  }
  for (const c of DEFAULT_DEMO_INSURANCE_CASES) {
    labels.add(c.patientLabel);
  }
  return [...labels].sort();
}
