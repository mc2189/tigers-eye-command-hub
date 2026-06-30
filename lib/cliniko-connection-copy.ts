import type { ClinikoStatusData } from "@/components/admin/ClinikoConnectionPanel";

export function getClinikoConnectionEmptyState(
  status: ClinikoStatusData | null
): { title: string; description: string } {
  const error = status?.error ?? "";
  const rateLimited =
    error.includes("429") || error.toLowerCase().includes("rate limit");

  if (rateLimited) {
    return {
      title: "Cliniko test account is rate-limited.",
      description:
        "The configured Cliniko test account hit a temporary API limit. Wait a few seconds, then refresh. This is the live test account — not demo fallback data.",
    };
  }

  if (status?.configured && status.status === "error") {
    return {
      title: "Cliniko test account connection failed.",
      description:
        error ||
        "The Cliniko test API key is configured on this server but could not be reached. Open the Cliniko test lab to diagnose, then refresh.",
    };
  }

  if (status?.status === "not_configured" || status?.configured === false) {
    return {
      title: "Cliniko test account not configured on this server.",
      description:
        "Add CLINIKO_API_KEY from your Cliniko test account to this server's environment (.env.local locally, Vercel env vars for production), redeploy if needed, then refresh.",
    };
  }

  return {
    title: "Cliniko test account not connected.",
    description:
      "Configure the Cliniko test API key on this server, then refresh this page.",
  };
}
