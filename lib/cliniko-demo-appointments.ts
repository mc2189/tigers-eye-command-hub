export type DemoAppointmentRawType = "individual_appointment";

export interface DemoPatientNameLookup {
  firstName: string;
  lastName: string;
}

export interface ClinikoIndividualAppointmentLike {
  id: string;
  startsAt: string;
  endsAt?: string;
  patientId?: string;
  patientName?: string;
  patientLabel?: string;
  appointmentTypeName?: string;
  practitionerName?: string;
  businessName?: string;
  cancelledAt?: string;
  archivedAt?: string;
  source?: string;
}

export interface DemoPatientNameLookup {
  firstName: string;
  lastName: string;
}

export interface LiveDemoAppointmentCandidate {
  id?: string;
  clinikoId?: string;
  patientId?: string;
  patientName?: string;
  patientLabel?: string;
  startsAt?: string;
  startTime?: string;
  appointmentStart?: string;
  cancelledAt?: string;
  archivedAt?: string;
  source?: string;
  rawType?: DemoAppointmentRawType;
}

const PLACEHOLDER_ID_PATTERN = /^(demo-|bk-|mapped-|unknown|cliniko-type-|inferred-)/i;

export function isBrokenAbbreviatedDemoLabel(label: string): boolean {
  const trimmed = label.trim();
  if (!trimmed) return true;
  if (/^DEMO (\d|[A-Za-z]|[(])\.$/.test(trimmed)) return true;
  if (/^DEMO \([^)]*$/.test(trimmed)) return true;
  if (/^DEMO [A-Za-z0-9(]{1,2}\.$/.test(trimmed)) return true;
  return false;
}

export function getSafeDemoPatientLabel(
  appointment: {
    patientName?: string;
    patientLabel?: string;
    patientId?: string;
  },
  patientsById?: Map<string, DemoPatientNameLookup>
): string {
  const rawName = appointment.patientName?.trim();
  if (rawName && /^DEMO/i.test(rawName)) {
    return rawName;
  }

  if (appointment.patientId && patientsById) {
    const patient = patientsById.get(appointment.patientId);
    if (patient) {
      const fullName = `${patient.firstName} ${patient.lastName}`.trim();
      if (/^DEMO/i.test(patient.firstName)) {
        return fullName;
      }
    }
  }

  const label = appointment.patientLabel?.trim();
  if (label && /^DEMO/i.test(label) && !isBrokenAbbreviatedDemoLabel(label)) {
    return label;
  }

  if (rawName && !/^DEMO/i.test(rawName)) {
    return "Cliniko patient";
  }

  return "DEMO patient";
}

export function isRealClinikoAppointment(item: LiveDemoAppointmentCandidate): boolean {
  const id = String(item.clinikoId ?? item.id ?? "").trim();
  if (!id || id === "unknown") return false;
  if (PLACEHOLDER_ID_PATTERN.test(id)) return false;
  if (!/^\d+$/.test(id)) return false;

  const startsAt = item.startsAt ?? item.startTime ?? item.appointmentStart;
  if (!startsAt || !String(startsAt).trim()) return false;

  if (item.source === "demo") return false;

  return true;
}

export function hasDemoPatientName(
  appointment: Pick<ClinikoIndividualAppointmentLike, "patientName" | "patientLabel">
): boolean {
  const name =
    appointment.patientName?.trim() ??
    appointment.patientLabel?.trim() ??
    "";
  return /^DEMO/i.test(name) && !isBrokenAbbreviatedDemoLabel(name);
}

export function matchesDemoPatientById(
  appointment: Pick<ClinikoIndividualAppointmentLike, "patientId">,
  demoPatientIds: Set<string>
): boolean {
  return Boolean(
    appointment.patientId && demoPatientIds.has(appointment.patientId)
  );
}

export function isLiveDemoClinikoAppointment(
  appointment: ClinikoIndividualAppointmentLike,
  demoPatientIds: Set<string>
): boolean {
  if (!isRealClinikoAppointment({
    id: appointment.id,
    clinikoId: appointment.id,
    startsAt: appointment.startsAt,
    source: appointment.source === "cliniko-test" ? "cliniko-test-account" : appointment.source,
    rawType: "individual_appointment",
  })) {
    return false;
  }

  if (appointment.cancelledAt || appointment.archivedAt) {
    return false;
  }

  return (
    matchesDemoPatientById(appointment, demoPatientIds) ||
    hasDemoPatientName(appointment)
  );
}

export function shortenClinikoId(id: string): string {
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

export interface LiveDemoAppointmentFilterResult<T> {
  appointments: T[];
  returnedByCliniko: number;
  excludedInvalid: number;
  displayed: number;
  warnings: string[];
}

export function partitionLiveDemoAppointments(
  rawAppointments: ClinikoIndividualAppointmentLike[],
  demoPatientIds: Set<string>
): {
  accepted: ClinikoIndividualAppointmentLike[];
  excluded: ClinikoIndividualAppointmentLike[];
  warnings: string[];
} {
  const accepted: ClinikoIndividualAppointmentLike[] = [];
  const excluded: ClinikoIndividualAppointmentLike[] = [];
  const warnings: string[] = [];

  for (const appointment of rawAppointments) {
    if (isLiveDemoClinikoAppointment(appointment, demoPatientIds)) {
      accepted.push(appointment);
      if (
        hasDemoPatientName(appointment) &&
        !matchesDemoPatientById(appointment, demoPatientIds)
      ) {
        warnings.push(
          `Appointment ${shortenClinikoId(appointment.id)} has a DEMO patient name but is not linked to a current test lab patient_id — re-create or re-link in Cliniko for reliable filtering.`
        );
      }
      continue;
    }

    excluded.push(appointment);
    if (!isRealClinikoAppointment({
      id: appointment.id,
      clinikoId: appointment.id,
      startsAt: appointment.startsAt,
      source: appointment.source,
    })) {
      warnings.push(
        "Excluded non-Cliniko appointment placeholder from live appointment list."
      );
    }
  }

  return { accepted, excluded, warnings: [...new Set(warnings)] };
}
