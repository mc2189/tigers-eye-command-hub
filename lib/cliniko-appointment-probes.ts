import "server-only";

import { ClinikoApiError } from "@/lib/cliniko-api-error";
import {
  getSafeDemoPatientLabel,
  isLiveDemoClinikoAppointment,
} from "@/lib/cliniko-demo-appointments";
import {
  buildClinikoDateTime,
  buildClinikoQFilter,
  buildIndividualAppointmentsPath,
  offsetClinikoDate,
} from "@/lib/cliniko-query";
import {
  clinikoFetch,
  getClinikoConfig,
  parseIndividualAppointment,
  type ClinikoIndividualAppointment,
} from "@/lib/cliniko";

export interface AppointmentProbeSample {
  id: string;
  patientLabel: string;
  patientId?: string;
  startsAt?: string;
  appointmentType?: string;
  practitioner?: string;
  business?: string;
  cancelledAt?: string | null;
  archivedAt?: string | null;
  deletedAt?: string | null;
}

export interface AppointmentProbeResult {
  name: string;
  endpoint: string;
  ok: boolean;
  httpStatus?: number;
  totalEntries?: number;
  returnedCount: number;
  demoMatchCount: number;
  sample: AppointmentProbeSample[];
  error?: string;
}

export interface AppointmentProbeReport {
  ok: boolean;
  generatedAt: string;
  shard: string | null;
  probes: AppointmentProbeResult[];
  conclusion: string;
  message: string;
}

export interface AppointmentLookupResult {
  ok: boolean;
  appointmentId: string;
  endpoint: string;
  httpStatus?: number;
  readable: boolean;
  isDemoPatient: boolean;
  canMap: boolean;
  appointment?: AppointmentProbeSample;
  error?: string;
  message: string;
}

export interface ProbePatientRecord {
  id: string;
  firstName: string;
  lastName: string;
}

function isDemoPatientName(firstName?: string | null): boolean {
  return Boolean(firstName?.trim().toUpperCase().startsWith("DEMO"));
}
function patientsByIdMap(
  patients: ProbePatientRecord[]
): Map<string, ProbePatientRecord> {
  return new Map(patients.map((patient) => [patient.id, patient]));
}

function toProbeSample(
  appointment: ClinikoIndividualAppointment,
  patientsById: Map<string, ProbePatientRecord>,
  raw?: Record<string, unknown>
): AppointmentProbeSample {
  return {
    id: appointment.id,
    patientLabel: getSafeDemoPatientLabel(appointment, patientsById),
    patientId: appointment.patientId,
    startsAt: appointment.startsAt || undefined,
    appointmentType: appointment.appointmentTypeName,
    practitioner: appointment.practitionerName,
    business: appointment.businessName,
    cancelledAt: appointment.cancelledAt ?? null,
    archivedAt: appointment.archivedAt ?? null,
    deletedAt: raw?.deleted_at ? String(raw.deleted_at) : null,
  };
}

function countDemoMatches(
  appointments: ClinikoIndividualAppointment[],
  demoPatientIds: Set<string>
): number {
  return appointments.filter(
    (appointment) =>
      appointment.patientId && demoPatientIds.has(appointment.patientId)
  ).length;
}

async function runListProbe(
  name: string,
  path: string,
  demoPatientIds: Set<string>,
  patientsById: Map<string, ProbePatientRecord>
): Promise<AppointmentProbeResult> {
  try {
    const raw = await clinikoFetch<{
      individual_appointments?: Record<string, unknown>[];
      total_entries?: number;
    }>(path);

    const rows = raw.individual_appointments ?? [];
    const appointments = rows.map((row) => parseIndividualAppointment(row));

    return {
      name,
      endpoint: path,
      ok: true,
      httpStatus: 200,
      totalEntries: raw.total_entries ?? appointments.length,
      returnedCount: appointments.length,
      demoMatchCount: countDemoMatches(appointments, demoPatientIds),
      sample: appointments.slice(0, 5).map((appointment, index) =>
        toProbeSample(appointment, patientsById, rows[index])
      ),
    };
  } catch (err) {
    const apiError = err instanceof ClinikoApiError ? err : null;
    return {
      name,
      endpoint: path,
      ok: false,
      httpStatus: apiError?.status,
      returnedCount: 0,
      demoMatchCount: 0,
      sample: [],
      error: apiError?.clinikoMessage ?? apiError?.message ?? "Probe failed.",
    };
  }
}

export function deriveProbeConclusion(probes: AppointmentProbeResult[]): string {
  const unfiltered = probes.find((probe) => probe.name === "Unfiltered");
  const futureWindow = probes.find((probe) => probe.name === "Future window");
  const createdRecently = probes.find((probe) => probe.name === "Created recently");
  const patientProbes = probes.filter((probe) => probe.name.startsWith("Patient "));

  const anyReturned = probes.some((probe) => probe.ok && probe.returnedCount > 0);
  const anyDemoMatch = probes.some((probe) => probe.demoMatchCount > 0);
  const patientHasMatches = patientProbes.some((probe) => probe.demoMatchCount > 0);

  if (!anyReturned) {
    return "The API key/user cannot see these appointments, or they are not individual appointments in the API response. Check business/practitioner/account context.";
  }

  if (unfiltered?.ok && unfiltered.returnedCount > 0 && !anyDemoMatch) {
    return "Cliniko is returning appointments, but DEMO patient matching is too strict.";
  }

  if (patientHasMatches) {
    return "Use patient_id filter for DEMO appointment read-back.";
  }

  if (
    futureWindow?.ok &&
    futureWindow.returnedCount === 0 &&
    unfiltered?.ok &&
    (unfiltered.returnedCount ?? 0) > 0
  ) {
    return "Date window/filter syntax is wrong or too narrow.";
  }

  if (createdRecently?.ok && createdRecently.returnedCount > 0) {
    return "Use created_at probe to locate new test appointments, then map by patient_id.";
  }

  if (anyDemoMatch) {
    return "DEMO appointments were found by at least one probe. Prefer patient_id-specific queries for read-back.";
  }

  return "Cliniko returned appointments, but none matched DEMO patients on patient_id. Check that manual appointments are linked to DEMO patients.";
}

export async function probeIndividualAppointments(input: {
  patients: ProbePatientRecord[];
  businessId?: string;
  practitionerId?: string;
}): Promise<AppointmentProbeReport> {
  const config = getClinikoConfig();
  const generatedAt = new Date().toISOString();
  const demoPatientIds = new Set(input.patients.map((patient) => patient.id));
  const patientsById = patientsByIdMap(input.patients);

  if (!config.apiKey) {
    return {
      ok: false,
      generatedAt,
      shard: config.shard,
      probes: [],
      conclusion: "Cliniko API key is not configured.",
      message: "Cannot run discovery probes without Cliniko configuration.",
    };
  }

  const now = new Date();
  const probes: AppointmentProbeResult[] = [];

  probes.push(
    await runListProbe(
      "Unfiltered",
      buildIndividualAppointmentsPath({
        page: 1,
        perPage: 100,
        sort: "starts_at:desc",
      }),
      demoPatientIds,
      patientsById
    )
  );

  probes.push(
    await runListProbe(
      "Future window",
      buildIndividualAppointmentsPath({
        page: 1,
        perPage: 100,
        sort: "starts_at:asc",
        qFilters: [
          buildClinikoQFilter("starts_at", ":>=", offsetClinikoDate(-7, now)),
          buildClinikoQFilter("starts_at", ":<=", offsetClinikoDate(90, now)),
        ],
      }),
      demoPatientIds,
      patientsById
    )
  );

  for (const patient of input.patients) {
    probes.push(
      await runListProbe(
        `Patient ${patient.firstName} ${patient.lastName}`,
        buildIndividualAppointmentsPath({
          page: 1,
          perPage: 100,
          sort: "starts_at:desc",
          qFilters: [buildClinikoQFilter("patient_id", ":=", patient.id)],
        }),
        demoPatientIds,
        patientsById
      )
    );
  }

  if (input.businessId) {
    probes.push(
      await runListProbe(
        "Business",
        buildIndividualAppointmentsPath({
          page: 1,
          perPage: 100,
          sort: "starts_at:desc",
          qFilters: [buildClinikoQFilter("business_id", ":=", input.businessId)],
        }),
        demoPatientIds,
        patientsById
      )
    );
  }

  if (input.practitionerId) {
    probes.push(
      await runListProbe(
        "Practitioner",
        buildIndividualAppointmentsPath({
          page: 1,
          perPage: 100,
          sort: "starts_at:desc",
          qFilters: [
            buildClinikoQFilter("practitioner_id", ":=", input.practitionerId),
          ],
        }),
        demoPatientIds,
        patientsById
      )
    );
  }

  probes.push(
    await runListProbe(
      "Created recently",
      buildIndividualAppointmentsPath({
        page: 1,
        perPage: 100,
        sort: "created_at:desc",
        qFilters: [
          buildClinikoQFilter("created_at", ":>=", offsetClinikoDate(-7, now)),
        ],
      }),
      demoPatientIds,
      patientsById
    )
  );

  const conclusion = deriveProbeConclusion(probes);
  const demoMatches = probes.reduce((sum, probe) => sum + probe.demoMatchCount, 0);

  return {
    ok: true,
    generatedAt,
    shard: config.shard,
    probes,
    conclusion,
    message:
      demoMatches > 0
        ? `Discovery found ${demoMatches} DEMO appointment match(es) across probes.`
        : "Discovery completed — no DEMO appointment matches yet.",
  };
}

export async function lookupIndividualAppointmentById(input: {
  appointmentId: string;
  patients: ProbePatientRecord[];
}): Promise<AppointmentLookupResult> {
  const appointmentId = input.appointmentId.trim();
  const endpoint = `/individual_appointments/${appointmentId}`;
  const patientsById = patientsByIdMap(input.patients);
  const demoPatientIds = new Set(input.patients.map((patient) => patient.id));

  if (!appointmentId || !/^\d+$/.test(appointmentId)) {
    return {
      ok: false,
      appointmentId,
      endpoint,
      readable: false,
      isDemoPatient: false,
      canMap: false,
      message: "Enter a numeric Cliniko appointment ID.",
      error: "Invalid appointment ID format.",
    };
  }

  try {
    const raw = await clinikoFetch<{ individual_appointment?: Record<string, unknown> }>(
      endpoint
    );
    const row = raw.individual_appointment ?? (raw as Record<string, unknown>);
    const appointment = parseIndividualAppointment(row);
    const linkedPatient = appointment.patientId
      ? patientsById.get(appointment.patientId)
      : undefined;
    const isDemoPatient = Boolean(
      linkedPatient && isDemoPatientName(linkedPatient.firstName)
    );
    const canMap = isLiveDemoClinikoAppointment(appointment, demoPatientIds);

    return {
      ok: true,
      appointmentId,
      endpoint,
      httpStatus: 200,
      readable: true,
      isDemoPatient,
      canMap,
      appointment: toProbeSample(appointment, patientsById, row),
      message: canMap
        ? "Cliniko returned this appointment and it maps to a live DEMO test lab row."
        : isDemoPatient
          ? "Cliniko returned this appointment for a DEMO patient, but it is cancelled/archived or missing required fields."
          : "Cliniko returned this appointment, but it is not linked to a DEMO patient in the test lab.",
    };
  } catch (err) {
    const apiError = err instanceof ClinikoApiError ? err : null;
    return {
      ok: false,
      appointmentId,
      endpoint,
      httpStatus: apiError?.status,
      readable: false,
      isDemoPatient: false,
      canMap: false,
      error: apiError?.clinikoMessage ?? apiError?.message ?? "Lookup failed.",
      message: "Cliniko could not return this appointment ID.",
    };
  }
}

export async function fetchDemoAppointmentsMerged(input: {
  patients: ProbePatientRecord[];
}): Promise<{
  appointments: ClinikoIndividualAppointment[];
  probeNotes: string[];
}> {
  const demoPatientIds = new Set(input.patients.map((patient) => patient.id));
  const byId = new Map<string, ClinikoIndividualAppointment>();
  const probeNotes: string[] = [];
  const now = new Date();

  async function mergeFromPath(label: string, path: string) {
    try {
      const raw = await clinikoFetch<{
        individual_appointments?: Record<string, unknown>[];
      }>(path);
      const rows = raw.individual_appointments ?? [];
      for (const row of rows) {
        const appointment = parseIndividualAppointment(row);
        byId.set(appointment.id, appointment);
      }
      probeNotes.push(`${label}: ${rows.length} row(s)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "fetch failed";
      probeNotes.push(`${label}: ${message}`);
    }
  }

  for (const patient of input.patients) {
    await mergeFromPath(
      `patient_id ${patient.id}`,
      buildIndividualAppointmentsPath({
        page: 1,
        perPage: 100,
        sort: "starts_at:desc",
        qFilters: [buildClinikoQFilter("patient_id", ":=", patient.id)],
      })
    );
  }

  await mergeFromPath(
    "future window",
    buildIndividualAppointmentsPath({
      page: 1,
      perPage: 100,
      sort: "starts_at:asc",
      qFilters: [
        buildClinikoQFilter("starts_at", ":>=", offsetClinikoDate(-7, now)),
        buildClinikoQFilter("starts_at", ":<=", offsetClinikoDate(90, now)),
      ],
    })
  );

  await mergeFromPath(
    "created recently",
    buildIndividualAppointmentsPath({
      page: 1,
      perPage: 100,
      sort: "created_at:desc",
      qFilters: [buildClinikoQFilter("created_at", ":>=", offsetClinikoDate(-7, now))],
    })
  );

  await mergeFromPath(
    "unfiltered",
    buildIndividualAppointmentsPath({
      page: 1,
      perPage: 100,
      sort: "starts_at:desc",
    })
  );

  const merged = [...byId.values()].filter((appointment) =>
    isLiveDemoClinikoAppointment(appointment, demoPatientIds)
  );

  if (merged.length === 0 && byId.size > 0) {
    probeNotes.push(
      "Cliniko returned appointments, but none passed live DEMO validation (patient_id, active status, numeric id)."
    );
  }

  return { appointments: merged, probeNotes };
}
