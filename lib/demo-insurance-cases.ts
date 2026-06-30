/**
 * DEMO-only insurance case details — not Cliniko or Healthcode data.
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

export const DEMO_INSURANCE_STORAGE_KEY = "tigers-eye-demo-insurance-cases-v1";

const DEMO_LABEL_PATTERN = /^DEMO\b/i;

export function isDemoPatientLabel(label: string): boolean {
  return DEMO_LABEL_PATTERN.test(label.trim());
}

export function loadDemoInsuranceCases(): Record<string, DemoInsuranceCaseDetail> {
  if (typeof window === "undefined") {
    return Object.fromEntries(
      DEFAULT_DEMO_INSURANCE_CASES.map((c) => [c.patientLabel, c])
    );
  }
  try {
    const raw = localStorage.getItem(DEMO_INSURANCE_STORAGE_KEY);
    if (!raw) {
      return Object.fromEntries(
        DEFAULT_DEMO_INSURANCE_CASES.map((c) => [c.patientLabel, c])
      );
    }
    const parsed = JSON.parse(raw) as Record<string, DemoInsuranceCaseDetail>;
    if (!parsed || typeof parsed !== "object") return {};
    const filtered: Record<string, DemoInsuranceCaseDetail> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (isDemoPatientLabel(key) && value?.patientLabel) {
        filtered[key] = value;
      }
    }
    return filtered;
  } catch {
    return {};
  }
}

export function saveDemoInsuranceCase(detail: DemoInsuranceCaseDetail): void {
  if (typeof window === "undefined") return;
  if (!isDemoPatientLabel(detail.patientLabel)) return;
  const existing = loadDemoInsuranceCases();
  existing[detail.patientLabel] = detail;
  localStorage.setItem(DEMO_INSURANCE_STORAGE_KEY, JSON.stringify(existing));
}

export function resetDemoInsuranceCases(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEMO_INSURANCE_STORAGE_KEY);
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
