/**
 * Cliniko-first storage boundary — field classification registry.
 * Clinical truth in Cliniko; operational workflow state in Command Hub only.
 */

export type StorageBoundaryClassification =
  | "cliniko-source-of-truth"
  | "command-hub-workflow-state"
  | "command-hub-sensitive-admin-demo"
  | "prepared-for-cliniko"
  | "future-integration"
  | "forbidden";

export interface StorageBoundaryFieldPolicy {
  fieldKey: string;
  label: string;
  classification: StorageBoundaryClassification;
  allowedInWorkflowStore: boolean;
  allowedInBrowserStorage: boolean;
  allowedInClinikoWrite: boolean;
  reason: string;
}

export const STORAGE_BOUNDARY_ONE_LINER =
  "Clinical truth in Cliniko; operational workflow state in Command Hub; no duplicate patient database.";

export const STORAGE_BOUNDARY_FIELD_POLICIES: StorageBoundaryFieldPolicy[] = [
  {
    fieldKey: "clinikoPatientId",
    label: "Cliniko patient ID",
    classification: "command-hub-workflow-state",
    allowedInWorkflowStore: true,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: true,
    reason: "ID reference only — patient record lives in Cliniko.",
  },
  {
    fieldKey: "clinikoAppointmentId",
    label: "Cliniko appointment ID",
    classification: "command-hub-workflow-state",
    allowedInWorkflowStore: true,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: true,
    reason: "ID reference only — appointment lives in Cliniko.",
  },
  {
    fieldKey: "patientName",
    label: "Patient name",
    classification: "cliniko-source-of-truth",
    allowedInWorkflowStore: false,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: true,
    reason: "Demographics belong in Cliniko, not duplicated in workflow store.",
  },
  {
    fieldKey: "dateOfBirth",
    label: "Date of birth",
    classification: "cliniko-source-of-truth",
    allowedInWorkflowStore: false,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: true,
    reason: "Demographics belong in Cliniko only.",
  },
  {
    fieldKey: "email",
    label: "Email",
    classification: "cliniko-source-of-truth",
    allowedInWorkflowStore: false,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: true,
    reason: "Contact details belong in Cliniko only.",
  },
  {
    fieldKey: "phone",
    label: "Phone",
    classification: "cliniko-source-of-truth",
    allowedInWorkflowStore: false,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: true,
    reason: "Contact details belong in Cliniko only.",
  },
  {
    fieldKey: "address",
    label: "Address",
    classification: "cliniko-source-of-truth",
    allowedInWorkflowStore: false,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: true,
    reason: "Address belongs in Cliniko only.",
  },
  {
    fieldKey: "emergencyContact",
    label: "Emergency contact",
    classification: "cliniko-source-of-truth",
    allowedInWorkflowStore: false,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: true,
    reason: "Clinical/admin contact data belongs in Cliniko.",
  },
  {
    fieldKey: "medicalWarning",
    label: "Medical warning",
    classification: "cliniko-source-of-truth",
    allowedInWorkflowStore: false,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: true,
    reason: "Clinical history belongs in Cliniko only.",
  },
  {
    fieldKey: "treatmentNoteBody",
    label: "Treatment note body",
    classification: "forbidden",
    allowedInWorkflowStore: false,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: true,
    reason: "Note body must be saved to Cliniko or discarded — never persisted in workflow store.",
  },
  {
    fieldKey: "appointmentStatus",
    label: "Appointment status",
    classification: "cliniko-source-of-truth",
    allowedInWorkflowStore: false,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "Read from Cliniko — not duplicated in workflow store.",
  },
  {
    fieldKey: "invoicePrepared",
    label: "Invoice prepared flag",
    classification: "command-hub-workflow-state",
    allowedInWorkflowStore: true,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "Operational workflow flag only.",
  },
  {
    fieldKey: "invoiceDraftStatus",
    label: "Invoice draft status",
    classification: "command-hub-workflow-state",
    allowedInWorkflowStore: true,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "Workflow readiness — future Xero integration.",
  },
  {
    fieldKey: "paymentStatus",
    label: "Payment status",
    classification: "future-integration",
    allowedInWorkflowStore: false,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "Real payment status is a future integration.",
  },
  {
    fieldKey: "followUpSuggested",
    label: "Follow-up suggested",
    classification: "command-hub-workflow-state",
    allowedInWorkflowStore: true,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "Workflow suggestion until booked in Cliniko.",
  },
  {
    fieldKey: "followUpBookedClinikoAppointmentId",
    label: "Follow-up Cliniko appointment ID",
    classification: "command-hub-workflow-state",
    allowedInWorkflowStore: true,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: true,
    reason: "ID reference after safe Cliniko write.",
  },
  {
    fieldKey: "patientMatchDecision",
    label: "Patient match / link decision",
    classification: "command-hub-workflow-state",
    allowedInWorkflowStore: true,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "Staff workflow decision — DEMO labels only.",
  },
  {
    fieldKey: "insuranceProvider",
    label: "Insurance provider",
    classification: "command-hub-sensitive-admin-demo",
    allowedInWorkflowStore: true,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "DEMO insurance workflow data — not saved to Cliniko unless custom fields are wired.",
  },
  {
    fieldKey: "policyNumber",
    label: "Policy number",
    classification: "command-hub-sensitive-admin-demo",
    allowedInWorkflowStore: true,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "DEMO insurance workflow data — not Cliniko-saved today.",
  },
  {
    fieldKey: "claimNumber",
    label: "Claim number",
    classification: "command-hub-sensitive-admin-demo",
    allowedInWorkflowStore: true,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "DEMO insurance workflow data — future Healthcode.",
  },
  {
    fieldKey: "authorisationNumber",
    label: "Authorisation number",
    classification: "command-hub-sensitive-admin-demo",
    allowedInWorkflowStore: true,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "DEMO insurance workflow data — not Cliniko-saved today.",
  },
  {
    fieldKey: "approvedSessions",
    label: "Approved sessions",
    classification: "command-hub-sensitive-admin-demo",
    allowedInWorkflowStore: true,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "DEMO session tracking — calculated in Command Hub.",
  },
  {
    fieldKey: "sessionsUsed",
    label: "Sessions used",
    classification: "command-hub-sensitive-admin-demo",
    allowedInWorkflowStore: true,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "DEMO session tracking — derived from appointments.",
  },
  {
    fieldKey: "patientLiabilityAgreement",
    label: "Patient liability agreement",
    classification: "command-hub-sensitive-admin-demo",
    allowedInWorkflowStore: true,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "Staff confirmation flag — demo workflow only.",
  },
  {
    fieldKey: "demoWeekPreview",
    label: "Demo week preview",
    classification: "command-hub-workflow-state",
    allowedInWorkflowStore: true,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "UI preference for demo layout only.",
  },
  {
    fieldKey: "apiKeys",
    label: "API keys",
    classification: "forbidden",
    allowedInWorkflowStore: false,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "Secrets belong in server environment only.",
  },
  {
    fieldKey: "sessionSecrets",
    label: "Session secrets",
    classification: "forbidden",
    allowedInWorkflowStore: false,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "Secrets belong in server environment only.",
  },
  {
    fieldKey: "rawClinikoPayload",
    label: "Raw Cliniko payload",
    classification: "forbidden",
    allowedInWorkflowStore: false,
    allowedInBrowserStorage: false,
    allowedInClinikoWrite: false,
    reason: "Do not cache raw Cliniko patient payloads in workflow store.",
  },
];

export function policiesByClassification(
  classification: StorageBoundaryClassification
): StorageBoundaryFieldPolicy[] {
  return STORAGE_BOUNDARY_FIELD_POLICIES.filter((p) => p.classification === classification);
}

export const FORBIDDEN_WORKFLOW_STORE_KEYS = new Set(
  STORAGE_BOUNDARY_FIELD_POLICIES.filter((p) => p.classification === "forbidden").map(
    (p) => p.fieldKey
  )
);
