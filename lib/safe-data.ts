export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
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
