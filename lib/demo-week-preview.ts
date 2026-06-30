/**
 * Demo week preview toggle — browser localStorage only.
 */

export const DEMO_WEEK_PREVIEW_KEY = "tigers-eye-demo-week-preview-v1";

export function isDemoWeekPreviewActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DEMO_WEEK_PREVIEW_KEY) !== "inactive";
  } catch {
    return true;
  }
}

export function setDemoWeekPreviewActive(active: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEMO_WEEK_PREVIEW_KEY, active ? "active" : "inactive");
    window.dispatchEvent(new CustomEvent("demo-week-preview-changed"));
  } catch {
    /* ignore */
  }
}

export function isDemoWeekPreviewDefaultOn(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(DEMO_WEEK_PREVIEW_KEY) !== "inactive";
}

export type DemoDataSourceLabel =
  | "Cliniko test account"
  | "Demo week preview"
  | "Demo case detail"
  | "Suggested by Command Hub"
  | "Prepared for Cliniko"
  | "Saved to Cliniko test account"
  | "Demo-only browser state"
  | "Future integration";

export function getActiveSourceLabel(
  previewActive: boolean,
  isLive: boolean
): DemoDataSourceLabel {
  if (previewActive) return "Demo week preview";
  if (isLive) return "Cliniko test account";
  return "Demo week preview";
}
