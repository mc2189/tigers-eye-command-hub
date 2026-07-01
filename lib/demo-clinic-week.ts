/**
 * Demo Clinic Week — fake DEMO-only scenario library for Command Hub previews and seeding.
 * No real patient data. Every client name starts with DEMO.
 */

import type {
  InvoiceStatus,
  LocationId,
  NoteStatus,
  PaymentStatus,
  PractitionerId,
} from "@/lib/demo-data";

export type DemoWorkflowScenario =
  | "private-initial"
  | "private-followup"
  | "sports-massage"
  | "taping"
  | "acupuncture"
  | "telehealth"
  | "insurance-aviva-complete"
  | "insurance-vitality-missing-auth"
  | "insurance-bupa-missing-sessions"
  | "insurance-ready-invoice"
  | "insurance-reauth"
  | "external-work"
  | "waitlist"
  | "cancelled"
  | "follow-up-due";

export type DemoRecordStatus =
  | "saved-to-cliniko"
  | "prepared-for-cliniko"
  | "demo-browser-state"
  | "suggested-by-command-hub"
  | "future-integration";

export type DemoPaymentScenario =
  | "paid-in-clinic"
  | "payment-check-needed"
  | "invoice-required"
  | "insurance-funded"
  | "external-invoice"
  | "price-missing"
  | "future-payment";

export type DemoInvoiceScenario =
  | "private-check"
  | "insurance-ready"
  | "insurance-missing-auth"
  | "insurance-missing-details"
  | "external-route"
  | "prepared-draft";

export interface DemoClientProfile {
  patientLabel: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;
  gpOrReferrer: string;
  occupationOrSport: string;
  reasonForVisit: string;
  medicalWarning?: string;
  marketingSource: string;
  preferredLocation: LocationId;
  preferredPractitioner: string;
  consentSigned: boolean;
  liabilityAccepted: boolean;
  insurer?: string;
  policyNumber?: string;
  claimNumber?: string;
  authorisationNumber?: string;
  approvedSessions?: number;
}

export interface DemoTreatmentNoteDraft {
  templateName: string;
  status: DemoRecordStatus;
  sections: Record<string, string>;
}

export interface DemoFollowUpPlan {
  status: DemoRecordStatus;
  summary: string;
  suggestedInDays?: number;
  bookedInCliniko: boolean;
  checkInMessage?: string;
}

export interface DemoInvoiceDraft {
  scenario: DemoInvoiceScenario;
  status: DemoRecordStatus;
  payerType: "private" | "insurance" | "external";
  amount: number;
  insurer?: string;
  policyNumber?: string;
  claimNumber?: string;
  authorisationNumber?: string;
  approvedSessions?: number;
  sessionsUsed?: number;
  sessionsToInvoice?: number;
  missingDetails?: string[];
  suggestedNextStep: string;
}

export interface DemoClinicWeekScenario {
  id: string;
  patientLabel: string;
  appointmentType: string;
  preferredPractitioner: string;
  practitionerId: PractitionerId;
  location: string;
  locationId: LocationId;
  startsAtOffsetDays: number;
  time: string;
  durationMinutes: number;
  workflowScenario: DemoWorkflowScenario;
  noteStatus: NoteStatus;
  noteDraft: DemoTreatmentNoteDraft;
  paymentScenario: DemoPaymentScenario;
  paymentStatus: PaymentStatus;
  expectedFee: number;
  depositRequired: boolean;
  invoiceScenario: DemoInvoiceScenario;
  invoiceStatus: InvoiceStatus;
  invoiceDraft: DemoInvoiceDraft;
  insuranceScenario?: string;
  stockScenario?: string[];
  followUpScenario?: DemoFollowUpPlan;
  clientProfile: DemoClientProfile;
  treatmentPlan: string;
  clinikoSaved: {
    patient: boolean;
    appointment: boolean;
    note: boolean;
    invoice: boolean;
  };
  cancelled?: boolean;
}

function dayOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function endTime(start: string, minutes: number): string {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function noteDraft(
  template: string,
  subjective: string,
  plan: string
): DemoTreatmentNoteDraft {
  return {
    templateName: template,
    status: "prepared-for-cliniko",
    sections: {
      Subjective: subjective,
      Objective: "DEMO objective findings recorded for preview only.",
      Assessment: "DEMO assessment — practitioner to confirm before saving.",
      "Treatment provided": "DEMO treatment summary.",
      "Advice given": "Home exercise and activity guidance discussed.",
      "Red flags checked": "No acute red flags reported in this DEMO scenario.",
      Plan: plan,
      "Follow-up recommendation": plan,
    },
  };
}

function profile(
  label: string,
  reason: string,
  extras: Partial<DemoClientProfile> = {}
): DemoClientProfile {
  const slug = label.replace(/^DEMO\s+/i, "").replace(/\s+/g, ".").toLowerCase();
  return {
    patientLabel: label,
    dateOfBirth: "1985-06-15",
    email: `${slug}@demo.tigerseye.test`,
    phone: "07700 900000",
    address: "1 Demo Street, Dundee DD1 1AA",
    emergencyContact: "DEMO Emergency Contact — 07700 900001",
    gpOrReferrer: "DEMO GP Practice",
    occupationOrSport: extras.occupationOrSport ?? "Office worker",
    reasonForVisit: reason,
    marketingSource: "DEMO referral — website",
    preferredLocation: extras.preferredLocation ?? "dundee",
    preferredPractitioner: extras.preferredPractitioner ?? "George Stewart",
    consentSigned: true,
    liabilityAccepted: extras.liabilityAccepted ?? true,
    ...extras,
  };
}

export const DEMO_CLINIC_WEEK_SCENARIOS: DemoClinicWeekScenario[] = [
  {
    id: "dcw-001",
    patientLabel: "DEMO Alex Wilson",
    appointmentType: "Private physiotherapy initial assessment",
    preferredPractitioner: "George Stewart",
    practitionerId: "george",
    location: "Tigers Eye Demo System",
    locationId: "dundee",
    startsAtOffsetDays: 0,
    time: "09:00",
    durationMinutes: 60,
    workflowScenario: "private-initial",
    noteStatus: "draft-needed",
    noteDraft: noteDraft(
      "Initial assessment note",
      "DEMO runner with calf pain — onset 2 weeks ago after increased mileage.",
      "Follow-up suggested in 7 days — review loading and home programme."
    ),
    paymentScenario: "payment-check-needed",
    paymentStatus: "pay-in-clinic",
    expectedFee: 75,
    depositRequired: false,
    invoiceScenario: "private-check",
    invoiceStatus: "draft-needed",
    invoiceDraft: {
      scenario: "private-check",
      status: "prepared-for-cliniko",
      payerType: "private",
      amount: 75,
      suggestedNextStep: "Check whether payment was taken at appointment or invoice is needed.",
    },
    followUpScenario: {
      status: "suggested-by-command-hub",
      summary: "Follow-up suggested in 7 days",
      suggestedInDays: 7,
      bookedInCliniko: false,
    },
    clientProfile: profile("DEMO Alex Wilson", "Runner with calf pain", {
      occupationOrSport: "Recreational runner",
    }),
    treatmentPlan: "Initial assessment → graded loading programme → review in 7 days.",
    clinikoSaved: { patient: false, appointment: false, note: false, invoice: false },
  },
  {
    id: "dcw-002",
    patientLabel: "DEMO Sarah McKay",
    appointmentType: "Aviva insurance initial assessment",
    preferredPractitioner: "George Stewart",
    practitionerId: "george",
    location: "Tigers Eye Demo System",
    locationId: "dundee",
    startsAtOffsetDays: 0,
    time: "10:30",
    durationMinutes: 60,
    workflowScenario: "insurance-aviva-complete",
    noteStatus: "draft-needed",
    noteDraft: noteDraft(
      "Insurance assessment note",
      "DEMO Aviva-funded initial — shoulder pain post-injury.",
      "Session 1 of 6 approved — insurer invoice after treatment note saved."
    ),
    paymentScenario: "insurance-funded",
    paymentStatus: "insurance-invoice",
    expectedFee: 0,
    depositRequired: false,
    invoiceScenario: "insurance-ready",
    invoiceStatus: "ready-to-send",
    invoiceDraft: {
      scenario: "insurance-ready",
      status: "prepared-for-cliniko",
      payerType: "insurance",
      amount: 55,
      insurer: "Aviva",
      policyNumber: "DEMO-POL-AVIVA-001",
      claimNumber: "DEMO-CLAIM-AVIVA-001",
      authorisationNumber: "DEMO-AUTH-AVIVA-001",
      approvedSessions: 6,
      sessionsUsed: 2,
      sessionsToInvoice: 1,
      suggestedNextStep: "Insurance invoice draft ready — 4 sessions remaining after this visit.",
    },
    insuranceScenario: "Aviva — 6 approved, 2 used, ready to invoice",
    clientProfile: profile("DEMO Sarah McKay", "Aviva insurance initial assessment", {
      insurer: "Aviva",
      policyNumber: "DEMO-POL-AVIVA-001",
      claimNumber: "DEMO-CLAIM-AVIVA-001",
      authorisationNumber: "DEMO-AUTH-AVIVA-001",
      approvedSessions: 6,
    }),
    treatmentPlan: "Insurer-funded physio — 6 sessions approved, session tracking active.",
    clinikoSaved: { patient: false, appointment: false, note: false, invoice: false },
  },
  {
    id: "dcw-003",
    patientLabel: "DEMO Jamie Ross",
    appointmentType: "Vitality insurance follow-up",
    preferredPractitioner: "George Stewart",
    practitionerId: "george",
    location: "Tigers Eye Demo System",
    locationId: "dundee",
    startsAtOffsetDays: 0,
    time: "14:00",
    durationMinutes: 45,
    workflowScenario: "insurance-vitality-missing-auth",
    noteStatus: "not-started",
    noteDraft: noteDraft(
      "Follow-up physio note",
      "DEMO Vitality follow-up — knee pain improving.",
      "Confirm authorisation before billing next session."
    ),
    paymentScenario: "insurance-funded",
    paymentStatus: "insurance-invoice",
    expectedFee: 0,
    depositRequired: false,
    invoiceScenario: "insurance-missing-auth",
    invoiceStatus: "draft-needed",
    invoiceDraft: {
      scenario: "insurance-missing-auth",
      status: "prepared-for-cliniko",
      payerType: "insurance",
      amount: 55,
      insurer: "Vitality",
      policyNumber: "DEMO-POL-VIT-002",
      claimNumber: "DEMO-CLAIM-VIT-002",
      approvedSessions: 4,
      sessionsUsed: 1,
      missingDetails: ["Authorisation number"],
      suggestedNextStep: "Missing authorisation — blocked from insurance invoice until captured.",
    },
    insuranceScenario: "Vitality — authorisation missing",
    clientProfile: profile("DEMO Jamie Ross", "Vitality insurance follow-up", {
      insurer: "Vitality",
      policyNumber: "DEMO-POL-VIT-002",
      claimNumber: "DEMO-CLAIM-VIT-002",
      approvedSessions: 4,
      liabilityAccepted: true,
    }),
    treatmentPlan: "Insurance follow-up — authorisation number needed before invoicing.",
    clinikoSaved: { patient: false, appointment: false, note: false, invoice: false },
  },
  {
    id: "dcw-004",
    patientLabel: "DEMO Priya Singh",
    appointmentType: "Telehealth review",
    preferredPractitioner: "George Stewart",
    practitionerId: "george",
    location: "Telehealth",
    locationId: "telehealth",
    startsAtOffsetDays: 1,
    time: "11:00",
    durationMinutes: 30,
    workflowScenario: "telehealth",
    noteStatus: "draft-needed",
    noteDraft: noteDraft(
      "Telehealth review note",
      "DEMO remote check-in — post-op rehab progress review.",
      "Check-in message suggested — no stock impact."
    ),
    paymentScenario: "payment-check-needed",
    paymentStatus: "paid-online",
    expectedFee: 40,
    depositRequired: false,
    invoiceScenario: "private-check",
    invoiceStatus: "draft-needed",
    invoiceDraft: {
      scenario: "private-check",
      status: "prepared-for-cliniko",
      payerType: "private",
      amount: 40,
      suggestedNextStep: "Confirm online payment received.",
    },
    followUpScenario: {
      status: "suggested-by-command-hub",
      summary: "Check-in message suggested",
      suggestedInDays: 14,
      bookedInCliniko: false,
      checkInMessage: "DEMO check-in: How is your home exercise programme going?",
    },
    clientProfile: profile("DEMO Priya Singh", "Telehealth rehab review", {
      preferredLocation: "telehealth",
    }),
    treatmentPlan: "Remote review → adjust home programme → optional in-person follow-up.",
    clinikoSaved: { patient: false, appointment: false, note: false, invoice: false },
  },
  {
    id: "dcw-005",
    patientLabel: "DEMO Connor Fraser",
    appointmentType: "Sports massage",
    preferredPractitioner: "Jamie Lee Thomson",
    practitionerId: "jamie-lee",
    location: "Tigers Eye Demo System",
    locationId: "dundee",
    startsAtOffsetDays: 1,
    time: "09:30",
    durationMinutes: 45,
    workflowScenario: "sports-massage",
    noteStatus: "draft-needed",
    noteDraft: noteDraft(
      "Sports massage note",
      "DEMO pre-event massage — tight hamstrings and glutes.",
      "Optional maintenance massage in 4 weeks."
    ),
    paymentScenario: "payment-check-needed",
    paymentStatus: "pay-in-clinic",
    expectedFee: 50,
    depositRequired: false,
    invoiceScenario: "private-check",
    invoiceStatus: "draft-needed",
    invoiceDraft: {
      scenario: "private-check",
      status: "prepared-for-cliniko",
      payerType: "private",
      amount: 50,
      suggestedNextStep: "Payment check needed at reception.",
    },
    stockScenario: ["Couch roll", "Massage lotion"],
    followUpScenario: {
      status: "suggested-by-command-hub",
      summary: "Maintenance massage reminder",
      suggestedInDays: 28,
      bookedInCliniko: false,
    },
    clientProfile: profile("DEMO Connor Fraser", "Sports massage pre-event", {
      occupationOrSport: "Amateur football",
      preferredPractitioner: "Jamie Lee Thomson",
    }),
    treatmentPlan: "Sports massage → recovery advice → optional maintenance booking.",
    clinikoSaved: { patient: false, appointment: false, note: false, invoice: false },
  },
  {
    id: "dcw-006",
    patientLabel: "DEMO Rachel Grant",
    appointmentType: "Taping appointment",
    preferredPractitioner: "George Stewart",
    practitionerId: "george",
    location: "Tigers Eye Demo System",
    locationId: "dundee",
    startsAtOffsetDays: 1,
    time: "15:00",
    durationMinutes: 30,
    workflowScenario: "taping",
    noteStatus: "not-started",
    noteDraft: noteDraft(
      "Taping note",
      "DEMO ankle taping before return to sport.",
      "Short follow-up check in 5 days."
    ),
    paymentScenario: "payment-check-needed",
    paymentStatus: "pay-in-clinic",
    expectedFee: 35,
    depositRequired: false,
    invoiceScenario: "private-check",
    invoiceStatus: "draft-needed",
    invoiceDraft: {
      scenario: "private-check",
      status: "prepared-for-cliniko",
      payerType: "private",
      amount: 35,
      suggestedNextStep: "Check payment at appointment.",
    },
    stockScenario: ["Zinc oxide tape"],
    followUpScenario: {
      status: "suggested-by-command-hub",
      summary: "Follow-up suggested in 5 days",
      suggestedInDays: 5,
      bookedInCliniko: false,
    },
    clientProfile: profile("DEMO Rachel Grant", "Ankle taping before sport return"),
    treatmentPlan: "Taping → activity advice → brief check-in follow-up.",
    clinikoSaved: { patient: false, appointment: false, note: false, invoice: false },
  },
  {
    id: "dcw-007",
    patientLabel: "DEMO Mark Johnston",
    appointmentType: "Acupuncture",
    preferredPractitioner: "George Stewart",
    practitionerId: "george",
    location: "Tigers Eye Demo System",
    locationId: "dundee",
    startsAtOffsetDays: 2,
    time: "10:00",
    durationMinutes: 45,
    workflowScenario: "acupuncture",
    noteStatus: "draft-needed",
    noteDraft: noteDraft(
      "Acupuncture treatment note",
      "DEMO lower back pain — first acupuncture session.",
      "Review response before next session."
    ),
    paymentScenario: "payment-check-needed",
    paymentStatus: "pay-in-clinic",
    expectedFee: 55,
    depositRequired: false,
    invoiceScenario: "private-check",
    invoiceStatus: "draft-needed",
    invoiceDraft: {
      scenario: "private-check",
      status: "prepared-for-cliniko",
      payerType: "private",
      amount: 55,
      suggestedNextStep: "Treatment note required before payment check.",
    },
    stockScenario: ["Acupuncture needles"],
    followUpScenario: {
      status: "suggested-by-command-hub",
      summary: "Review response before next session",
      suggestedInDays: 7,
      bookedInCliniko: false,
    },
    clientProfile: profile("DEMO Mark Johnston", "Lower back pain — acupuncture trial"),
    treatmentPlan: "Acupuncture session → monitor response → follow-up decision.",
    clinikoSaved: { patient: false, appointment: false, note: false, invoice: false },
  },
  {
    id: "dcw-008",
    patientLabel: "DEMO Emma Campbell",
    appointmentType: "External / SSE-style site work",
    preferredPractitioner: "George Stewart",
    practitionerId: "george",
    location: "External site visit",
    locationId: "external",
    startsAtOffsetDays: 2,
    time: "13:00",
    durationMinutes: 120,
    workflowScenario: "external-work",
    noteStatus: "draft-needed",
    noteDraft: noteDraft(
      "External work note",
      "DEMO on-site physio cover — industrial setting.",
      "External invoice route to be confirmed with organisation."
    ),
    paymentScenario: "external-invoice",
    paymentStatus: "external-invoice",
    expectedFee: 280,
    depositRequired: false,
    invoiceScenario: "external-route",
    invoiceStatus: "draft-needed",
    invoiceDraft: {
      scenario: "external-route",
      status: "prepared-for-cliniko",
      payerType: "external",
      amount: 280,
      suggestedNextStep: "External work invoice route to be confirmed — organisation billing.",
    },
    clientProfile: profile("DEMO Emma Campbell", "External site physio session", {
      preferredLocation: "external",
      occupationOrSport: "DEMO Organisation — site cover",
    }),
    treatmentPlan: "External session → site note → organisation invoice route.",
    clinikoSaved: { patient: false, appointment: false, note: false, invoice: false },
  },
  {
    id: "dcw-009",
    patientLabel: "DEMO Lewis Murray",
    appointmentType: "Private physio follow-up",
    preferredPractitioner: "George Stewart",
    practitionerId: "george",
    location: "Tigers Eye Demo System",
    locationId: "dundee",
    startsAtOffsetDays: 3,
    time: "09:00",
    durationMinutes: 45,
    workflowScenario: "private-followup",
    noteStatus: "in-progress",
    noteDraft: noteDraft(
      "Follow-up physio note",
      "DEMO follow-up — progressing well with home exercises.",
      "Continue programme — review in 2 weeks."
    ),
    paymentScenario: "paid-in-clinic",
    paymentStatus: "paid-online",
    expectedFee: 55,
    depositRequired: false,
    invoiceScenario: "private-check",
    invoiceStatus: "paid",
    invoiceDraft: {
      scenario: "private-check",
      status: "prepared-for-cliniko",
      payerType: "private",
      amount: 55,
      suggestedNextStep: "Payment received — note completion only.",
    },
    followUpScenario: {
      status: "suggested-by-command-hub",
      summary: "Review progress in 14 days",
      suggestedInDays: 14,
      bookedInCliniko: false,
    },
    clientProfile: profile("DEMO Lewis Murray", "Follow-up after initial assessment"),
    treatmentPlan: "Follow-up → progress review → continue or discharge decision.",
    clinikoSaved: { patient: false, appointment: false, note: false, invoice: false },
  },
  {
    id: "dcw-010",
    patientLabel: "DEMO Fiona Stewart",
    appointmentType: "Bupa insurance follow-up",
    preferredPractitioner: "George Stewart",
    practitionerId: "george",
    location: "Tigers Eye Demo System",
    locationId: "dundee",
    startsAtOffsetDays: 3,
    time: "11:30",
    durationMinutes: 45,
    workflowScenario: "insurance-bupa-missing-sessions",
    noteStatus: "not-started",
    noteDraft: noteDraft(
      "Insurance assessment note",
      "DEMO Bupa follow-up — approved sessions not captured in demo case detail.",
      "Capture approved session count before invoicing."
    ),
    paymentScenario: "insurance-funded",
    paymentStatus: "insurance-invoice",
    expectedFee: 0,
    depositRequired: false,
    invoiceScenario: "insurance-missing-details",
    invoiceStatus: "draft-needed",
    invoiceDraft: {
      scenario: "insurance-missing-details",
      status: "prepared-for-cliniko",
      payerType: "insurance",
      amount: 55,
      insurer: "Bupa",
      policyNumber: "DEMO-POL-BUPA-010",
      claimNumber: "DEMO-CLAIM-BUPA-010",
      missingDetails: ["Approved sessions"],
      suggestedNextStep: "Approved sessions missing — capture before insurance invoice.",
    },
    insuranceScenario: "Bupa — approved sessions missing",
    clientProfile: profile("DEMO Fiona Stewart", "Bupa insurance follow-up", {
      insurer: "Bupa",
      policyNumber: "DEMO-POL-BUPA-010",
      claimNumber: "DEMO-CLAIM-BUPA-010",
      liabilityAccepted: false,
    }),
    treatmentPlan: "Insurance follow-up — complete case details before billing.",
    clinikoSaved: { patient: false, appointment: false, note: false, invoice: false },
  },
  {
    id: "dcw-011",
    patientLabel: "DEMO Callum Reid",
    appointmentType: "Insurance follow-up — re-authorisation needed",
    preferredPractitioner: "George Stewart",
    practitionerId: "george",
    location: "Tigers Eye Demo System",
    locationId: "dundee",
    startsAtOffsetDays: 4,
    time: "14:30",
    durationMinutes: 45,
    workflowScenario: "insurance-reauth",
    noteStatus: "draft-needed",
    noteDraft: noteDraft(
      "Follow-up physio note",
      "DEMO insurance follow-up — sessions used, re-authorisation needed.",
      "Contact insurer for re-authorisation before next block."
    ),
    paymentScenario: "insurance-funded",
    paymentStatus: "insurance-invoice",
    expectedFee: 0,
    depositRequired: false,
    invoiceScenario: "insurance-ready",
    invoiceStatus: "ready-to-send",
    invoiceDraft: {
      scenario: "insurance-ready",
      status: "prepared-for-cliniko",
      payerType: "insurance",
      amount: 55,
      insurer: "Aviva",
      policyNumber: "DEMO-POL-AVIVA-011",
      claimNumber: "DEMO-CLAIM-AVIVA-011",
      authorisationNumber: "DEMO-AUTH-AVIVA-011",
      approvedSessions: 6,
      sessionsUsed: 6,
      sessionsToInvoice: 1,
      suggestedNextStep: "Sessions used — needs re-authorisation for further treatment.",
    },
    insuranceScenario: "Aviva — sessions used, re-authorisation needed",
    clientProfile: profile("DEMO Callum Reid", "Insurance follow-up — sessions exhausted", {
      insurer: "Aviva",
      policyNumber: "DEMO-POL-AVIVA-011",
      claimNumber: "DEMO-CLAIM-AVIVA-011",
      authorisationNumber: "DEMO-AUTH-AVIVA-011",
      approvedSessions: 6,
    }),
    treatmentPlan: "Final session of block → re-authorisation request → insurer contact.",
    clinikoSaved: { patient: false, appointment: false, note: false, invoice: false },
  },
  {
    id: "dcw-012",
    patientLabel: "DEMO Ava Morrison",
    appointmentType: "Private physiotherapy initial assessment",
    preferredPractitioner: "Jamie Lee Thomson",
    practitionerId: "jamie-lee",
    location: "Aviemore",
    locationId: "aviemore",
    startsAtOffsetDays: 5,
    time: "10:00",
    durationMinutes: 60,
    workflowScenario: "private-initial",
    noteStatus: "not-started",
    noteDraft: noteDraft(
      "Initial assessment note",
      "DEMO Aviemore initial — neck and shoulder pain.",
      "Initial assessment → treatment plan → follow-up booking."
    ),
    paymentScenario: "payment-check-needed",
    paymentStatus: "deposit-paid",
    expectedFee: 75,
    depositRequired: true,
    invoiceScenario: "private-check",
    invoiceStatus: "draft-needed",
    invoiceDraft: {
      scenario: "private-check",
      status: "prepared-for-cliniko",
      payerType: "private",
      amount: 75,
      suggestedNextStep: "Deposit paid — balance due at appointment.",
    },
    followUpScenario: {
      status: "suggested-by-command-hub",
      summary: "Follow-up suggested after initial assessment",
      suggestedInDays: 7,
      bookedInCliniko: false,
    },
    clientProfile: profile("DEMO Ava Morrison", "Neck and shoulder pain — Aviemore", {
      preferredLocation: "aviemore",
      preferredPractitioner: "Jamie Lee Thomson",
    }),
    treatmentPlan: "Aviemore initial → local follow-up pathway.",
    clinikoSaved: { patient: false, appointment: false, note: false, invoice: false },
  },
];

export function getDemoClinicWeekDate(scenario: DemoClinicWeekScenario): string {
  return dayOffset(scenario.startsAtOffsetDays);
}

export function getDemoClinicWeekEndTime(scenario: DemoClinicWeekScenario): string {
  return endTime(scenario.time, scenario.durationMinutes);
}

export function getDemoClinicWeekPatientLabels(): string[] {
  return [...new Set(DEMO_CLINIC_WEEK_SCENARIOS.map((s) => s.patientLabel))];
}

export function getScenarioByPatient(patientLabel: string): DemoClinicWeekScenario[] {
  return DEMO_CLINIC_WEEK_SCENARIOS.filter((s) => s.patientLabel === patientLabel);
}

export function getDemoClinicWeekSummary() {
  const today = new Date().toISOString().split("T")[0];
  const appointments = DEMO_CLINIC_WEEK_SCENARIOS.filter((s) => !s.cancelled);
  const todayCount = appointments.filter(
    (s) => getDemoClinicWeekDate(s) === today
  ).length;
  return {
    patientCount: getDemoClinicWeekPatientLabels().length,
    appointmentCount: appointments.length,
    todayCount,
    insuranceCases: appointments.filter((s) => s.insuranceScenario).length,
    notesNeeded: appointments.filter((s) => s.noteStatus !== "complete").length,
  };
}

/** Safety copy shown on notes pages */
export const DEMO_NOTE_SAFETY_COPY = [
  "No audio stored.",
  "No local clinical-note database.",
  "Practitioner reviews before saving.",
  "Cliniko remains the clinical record.",
  "Notes can only be saved for DEMO-linked patients and appointments in this test account.",
] as const;

/** Entity audit — what Cliniko integration currently supports */
export const CLINIKO_ENTITY_AUDIT = {
  patient: { writable: true, label: "Saved to Cliniko test account" },
  appointment: { writable: true, label: "Saved to Cliniko test account" },
  treatmentNote: { writable: true, label: "Saved to Cliniko test account", gatedBy: "CLINIKO_ENABLE_WRITES" },
  followUp: { writable: false, label: "Suggested by Command Hub" },
  invoice: { writable: false, label: "Prepared for Cliniko" },
  payment: { writable: false, label: "Future integration" },
  insuranceCase: { writable: false, label: "Command Hub demo case" },
  customFields: { writable: false, label: "Future integration" },
} as const;
