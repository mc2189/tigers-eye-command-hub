import "server-only";

import {
  getSafeDemoPatientLabel,
  partitionLiveDemoAppointments,
  type ClinikoIndividualAppointmentLike,
  type DemoAppointmentRawType,
} from "@/lib/cliniko-demo-appointments";
import {
  ClinikoApiError,
  classifyAppointmentFailure,
} from "@/lib/cliniko-api-error";
import {
  clinikoFetch,
  createTestIndividualAppointment,
  fetchNextAvailableTime,
  generateSafeManualTestTime,
  getAppointmentTypes,
  getBusinesses,
  getClinikoConfig,
  getDemoIndividualAppointments,
  parseIndividualAppointment,
  resolvePractitionerForBooking,
  type ClinikoAppointmentType,
  type ClinikoBusiness,
  type ClinikoIndividualAppointment,
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
  clinikoId: string;
  rawType: DemoAppointmentRawType;
  source: "cliniko-test-account";
  patientId?: string;
  patientLabel: string;
  startsAt: string;
  endsAt?: string;
  appointmentTypeName?: string;
  practitionerName?: string;
  businessName?: string;
  cancelled?: boolean;
  archived?: boolean;
}

export interface AppointmentSourceDiagnostics {
  lastRefreshAt: string;
  endpoint: "/individual_appointments";
  returnedByCliniko: number;
  excludedInvalid: number;
  displayed: number;
  demoFallbackActive: boolean;
  localProofStateActive: boolean;
  warnings: string[];
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
  severity: "hard" | "soft";
}

export interface AppointmentPreflightResult {
  ready: boolean;
  checks: AppointmentPreflightCheck[];
  proposedStartsAt?: string;
  proposedEndsAt?: string;
  usingManualTime?: boolean;
  manualTimeMessage?: string;
}

export interface AppointmentProofDiagnostics {
  lastEndpoint?: string;
  dataSource: "individual_appointments" | "bookings";
  availableTimeEndpoint?: string;
  availableTimeResult?: string;
  availableTimeHttpStatus?: number;
  availableTimeSeverity: "hard" | "soft";
  proposedStartsAt?: string;
  proposedEndsAt?: string;
  usingManualTime?: boolean;
  selectedPatientId?: string;
  selectedBusinessId?: string;
  selectedPractitionerId?: string;
  selectedAppointmentTypeId?: string;
}

export interface DemoTestLabSnapshot {
  ok: boolean;
  source: "cliniko-test-account" | "demo-fallback" | "unavailable";
  mode: "live" | "demo" | "unavailable";
  writesEnabled: boolean;
  message: string;
  generatedAt: string;
  counts: {
    patients: number;
    appointments: number;
  };
  demoFallbackActive: boolean;
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
  proofDiagnostics?: AppointmentProofDiagnostics;
  appointmentSourceDiagnostics?: AppointmentSourceDiagnostics;
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

function mapAppointmentFromIndividual(
  appointment: ClinikoIndividualAppointment | ClinikoIndividualAppointmentLike,
  patientsById: Map<string, DemoPatientRecord> = new Map()
): DemoAppointmentRecord {
  const clinikoId = String(appointment.id ?? "").trim();
  return {
    id: clinikoId,
    clinikoId,
    rawType: "individual_appointment",
    source: "cliniko-test-account",
    patientId: appointment.patientId,
    patientLabel: getSafeDemoPatientLabel(appointment, patientsById),
    startsAt: String(appointment.startsAt ?? ""),
    endsAt: appointment.endsAt ? String(appointment.endsAt) : undefined,
    appointmentTypeName:
      coerceDemoLabel(appointment.appointmentTypeName) ?? "Appointment",
    practitionerName:
      coerceDemoLabel(appointment.practitionerName) ?? "Practitioner",
    businessName: coerceDemoLabel(appointment.businessName) ?? "Clinic",
    cancelled: Boolean(appointment.cancelledAt),
    archived: Boolean(appointment.archivedAt),
  };
}

function coerceDemoLabel(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const direct = record.name ?? record.label;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  return undefined;
}

function emptyAppointmentDiagnostics(
  generatedAt: string,
  demoFallbackActive: boolean,
  warnings: string[]
): AppointmentSourceDiagnostics {
  return {
    lastRefreshAt: generatedAt,
    endpoint: "/individual_appointments",
    returnedByCliniko: 0,
    excludedInvalid: 0,
    displayed: 0,
    demoFallbackActive,
    localProofStateActive: false,
    warnings,
  };
}

async function fetchDemoAppointmentsLive(patients: DemoPatientRecord[]): Promise<{
  appointments: DemoAppointmentRecord[];
  diagnostics: AppointmentSourceDiagnostics;
}> {
  const patientIds = new Set(patients.map((p) => p.id));
  const patientsById = new Map(patients.map((p) => [p.id, p]));
  const generatedAt = new Date().toISOString();

  const result = await getDemoIndividualAppointments({
    demoPatientIds: patientIds,
    strictPatientMatch: true,
  });

  const demoFallbackActive =
    result.source === "demo" || result.status === "not_configured";

  if (demoFallbackActive || !result.ok) {
    return {
      appointments: [],
      diagnostics: emptyAppointmentDiagnostics(generatedAt, demoFallbackActive, [
        demoFallbackActive
          ? "Demo fallback appointments are not shown in the live test lab list."
          : result.error ?? "Could not load individual appointments from Cliniko.",
      ]),
    };
  }

  const raw = result.data?.appointments ?? [];
  const { accepted, excluded, warnings } = partitionLiveDemoAppointments(
    raw,
    patientIds
  );

  return {
    appointments: accepted.map((appointment) =>
      mapAppointmentFromIndividual(appointment, patientsById)
    ),
    diagnostics: {
      lastRefreshAt: generatedAt,
      endpoint: "/individual_appointments",
      returnedByCliniko: raw.length,
      excludedInvalid: excluded.length,
      displayed: accepted.length,
      demoFallbackActive: false,
      localProofStateActive: false,
      warnings,
    },
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
  proposedEndsAt?: string;
}): Promise<AppointmentPreflightResult> {
  const config = getClinikoConfig();
  const checks: AppointmentPreflightCheck[] = [];

  const add = (
    id: string,
    label: string,
    passed: boolean,
    severity: "hard" | "soft",
    detail?: string
  ) => {
    checks.push({ id, label, passed, severity, detail });
  };

  add("staff_auth", "Staff authenticated (route protected)", true, "hard");
  add(
    "writes_enabled",
    "Cliniko writes enabled",
    config.writesEnabled,
    "hard",
    config.writesEnabled ? undefined : "Set CLINIKO_ENABLE_WRITES=true"
  );
  add(
    "api_key",
    "Cliniko API key configured",
    Boolean(config.apiKey),
    "hard",
    config.apiKey ? undefined : "Add CLINIKO_API_KEY"
  );

  const practitionerResolution = await resolvePractitionerForBooking();
  const practitionerId = input?.practitionerId ?? practitionerResolution.practitionerId;
  add(
    "practitioner",
    "Bookable practitioner available",
    practitionerResolution.bookable && Boolean(practitionerId),
    "hard",
    practitionerResolution.message
  );

  const businesses = await getBusinesses();
  const businessId = input?.businessId ?? businesses.data?.[0]?.id;
  add(
    "business",
    "Business / location exists",
    Boolean(businessId),
    "hard",
    businessId ? undefined : "Add a business in Cliniko"
  );

  const types = await getAppointmentTypes();
  const appointmentType =
    types.data?.find((t) => t.id === input?.appointmentTypeId) ??
    types.data?.find((t) => !t.archived) ??
    types.data?.[0];
  const durationMinutes = appointmentType?.durationMinutes ?? 45;
  add(
    "appointment_type",
    "Appointment type exists",
    Boolean(appointmentType?.id),
    "hard",
    appointmentType?.id ? undefined : "Create an appointment type in Cliniko"
  );
  add(
    "duration",
    "Appointment type has duration (or 45 min fallback)",
    Boolean(durationMinutes),
    "hard",
    `${durationMinutes} min`
  );

  add(
    "demo_patient",
    "DEMO patient selected",
    Boolean(input?.patientId),
    "hard",
    input?.patientId ? undefined : "Create a DEMO patient first"
  );

  let proposedStartsAt = input?.proposedStartsAt;
  let proposedEndsAt = input?.proposedEndsAt;
  let usingManualTime = false;
  let manualTimeMessage: string | undefined;

  if (businessId && practitionerId && appointmentType?.id) {
    const next = await fetchNextAvailableTime({
      businessId,
      practitionerId,
      appointmentTypeId: appointmentType.id,
    });
    if (next.startsAt) {
      proposedStartsAt = next.startsAt;
      proposedEndsAt = new Date(
        new Date(next.startsAt).getTime() + durationMinutes * 60 * 1000
      ).toISOString();
      add(
        "available_time",
        "Online booking availability found",
        true,
        "soft",
        next.startsAt
      );
    } else {
      add(
        "available_time",
        "Online booking availability check failed — direct test appointment can still be attempted",
        true,
        "soft",
        next.httpStatus
          ? `HTTP ${next.httpStatus}: ${next.message ?? "No availability returned"}`
          : next.message ?? "No availability returned"
      );
    }
  } else {
    add(
      "available_time",
      "Online booking availability check skipped",
      true,
      "soft",
      "Resolve business, practitioner and appointment type first"
    );
  }

  if (!proposedStartsAt) {
    const manual = generateSafeManualTestTime({ durationMinutes });
    proposedStartsAt = manual.startsAt;
    proposedEndsAt = manual.endsAt;
    usingManualTime = true;
    manualTimeMessage = manual.message;
    add("manual_time", "Safe manual test time generated", true, "soft", manual.message);
  }

  const inFuture = proposedStartsAt
    ? new Date(proposedStartsAt).getTime() > Date.now()
    : false;
  add(
    "future_time",
    "Proposed time is in the future",
    inFuture,
    "hard",
    inFuture ? proposedStartsAt : "Choose a future appointment time"
  );

  const hardChecks = checks.filter((c) => c.severity === "hard");
  return {
    ready: hardChecks.every((c) => c.passed),
    checks,
    proposedStartsAt,
    proposedEndsAt,
    usingManualTime,
    manualTimeMessage,
  };
}

export async function getDemoTestLabSnapshot(input?: {
  patientId?: string;
  businessId?: string;
  practitionerId?: string;
  appointmentTypeId?: string;
}): Promise<DemoTestLabSnapshot> {
  const config = getClinikoConfig();
  const generatedAt = new Date().toISOString();

  if (!config.apiKey) {
    return {
      ok: true,
      source: "demo-fallback",
      mode: "demo",
      writesEnabled: config.writesEnabled,
      message: "No Cliniko API key — live test lab appointments are unavailable.",
      generatedAt,
      counts: { patients: 0, appointments: 0 },
      demoFallbackActive: true,
      patients: [],
      appointments: [],
      businesses: [],
      appointmentTypes: [],
      practitionerSource: "demo",
      practitionerBookable: false,
      practitionerSourceLabel: practitionerSourceLabel("demo"),
      appointmentSourceDiagnostics: emptyAppointmentDiagnostics(generatedAt, true, [
        "Demo fallback appointments are not shown in the live test lab list.",
      ]),
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

    const { appointments, diagnostics } = await fetchDemoAppointmentsLive(patients);

    const businessId = input?.businessId ?? businessesResult.data?.[0]?.id;
    const practitionerId =
      input?.practitionerId ?? practitionerResolution.practitionerId;
    const appointmentTypeId =
      input?.appointmentTypeId ??
      typesResult.data?.find((t) => !t.archived)?.id ??
      typesResult.data?.[0]?.id;
    const selectedPatientId = input?.patientId ?? patients[0]?.id;

    const preflight = await runAppointmentPreflight({
      patientId: selectedPatientId,
      businessId,
      practitionerId,
      appointmentTypeId,
    });

    let availableTimeEndpoint: string | undefined;
    let availableTimeResult: string | undefined;
    let availableTimeHttpStatus: number | undefined;
    if (businessId && practitionerId && appointmentTypeId) {
      const next = await fetchNextAvailableTime({
        businessId,
        practitionerId,
        appointmentTypeId,
      });
      availableTimeEndpoint = next.endpoint;
      availableTimeResult = next.startsAt ?? next.message;
      availableTimeHttpStatus = next.httpStatus;
    }

    return {
      ok: true,
      source: "cliniko-test-account",
      mode: "live",
      writesEnabled: config.writesEnabled,
      message:
        appointments.length > 0
          ? `Loaded ${appointments.length} live DEMO appointment(s) from Cliniko.`
          : "No live DEMO appointments found in Cliniko.",
      generatedAt,
      counts: {
        patients: patients.length,
        appointments: appointments.length,
      },
      demoFallbackActive: false,
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
        proposedStartsAt: preflight.proposedStartsAt,
      },
      preflight,
      proofDiagnostics: {
        lastEndpoint: "/individual_appointments",
        dataSource: "individual_appointments",
        availableTimeEndpoint,
        availableTimeResult,
        availableTimeHttpStatus,
        availableTimeSeverity: "soft",
        proposedStartsAt: preflight.proposedStartsAt,
        proposedEndsAt: preflight.proposedEndsAt,
        usingManualTime: preflight.usingManualTime,
        selectedPatientId,
        selectedBusinessId: businessId,
        selectedPractitionerId: practitionerId,
        selectedAppointmentTypeId: appointmentTypeId,
      },
      appointmentSourceDiagnostics: diagnostics,
    };
  } catch (err) {
    return {
      ok: false,
      source: "unavailable",
      mode: "unavailable",
      writesEnabled: config.writesEnabled,
      message: err instanceof Error ? err.message : "Could not load test lab data.",
      generatedAt,
      counts: { patients: 0, appointments: 0 },
      demoFallbackActive: false,
      patients: [],
      appointments: [],
      businesses: [],
      appointmentTypes: [],
      practitionerSource: "none",
      practitionerBookable: false,
      practitionerSourceLabel: practitionerSourceLabel("none"),
      appointmentSourceDiagnostics: emptyAppointmentDiagnostics(generatedAt, false, [
        err instanceof Error ? err.message : "Could not load test lab data.",
      ]),
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
    const failed = preflight.checks.find((c) => c.severity === "hard" && !c.passed);
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
    const appointmentType = types.data?.find((t) => t.id === appointmentTypeId);
    const durationMinutes = appointmentType?.durationMinutes ?? 45;

    const startsAt = preflight.proposedStartsAt ?? input?.startsAt;
    const endsAt =
      preflight.proposedEndsAt ??
      (startsAt
        ? new Date(
            new Date(startsAt).getTime() + durationMinutes * 60 * 1000
          ).toISOString()
        : undefined);

    if (!startsAt || !endsAt || !businessId || !practitionerId || !appointmentTypeId) {
      return actionFailure(
        "create_demo_appointment",
        "Missing required fields for direct individual appointment creation.",
        "needs-setup"
      );
    }

    const created = await createTestIndividualAppointment({
      patientId,
      businessId,
      practitionerId,
      appointmentTypeId,
      startsAt,
      endsAt,
    });

    if (!created.ok || !created.data) {
      const errMsg = created.error ?? "Failed to create demo appointment.";
      const diagnostics: DemoTestLabDiagnostics = {
        endpoint,
        clinikoMessage: errMsg,
        likelyCause: errMsg.includes("404") ? "route_or_id_mismatch" : "payload_rejected",
        suggestedFix:
          errMsg.includes("404")
            ? "Verify practitioner, business and appointment type IDs against Cliniko."
            : "Review Cliniko validation message and adjust time or IDs.",
      };
      return actionFailure("create_demo_appointment", errMsg, "failed", diagnostics);
    }

    const appointment = mapAppointmentFromIndividual(created.data);

    return actionSuccess(
      "create_demo_appointment",
      preflight.usingManualTime
        ? `${preflight.manualTimeMessage} Created fake demo appointment on ${appointment.startsAt}.`
        : `Created fake demo appointment on ${appointment.startsAt}.`,
      {
        appointment,
        mappingProof: "Use Command Hub bookings/calendar to verify mapping.",
        proofDiagnostics: {
          endpoint,
          ids: {
            patientId,
            businessId,
            practitionerId,
            appointmentTypeId,
          },
          startsAt,
          endsAt,
        },
      }
    );
  } catch (err) {
    const diagnostics = diagnosticsFromError("create_demo_appointment", err, endpoint);
    if (err instanceof ClinikoApiError && err.status === 404) {
      diagnostics.suggestedFix =
        "Verify endpoint path and Cliniko IDs. Individual appointments use /individual_appointments.";
    }
    return actionFailure(
      "create_demo_appointment",
      err instanceof Error ? err.message : "Failed to create demo appointment.",
      "failed",
      diagnostics
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
    const appointment = mapAppointmentFromIndividual(
      parseIndividualAppointment(
        raw.individual_appointment ?? (raw as Record<string, unknown>)
      )
    );

    if (appointment.patientId) {
      await assertDemoPatient(appointment.patientId);
    } else if (!/^DEMO/i.test(appointment.patientLabel ?? "")) {
      throw new Error("Only DEMO-linked appointments can be cancelled.");
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
    const { appointments, diagnostics } = await fetchDemoAppointmentsLive(patients);

    return actionSuccess(
      "check_demo_appointments",
      appointments.length > 0
        ? `Found ${appointments.length} live DEMO individual appointment(s) in Cliniko.`
        : "No live DEMO appointments found in Cliniko.",
      {
        appointments,
        count: appointments.length,
        endpoint,
        dataSource: "individual_appointments",
        appointmentSourceDiagnostics: diagnostics,
      },
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
    const { appointments } = await fetchDemoAppointmentsLive(patients);

    const warnings: string[] = [];
    let cancelledAppointments = 0;
    let archivedPatients = 0;
    let skipped = 0;

    for (const appointment of appointments) {
      if (appointment.cancelled) continue;
      if (!appointment.patientId || !patients.some((p) => p.id === appointment.patientId)) {
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
