import "server-only";

import {
  ClinikoApiError,
  classifyAppointmentFailure,
} from "@/lib/cliniko-api-error";
import {
  clinikoFetch,
  fetchNextAvailableTime,
  getAppointmentTypes,
  getBusinesses,
  getClinikoConfig,
  resolvePractitionerForBooking,
  type ClinikoAppointmentType,
  type ClinikoBusiness,
  type PractitionerSourceKind,
} from "@/lib/cliniko";

export const DEMO_PATIENT_FIRST_NAME_PREFIX = "DEMO";
export const DEMO_EMAIL_DOMAIN = "demo.tigerseye.test";

export type ProofStatus = "proven" | "failed" | "not-tested" | "needs-setup";

export type TestLabAction =
  | "create_demo_patient"
  | "update_demo_patient"
  | "archive_demo_patient"
  | "create_demo_appointment"
  | "cancel_demo_appointment"
  | "check_demo_appointments"
  | "cleanup_demo_records";

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

export interface DemoTestLabDiagnostics {
  endpoint?: string;
  httpStatus?: number;
  clinikoMessage?: string;
  likelyCause?: string;
  suggestedFix?: string;
}

export interface DemoTestLabActionResult {
  ok: boolean;
  action: TestLabAction;
  result?: unknown;
  proofStatus: ProofStatus;
  message: string;
  diagnostics?: DemoTestLabDiagnostics;
}

export interface AppointmentPreflightCheck {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface AppointmentPreflightResult {
  ready: boolean;
  checks: AppointmentPreflightCheck[];
}

export interface DemoTestLabSnapshot {
  ok: boolean;
  mode: "live" | "demo" | "unavailable";
  writesEnabled: boolean;
  message?: string;
  patients: DemoPatientRecord[];
  appointments: DemoAppointmentRecord[];
  businesses: ClinikoBusiness[];
  appointmentTypes: ClinikoAppointmentType[];
  practitionerSource: PractitionerSourceKind;
  practitionerBookable: boolean;
  practitionerId?: string;
  practitionerName?: string;
  practitionerSourceLabel: string;
  defaults?: {
    businessId?: string;
    practitionerId?: string;
    appointmentTypeId?: string;
    proposedStartsAt?: string;
  };
  preflight?: AppointmentPreflightResult;
}

function writesAllowed(): { ok: true } | { ok: false; message: string } {
  const config = getClinikoConfig();
  if (!config.apiKey) {
    return { ok: false, message: "Cliniko API key not configured." };
  }
  if (!config.writesEnabled) {
    return {
      ok: false,
      message:
        "Cliniko writes disabled. Set CLINIKO_ENABLE_WRITES=true for the test account.",
    };
  }
  return { ok: true };
}

function practitionerSourceLabel(source: PractitionerSourceKind): string {
  switch (source) {
    case "practitioners":
      return "practitioners endpoint";
    case "users":
      return "users endpoint";
    case "demo":
      return "demo fallback";
    default:
      return "none";
  }
}

function diagnosticsFromError(
  action: string,
  err: unknown,
  endpoint?: string
): DemoTestLabDiagnostics {
  if (err instanceof ClinikoApiError) {
    const classified = classifyAppointmentFailure(
      action,
      err.status,
      err.clinikoMessage
    );
    return {
      endpoint: endpoint ?? err.path,
      httpStatus: err.status,
      clinikoMessage: err.clinikoMessage ?? err.message,
      likelyCause: classified.likelyCause,
      suggestedFix: classified.suggestedFix,
    };
  }

  const message = err instanceof Error ? err.message : "Unknown error";
  const classified = classifyAppointmentFailure(action, undefined, message);
  return {
    endpoint,
    clinikoMessage: message,
    likelyCause: classified.likelyCause,
    suggestedFix: classified.suggestedFix,
  };
}

function actionFailure(
  action: TestLabAction,
  message: string,
  proofStatus: ProofStatus = "failed",
  diagnostics?: DemoTestLabDiagnostics
): DemoTestLabActionResult {
  return { ok: false, action, proofStatus, message, diagnostics };
}

function actionSuccess(
  action: TestLabAction,
  message: string,
  result?: unknown,
  proofStatus: ProofStatus = "proven"
): DemoTestLabActionResult {
  return { ok: true, action, proofStatus, message, result };
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
  to.setDate(to.getDate() + 60);

  const query = new URLSearchParams({ per_page: "100" });
  query.append("q[]", `starts_at:>=${from.toISOString()}`);
  query.append("q[]", `starts_at:<=${to.toISOString()}`);

  const raw = await clinikoFetch<{
    individual_appointments?: Record<string, unknown>[];
  }>(`/individual_appointments?${query.toString()}`);

  return (raw.individual_appointments ?? [])
    .map(mapAppointment)
    .filter((a) => a.patientId && patientIds.has(a.patientId));
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

export async function runAppointmentPreflight(input?: {
  patientId?: string;
  businessId?: string;
  practitionerId?: string;
  appointmentTypeId?: string;
  proposedStartsAt?: string;
}): Promise<AppointmentPreflightResult> {
  const config = getClinikoConfig();
  const checks: AppointmentPreflightCheck[] = [];

  const add = (id: string, label: string, passed: boolean, detail?: string) => {
    checks.push({ id, label, passed, detail });
  };

  add("staff_auth", "Staff authenticated (route protected)", true);
  add(
    "writes_enabled",
    "Cliniko writes enabled",
    config.writesEnabled,
    config.writesEnabled ? undefined : "Set CLINIKO_ENABLE_WRITES=true"
  );
  add(
    "api_key",
    "Cliniko API key configured",
    Boolean(config.apiKey),
    config.apiKey ? undefined : "Add CLINIKO_API_KEY"
  );

  const practitionerResolution = await resolvePractitionerForBooking();
  const practitionerId = input?.practitionerId ?? practitionerResolution.practitionerId;
  add(
    "practitioner",
    "Bookable practitioner available",
    practitionerResolution.bookable && Boolean(practitionerId),
    practitionerResolution.message
  );

  const businesses = await getBusinesses();
  const businessId = input?.businessId ?? businesses.data?.[0]?.id;
  add(
    "business",
    "Business / location exists",
    Boolean(businessId),
    businessId ? undefined : "Add a business in Cliniko"
  );

  const types = await getAppointmentTypes();
  const appointmentType =
    types.data?.find((t) => t.id === input?.appointmentTypeId) ??
    types.data?.find((t) => !t.archived) ??
    types.data?.[0];
  add(
    "appointment_type",
    "Appointment type exists",
    Boolean(appointmentType?.id),
    appointmentType?.id ? undefined : "Create an appointment type in Cliniko"
  );

  if (appointmentType) {
    add(
      "duration",
      "Appointment type has duration",
      Boolean(appointmentType.durationMinutes),
      appointmentType.durationMinutes
        ? `${appointmentType.durationMinutes} min`
        : "Duration may be required by Cliniko"
    );
  }

  add(
    "demo_patient",
    "DEMO patient selected",
    Boolean(input?.patientId),
    input?.patientId ? undefined : "Create a DEMO patient first"
  );

  let proposedStartsAt = input?.proposedStartsAt;
  if (!proposedStartsAt && businessId && practitionerId && appointmentType?.id) {
    const next = await fetchNextAvailableTime({
      businessId,
      practitionerId,
      appointmentTypeId: appointmentType.id,
    });
    proposedStartsAt = next.startsAt;
    add(
      "available_time",
      "Available time found",
      Boolean(proposedStartsAt),
      proposedStartsAt ?? next.message ?? "Set practitioner availability in Cliniko"
    );
  } else if (proposedStartsAt) {
    add("available_time", "Proposed time provided", true, proposedStartsAt);
  } else {
    add(
      "available_time",
      "Available time found",
      false,
      "Could not resolve business, practitioner, and appointment type"
    );
  }

  if (proposedStartsAt) {
    const inFuture = new Date(proposedStartsAt).getTime() > Date.now();
    add(
      "future_time",
      "Proposed time is in the future",
      inFuture,
      inFuture ? proposedStartsAt : "Choose a future appointment time"
    );
  } else {
    add("future_time", "Proposed time is in the future", false);
  }

  return {
    ready: checks.every((c) => c.passed),
    checks,
  };
}

export async function getDemoTestLabSnapshot(input?: {
  patientId?: string;
  businessId?: string;
  practitionerId?: string;
  appointmentTypeId?: string;
}): Promise<DemoTestLabSnapshot> {
  const config = getClinikoConfig();

  if (!config.apiKey) {
    return {
      ok: true,
      mode: "demo",
      writesEnabled: config.writesEnabled,
      message: "No Cliniko API key — test lab preview uses demo fallbacks only.",
      patients: [],
      appointments: [],
      businesses: [],
      appointmentTypes: [],
      practitionerSource: "demo",
      practitionerBookable: false,
      practitionerSourceLabel: practitionerSourceLabel("demo"),
    };
  }

  try {
    const [patients, businessesResult, typesResult, practitionerResolution] =
      await Promise.all([
        fetchDemoPatientsLive(),
        getBusinesses(),
        getAppointmentTypes(),
        resolvePractitionerForBooking(),
      ]);

    const patientIds = new Set(patients.map((p) => p.id));
    const appointments = await fetchDemoAppointmentsLive(patientIds);

    const businessId = input?.businessId ?? businessesResult.data?.[0]?.id;
    const practitionerId =
      input?.practitionerId ?? practitionerResolution.practitionerId;
    const appointmentTypeId =
      input?.appointmentTypeId ??
      typesResult.data?.find((t) => !t.archived)?.id ??
      typesResult.data?.[0]?.id;

    let proposedStartsAt: string | undefined;
    if (businessId && practitionerId && appointmentTypeId && practitionerResolution.bookable) {
      const next = await fetchNextAvailableTime({
        businessId,
        practitionerId,
        appointmentTypeId,
      });
      proposedStartsAt = next.startsAt;
    }

    const preflight = await runAppointmentPreflight({
      patientId: input?.patientId ?? patients[0]?.id,
      businessId,
      practitionerId,
      appointmentTypeId,
      proposedStartsAt,
    });

    return {
      ok: true,
      mode: "live",
      writesEnabled: config.writesEnabled,
      patients,
      appointments,
      businesses: businessesResult.data ?? [],
      appointmentTypes: typesResult.data ?? [],
      practitionerSource: practitionerResolution.source,
      practitionerBookable: practitionerResolution.bookable,
      practitionerId: practitionerResolution.practitionerId,
      practitionerName: practitionerResolution.practitionerName,
      practitionerSourceLabel: practitionerSourceLabel(practitionerResolution.source),
      defaults: {
        businessId,
        practitionerId,
        appointmentTypeId,
        proposedStartsAt,
      },
      preflight,
    };
  } catch (err) {
    return {
      ok: false,
      mode: "unavailable",
      writesEnabled: config.writesEnabled,
      message: err instanceof Error ? err.message : "Could not load test lab data.",
      patients: [],
      appointments: [],
      businesses: [],
      appointmentTypes: [],
      practitionerSource: "none",
      practitionerBookable: false,
      practitionerSourceLabel: practitionerSourceLabel("none"),
    };
  }
}

export async function createDemoPatient(): Promise<DemoTestLabActionResult> {
  const gate = writesAllowed();
  if (!gate.ok) {
    return actionFailure("create_demo_patient", gate.message, "needs-setup");
  }

  const endpoint = "/patients";
  try {
    const existing = await fetchDemoPatientsLive();
    const identity = buildDemoPatientIdentity(existing.length + 1);

    const created = await clinikoFetch<{ patient?: Record<string, unknown> }>(endpoint, {
      method: "POST",
      body: JSON.stringify({
        first_name: identity.firstName,
        last_name: identity.lastName,
        email: identity.email,
      }),
    });

    const patient = mapPatient(created.patient ?? (created as Record<string, unknown>));
    return actionSuccess(
      "create_demo_patient",
      `Created fake demo patient ${patient.firstName} ${patient.lastName}.`,
      { patient }
    );
  } catch (err) {
    return actionFailure(
      "create_demo_patient",
      err instanceof Error ? err.message : "Failed to create demo patient.",
      "failed",
      diagnosticsFromError("create_demo_patient", err, endpoint)
    );
  }
}

export async function updateDemoPatient(
  patientId: string,
  updates: { lastName?: string }
): Promise<DemoTestLabActionResult> {
  const gate = writesAllowed();
  if (!gate.ok) {
    return actionFailure("update_demo_patient", gate.message, "needs-setup");
  }

  const endpoint = `/patients/${patientId}`;
  try {
    const current = await assertDemoPatient(patientId);
    const lastName = updates.lastName ?? `${current.lastName} (updated)`;

    const updated = await clinikoFetch<{ patient?: Record<string, unknown> }>(endpoint, {
      method: "PATCH",
      body: JSON.stringify({ last_name: lastName }),
    });

    const patient = mapPatient(updated.patient ?? (updated as Record<string, unknown>));
    return actionSuccess(
      "update_demo_patient",
      `Updated demo patient ${patient.firstName} ${patient.lastName}.`,
      { patient }
    );
  } catch (err) {
    return actionFailure(
      "update_demo_patient",
      err instanceof Error ? err.message : "Failed to update demo patient.",
      "failed",
      diagnosticsFromError("update_demo_patient", err, endpoint)
    );
  }
}

export async function archiveDemoPatient(patientId: string): Promise<DemoTestLabActionResult> {
  const gate = writesAllowed();
  if (!gate.ok) {
    return actionFailure("archive_demo_patient", gate.message, "needs-setup");
  }

  const endpoint = `/patients/${patientId}`;
  try {
    await assertDemoPatient(patientId);
    await clinikoFetch(endpoint, { method: "DELETE" });

    return actionSuccess(
      "archive_demo_patient",
      `Archived demo patient ${patientId}.`,
      { patientId }
    );
  } catch (err) {
    return actionFailure(
      "archive_demo_patient",
      err instanceof Error ? err.message : "Failed to archive demo patient.",
      "failed",
      diagnosticsFromError("archive_demo_patient", err, endpoint)
    );
  }
}

export async function createDemoAppointment(input?: {
  patientId?: string;
  businessId?: string;
  practitionerId?: string;
  appointmentTypeId?: string;
  startsAt?: string;
}): Promise<DemoTestLabActionResult> {
  const gate = writesAllowed();
  if (!gate.ok) {
    return actionFailure("create_demo_appointment", gate.message, "needs-setup");
  }

  const preflight = await runAppointmentPreflight({
    patientId: input?.patientId,
    businessId: input?.businessId,
    practitionerId: input?.practitionerId,
    appointmentTypeId: input?.appointmentTypeId,
    proposedStartsAt: input?.startsAt,
  });

  if (!preflight.ready) {
    const failed = preflight.checks.find((c) => !c.passed);
    return actionFailure(
      "create_demo_appointment",
      failed?.detail ?? failed?.label ?? "Appointment preflight failed.",
      "needs-setup",
      {
        likelyCause: failed?.id,
        suggestedFix: failed?.detail ?? "Complete missing Cliniko setup items.",
      }
    );
  }

  const practitionerResolution = await resolvePractitionerForBooking();
  if (!practitionerResolution.bookable) {
    return actionFailure(
      "create_demo_appointment",
      "A real Cliniko practitioner is required before appointments can be created.",
      "needs-setup",
      {
        likelyCause: "user_not_practitioner",
        suggestedFix: practitionerResolution.message,
      }
    );
  }

  const endpoint = "/individual_appointments";
  try {
    const businesses = await getBusinesses();
    const types = await getAppointmentTypes();

    const patientId = input?.patientId!;
    await assertDemoPatient(patientId);

    const businessId = input?.businessId ?? businesses.data?.[0]?.id;
    const practitionerId =
      input?.practitionerId ?? practitionerResolution.practitionerId;
    const appointmentTypeId =
      input?.appointmentTypeId ??
      types.data?.find((t) => !t.archived)?.id ??
      types.data?.[0]?.id;

    let startsAt = input?.startsAt;
    if (!startsAt && businessId && practitionerId && appointmentTypeId) {
      const next = await fetchNextAvailableTime({
        businessId,
        practitionerId,
        appointmentTypeId,
      });
      startsAt = next.startsAt;
    }

    if (!startsAt) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 3);
      fallback.setHours(10, 0, 0, 0);
      startsAt = fallback.toISOString();
    }

    const created = await clinikoFetch<{ individual_appointment?: Record<string, unknown> }>(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify({
          patient_id: patientId,
          business_id: businessId,
          practitioner_id: practitionerId,
          appointment_type_id: appointmentTypeId,
          starts_at: startsAt,
          notes: "DEMO appointment created by Tigers Eye Command Hub test lab.",
        }),
      }
    );

    const appointment = mapAppointment(
      created.individual_appointment ?? (created as Record<string, unknown>)
    );

    return actionSuccess(
      "create_demo_appointment",
      `Created fake demo appointment on ${appointment.startsAt}.`,
      { appointment, mappingProof: "Use Command Hub bookings/calendar to verify mapping." }
    );
  } catch (err) {
    return actionFailure(
      "create_demo_appointment",
      err instanceof Error ? err.message : "Failed to create demo appointment.",
      "failed",
      diagnosticsFromError("create_demo_appointment", err, endpoint)
    );
  }
}

export async function cancelDemoAppointment(
  appointmentId: string
): Promise<DemoTestLabActionResult> {
  const gate = writesAllowed();
  if (!gate.ok) {
    return actionFailure("cancel_demo_appointment", gate.message, "needs-setup");
  }

  const cancelEndpoint = `/individual_appointments/${appointmentId}/cancel`;
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

    await clinikoFetch(cancelEndpoint, {
      method: "PATCH",
      body: JSON.stringify({
        cancellation_reason: 50,
        cancellation_note: "DEMO cleanup — Tigers Eye Command Hub test lab.",
        apply_to_repeats: false,
      }),
    });

    return actionSuccess(
      "cancel_demo_appointment",
      `Cancelled demo appointment ${appointmentId}.`,
      { appointment: { ...appointment, cancelled: true } }
    );
  } catch (err) {
    return actionFailure(
      "cancel_demo_appointment",
      err instanceof Error ? err.message : "Failed to cancel demo appointment.",
      "failed",
      diagnosticsFromError("cancel_demo_appointment", err, cancelEndpoint)
    );
  }
}

export async function checkDemoAppointments(): Promise<DemoTestLabActionResult> {
  const endpoint = "/individual_appointments";
  try {
    const patients = await fetchDemoPatientsLive();
    const patientIds = new Set(patients.map((p) => p.id));
    const appointments = await fetchDemoAppointmentsLive(patientIds);

    return actionSuccess(
      "check_demo_appointments",
      appointments.length > 0
        ? `Found ${appointments.length} upcoming DEMO appointment(s) in Cliniko.`
        : "No upcoming DEMO appointments found in Cliniko.",
      { appointments, count: appointments.length },
      appointments.length > 0 ? "proven" : "not-tested"
    );
  } catch (err) {
    return actionFailure(
      "check_demo_appointments",
      err instanceof Error ? err.message : "Failed to check demo appointments.",
      "failed",
      diagnosticsFromError("check_demo_appointments", err, endpoint)
    );
  }
}

export async function cleanupDemoTestData(): Promise<DemoTestLabActionResult> {
  const gate = writesAllowed();
  if (!gate.ok) {
    return actionFailure("cleanup_demo_records", gate.message, "needs-setup");
  }

  try {
    const patients = await fetchDemoPatientsLive();
    const patientIds = new Set(patients.map((p) => p.id));
    const appointments = await fetchDemoAppointmentsLive(patientIds);

    const warnings: string[] = [];
    let cancelledAppointments = 0;
    let archivedPatients = 0;
    let skipped = 0;

    for (const appointment of appointments) {
      if (appointment.cancelled) continue;
      if (!appointment.patientId || !patientIds.has(appointment.patientId)) {
        skipped += 1;
        warnings.push(`Skipped appointment ${appointment.id} — not linked to a DEMO patient.`);
        continue;
      }
      const result = await cancelDemoAppointment(appointment.id);
      if (result.ok) cancelledAppointments += 1;
      else warnings.push(result.message);
    }

    for (const patient of patients) {
      if (!isDemoPatientName(patient.firstName)) {
        skipped += 1;
        warnings.push(`Skipped patient ${patient.id} — not DEMO-prefixed.`);
        continue;
      }
      const result = await archiveDemoPatient(patient.id);
      if (result.ok) archivedPatients += 1;
      else warnings.push(result.message);
    }

    return actionSuccess(
      "cleanup_demo_records",
      `Cleanup complete — cancelled ${cancelledAppointments} demo appointment(s), archived ${archivedPatients} demo patient(s)${skipped ? `, skipped ${skipped} uncertain record(s)` : ""}.`,
      {
        cancelledAppointments,
        archivedPatients,
        skipped,
        warnings,
      }
    );
  } catch (err) {
    return actionFailure(
      "cleanup_demo_records",
      err instanceof Error ? err.message : "Demo cleanup failed.",
      "failed",
      diagnosticsFromError("cleanup_demo_records", err)
    );
  }
}
