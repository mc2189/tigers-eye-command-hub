/**
 * Cliniko patient field capability map — what this integration can write vs prepare only.
 * Based on Cliniko Patient API (POST/PATCH /patients) as documented at docs.api.cliniko.com.
 */

export type PatientFieldWriteMode =
  | "create"
  | "update"
  | "not-supported"
  | "not-yet-implemented";

export interface ClinikoPatientFieldDefinition {
  fieldName: string;
  sourceField: string;
  clinikoField: string;
  canWriteNow: boolean;
  writeMode: PatientFieldWriteMode;
  displayLabel: string;
  preparedOnlyReason?: string;
}

export const CLINIKO_PATIENT_FIELD_MAP: ClinikoPatientFieldDefinition[] = [
  {
    fieldName: "firstName",
    sourceField: "firstName",
    clinikoField: "first_name",
    canWriteNow: true,
    writeMode: "create",
    displayLabel: "First name",
  },
  {
    fieldName: "lastName",
    sourceField: "lastName",
    clinikoField: "last_name",
    canWriteNow: true,
    writeMode: "create",
    displayLabel: "Last name",
  },
  {
    fieldName: "email",
    sourceField: "email",
    clinikoField: "email",
    canWriteNow: true,
    writeMode: "create",
    displayLabel: "Email",
  },
  {
    fieldName: "phone",
    sourceField: "phone",
    clinikoField: "patient_phone_numbers[].number",
    canWriteNow: true,
    writeMode: "create",
    displayLabel: "Phone",
  },
  {
    fieldName: "dateOfBirth",
    sourceField: "dateOfBirth",
    clinikoField: "date_of_birth",
    canWriteNow: true,
    writeMode: "create",
    displayLabel: "Date of birth",
  },
  {
    fieldName: "addressLine1",
    sourceField: "addressLine1",
    clinikoField: "address_1",
    canWriteNow: true,
    writeMode: "create",
    displayLabel: "Address line 1",
  },
  {
    fieldName: "addressLine2",
    sourceField: "addressLine2",
    clinikoField: "address_2",
    canWriteNow: true,
    writeMode: "create",
    displayLabel: "Address line 2",
  },
  {
    fieldName: "city",
    sourceField: "city",
    clinikoField: "city",
    canWriteNow: true,
    writeMode: "create",
    displayLabel: "Town/city",
  },
  {
    fieldName: "postcode",
    sourceField: "postcode",
    clinikoField: "post_code",
    canWriteNow: true,
    writeMode: "create",
    displayLabel: "Postcode",
  },
  {
    fieldName: "emergencyContact",
    sourceField: "emergencyContact",
    clinikoField: "emergency_contact",
    canWriteNow: true,
    writeMode: "create",
    displayLabel: "Emergency contact",
  },
  {
    fieldName: "gpOrReferrer",
    sourceField: "gpOrReferrer",
    clinikoField: "referral_source",
    canWriteNow: true,
    writeMode: "create",
    displayLabel: "GP / referral source",
  },
  {
    fieldName: "reasonForVisit",
    sourceField: "reasonForVisit",
    clinikoField: "appointment_notes",
    canWriteNow: true,
    writeMode: "create",
    displayLabel: "Reason for visit",
  },
  {
    fieldName: "occupationOrActivity",
    sourceField: "occupationOrActivity",
    clinikoField: "occupation",
    canWriteNow: true,
    writeMode: "create",
    displayLabel: "Occupation/activity",
  },
  {
    fieldName: "medicalWarning",
    sourceField: "medicalWarning",
    clinikoField: "notes",
    canWriteNow: true,
    writeMode: "create",
    displayLabel: "Medical warning flag",
  },
  {
    fieldName: "marketingSource",
    sourceField: "marketingSource",
    clinikoField: "notes",
    canWriteNow: false,
    writeMode: "not-yet-implemented",
    displayLabel: "Marketing/source note",
    preparedOnlyReason:
      "Prepared for Cliniko — merged into notes field only when no medical warning is present",
  },
  {
    fieldName: "insuranceProvider",
    sourceField: "insuranceProvider",
    clinikoField: "custom_fields",
    canWriteNow: false,
    writeMode: "not-supported",
    displayLabel: "Insurance provider",
    preparedOnlyReason:
      "Prepared for Cliniko — stored in Command Hub demo case only; Cliniko custom fields not wired in this integration",
  },
  {
    fieldName: "policyNumber",
    sourceField: "policyNumber",
    clinikoField: "custom_fields",
    canWriteNow: false,
    writeMode: "not-supported",
    displayLabel: "Policy/member number",
    preparedOnlyReason:
      "Prepared for Cliniko — stored in Command Hub demo case only; Cliniko custom fields not wired in this integration",
  },
  {
    fieldName: "claimNumber",
    sourceField: "claimNumber",
    clinikoField: "custom_fields",
    canWriteNow: false,
    writeMode: "not-supported",
    displayLabel: "Claim number",
    preparedOnlyReason:
      "Prepared for Cliniko — stored in Command Hub demo case only; Cliniko custom fields not wired in this integration",
  },
  {
    fieldName: "authorisationNumber",
    sourceField: "authorisationNumber",
    clinikoField: "custom_fields",
    canWriteNow: false,
    writeMode: "not-supported",
    displayLabel: "Authorisation number",
    preparedOnlyReason:
      "Prepared for Cliniko — stored in Command Hub demo case only; Cliniko custom fields not wired in this integration",
  },
  {
    fieldName: "approvedSessions",
    sourceField: "approvedSessions",
    clinikoField: "custom_fields",
    canWriteNow: false,
    writeMode: "not-supported",
    displayLabel: "Approved sessions",
    preparedOnlyReason:
      "Prepared for Cliniko — stored in Command Hub demo insurance case only",
  },
  {
    fieldName: "preferredLocation",
    sourceField: "preferredLocation",
    clinikoField: "—",
    canWriteNow: false,
    writeMode: "not-supported",
    displayLabel: "Preferred location",
    preparedOnlyReason:
      "Prepared for Cliniko — not currently written by this integration",
  },
  {
    fieldName: "preferredPractitioner",
    sourceField: "preferredPractitioner",
    clinikoField: "—",
    canWriteNow: false,
    writeMode: "not-supported",
    displayLabel: "Preferred practitioner",
    preparedOnlyReason:
      "Prepared for Cliniko — not currently written by this integration",
  },
];

export function getWritablePatientFields(): ClinikoPatientFieldDefinition[] {
  return CLINIKO_PATIENT_FIELD_MAP.filter((f) => f.canWriteNow);
}

export function getPreparedOnlyPatientFields(): ClinikoPatientFieldDefinition[] {
  return CLINIKO_PATIENT_FIELD_MAP.filter((f) => !f.canWriteNow);
}
