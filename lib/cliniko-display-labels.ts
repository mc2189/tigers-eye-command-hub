export const GENERIC_APPOINTMENT_TYPE = "Appointment type not returned";
export const GENERIC_PRACTITIONER = "Practitioner not returned";
export const GENERIC_LOCATION = "Clinic not returned";

export function isGenericAppointmentType(name?: string | null): boolean {
  const v = name?.trim().toLowerCase() ?? "";
  return !v || v === "appointment" || v === "unknown appointment type";
}

export function isGenericPractitioner(name?: string | null): boolean {
  const v = name?.trim().toLowerCase() ?? "";
  return (
    !v ||
    v === "practitioner" ||
    v === "unmatched cliniko practitioner" ||
    v === "unknown practitioner"
  );
}

export function isGenericLocation(name?: string | null): boolean {
  const v = name?.trim().toLowerCase() ?? "";
  return !v || v === "clinic" || v === "unknown clinic";
}
