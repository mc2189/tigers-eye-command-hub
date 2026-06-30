import type { ClinikoStatusData } from "@/components/admin/ClinikoConnectionPanel";

export function getClinikoConnectionEmptyState(
  status: ClinikoStatusData | null
): { title: string; description: string } {
  if (status?.status === "not_configured") {
    return {
      title: "Cliniko API key not configured on this server.",
      description:
        "Your local .env.local does not apply to Vercel. Add CLINIKO_API_KEY (and related Cliniko env vars) in the Vercel project settings, redeploy, then refresh this page.",
    };
  }

  if (status?.status === "error") {
    return {
      title: "Cliniko connection failed.",
      description:
        status.error ??
        "Check CLINIKO_API_KEY and CLINIKO_SHARD in your server environment, then open the Cliniko test lab to diagnose.",
    };
  }

  return {
    title: "Cliniko not connected.",
    description:
      "Add your Cliniko test API key and matching shard to the server environment, then refresh this page.",
  };
}
