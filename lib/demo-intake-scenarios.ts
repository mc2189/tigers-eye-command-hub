import type { BookingIntakeInput } from "@/lib/cliniko-patient-matching";
import { DEMO_CLINIC_WEEK_SCENARIOS } from "@/lib/demo-clinic-week";

export interface DemoIntakeScenario {
  id: string;
  title: string;
  description: string;
  input: BookingIntakeInput & {
    address?: string;
    emergencyContact?: string;
    gpOrReferrer?: string;
    occupationOrActivity?: string;
  };
  expectedStatus: "exact" | "possible" | "none" | "unsafe";
}

export function buildIntakeMatchCandidates() {
  const seen = new Set<string>();
  const candidates: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    postcode?: string;
    policyNumber?: string;
  }> = [];

  for (const s of DEMO_CLINIC_WEEK_SCENARIOS) {
    if (seen.has(s.patientLabel)) continue;
    seen.add(s.patientLabel);
    const parts = s.patientLabel.replace(/^DEMO\s+/i, "").split(/\s+/);
    candidates.push({
      id: `demo-week-${s.id}`,
      firstName: `DEMO ${parts[0] ?? "Patient"}`,
      lastName: parts.slice(1).join(" ") || "Week",
      email: s.clientProfile.email,
      phone: s.clientProfile.phone,
      dateOfBirth: s.clientProfile.dateOfBirth,
      postcode: s.clientProfile.address.match(/\b([A-Z]{1,2}\d[\dA-Z]?\s*\d[A-Z]{2})\b/i)?.[1],
      policyNumber: s.clientProfile.policyNumber,
    });
  }
  return candidates;
}

export const DEMO_INTAKE_SCENARIOS: DemoIntakeScenario[] = [
  {
    id: "exact-email",
    title: "Existing DEMO client — exact email match",
    description: "DEMO Alex Wilson books again using the same demo email.",
    input: {
      firstName: "DEMO Alex",
      lastName: "Wilson",
      email: "alex.wilson@demo.tigerseye.test",
      phone: "07700 900000",
      dateOfBirth: "1985-06-15",
      appointmentType: "Private physiotherapy initial assessment",
      location: "Dundee",
      reasonForVisit: "Runner with calf pain",
      address: "12 Demo Street, Dundee DD1 1AA",
    },
    expectedStatus: "exact",
  },
  {
    id: "possible-name-dob",
    title: "Existing DEMO client — possible name/DOB match",
    description: "Name matches but email differs — staff must confirm.",
    input: {
      firstName: "DEMO Sarah",
      lastName: "McKay",
      email: "different.email@demo.tigerseye.test",
      dateOfBirth: "1985-06-15",
      appointmentType: "Aviva insurance initial assessment",
      location: "Dundee",
      insuranceProvider: "Aviva",
      policyNumber: "DEMO-POL-AVIVA-001",
    },
    expectedStatus: "possible",
  },
  {
    id: "new-client",
    title: "New DEMO client — no match",
    description: "Brand new DEMO patient with no existing Cliniko record.",
    input: {
      firstName: "DEMO New",
      lastName: "Patient",
      email: "new.patient@demo.tigerseye.test",
      phone: "07700 900123",
      dateOfBirth: "1990-01-01",
      address: "99 Demo Lane, Dundee DD2 2BB",
      emergencyContact: "DEMO Contact — 07700 900999",
      reasonForVisit: "Demo intake — new client",
      appointmentType: "Sports massage",
      location: "Dundee",
    },
    expectedStatus: "none",
  },
  {
    id: "insurance-policy",
    title: "Insurance customer with policy details",
    description: "Vitality insurance booking with policy number for matching.",
    input: {
      firstName: "DEMO Jamie",
      lastName: "Ross",
      email: "jamie.ross@demo.tigerseye.test",
      appointmentType: "Vitality insurance follow-up",
      insuranceProvider: "Vitality",
      policyNumber: "DEMO-POL-VIT-002",
      claimNumber: "DEMO-CLAIM-VIT-002",
    },
    expectedStatus: "exact",
  },
  {
    id: "unsafe-non-demo",
    title: "Unsafe/non-DEMO input blocked",
    description: "Real-looking name without DEMO prefix — must not write.",
    input: {
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@example.com",
      appointmentType: "Initial assessment",
    },
    expectedStatus: "unsafe",
  },
];
