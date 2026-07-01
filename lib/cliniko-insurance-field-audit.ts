/**
 * Insurance field storage audit — where each field lives today.
 */

export type InsuranceFieldStorage =
  | "cliniko"
  | "command-hub-demo"
  | "prepared-only"
  | "future-integration";

export interface InsuranceFieldAuditEntry {
  fieldName: string;
  currentStorage: InsuranceFieldStorage;
  canWriteToClinikoNow: boolean;
  clinikoTarget?: string;
  reason: string;
  recommendedNextStep: string;
  displayLabel: string;
}

export const INSURANCE_FIELD_AUDIT: InsuranceFieldAuditEntry[] = [
  {
    fieldName: "insuranceProvider",
    displayLabel: "Insurance provider",
    currentStorage: "command-hub-demo",
    canWriteToClinikoNow: false,
    clinikoTarget: "custom_fields (not wired)",
    reason:
      "Insurer name is stored in the Command Hub demo case (server-persisted workflow store). Cliniko custom fields are not wired in this integration.",
    recommendedNextStep:
      "Configure Cliniko custom fields for insurer capture, or integrate Healthcode when ready.",
  },
  {
    fieldName: "policyNumber",
    displayLabel: "Policy/member number",
    currentStorage: "command-hub-demo",
    canWriteToClinikoNow: false,
    clinikoTarget: "custom_fields (not wired)",
    reason:
      "Policy numbers are Command Hub demo case only — not written to or read from Cliniko.",
    recommendedNextStep: "Add Cliniko custom field mapping when George confirms field setup.",
  },
  {
    fieldName: "claimNumber",
    displayLabel: "Claim number",
    currentStorage: "command-hub-demo",
    canWriteToClinikoNow: false,
    reason: "Claim numbers live in Command Hub demo case — not Cliniko.",
    recommendedNextStep: "Future Healthcode integration for claim submission.",
  },
  {
    fieldName: "authorisationNumber",
    displayLabel: "Authorisation number",
    currentStorage: "command-hub-demo",
    canWriteToClinikoNow: false,
    reason: "Authorisation stored in Command Hub demo case only.",
    recommendedNextStep: "Cliniko custom field or Healthcode when workflow confirmed.",
  },
  {
    fieldName: "approvedSessions",
    displayLabel: "Approved sessions",
    currentStorage: "command-hub-demo",
    canWriteToClinikoNow: false,
    reason: "Session approval counts are calculated in Command Hub from demo case input.",
    recommendedNextStep: "Cliniko custom fields for session tracking if required.",
  },
  {
    fieldName: "sessionsUsed",
    displayLabel: "Sessions used",
    currentStorage: "command-hub-demo",
    canWriteToClinikoNow: false,
    reason: "Derived from demo appointments + demo case — not stored in Cliniko.",
    recommendedNextStep: "Keep as workflow calculation until Cliniko fields exist.",
  },
  {
    fieldName: "sessionsRemaining",
    displayLabel: "Sessions remaining",
    currentStorage: "command-hub-demo",
    canWriteToClinikoNow: false,
    reason: "Calculated by Command Hub — not a Cliniko field today.",
    recommendedNextStep: "Display-only workflow metric until Cliniko capture exists.",
  },
  {
    fieldName: "liabilityAgreement",
    displayLabel: "Patient liability agreement",
    currentStorage: "command-hub-demo",
    canWriteToClinikoNow: false,
    reason: "Liability flag is Command Hub demo case (server-side workflow state) — not written to Cliniko.",
    recommendedNextStep: "Staff confirmation workflow; optional Cliniko patient notes later.",
  },
  {
    fieldName: "invoiceReadiness",
    displayLabel: "Invoice readiness",
    currentStorage: "prepared-only",
    canWriteToClinikoNow: false,
    reason: "Workflow suggestion only — invoice drafts are prepared in Command Hub.",
    recommendedNextStep: "Future Xero integration for invoice posting.",
  },
  {
    fieldName: "invoiceHistory",
    displayLabel: "Invoice history",
    currentStorage: "future-integration",
    canWriteToClinikoNow: false,
    reason: "Not connected — Xero/Healthcode remain future integrations.",
    recommendedNextStep: "Connect Xero for invoice history and Healthcode for insurer submission.",
  },
  {
    fieldName: "patientAndAppointment",
    displayLabel: "Patient and appointment",
    currentStorage: "cliniko",
    canWriteToClinikoNow: true,
    clinikoTarget: "patients + individual_appointments",
    reason: "DEMO patients and appointments can be saved to the Cliniko test account when writes are enabled.",
    recommendedNextStep: "Use intake and appointment records to confirm DEMO linkage before notes/invoices.",
  },
];

export function getInsuranceFieldsByStorage(
  storage: InsuranceFieldStorage
): InsuranceFieldAuditEntry[] {
  return INSURANCE_FIELD_AUDIT.filter((f) => f.currentStorage === storage);
}

export function insuranceStorageLabel(storage: InsuranceFieldStorage): string {
  switch (storage) {
    case "cliniko":
      return "Saved to Cliniko test account";
    case "command-hub-demo":
      return "Command Hub demo case";
    case "prepared-only":
      return "Prepared for Cliniko";
    case "future-integration":
      return "Future integration";
  }
}
