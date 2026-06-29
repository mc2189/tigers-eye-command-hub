import "server-only";

import {
  clinikoFetch,
  getAppointmentTypes,
  getBookings,
  getBusinesses,
  getClinikoConfig,
  getPractitioners,
} from "@/lib/cliniko";

export const DEMO_PATIENT_FIRST_NAME_PREFIX = "DEMO";
export const DEMO_EMAIL_DOMAIN = "demo.tigerseye.test";

export interface DemoPatientRecord {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  archived?: boolean;
}

export interface DemoAppointmentRecord {
  id: string;
  patientId?: string;
  patientLabel?: string;
  startsAt: string;
  endsAt?: string;
  appointmentTypeName?: string;
  businessName?: string;
  cancelled?: boolean;
}

export interface DemoTestLabSnapshot {
  ok: boolean;
  mode: "live" | "demo" | "unavailable";
  writesEnabled: boolean;
  message?: string;
  patients: DemoPatientRecord[];
  appointments: DemoAppointmentRecord[];
  defaults?: {
    businessId?: string;
    practitionerId?: string;
    appointmentTypeId?: string;
  };
}

export interface DemoTestLabActionResult {
  ok: boolean;
  action: string;
  mode: "live" | "demo" | "blocked";
  message: string;
  patient?: DemoPatientRecord;
  appointment?: DemoAppointmentRecord;
  cleaned?: { patients: number; appointments: number };
}

function writesAllowed(): { ok: true } | { ok: false; message: string } {
  const config = getClinikoConfig();
  if (!config.apiKey) {
    return { ok: false, message: "Cliniko API key not configured." };
  }
  if (!config.writesEnabled) {
    return {
      ok: false,
      message: "Cliniko writes disabled. Set CLINIKO_ENABLE_WRITES=true for the test account.",
    };
  }
  return { ok: true };
}

export function isDemoPatientName(firstName?: string | null): boolean {
  return Boolean(firstName?.trim().toUpperCase().startsWith(DEMO_PATIENT_FIRST_NAME_PREFIX));
}

export function buildDemoPatientIdentity(sequence: number) {
  const suffix = String(sequence).padStart(3, "0");
  return {
    firstName: `${DEMO_PATIENT_FIRST_NAME_PREFIX} Test`,
    lastName: `Patient ${suffix}`,
    email: `demo.patient.${suffix}@${DEMO_EMAIL_DOMAIN}`,
  };
}

function mapPatient(raw: Record<string, unknown>): DemoPatientRecord {
  return {
    id: String(raw.id ?? ""),
    firstName: String(raw.first_name ?? ""),
    lastName: String(raw.last_name ?? ""),
    email: raw.email as string | undefined,
    archived: Boolean(raw.archived_at),
  };
}

function mapAppointment(raw: Record<string, unknown>): DemoAppointmentRecord {
  return {
    id: String(raw.id ?? ""),
    patientId: raw.patient_id ? String(raw.patient_id) : undefined,
    patientLabel: raw.patient_name as string | undefined,
    startsAt: String(raw.starts_at ?? ""),
    endsAt: raw.ends_at ? String(raw.ends_at) : undefined,
    appointmentTypeName: raw.appointment_type_name as string | undefined,
    businessName: raw.business_name as string | undefined,
    cancelled: Boolean(raw.cancelled_at),
  };
}

async function fetchDemoPatientsLive(): Promise<DemoPatientRecord[]> {
  const raw = await clinikoFetch<{
    patients?: Record<string, unknown>[];
  }>("/patients?per_page=100&sort=created_at:desc");

  return (raw.patients ?? [])
    .map(mapPatient)
    .filter((p) => isDemoPatientName(p.firstName) && !p.archived);
}

async function fetchDemoAppointmentsLive(
  patientIds: Set<string>
): Promise<DemoAppointmentRecord[]> {
  if (patientIds.size === 0) return [];

  const from = new Date();
  from.setDate(from.getDate() - 7);
  const to = new Date();
  to.setDate(to.getDate() + 30);

  const query = new URLSearchParams({
    per_page: "100",
  });
  query.append("q[]", `starts_at:>=${from.toISOString()}`);
  query.append("q[]", `starts_at:<=${to.toISOString()}`);

  const raw = await clinikoFetch<{
    individual_appointments?: Record<string, unknown>[];
  }>(`/individual_appointments?${query.toString()}`);

  return (raw.individual_appointments ?? [])
    .map(mapAppointment)
    .filter((a) => a.patientId && patientIds.has(a.patientId));
}

async function resolveDefaults(): Promise<{
  businessId?: string;
  practitionerId?: string;
  appointmentTypeId?: string;
}> {
  const [businesses, practitioners, types] = await Promise.all([
    getBusinesses(),
    getPractitioners(),
    getAppointmentTypes(),
  ]);

  return {
    businessId: businesses.data?.[0]?.id,
    practitionerId: practitioners.data?.[0]?.id,
    appointmentTypeId: types.data?.find((t) => !t.archived)?.id ?? types.data?.[0]?.id,
  };
}

async function assertDemoPatient(patientId: string): Promise<DemoPatientRecord> {
  const raw = await clinikoFetch<{ patient?: Record<string, unknown> }>(
    `/patients/${patientId}`
  );
  const patient = mapPatient(raw.patient ?? (raw as Record<string, unknown>));
  if (!isDemoPatientName(patient.firstName)) {
    throw new Error("Only DEMO-prefixed test patients can be modified.");
  }
  return patient;
}

export async function getDemoTestLabSnapshot(): Promise<DemoTestLabSnapshot> {
  const config = getClinikoConfig();

  if (!config.apiKey) {
    return {
      ok: true,
      mode: "demo",
      writesEnabled: config.writesEnabled,
      message: "No Cliniko API key — test lab preview uses demo fallbacks only.",
      patients: [],
      appointments: [],
    };
  }

  try {
    const patients = await fetchDemoPatientsLive();
    const patientIds = new Set(patients.map((p) => p.id));
    const appointments = await fetchDemoAppointmentsLive(patientIds);
    const defaults = await resolveDefaults();

    return {
      ok: true,
      mode: "live",
      writesEnabled: config.writesEnabled,
      patients,
      appointments,
      defaults,
    };
  } catch (err) {
    return {
      ok: false,
      mode: "unavailable",
      writesEnabled: config.writesEnabled,
      message: err instanceof Error ? err.message : "Could not load test lab data.",
      patients: [],
      appointments: [],
    };
  }
}

export async function createDemoPatient(): Promise<DemoTestLabActionResult> {
  const gate = writesAllowed();
  if (!gate.ok) {
    return { ok: false, action: "create-patient", mode: "blocked", message: gate.message };
  }

  try {
    const existing = await fetchDemoPatientsLive();
    const identity = buildDemoPatientIdentity(existing.length + 1);

    const created = await clinikoFetch<{ patient?: Record<string, unknown> }>("/patients", {
      method: "POST",
      body: JSON.stringify({
        first_name: identity.firstName,
        last_name: identity.lastName,
        email: identity.email,
      }),
    });

    const patient = mapPatient(created.patient ?? (created as Record<string, unknown>));
    return {
      ok: true,
      action: "create-patient",
      mode: "live",
      message: `Created fake demo patient ${patient.firstName} ${patient.lastName}.`,
      patient,
    };
  } catch (err) {
    return {
      ok: false,
      action: "create-patient",
      mode: "live",
      message: err instanceof Error ? err.message : "Failed to create demo patient.",
    };
  }
}

export async function updateDemoPatient(
  patientId: string,
  updates: { lastName?: string }
): Promise<DemoTestLabActionResult> {
  const gate = writesAllowed();
  if (!gate.ok) {
    return { ok: false, action: "update-patient", mode: "blocked", message: gate.message };
  }

  try {
    const current = await assertDemoPatient(patientId);
    const lastName = updates.lastName ?? `${current.lastName} (updated)`;

    const updated = await clinikoFetch<{ patient?: Record<string, unknown> }>(
      `/patients/${patientId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ last_name: lastName }),
      }
    );

    const patient = mapPatient(updated.patient ?? (updated as Record<string, unknown>));
    return {
      ok: true,
      action: "update-patient",
      mode: "live",
      message: `Updated demo patient ${patient.firstName} ${patient.lastName}.`,
      patient,
    };
  } catch (err) {
    return {
      ok: false,
      action: "update-patient",
      mode: "live",
      message: err instanceof Error ? err.message : "Failed to update demo patient.",
    };
  }
}

export async function createDemoAppointment(input?: {
  patientId?: string;
  businessId?: string;
  practitionerId?: string;
  appointmentTypeId?: string;
}): Promise<DemoTestLabActionResult> {
  const gate = writesAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      action: "create-appointment",
      mode: "blocked",
      message: gate.message,
    };
  }

  try {
    const defaults = await resolveDefaults();
    const patientId = input?.patientId;
    if (!patientId) {
      return {
        ok: false,
        action: "create-appointment",
        mode: "blocked",
        message: "Select a DEMO test patient first.",
      };
    }

    await assertDemoPatient(patientId);

    const businessId = input?.businessId ?? defaults.businessId;
    const practitionerId = input?.practitionerId ?? defaults.practitionerId;
    const appointmentTypeId = input?.appointmentTypeId ?? defaults.appointmentTypeId;

    if (!businessId || !practitionerId || !appointmentTypeId) {
      return {
        ok: false,
        action: "create-appointment",
        mode: "blocked",
        message: "Could not resolve Cliniko business, practitioner or appointment type.",
      };
    }

    const starts = new Date();
    starts.setDate(starts.getDate() + 2);
    starts.setHours(10, 0, 0, 0);

    const created = await clinikoFetch<{ individual_appointment?: Record<string, unknown> }>(
      "/individual_appointments",
      {
        method: "POST",
        body: JSON.stringify({
          patient_id: patientId,
          business_id: businessId,
          practitioner_id: practitionerId,
          appointment_type_id: appointmentTypeId,
          starts_at: starts.toISOString(),
          notes: "DEMO appointment created by Tigers Eye Command Hub test lab.",
        }),
      }
    );

    const appointment = mapAppointment(
      created.individual_appointment ?? (created as Record<string, unknown>)
    );

    return {
      ok: true,
      action: "create-appointment",
      mode: "live",
      message: `Created fake demo appointment on ${appointment.startsAt}.`,
      appointment,
    };
  } catch (err) {
    return {
      ok: false,
      action: "create-appointment",
      mode: "live",
      message: err instanceof Error ? err.message : "Failed to create demo appointment.",
    };
  }
}

export async function cancelDemoAppointment(
  appointmentId: string
): Promise<DemoTestLabActionResult> {
  const gate = writesAllowed();
  if (!gate.ok) {
    return {
      ok: false,
      action: "cancel-appointment",
      mode: "blocked",
      message: gate.message,
    };
  }

  try {
    const raw = await clinikoFetch<{ individual_appointment?: Record<string, unknown> }>(
      `/individual_appointments/${appointmentId}`
    );
    const appointment = mapAppointment(
      raw.individual_appointment ?? (raw as Record<string, unknown>)
    );

    if (appointment.patientId) {
      await assertDemoPatient(appointment.patientId);
    }

    await clinikoFetch(`/individual_appointments/${appointmentId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({
        cancellation_reason: 50,
        cancellation_note: "DEMO cleanup — Tigers Eye Command Hub test lab.",
        apply_to_repeats: false,
      }),
    });

    return {
      ok: true,
      action: "cancel-appointment",
      mode: "live",
      message: `Cancelled demo appointment ${appointmentId}.`,
      appointment: { ...appointment, cancelled: true },
    };
  } catch (err) {
    return {
      ok: false,
      action: "cancel-appointment",
      mode: "live",
      message: err instanceof Error ? err.message : "Failed to cancel demo appointment.",
    };
  }
}

export async function archiveDemoPatient(patientId: string): Promise<DemoTestLabActionResult> {
  const gate = writesAllowed();
  if (!gate.ok) {
    return { ok: false, action: "archive-patient", mode: "blocked", message: gate.message };
  }

  try {
    await assertDemoPatient(patientId);

    await clinikoFetch(`/patients/${patientId}`, { method: "DELETE" });

    return {
      ok: true,
      action: "archive-patient",
      mode: "live",
      message: `Archived demo patient ${patientId}.`,
    };
  } catch (err) {
    return {
      ok: false,
      action: "archive-patient",
      mode: "live",
      message: err instanceof Error ? err.message : "Failed to archive demo patient.",
    };
  }
}

export async function cleanupDemoTestData(): Promise<DemoTestLabActionResult> {
  const gate = writesAllowed();
  if (!gate.ok) {
    return { ok: false, action: "cleanup", mode: "blocked", message: gate.message };
  }

  try {
    const patients = await fetchDemoPatientsLive();
    const patientIds = new Set(patients.map((p) => p.id));
    const appointments = await fetchDemoAppointmentsLive(patientIds);

    let cancelledAppointments = 0;
    for (const appointment of appointments) {
      if (appointment.cancelled) continue;
      const result = await cancelDemoAppointment(appointment.id);
      if (result.ok) cancelledAppointments += 1;
    }

    let archivedPatients = 0;
    for (const patient of patients) {
      const result = await archiveDemoPatient(patient.id);
      if (result.ok) archivedPatients += 1;
    }

    return {
      ok: true,
      action: "cleanup",
      mode: "live",
      message: `Cleanup complete — cancelled ${cancelledAppointments} demo appointment(s) and archived ${archivedPatients} demo patient(s).`,
      cleaned: { patients: archivedPatients, appointments: cancelledAppointments },
    };
  } catch (err) {
    return {
      ok: false,
      action: "cleanup",
      mode: "live",
      message: err instanceof Error ? err.message : "Demo cleanup failed.",
    };
  }
}

export async function getDemoBookingsFallback(): Promise<DemoAppointmentRecord[]> {
  const result = await getBookings({ perPage: 20 });
  return (result.data?.bookings ?? []).map((b) => ({
    id: b.id,
    patientLabel: b.patientLabel,
    startsAt: b.startsAt,
    endsAt: b.endsAt,
    appointmentTypeName: b.appointmentTypeName,
    businessName: b.businessName,
    cancelled: false,
  }));
}
