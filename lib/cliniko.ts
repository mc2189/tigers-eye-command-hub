import "server-only";

import {
  appointmentTypes as demoAppointmentTypes,
  bookings as demoBookings,
  practitioners as demoPractitioners,
} from "@/lib/demo-data";
import { clinics } from "@/lib/tigers-eye-content";
import {
  ClinikoApiError,
  parseClinikoErrorBody,
  redactClinikoBody,
} from "@/lib/cliniko-api-error";
import {
  buildClinikoQFilter,
  buildIndividualAppointmentsQueryString,
  offsetClinikoDate,
} from "@/lib/cliniko-query";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ClinikoConnectionState =
  | "not_configured"
  | "connected"
  | "error";

export type ClinikoResult<T> = {
  ok: boolean;
  source: "cliniko" | "demo";
  status: ClinikoConnectionState;
  data?: T;
  error?: string;
  warning?: string;
};

export interface ClinikoConfig {
  apiKey: string | null;
  shard: string;
  userAgent: string;
  writesEnabled: boolean;
  baseUrl: string | null;
  warning?: string;
}

export interface ClinikoAuthenticatedUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

export interface ClinikoBusiness {
  id: string;
  name: string;
  address?: string;
  timezone?: string;
  archived?: boolean;
}

export interface ClinikoPractitioner {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  active?: boolean;
}

export interface ClinikoAppointmentType {
  id: string;
  name: string;
  category?: string;
  durationMinutes?: number;
  price?: number;
  onlineBookingsEnabled?: boolean;
  telehealthEnabled?: boolean;
  archived?: boolean;
}

export interface ClinikoBooking {
  id: string;
  startsAt: string;
  endsAt: string;
  appointmentTypeName?: string;
  practitionerName?: string;
  businessName?: string;
  patientLabel?: string;
  source: "cliniko";
  paymentStatus?: string;
  noteStatus?: string;
  invoiceStatus?: string;
  rawLinks?: unknown;
}

export interface ClinikoBookingsResponse {
  bookings: ClinikoBooking[];
  totalEntries?: number;
  source: "cliniko" | "demo";
}

export interface ClinikoIndividualAppointment {
  id: string;
  startsAt: string;
  endsAt: string;
  patientId?: string;
  patientName?: string;
  patientLabel?: string;
  appointmentTypeId?: string;
  appointmentTypeName?: string;
  practitionerId?: string;
  practitionerName?: string;
  businessId?: string;
  businessName?: string;
  noteStatus?: string;
  invoiceStatus?: string;
  telehealthUrl?: string;
  cancelledAt?: string;
  archivedAt?: string;
  source: "cliniko-test";
  rawLinks?: unknown;
}

export interface ClinikoIndividualAppointmentsResponse {
  appointments: ClinikoIndividualAppointment[];
  totalEntries?: number;
  source: "cliniko" | "demo";
}

export interface ClinikoOnlineBookingsResponse {
  bookings: ClinikoBooking[];
  totalEntries?: number;
  source: "cliniko" | "demo";
}

export interface AvailableTimeLookupResult {
  startsAt?: string;
  message?: string;
  httpStatus?: number;
  endpoint: string;
  severity: "soft";
}

export interface SafeManualTestTime {
  startsAt: string;
  endsAt: string;
  message: string;
}

export interface ClinikoStatusResponse {
  ok: boolean;
  source: "cliniko" | "demo";
  status: ClinikoConnectionState;
  shard: string | null;
  baseUrl: string | null;
  userAgentConfigured: boolean;
  writesEnabled: boolean;
  authenticatedUser?: ClinikoAuthenticatedUser;
  counts?: {
    businesses: number;
    practitioners: number;
    appointmentTypes: number;
    bookings: number;
  };
  error?: string;
  warning?: string;
}

export interface DraftTreatmentNoteInput {
  bookingId?: string;
  patientId?: string;
  title?: string;
  sections: Record<string, string>;
  templateName?: string;
}

export interface DraftTreatmentNoteResult {
  ok: boolean;
  mode: "dry_run" | "created";
  message: string;
  noteId?: string;
  createdAt?: string;
  localContentStored: false;
}

// ─── Config ──────────────────────────────────────────────────────────────────

export function inferClinikoShard(apiKey: string): string | null {
  const match = apiKey.match(/-([a-z]{2}\d+)$/i);
  return match ? match[1].toLowerCase() : null;
}

export function getClinikoConfig(): ClinikoConfig {
  const apiKey = process.env.CLINIKO_API_KEY?.trim() || null;
  const envShard = process.env.CLINIKO_SHARD?.trim();
  const userAgent =
    process.env.CLINIKO_USER_AGENT?.trim() ||
    "Tigers Eye Command Hub Demo / built by Mike Currie";
  const writesEnabled = process.env.CLINIKO_ENABLE_WRITES === "true";

  let shard = envShard || "uk1";
  let warning: string | undefined;

  if (apiKey && !envShard) {
    const inferred = inferClinikoShard(apiKey);
    if (inferred) {
      shard = inferred;
    } else {
      warning =
        "CLINIKO_SHARD not set and could not be inferred from API key suffix. Defaulting to uk1.";
    }
  }

  if (apiKey && envShard) {
    const inferred = inferClinikoShard(apiKey);
    if (inferred && inferred !== envShard.toLowerCase()) {
      warning = `Shard mismatch likely — key suffix suggests ${inferred} but CLINIKO_SHARD is ${envShard}.`;
    }
  }

  return {
    apiKey,
    shard,
    userAgent,
    writesEnabled,
    baseUrl: apiKey ? `https://api.${shard}.cliniko.com/v1` : null,
    warning,
  };
}

export function getClinikoBaseUrl(): string | null {
  return getClinikoConfig().baseUrl;
}

function isConfigured(): boolean {
  return Boolean(getClinikoConfig().apiKey);
}

export function clinikoIsConfigured(): boolean {
  return isConfigured();
}

function buildAuthHeader(apiKey: string): string {
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

function redactError(status: number, statusText: string): string {
  return `Cliniko request failed (${status} ${statusText})`;
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

export async function clinikoFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getClinikoConfig();
  if (!config.apiKey || !config.baseUrl) {
    throw new Error("NOT_CONFIGURED");
  }

  const url = `${config.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": config.userAgent,
    Authorization: buildAuthHeader(config.apiKey),
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
    cache: "no-store",
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    const clinikoMessage = parseClinikoErrorBody(bodyText);
    throw new ClinikoApiError({
      message: redactError(response.status, response.statusText),
      status: response.status,
      path,
      bodyText: bodyText ? redactClinikoBody(bodyText) : undefined,
      clinikoMessage,
    });
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {} as T;
  }

  return (await response.json()) as T;
}

// ─── Demo fallbacks ──────────────────────────────────────────────────────────

function demoBusinesses(): ClinikoBusiness[] {
  return clinics.map((c, i) => ({
    id: `demo-business-${i + 1}`,
    name: c.name,
    address: c.address,
    timezone: "Europe/London",
    archived: false,
  }));
}

function demoPractitionersList(): ClinikoPractitioner[] {
  return demoPractitioners
    .filter((p) => !p.isPlaceholder)
    .map((p, i) => ({
      id: `demo-practitioner-${i + 1}`,
      name: p.name,
      firstName: p.name.split(" ")[0],
      lastName: p.name.split(" ").slice(1).join(" ") || undefined,
      role: p.role,
      active: true,
    }));
}

function demoAppointmentTypesList(): ClinikoAppointmentType[] {
  return demoAppointmentTypes.map((a) => ({
    id: a.id,
    name: a.name,
    durationMinutes: a.durationMinutes,
    price: a.defaultFee,
    onlineBookingsEnabled: true,
    telehealthEnabled: a.id === "telehealth",
    archived: false,
  }));
}

function demoBookingsList(): ClinikoBooking[] {
  return demoBookings.map((b) => ({
    id: b.id,
    startsAt: `${b.date}T${b.time}:00`,
    endsAt: `${b.date}T${b.time}:00`,
    appointmentTypeName: demoAppointmentTypes.find((a) => a.id === b.appointmentTypeId)?.name,
    practitionerName: demoPractitioners.find((p) => p.id === b.practitionerId)?.name,
    businessName: b.locationId === "dundee" ? "Dundee" : b.locationId === "aviemore" ? "Aviemore" : b.locationId,
    patientLabel: b.clientName,
    source: "cliniko" as const,
    paymentStatus: b.paymentStatus,
    noteStatus: b.noteStatus,
    invoiceStatus: b.invoiceStatus,
  }));
}

function toPatientLabel(name?: string | null): string {
  if (!name?.trim()) return "Cliniko patient";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
  }
  return name.trim();
}

function mapNoteStatus(status?: number | null): string | undefined {
  if (status === null || status === undefined) return undefined;
  const map: Record<number, string> = {
    0: "not started",
    1: "draft",
    2: "final",
  };
  return map[status] ?? `status ${status}`;
}

function mapInvoiceStatus(status?: number | null): string | undefined {
  if (status === null || status === undefined) return undefined;
  return `invoice status ${status}`;
}

// ─── API accessors ───────────────────────────────────────────────────────────

export async function getAuthenticatedUser(): Promise<
  ClinikoResult<ClinikoAuthenticatedUser>
> {
  if (!isConfigured()) {
    return {
      ok: true,
      source: "demo",
      status: "not_configured",
      data: {
        id: "demo-user",
        firstName: "George",
        lastName: "Stewart",
        email: "george@tigerseye.org.uk",
        role: "practitioner",
      },
      warning: "No Cliniko API key configured — using demo data.",
    };
  }

  try {
    const raw = await clinikoFetch<Record<string, unknown>>("/user");
    const user = (raw.user ?? raw) as Record<string, unknown>;
    return {
      ok: true,
      source: "cliniko",
      status: "connected",
      data: {
        id: String(user.id ?? ""),
        firstName: user.first_name as string | undefined,
        lastName: user.last_name as string | undefined,
        email: user.email as string | undefined,
        role: user.role as string | undefined,
      },
    };
  } catch (err) {
    return {
      ok: false,
      source: "demo",
      status: "error",
      error:
        err instanceof Error && err.message === "NOT_CONFIGURED"
          ? "Cliniko not configured"
          : err instanceof Error
            ? err.message
            : "Cliniko authentication failed",
    };
  }
}

export async function getBusinesses(): Promise<ClinikoResult<ClinikoBusiness[]>> {
  const config = getClinikoConfig();
  if (!isConfigured()) {
    return {
      ok: true,
      source: "demo",
      status: "not_configured",
      data: demoBusinesses(),
      warning: config.warning ?? "No Cliniko API key configured — using demo data.",
    };
  }

  try {
    const raw = await clinikoFetch<{
      businesses?: Record<string, unknown>[];
      total_entries?: number;
    }>("/businesses?per_page=50");

    const businesses = (raw.businesses ?? []).map((b) => ({
      id: String(b.id ?? ""),
      name: String(b.business_name ?? b.name ?? "Unnamed business"),
      address: formatAddress(b),
      timezone: b.time_zone as string | undefined,
      archived: Boolean(b.archived_at),
    }));

    return {
      ok: true,
      source: "cliniko",
      status: "connected",
      data: businesses,
      warning: config.warning,
    };
  } catch (err) {
    return {
      ok: false,
      source: "cliniko",
      status: "error",
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch businesses",
      warning: "Connected to Cliniko, but businesses could not be loaded.",
    };
  }
}

export async function getPractitioners(): Promise<
  ClinikoResult<ClinikoPractitioner[]>
> {
  const config = getClinikoConfig();
  if (!isConfigured()) {
    return {
      ok: true,
      source: "demo",
      status: "not_configured",
      data: demoPractitionersList(),
      warning: config.warning ?? "No Cliniko API key configured — using demo data.",
    };
  }

  try {
    const raw = await clinikoFetch<{
      practitioners?: Record<string, unknown>[];
      users?: Record<string, unknown>[];
    }>("/practitioners?per_page=50");

    let list = raw.practitioners ?? [];

    if (list.length === 0) {
      const usersRaw = await clinikoFetch<{ users?: Record<string, unknown>[] }>(
        "/users?per_page=50"
      );
      list = usersRaw.users ?? [];
    }

    const practitioners = list.map((p) => mapPractitioner(p));

    return {
      ok: true,
      source: "cliniko",
      status: "connected",
      data: practitioners,
      warning: config.warning,
    };
  } catch (err) {
    return {
      ok: false,
      source: "cliniko",
      status: "error",
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch practitioners",
      warning: "Connected to Cliniko, but practitioners could not be loaded.",
    };
  }
}

export type PractitionerSourceKind =
  | "practitioners"
  | "users"
  | "none"
  | "demo";

export interface PractitionerBookingResolution {
  practitionerId?: string;
  practitionerName?: string;
  source: PractitionerSourceKind;
  bookable: boolean;
  message: string;
}

export async function resolvePractitionerForBooking(): Promise<PractitionerBookingResolution> {
  if (!isConfigured()) {
    return {
      source: "demo",
      bookable: false,
      message: "No Cliniko API key configured.",
    };
  }

  try {
    const practitionersRaw = await clinikoFetch<{
      practitioners?: Record<string, unknown>[];
    }>("/practitioners?per_page=50");

    const practitionersList = practitionersRaw.practitioners ?? [];
    if (practitionersList.length > 0) {
      const p = mapPractitioner(practitionersList[0]);
      return {
        practitionerId: p.id,
        practitionerName: p.name,
        source: "practitioners",
        bookable: true,
        message: "Practitioner resolved from practitioners endpoint.",
      };
    }

    const usersRaw = await clinikoFetch<{ users?: Record<string, unknown>[] }>(
      "/users?per_page=50"
    );
    const users = usersRaw.users ?? [];
    if (users.length > 0) {
      const u = mapPractitioner(users[0]);
      return {
        practitionerId: u.id,
        practitionerName: u.name,
        source: "users",
        bookable: false,
        message:
          "A real Cliniko practitioner is required before appointments can be created. The users endpoint returned IDs, but appointments must use practitioner IDs.",
      };
    }

    return {
      source: "none",
      bookable: false,
      message: "No practitioner found in Cliniko test account.",
    };
  } catch (err) {
    return {
      source: "none",
      bookable: false,
      message: err instanceof Error ? err.message : "Could not resolve practitioner.",
    };
  }
}

export async function fetchNextAvailableTime(input: {
  businessId: string;
  practitionerId: string;
  appointmentTypeId: string;
}): Promise<AvailableTimeLookupResult> {
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + 14);

  const formatDate = (d: Date) => d.toISOString().slice(0, 10);
  const query = new URLSearchParams({
    from: formatDate(from),
    to: formatDate(to),
  });

  const endpoint = `/businesses/${input.businessId}/practitioners/${input.practitionerId}/appointment_types/${input.appointmentTypeId}/next_available_time?${query.toString()}`;

  try {
    const raw = await clinikoFetch<{
      appointment_start?: string;
      next_available_time?: { appointment_start?: string };
    }>(endpoint);

    const startsAt =
      raw.appointment_start ?? raw.next_available_time?.appointment_start;
    return startsAt
      ? { startsAt, endpoint, severity: "soft" }
      : {
          message: "No next available time returned from Cliniko.",
          endpoint,
          severity: "soft",
        };
  } catch (err) {
    return {
      message:
        err instanceof ClinikoApiError
          ? err.clinikoMessage ?? err.message
          : err instanceof Error
            ? err.message
            : "Could not fetch next available time.",
      httpStatus: err instanceof ClinikoApiError ? err.status : undefined,
      endpoint,
      severity: "soft",
    };
  }
}

export function generateSafeManualTestTime(input?: {
  durationMinutes?: number;
  timezone?: string;
}): SafeManualTestTime {
  const duration = input?.durationMinutes ?? 45;
  const now = Date.now();
  const candidate = new Date();
  candidate.setDate(candidate.getDate() + 1);
  candidate.setHours(10, 30, 0, 0);

  while (
    candidate.getDay() === 0 ||
    candidate.getDay() === 6 ||
    candidate.getTime() - now < 24 * 60 * 60 * 1000
  ) {
    candidate.setDate(candidate.getDate() + 1);
    candidate.setHours(10, 30, 0, 0);
  }

  const endsAt = new Date(candidate.getTime() + duration * 60 * 1000);
  return {
    startsAt: candidate.toISOString(),
    endsAt: endsAt.toISOString(),
    message:
      "Using safe manual test time because online booking availability was not returned.",
  };
}

export function isDemoIndividualAppointment(
  appointment: ClinikoIndividualAppointment,
  demoPatientIds?: Set<string>
): boolean {
  const label = appointment.patientName ?? appointment.patientLabel ?? "";
  if (/^DEMO/i.test(label.trim())) return true;
  if (demoPatientIds && appointment.patientId && demoPatientIds.has(appointment.patientId)) {
    return true;
  }
  return false;
}

export async function getIndividualAppointments(params?: {
  page?: number;
  perPage?: number;
  from?: string;
  to?: string;
  query?: string;
  qFilters?: string[];
  sort?: string;
  includeArchived?: boolean;
}): Promise<ClinikoResult<ClinikoIndividualAppointmentsResponse>> {
  const config = getClinikoConfig();

  if (!isConfigured()) {
    return {
      ok: true,
      source: "demo",
      status: "not_configured",
      data: {
        appointments: demoBookingsList().map(individualAppointmentFromBooking),
        totalEntries: demoBookingsList().length,
        source: "demo",
      },
      warning: config.warning ?? "No Cliniko API key configured — using demo data.",
    };
  }

  try {
    const qFilters = [...(params?.qFilters ?? [])];
    if (params?.from) {
      qFilters.push(
        buildClinikoQFilter(
          "starts_at",
          ":>=",
          params.from.includes("T") ? params.from : `${params.from}T00:00:00.000Z`
        )
      );
    }
    if (params?.to) {
      qFilters.push(
        buildClinikoQFilter(
          "starts_at",
          ":<=",
          params.to.includes("T") ? params.to : `${params.to}T23:59:59.999Z`
        )
      );
    }
    if (params?.query) {
      qFilters.push(params.query);
    }

    const queryString = buildIndividualAppointmentsQueryString({
      page: params?.page,
      perPage: params?.perPage,
      sort: params?.sort,
      qFilters,
    });

    const raw = await clinikoFetch<{
      individual_appointments?: Record<string, unknown>[];
      total_entries?: number;
    }>(`/individual_appointments?${queryString}`);

    let appointments = (raw.individual_appointments ?? []).map((appt) =>
      mapIndividualAppointment(appt)
    );

    if (!params?.includeArchived) {
      appointments = appointments.filter((a) => !a.archivedAt && !a.cancelledAt);
    }

    return {
      ok: true,
      source: "cliniko",
      status: "connected",
      data: {
        appointments,
        totalEntries: raw.total_entries ?? appointments.length,
        source: "cliniko",
      },
      warning: config.warning,
    };
  } catch (err) {
    return {
      ok: false,
      source: "cliniko",
      status: "error",
      data: {
        appointments: [],
        totalEntries: 0,
        source: "cliniko",
      },
      error: err instanceof Error ? err.message : "Failed to fetch individual appointments",
      warning: "Connected to Cliniko, but individual appointments could not be loaded.",
    };
  }
}

export async function getUpcomingIndividualAppointments(params?: {
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
}): Promise<ClinikoResult<ClinikoIndividualAppointmentsResponse>> {
  const now = new Date();
  const fromIso = params?.from
    ? params.from.includes("T")
      ? params.from
      : `${params.from}T00:00:00.000Z`
    : offsetClinikoDate(-7, now).toISOString();
  const toIso = params?.to
    ? params.to.includes("T")
      ? params.to
      : `${params.to}T23:59:59.999Z`
    : offsetClinikoDate(90, now).toISOString();

  return getIndividualAppointments({
    qFilters: [
      buildClinikoQFilter("starts_at", ":>=", fromIso),
      buildClinikoQFilter("starts_at", ":<=", toIso),
    ],
    page: params?.page,
    perPage: params?.perPage ?? 100,
    sort: "starts_at:asc",
  });
}

export async function getDemoIndividualAppointments(params?: {
  from?: string;
  to?: string;
  demoPatientIds?: Set<string>;
  strictPatientMatch?: boolean;
}): Promise<ClinikoResult<ClinikoIndividualAppointmentsResponse>> {
  const fromDate =
    params?.from ??
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d.toISOString().slice(0, 10);
    })();

  const result = await getUpcomingIndividualAppointments({
    from: fromDate,
    to: params?.to,
    perPage: 100,
  });

  if (!result.data) return result;

  const demoAppointments = result.data.appointments.filter((appointment) => {
    if (params?.strictPatientMatch) {
      return Boolean(
        appointment.patientId && params.demoPatientIds?.has(appointment.patientId)
      );
    }
    return isDemoIndividualAppointment(appointment, params?.demoPatientIds);
  });

  return {
    ...result,
    data: {
      ...result.data,
      appointments: demoAppointments,
      totalEntries: demoAppointments.length,
    },
  };
}

export async function createTestIndividualAppointment(input: {
  patientId: string;
  businessId: string;
  practitionerId: string;
  appointmentTypeId: string;
  startsAt: string;
  endsAt: string;
}): Promise<ClinikoResult<ClinikoIndividualAppointment>> {
  const config = getClinikoConfig();
  if (!config.apiKey) {
    return { ok: false, source: "demo", status: "not_configured", error: "NOT_CONFIGURED" };
  }
  if (!config.writesEnabled) {
    return {
      ok: false,
      source: "cliniko",
      status: "error",
      error: "Cliniko writes disabled.",
    };
  }

  const endpoint = "/individual_appointments";
  try {
    const created = await clinikoFetch<{ individual_appointment?: Record<string, unknown> }>(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify({
          patient_id: input.patientId,
          business_id: input.businessId,
          practitioner_id: input.practitionerId,
          appointment_type_id: input.appointmentTypeId,
          starts_at: input.startsAt,
          ends_at: input.endsAt,
        }),
      }
    );

    return {
      ok: true,
      source: "cliniko",
      status: "connected",
      data: mapIndividualAppointment(
        created.individual_appointment ?? (created as Record<string, unknown>)
      ),
    };
  } catch (err) {
    return {
      ok: false,
      source: "cliniko",
      status: "error",
      error: err instanceof Error ? err.message : "Failed to create individual appointment",
    };
  }
}

export async function cancelTestIndividualAppointment(
  id: string
): Promise<ClinikoResult<ClinikoIndividualAppointment>> {
  const endpoint = `/individual_appointments/${id}/cancel`;
  try {
    await clinikoFetch(endpoint, {
      method: "PATCH",
      body: JSON.stringify({
        cancellation_reason: 50,
        cancellation_note: "DEMO cleanup — Tigers Eye Command Hub test lab.",
        apply_to_repeats: false,
      }),
    });

    const raw = await clinikoFetch<{ individual_appointment?: Record<string, unknown> }>(
      `/individual_appointments/${id}`
    );

    return {
      ok: true,
      source: "cliniko",
      status: "connected",
      data: mapIndividualAppointment(
        raw.individual_appointment ?? (raw as Record<string, unknown>)
      ),
    };
  } catch (err) {
    return {
      ok: false,
      source: "cliniko",
      status: "error",
      error: err instanceof Error ? err.message : "Failed to cancel individual appointment",
    };
  }
}

export async function archiveTestIndividualAppointment(
  id: string
): Promise<ClinikoResult<{ id: string }>> {
  const endpoint = `/individual_appointments/${id}/archive`;
  try {
    await clinikoFetch(endpoint, { method: "POST", body: JSON.stringify({}) });
    return {
      ok: true,
      source: "cliniko",
      status: "connected",
      data: { id },
    };
  } catch (err) {
    return {
      ok: false,
      source: "cliniko",
      status: "error",
      error: err instanceof Error ? err.message : "Failed to archive individual appointment",
    };
  }
}

export async function getIndividualAppointmentConflicts(
  id: string
): Promise<ClinikoResult<unknown>> {
  try {
    const raw = await clinikoFetch<unknown>(`/individual_appointments/${id}/conflicts`);
    return { ok: true, source: "cliniko", status: "connected", data: raw };
  } catch (err) {
    return {
      ok: false,
      source: "cliniko",
      status: "error",
      error: err instanceof Error ? err.message : "Failed to fetch appointment conflicts",
    };
  }
}

export async function getOnlineBookings(params?: {
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
}): Promise<ClinikoResult<ClinikoOnlineBookingsResponse>> {
  const config = getClinikoConfig();

  if (!isConfigured()) {
    return {
      ok: true,
      source: "demo",
      status: "not_configured",
      data: { bookings: [], totalEntries: 0, source: "demo" },
      warning: config.warning,
    };
  }

  try {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      per_page: String(params?.perPage ?? 50),
    });
    if (params?.from) {
      query.append("q[]", `starts_at:>=${params.from}T00:00:00Z`);
    }
    if (params?.to) {
      query.append("q[]", `starts_at:<=${params.to}T23:59:59Z`);
    }

    const raw = await clinikoFetch<{
      bookings?: Record<string, unknown>[];
      total_entries?: number;
    }>(`/bookings?${query.toString()}`);

    const bookings = (raw.bookings ?? []).map((booking) => mapOnlineBooking(booking));

    return {
      ok: true,
      source: "cliniko",
      status: "connected",
      data: {
        bookings,
        totalEntries: raw.total_entries ?? bookings.length,
        source: "cliniko",
      },
      warning: config.warning,
    };
  } catch (err) {
    return {
      ok: false,
      source: "cliniko",
      status: "error",
      data: { bookings: [], totalEntries: 0, source: "cliniko" },
      error: err instanceof Error ? err.message : "Failed to fetch online bookings",
      warning: "Connected to Cliniko, but online bookings could not be loaded.",
    };
  }
}

export async function getAppointmentTypes(): Promise<
  ClinikoResult<ClinikoAppointmentType[]>
> {
  const config = getClinikoConfig();
  if (!isConfigured()) {
    return {
      ok: true,
      source: "demo",
      status: "not_configured",
      data: demoAppointmentTypesList(),
      warning: config.warning ?? "No Cliniko API key configured — using demo data.",
    };
  }

  try {
    const raw = await clinikoFetch<{
      appointment_types?: Record<string, unknown>[];
    }>("/appointment_types?per_page=100");

    const types = (raw.appointment_types ?? []).map((t) => ({
      id: String(t.id ?? ""),
      name: String(t.name ?? "Unnamed type"),
      category: t.category as string | undefined,
      durationMinutes: parseDurationMinutes(t.duration_in_minutes ?? t.duration),
      price: parsePrice(t),
      onlineBookingsEnabled: t.show_in_online_bookings as boolean | undefined,
      telehealthEnabled: t.telehealth_enabled as boolean | undefined,
      archived: Boolean(t.archived_at),
    }));

    return {
      ok: true,
      source: "cliniko",
      status: "connected",
      data: types,
      warning: config.warning,
    };
  } catch (err) {
    return {
      ok: false,
      source: "cliniko",
      status: "error",
      data: [],
      error: err instanceof Error ? err.message : "Failed to fetch appointment types",
      warning: "Connected to Cliniko, but appointment types could not be loaded.",
    };
  }
}

export async function getBookings(params?: {
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
}): Promise<ClinikoResult<ClinikoBookingsResponse>> {
  const individual = await getIndividualAppointments({
    from: params?.from,
    to: params?.to,
    page: params?.page,
    perPage: params?.perPage,
  });

  if (!individual.data) {
    return {
      ok: individual.ok,
      source: individual.source,
      status: individual.status,
      error: individual.error,
      warning: individual.warning,
    };
  }

  return {
    ok: individual.ok,
    source: individual.source,
    status: individual.status,
    data: {
      bookings: individual.data.appointments.map(individualAppointmentToBooking),
      totalEntries: individual.data.totalEntries,
      source: individual.data.source,
    },
    error: individual.error,
    warning: individual.warning,
  };
}

export async function getClinikoStatus(): Promise<ClinikoStatusResponse> {
  const config = getClinikoConfig();

  if (!config.apiKey) {
    const demoBookings = demoBookingsList();
    return {
      ok: true,
      source: "demo",
      status: "not_configured",
      shard: null,
      baseUrl: null,
      userAgentConfigured: Boolean(process.env.CLINIKO_USER_AGENT?.trim()),
      writesEnabled: config.writesEnabled,
      authenticatedUser: {
        id: "demo-user",
        firstName: "Demo",
        lastName: "User",
        role: "practitioner",
      },
      counts: {
        businesses: demoBusinesses().length,
        practitioners: demoPractitionersList().length,
        appointmentTypes: demoAppointmentTypesList().length,
        bookings: demoBookings.length,
      },
      warning: "Demo mode: no Cliniko key configured.",
    };
  }

  try {
    const [userResult, businessesResult, practitionersResult, typesResult, bookingsResult] =
      await Promise.all([
        getAuthenticatedUser(),
        getBusinesses(),
        getPractitioners(),
        getAppointmentTypes(),
        getIndividualAppointments({ perPage: 10 }),
      ]);

    const connected = userResult.status === "connected";

    return {
      ok: connected,
      source: connected ? "cliniko" : "demo",
      status: connected ? "connected" : "error",
      shard: config.shard,
      baseUrl: config.baseUrl,
      userAgentConfigured: Boolean(config.userAgent),
      writesEnabled: config.writesEnabled,
      authenticatedUser: userResult.data,
      counts: {
        businesses: businessesResult.data?.length ?? 0,
        practitioners: practitionersResult.data?.length ?? 0,
        appointmentTypes: typesResult.data?.length ?? 0,
        bookings: bookingsResult.data?.totalEntries ?? bookingsResult.data?.appointments.length ?? 0,
      },
      error: connected ? undefined : userResult.error ?? "Cliniko authentication failed",
      warning: config.warning ?? userResult.warning ?? businessesResult.warning,
    };
  } catch (err) {
    return {
      ok: false,
      source: "demo",
      status: "error",
      shard: config.shard,
      baseUrl: config.baseUrl,
      userAgentConfigured: Boolean(config.userAgent),
      writesEnabled: config.writesEnabled,
      error: err instanceof Error ? err.message : "Cliniko authentication failed",
      warning: config.warning,
    };
  }
}

export async function createDraftTreatmentNote(
  input: DraftTreatmentNoteInput
): Promise<DraftTreatmentNoteResult> {
  const config = getClinikoConfig();

  if (!input.sections || Object.keys(input.sections).length === 0) {
    return {
      ok: false,
      mode: "dry_run",
      message: "Structured sections are required.",
      localContentStored: false,
    };
  }

  if (!config.writesEnabled) {
    return {
      ok: true,
      mode: "dry_run",
      message:
        "Draft treatment note write is disabled. Payload validated only.",
      localContentStored: false,
    };
  }

  if (!config.apiKey) {
    return {
      ok: true,
      mode: "dry_run",
      message:
        "No Cliniko API key configured. Payload validated only.",
      localContentStored: false,
    };
  }

  const content = {
    sections: Object.entries(input.sections)
      .filter(([, value]) => value && value !== "—")
      .map(([name, answer]) => ({
        name,
        description: name,
        questions: [{ name, type: "text", answer }],
      })),
  };

  const payload: Record<string, unknown> = {
    draft: true,
    title: input.title ?? input.templateName ?? "Command Hub draft note",
    content,
  };

  if (input.bookingId) payload.booking_id = input.bookingId;
  if (input.patientId) payload.patient_id = input.patientId;

  try {
    const result = await clinikoFetch<{
      id?: string;
      created_at?: string;
    }>("/treatment_notes", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      ok: true,
      mode: "created",
      message: "Draft note saved to Cliniko.",
      noteId: result.id ? String(result.id) : undefined,
      createdAt: result.created_at,
      localContentStored: false,
    };
  } catch (err) {
    return {
      ok: false,
      mode: "dry_run",
      message:
        err instanceof Error ? err.message : "Failed to create draft treatment note",
      localContentStored: false,
    };
  }
}

export function parseIndividualAppointment(
  raw: Record<string, unknown>
): ClinikoIndividualAppointment {
  return mapIndividualAppointment(raw);
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapPractitioner(p: Record<string, unknown>): ClinikoPractitioner {
  const firstName = (p.first_name as string) ?? "";
  const lastName = (p.last_name as string) ?? "";
  const displayName =
    (p.label as string) ||
    (p.name as string) ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    "Practitioner";

  return {
    id: String(p.id ?? ""),
    name: displayName,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    email: p.email as string | undefined,
    role: (p.role as string) ?? (p.user_type as string) ?? undefined,
    active: !p.archived_at && !p.deactivated_at,
  };
}

function extractLinkId(links: unknown, key: string): string | undefined {
  if (!links || typeof links !== "object") return undefined;
  const url = (links as Record<string, string>)[key];
  if (!url) return undefined;
  const match = url.match(/\/(\d+)(?:\?.*)?$/);
  return match ? match[1] : undefined;
}

function extractResourceId(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string" || typeof value === "number") {
    const asString = String(value).trim();
    if (/^\d+$/.test(asString)) return asString;
    const fromUrl = asString.match(/\/(\d+)(?:\?.*)?$/);
    return fromUrl ? fromUrl[1] : undefined;
  }
  if (typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  if (record.id != null) {
    const id = String(record.id).trim();
    if (id) return id;
  }

  return (
    extractLinkId(record.links, "self") ??
    extractLinkId(record.links, "patient") ??
    extractLinkId(record.links, "practitioner") ??
    extractLinkId(record.links, "business")
  );
}

function coerceClinikoField(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (!value || typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  const direct =
    record.name ??
    record.label ??
    record.business_name ??
    record.appointment_type_name ??
    record.patient_name ??
    record.practitioner_name;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const first = record.first_name;
  const last = record.last_name;
  if (typeof first === "string" || typeof last === "string") {
    const parts = [first, last].filter((part) => typeof part === "string" && part.trim());
    if (parts.length > 0) return parts.join(" ");
  }

  return undefined;
}

function resolvePatientIdFromRaw(appt: Record<string, unknown>): string | undefined {
  if (appt.patient_id != null) {
    const id = String(appt.patient_id).trim();
    if (id) return id;
  }

  const fromPatient = extractResourceId(appt.patient);
  if (fromPatient) return fromPatient;

  const fromLinks = extractLinkId(appt.links, "patient");
  if (fromLinks) return fromLinks;

  return extractResourceId(appt.patient_name);
}

function mapIndividualAppointment(appt: Record<string, unknown>): ClinikoIndividualAppointment {
  const links = appt.links;
  const patientName =
    coerceClinikoField(appt.patient_name) ?? coerceClinikoField(appt.patient);
  const appointmentTypeName =
    coerceClinikoField(appt.appointment_type_name) ??
    coerceClinikoField(appt.appointment_type);
  const practitionerName =
    coerceClinikoField(appt.practitioner_name) ?? coerceClinikoField(appt.practitioner);
  const businessName =
    coerceClinikoField(appt.business_name) ?? coerceClinikoField(appt.business);
  return {
    id: String(appt.id ?? ""),
    startsAt: String(appt.starts_at ?? appt.start_time ?? ""),
    endsAt: String(appt.ends_at ?? appt.end_time ?? ""),
    patientId: resolvePatientIdFromRaw(appt),
    patientName,
    patientLabel: patientName ? toPatientLabel(patientName) : undefined,
    appointmentTypeId:
      appt.appointment_type_id != null
        ? String(appt.appointment_type_id)
        : extractResourceId(appt.appointment_type) ??
          extractLinkId(links, "appointment_type"),
    appointmentTypeName,
    practitionerId:
      appt.practitioner_id != null
        ? String(appt.practitioner_id)
        : extractResourceId(appt.practitioner) ?? extractLinkId(links, "practitioner"),
    practitionerName,
    businessId:
      appt.business_id != null
        ? String(appt.business_id)
        : extractResourceId(appt.business) ?? extractLinkId(links, "business"),
    businessName,
    noteStatus: mapNoteStatus(appt.treatment_note_status as number | undefined),
    invoiceStatus: mapInvoiceStatus(appt.invoice_status as number | undefined),
    telehealthUrl: appt.telehealth_url as string | undefined,
    cancelledAt: appt.cancelled_at ? String(appt.cancelled_at) : undefined,
    archivedAt: appt.archived_at ? String(appt.archived_at) : undefined,
    source: "cliniko-test",
    rawLinks: links,
  };
}

function individualAppointmentFromBooking(booking: ClinikoBooking): ClinikoIndividualAppointment {
  return {
    id: booking.id,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    patientLabel: booking.patientLabel,
    appointmentTypeName: booking.appointmentTypeName,
    practitionerName: booking.practitionerName,
    businessName: booking.businessName,
    noteStatus: booking.noteStatus,
    invoiceStatus: booking.invoiceStatus,
    source: "cliniko-test",
    rawLinks: booking.rawLinks,
  };
}

function individualAppointmentToBooking(
  appointment: ClinikoIndividualAppointment
): ClinikoBooking {
  return {
    id: appointment.id,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    appointmentTypeName: appointment.appointmentTypeName,
    practitionerName: appointment.practitionerName,
    businessName: appointment.businessName,
    patientLabel: appointment.patientLabel ?? appointment.patientName,
    source: "cliniko",
    noteStatus: appointment.noteStatus,
    invoiceStatus: appointment.invoiceStatus,
    rawLinks: appointment.rawLinks,
  };
}

function mapOnlineBooking(booking: Record<string, unknown>): ClinikoBooking {
  return {
    id: String(booking.id ?? ""),
    startsAt: String(booking.starts_at ?? booking.start_time ?? ""),
    endsAt: String(booking.ends_at ?? booking.end_time ?? ""),
    appointmentTypeName:
      coerceClinikoField(booking.appointment_type_name) ??
      coerceClinikoField(booking.appointment_type),
    practitionerName:
      coerceClinikoField(booking.practitioner_name) ??
      coerceClinikoField(booking.practitioner),
    businessName:
      coerceClinikoField(booking.business_name) ?? coerceClinikoField(booking.business),
    patientLabel: toPatientLabel(
      coerceClinikoField(booking.patient_name) ?? coerceClinikoField(booking.patient)
    ),
    source: "cliniko",
    rawLinks: booking.links,
  };
}

function mapBooking(appt: Record<string, unknown>): ClinikoBooking {
  return individualAppointmentToBooking(mapIndividualAppointment(appt));
}

function formatAddress(b: Record<string, unknown>): string | undefined {
  const parts = [
    b.address_1,
    b.address_2,
    b.city,
    b.state,
    b.post_code,
  ].filter(Boolean);
  return parts.length > 0 ? parts.map(String).join(", ") : undefined;
}

function parseDurationMinutes(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function parsePrice(t: Record<string, unknown>): number | undefined {
  const candidates = [t.price, t.default_price, t.fee];
  for (const c of candidates) {
    if (typeof c === "number") return c;
    if (typeof c === "string") {
      const parsed = parseFloat(c);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return undefined;
}
