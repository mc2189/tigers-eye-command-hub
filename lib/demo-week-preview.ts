/**
 * Demo week preview — persisted in Command Hub workflow store (server-side).
 */

export const DEMO_WEEK_PREVIEW_KEY = "tigers-eye-demo-week-preview-v1";

export type DemoDataSourceLabel =
  | "Cliniko test account"
  | "Demo week preview"
  | "Demo case detail"
  | "Suggested by Command Hub"
  | "Prepared for Cliniko"
  | "Saved to Cliniko test account"
  | "Command Hub demo case"
  | "Future integration";

export function getActiveSourceLabel(
  previewActive: boolean,
  isLive: boolean
): DemoDataSourceLabel {
  if (previewActive) return "Demo week preview";
  if (isLive) return "Cliniko test account";
  return "Demo week preview";
}
