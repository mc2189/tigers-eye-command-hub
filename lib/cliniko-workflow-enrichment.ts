import "server-only";

import type { ClinikoIndividualAppointment } from "@/lib/cliniko";
import {
  clinikoFetch,
  getAppointmentTypes,
  getBusinesses,
  getPractitioners,
} from "@/lib/cliniko";
import {
  getSafeDemoPatientLabel,
  type DemoPatientNameLookup,
} from "@/lib/cliniko-demo-appointments";

import {
  GENERIC_APPOINTMENT_TYPE,
  GENERIC_LOCATION,
  GENERIC_PRACTITIONER,
  isGenericAppointmentType,
  isGenericLocation,
  isGenericPractitioner,
} from "@/lib/cliniko-display-labels";
import type {
  ClinikoAppointmentTypeInput,
  ClinikoBusinessInput,
  ClinikoIndividualAppointmentInput,
  ClinikoPractitionerInput,
} from "@/lib/cliniko-mappers";

async function fetchDemoPatientsById(): Promise<Map<string, DemoPatientNameLookup>> {
  try {
    const raw = await clinikoFetch<{ patients?: Record<string, unknown>[] }>(
      "/patients?per_page=100&sort=created_at:desc"
    );
    const map = new Map<string, DemoPatientNameLookup>();
    for (const row of raw.patients ?? []) {
      const id = String(row.id ?? "").trim();
      const firstName = String(row.first_name ?? "").trim();
      const lastName = String(row.last_name ?? "").trim();
      if (!id || !/^DEMO/i.test(firstName)) continue;
      map.set(id, { firstName, lastName });
    }
    return map;
  } catch {
    return new Map();
  }
}

function resolveAppointmentTypeName(
  appointment: ClinikoIndividualAppointment,
  types: ClinikoAppointmentTypeInput[]
): string {
  if (!isGenericAppointmentType(appointment.appointmentTypeName)) {
    return appointment.appointmentTypeName!.trim();
  }
  if (appointment.appointmentTypeId) {
    const match = types.find((t) => t.id === appointment.appointmentTypeId);
    if (match?.name?.trim()) return match.name.trim();
  }
  return GENERIC_APPOINTMENT_TYPE;
}

function resolvePractitionerName(
  appointment: ClinikoIndividualAppointment,
  practitioners: ClinikoPractitionerInput[]
): string {
  if (!isGenericPractitioner(appointment.practitionerName)) {
    return appointment.practitionerName!.trim();
  }
  if (appointment.practitionerId) {
    const match = practitioners.find((p) => p.id === appointment.practitionerId);
    if (match?.name?.trim()) return match.name.trim();
  }
  return GENERIC_PRACTITIONER;
}

function resolveBusinessName(
  appointment: ClinikoIndividualAppointment,
  businesses: ClinikoBusinessInput[]
): string {
  if (!isGenericLocation(appointment.businessName)) {
    return appointment.businessName!.trim();
  }
  if (appointment.businessId) {
    const match = businesses.find((b) => b.id === appointment.businessId);
    if (match?.name?.trim()) return match.name.trim();
  }
  return GENERIC_LOCATION;
}

function resolvePatientFields(
  appointment: ClinikoIndividualAppointment,
  patientsById: Map<string, DemoPatientNameLookup>
): { patientName?: string; patientLabel: string } {
  const patientName = appointment.patientName?.trim();
  const label = getSafeDemoPatientLabel(
    {
      patientName,
      patientLabel: patientName ?? appointment.patientLabel,
      patientId: appointment.patientId,
    },
    patientsById
  );
  return {
    patientName: patientName && /^DEMO/i.test(patientName) ? patientName : undefined,
    patientLabel: label,
  };
}

export function appointmentHasDisplayQualityIssue(
  appointment: ClinikoIndividualAppointmentInput
): boolean {
  return (
    isGenericAppointmentType(appointment.appointmentTypeName) ||
    isGenericPractitioner(appointment.practitionerName) ||
    isGenericLocation(appointment.businessName) ||
    !appointment.patientLabel?.trim() ||
    appointment.patientLabel === "DEMO patient" ||
    appointment.patientLabel === "Cliniko patient"
  );
}

export function enrichIndividualAppointment(
  appointment: ClinikoIndividualAppointment,
  refs: {
    appointmentTypes: ClinikoAppointmentTypeInput[];
    practitioners: ClinikoPractitionerInput[];
    businesses: ClinikoBusinessInput[];
    patientsById: Map<string, DemoPatientNameLookup>;
  }
): ClinikoIndividualAppointmentInput {
  const { patientName, patientLabel } = resolvePatientFields(
    appointment,
    refs.patientsById
  );

  return {
    id: appointment.id,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt ?? appointment.startsAt,
    patientId: appointment.patientId,
    patientName,
    patientLabel,
    appointmentTypeId: appointment.appointmentTypeId,
    appointmentTypeName: resolveAppointmentTypeName(appointment, refs.appointmentTypes),
    practitionerId: appointment.practitionerId,
    practitionerName: resolvePractitionerName(appointment, refs.practitioners),
    businessId: appointment.businessId,
    businessName: resolveBusinessName(appointment, refs.businesses),
    noteStatus: appointment.noteStatus,
    invoiceStatus: appointment.invoiceStatus,
    telehealthUrl: appointment.telehealthUrl,
    cancelledAt: appointment.cancelledAt,
    archivedAt: appointment.archivedAt,
    source: "cliniko-test",
  };
}

export async function enrichIndividualAppointmentsForWorkflow(
  appointments: ClinikoIndividualAppointment[]
): Promise<{
  appointments: ClinikoIndividualAppointmentInput[];
  hasDisplayQualityIssues: boolean;
}> {
  if (appointments.length === 0) {
    return { appointments: [], hasDisplayQualityIssues: false };
  }

  const [typesResult, practitionersResult, businessesResult, patientsById] =
    await Promise.all([
      getAppointmentTypes(),
      getPractitioners(),
      getBusinesses(),
      fetchDemoPatientsById(),
    ]);

  const refs = {
    appointmentTypes: typesResult.data ?? [],
    practitioners: practitionersResult.data ?? [],
    businesses: businessesResult.data ?? [],
    patientsById,
  };

  const enriched = appointments.map((appointment) =>
    enrichIndividualAppointment(appointment, refs)
  );

  return {
    appointments: enriched,
    hasDisplayQualityIssues: enriched.some(appointmentHasDisplayQualityIssue),
  };
}
