/**
 * Booking intake patient matching — DEMO-safe scoring.
 */

import { isDemoSafeFirstName, validateDemoWriteInput } from "@/lib/demo-write-safety";

export type MatchStatus = "exact" | "possible" | "none" | "unsafe";
export type RecommendedAction =
  | "link-existing"
  | "staff-confirm"
  | "create-new"
  | "do-not-write";

export interface BookingIntakeInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  postcode?: string;
  appointmentType?: string;
  location?: string;
  preferredPractitioner?: string;
  reasonForVisit?: string;
  insuranceProvider?: string;
  policyNumber?: string;
  claimNumber?: string;
  authorisationNumber?: string;
}

export interface ClinikoPatientMatchCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  score: number;
  reasons: string[];
}

export interface PatientMatchResult {
  matchStatus: MatchStatus;
  confidence: number;
  suggestedMatches: ClinikoPatientMatchCandidate[];
  recommendedAction: RecommendedAction;
  staffConfirmationRequired: boolean;
  unsafeReason?: string;
  message: string;
}

function normalizeEmail(email?: string): string {
  return (email ?? "").trim().toLowerCase();
}

function normalizePhone(phone?: string): string {
  return (phone ?? "").replace(/\D/g, "");
}

function normalizeName(name?: string): string {
  return (name ?? "").trim().toLowerCase();
}

function scorePatient(
  input: BookingIntakeInput,
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    postcode?: string;
    policyNumber?: string;
  }
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (!isDemoSafeFirstName(patient.firstName)) {
    return { score: 0, reasons: ["Non-DEMO patient excluded"] };
  }

  const inputEmail = normalizeEmail(input.email);
  const patientEmail = normalizeEmail(patient.email);
  if (inputEmail && patientEmail && inputEmail === patientEmail) {
    score += 50;
    reasons.push("Exact email match");
  }

  const inputPhone = normalizePhone(input.phone);
  const patientPhone = normalizePhone(patient.phone);
  if (inputPhone && patientPhone && inputPhone === patientPhone) {
    score += 45;
    reasons.push("Exact phone match");
  }

  const nameMatch =
    normalizeName(input.firstName) === normalizeName(patient.firstName) &&
    normalizeName(input.lastName) === normalizeName(patient.lastName);
  const dobMatch =
    input.dateOfBirth &&
    patient.dateOfBirth &&
    input.dateOfBirth === patient.dateOfBirth;

  if (nameMatch && dobMatch) {
    score += 40;
    reasons.push("Name + DOB match");
  } else if (nameMatch) {
    score += 25;
    reasons.push("Name match");
  }

  if (
    input.postcode &&
    patient.postcode &&
    normalizeName(input.postcode) === normalizeName(patient.postcode) &&
    nameMatch
  ) {
    score += 15;
    reasons.push("Name + postcode match");
  }

  if (
    input.policyNumber &&
    patient.policyNumber &&
    input.policyNumber === patient.policyNumber
  ) {
    score += 35;
    reasons.push("Insurance policy/member number match");
  }

  const inputDomain = inputEmail.split("@")[1];
  const patientDomain = patientEmail.split("@")[1];
  if (
    inputDomain &&
    patientDomain &&
    inputDomain === patientDomain &&
    !nameMatch &&
    normalizeName(input.lastName) === normalizeName(patient.lastName)
  ) {
    score += 10;
    reasons.push("Similar name + same email domain");
  }

  return { score, reasons };
}

export function matchBookingIntake(
  input: BookingIntakeInput,
  candidates: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    postcode?: string;
    policyNumber?: string;
  }>
): PatientMatchResult {
  const safety = validateDemoWriteInput({
    firstName: input.firstName,
    lastName: input.lastName,
  });

  if (!safety.ok) {
    return {
      matchStatus: "unsafe",
      confidence: 0,
      suggestedMatches: [],
      recommendedAction: "do-not-write",
      staffConfirmationRequired: true,
      unsafeReason: safety.reason,
      message: safety.reason,
    };
  }

  const scored = candidates
    .map((patient) => {
      const { score, reasons } = scorePatient(input, patient);
      return {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        score,
        reasons,
      } satisfies ClinikoPatientMatchCandidate;
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  const confidence = top?.score ?? 0;

  if (confidence >= 50) {
    return {
      matchStatus: "exact",
      confidence,
      suggestedMatches: scored.slice(0, 5),
      recommendedAction: "link-existing",
      staffConfirmationRequired: false,
      message: "Exact DEMO match found — can link automatically in demo mode.",
    };
  }

  if (confidence >= 25) {
    return {
      matchStatus: "possible",
      confidence,
      suggestedMatches: scored.slice(0, 5),
      recommendedAction: "staff-confirm",
      staffConfirmationRequired: true,
      message: "Possible matches — staff confirmation needed.",
    };
  }

  return {
    matchStatus: "none",
    confidence: 0,
    suggestedMatches: [],
    recommendedAction: "create-new",
    staffConfirmationRequired: false,
    message: "No match — create new DEMO patient in Cliniko when ready.",
  };
}
