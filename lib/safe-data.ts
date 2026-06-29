export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function nestedClinikoLabel(value: Record<string, unknown>): string | undefined {
  const direct =
    value.name ??
    value.label ??
    value.business_name ??
    value.appointment_type_name ??
    value.patient_name ??
    value.practitioner_name;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const first = value.first_name;
  const last = value.last_name;
  if (typeof first === "string" || typeof last === "string") {
    const parts = [first, last].filter((part) => typeof part === "string" && part.trim());
    if (parts.length > 0) return parts.join(" ");
  }

  return undefined;
}

export function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") {
    const nested = nestedClinikoLabel(value as Record<string, unknown>);
    if (nested) return nested;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

export function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function safeDateLabel(value: unknown, fallback = "Time not returned"): string {
  const text = safeString(value);
  if (!text) return fallback;
  try {
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return fallback;
    return date.toLocaleString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return fallback;
  }
}

export function safeLowerCase(value: unknown, fallback = ""): string {
  return safeString(value, fallback).toLowerCase();
}
