/**
 * Cliniko list query helpers — safe for client and server.
 * API queries use ISO-8601 UTC datetimes in q[] filters.
 */

export type ClinikoQOperator = ":=" | ":>=" | ":<=";

export function buildClinikoDateTime(value: Date): string {
  return value.toISOString();
}

export function buildClinikoQFilter(
  field: string,
  operator: ClinikoQOperator,
  value: string | Date
): string {
  const encoded =
    value instanceof Date ? buildClinikoDateTime(value) : value.trim();
  return `${field}${operator}${encoded}`;
}

export function offsetClinikoDate(days: number, from: Date = new Date()): Date {
  const next = new Date(from.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export interface IndividualAppointmentsQueryParams {
  page?: number;
  perPage?: number;
  sort?: string;
  qFilters?: string[];
}

export function buildIndividualAppointmentsQueryString(
  params: IndividualAppointmentsQueryParams = {}
): string {
  const search = new URLSearchParams({
    page: String(params.page ?? 1),
    per_page: String(params.perPage ?? 100),
    sort: params.sort ?? "starts_at:asc",
  });

  for (const filter of params.qFilters ?? []) {
    if (filter.trim()) {
      search.append("q[]", filter);
    }
  }

  return search.toString();
}

export function buildIndividualAppointmentsPath(
  params: IndividualAppointmentsQueryParams = {}
): string {
  const qs = buildIndividualAppointmentsQueryString(params);
  return `/individual_appointments?${qs}`;
}

export function formatClinikoDateTimeLocal(
  iso: string,
  timeZone = "Europe/London"
): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString("en-GB", {
      timeZone,
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
