import "server-only";

import { clinikoFetch, getClinikoConfig } from "@/lib/cliniko";
import { CLINIKO_PATIENT_FIELD_MAP } from "@/lib/cliniko-patient-field-map";
import { DEMO_EMAIL_DOMAIN } from "@/lib/cliniko-test-lab";
import { validateDemoWriteInput } from "@/lib/demo-write-safety";

export interface CreateDemoPatientInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  emergencyContact?: string;
  gpOrReferrer?: string;
  reasonForVisit?: string;
  occupationOrActivity?: string;
  medicalWarning?: string;
  marketingSource?: string;
  insuranceProvider?: string;
  policyNumber?: string;
  claimNumber?: string;
  authorisationNumber?: string;
  approvedSessions?: number;
  preferredLocation?: string;
  preferredPractitioner?: string;
}

export interface SavedPatientField {
  label: string;
  value: string;
  source: "Cliniko test account";
}

export interface PreparedOnlyPatientField {
  label: string;
  value: string;
  reason: string;
}

export type DemoPatientCreateStatus = "created" | "prepared-only" | "blocked" | "failed";

export interface DemoPatientCreateResult {
  ok: boolean;
  status: DemoPatientCreateStatus;
  message: string;
  label: string;
  patientId?: string;
  savedFields: SavedPatientField[];
  preparedOnlyFields: PreparedOnlyPatientField[];
  warnings: string[];
  verified: boolean;
  verificationMessage?: string;
}

interface ClinikoPatientRaw {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  date_of_birth?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  post_code?: string;
  emergency_contact?: string;
  referral_source?: string;
  appointment_notes?: string;
  occupation?: string;
  notes?: string;
  patient_phone_numbers?: Array<{ number?: string; phone_type?: string }>;
}

function parseAddress(input: CreateDemoPatientInput): {
  address1?: string;
  address2?: string;
  city?: string;
  postcode?: string;
} {
  if (input.addressLine1 || input.postcode) {
    return {
      address1: input.addressLine1,
      address2: input.addressLine2,
      city: input.city,
      postcode: input.postcode,
    };
  }
  if (!input.address?.trim()) return {};
  const parts = input.address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return {};
  const last = parts[parts.length - 1] ?? "";
  const postcodeMatch = last.match(/\b([A-Z]{1,2}\d[\dA-Z]?\s*\d[A-Z]{2})\b/i);
  return {
    address1: parts[0],
    address2: parts.length > 2 ? parts.slice(1, -1).join(", ") : undefined,
    city: parts.length > 1 && !postcodeMatch ? parts[parts.length - 1] : undefined,
    postcode: postcodeMatch?.[1] ?? input.postcode,
  };
}

function buildNotesField(input: CreateDemoPatientInput): string | undefined {
  const parts: string[] = [];
  if (input.medicalWarning?.trim()) {
    parts.push(`Medical flag: ${input.medicalWarning.trim()}`);
  }
  if (input.marketingSource?.trim() && !input.medicalWarning?.trim()) {
    parts.push(`Source: ${input.marketingSource.trim()}`);
  }
  return parts.length > 0 ? parts.join("\n") : undefined;
}

export function buildClinikoPatientPayload(input: CreateDemoPatientInput): {
  payload: Record<string, unknown>;
  attemptedFields: SavedPatientField[];
  skippedFields: PreparedOnlyPatientField[];
} {
  const email =
    input.email?.trim() ||
    `${input.firstName}.${input.lastName}@${DEMO_EMAIL_DOMAIN}`.toLowerCase().replace(/\s+/g, ".");

  const addr = parseAddress(input);
  const notes = buildNotesField(input);

  const payload: Record<string, unknown> = {
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    email,
  };

  const attemptedFields: SavedPatientField[] = [
    { label: "First name", value: input.firstName.trim(), source: "Cliniko test account" },
    { label: "Last name", value: input.lastName.trim(), source: "Cliniko test account" },
    { label: "Email", value: email, source: "Cliniko test account" },
  ];

  const skippedFields: PreparedOnlyPatientField[] = [];

  if (input.phone?.trim()) {
    payload.patient_phone_numbers = [{ number: input.phone.trim(), phone_type: "Mobile" }];
    attemptedFields.push({
      label: "Phone",
      value: input.phone.trim(),
      source: "Cliniko test account",
    });
  }

  if (input.dateOfBirth?.trim()) {
    payload.date_of_birth = input.dateOfBirth.trim();
    attemptedFields.push({
      label: "Date of birth",
      value: input.dateOfBirth.trim(),
      source: "Cliniko test account",
    });
  }

  if (addr.address1) {
    payload.address_1 = addr.address1;
    attemptedFields.push({
      label: "Address line 1",
      value: addr.address1,
      source: "Cliniko test account",
    });
  }
  if (addr.address2) {
    payload.address_2 = addr.address2;
    attemptedFields.push({
      label: "Address line 2",
      value: addr.address2,
      source: "Cliniko test account",
    });
  }
  if (addr.city) {
    payload.city = addr.city;
    attemptedFields.push({ label: "Town/city", value: addr.city, source: "Cliniko test account" });
  }
  if (addr.postcode) {
    payload.post_code = addr.postcode;
    attemptedFields.push({
      label: "Postcode",
      value: addr.postcode,
      source: "Cliniko test account",
    });
  }

  if (input.emergencyContact?.trim()) {
    payload.emergency_contact = input.emergencyContact.trim();
    attemptedFields.push({
      label: "Emergency contact",
      value: input.emergencyContact.trim(),
      source: "Cliniko test account",
    });
  }

  if (input.gpOrReferrer?.trim()) {
    payload.referral_source = input.gpOrReferrer.trim();
    attemptedFields.push({
      label: "GP / referral source",
      value: input.gpOrReferrer.trim(),
      source: "Cliniko test account",
    });
  }

  if (input.reasonForVisit?.trim()) {
    payload.appointment_notes = input.reasonForVisit.trim();
    attemptedFields.push({
      label: "Reason for visit",
      value: input.reasonForVisit.trim(),
      source: "Cliniko test account",
    });
  }

  if (input.occupationOrActivity?.trim()) {
    payload.occupation = input.occupationOrActivity.trim();
    attemptedFields.push({
      label: "Occupation/activity",
      value: input.occupationOrActivity.trim(),
      source: "Cliniko test account",
    });
  }

  if (notes) {
    payload.notes = notes;
    attemptedFields.push({
      label: "Medical warning flag",
      value: notes,
      source: "Cliniko test account",
    });
  }

  for (const field of CLINIKO_PATIENT_FIELD_MAP.filter((f) => !f.canWriteNow)) {
    const value = input[field.sourceField as keyof CreateDemoPatientInput];
    if (value === undefined || value === null || value === "") continue;
    skippedFields.push({
      label: field.displayLabel,
      value: String(value),
      reason:
        field.preparedOnlyReason ??
        "Prepared for Cliniko — not currently written by this integration",
    });
  }

  return { payload, attemptedFields, skippedFields };
}

function normalizePhone(value?: string): string {
  return (value ?? "").replace(/\D/g, "");
}

function verifyPatientReadBack(
  sent: Record<string, unknown>,
  read: ClinikoPatientRaw
): { verified: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (read.first_name !== sent.first_name) {
    warnings.push("Read-back: first name mismatch");
  }
  if (read.last_name !== sent.last_name) {
    warnings.push("Read-back: last name mismatch");
  }
  if (sent.email && read.email && read.email !== sent.email) {
    warnings.push("Read-back: email mismatch");
  }
  if (sent.date_of_birth && read.date_of_birth && read.date_of_birth !== sent.date_of_birth) {
    warnings.push("Read-back: date of birth mismatch");
  }
  if (sent.patient_phone_numbers && Array.isArray(sent.patient_phone_numbers)) {
    const sentNum = (sent.patient_phone_numbers as Array<{ number?: string }>)[0]?.number;
    const readNum = read.patient_phone_numbers?.[0]?.number;
    if (sentNum && readNum && normalizePhone(readNum) !== normalizePhone(sentNum)) {
      warnings.push("Read-back: phone mismatch");
    }
  }

  return { verified: warnings.length === 0 && Boolean(read.id), warnings };
}

export async function createDemoPatientWithVerification(
  input: CreateDemoPatientInput
): Promise<DemoPatientCreateResult> {
  const safety = validateDemoWriteInput({
    firstName: input.firstName,
    lastName: input.lastName,
  });
  if (!safety.ok) {
    return {
      ok: false,
      status: "blocked",
      message: safety.reason,
      label: "Blocked from writing",
      savedFields: [],
      preparedOnlyFields: [],
      warnings: [safety.reason],
      verified: false,
    };
  }

  const config = getClinikoConfig();
  if (!config.apiKey) {
    const { skippedFields } = buildClinikoPatientPayload(input);
    return {
      ok: false,
      status: "prepared-only",
      message: "Cliniko not configured — patient prepared only.",
      label: "Prepared for Cliniko",
      savedFields: [],
      preparedOnlyFields: skippedFields,
      warnings: ["Cliniko API key not configured"],
      verified: false,
    };
  }

  if (!config.writesEnabled) {
    const { attemptedFields, skippedFields } = buildClinikoPatientPayload(input);
    return {
      ok: false,
      status: "prepared-only",
      message: "Cliniko writes disabled — patient prepared only.",
      label: "Prepared for Cliniko",
      savedFields: [],
      preparedOnlyFields: [
        ...attemptedFields.map((f) => ({
          label: f.label,
          value: f.value,
          reason: "Prepared for Cliniko — writes disabled on server",
        })),
        ...skippedFields,
      ],
      warnings: ["CLINIKO_ENABLE_WRITES is false"],
      verified: false,
    };
  }

  const { payload, attemptedFields, skippedFields } = buildClinikoPatientPayload(input);
  const warnings: string[] = [];

  try {
    const created = await clinikoFetch<{ patient?: ClinikoPatientRaw }>("/patients", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const patientId = created.patient?.id ? String(created.patient.id) : undefined;
    if (!patientId) {
      return {
        ok: false,
        status: "failed",
        message: "Cliniko did not return a patient ID.",
        label: "Prepared for Cliniko",
        savedFields: [],
        preparedOnlyFields: skippedFields,
        warnings: ["No patient ID in Cliniko response"],
        verified: false,
      };
    }

    let verified = false;
    let verificationMessage =
      "Created request succeeded, but read-back verification was not completed";

    try {
      const readBack = await clinikoFetch<{ patient?: ClinikoPatientRaw }>(
        `/patients/${patientId}`
      );
      const patient = readBack.patient;
      if (patient?.id) {
        const check = verifyPatientReadBack(payload, patient);
        verified = check.verified;
        warnings.push(...check.warnings);
        verificationMessage = verified
          ? "Created and verified in Cliniko test account"
          : "Created request succeeded, but read-back verification was not completed";
      }
    } catch {
      warnings.push("Read-back GET /patients/{id} failed");
    }

    return {
      ok: true,
      status: "created",
      message: verified
        ? "Patient created and verified in Cliniko test account"
        : "Patient created in Cliniko test account",
      label: "Saved to Cliniko test account",
      patientId,
      savedFields: attemptedFields,
      preparedOnlyFields: skippedFields,
      warnings,
      verified,
      verificationMessage,
    };
  } catch (err) {
    return {
      ok: false,
      status: "failed",
      message: err instanceof Error ? err.message : "Patient creation failed.",
      label: "Prepared for Cliniko",
      savedFields: [],
      preparedOnlyFields: [
        ...attemptedFields.map((f) => ({
          label: f.label,
          value: f.value,
          reason: "Prepared for Cliniko — Cliniko create request failed",
        })),
        ...skippedFields,
      ],
      warnings: [err instanceof Error ? err.message : "Unknown error"],
      verified: false,
    };
  }
}
