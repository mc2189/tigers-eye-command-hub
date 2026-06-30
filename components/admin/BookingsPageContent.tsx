"use client";

import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { WorkflowBundleList } from "@/components/admin/WorkflowBundleList";
import { ClinikoLoadState } from "@/components/admin/ClinikoLoadState";
import { DataSourcePill } from "@/components/admin/DataSourcePill";
import { PlainEmptyState } from "@/components/admin/PlainEmptyState";
import { useCommandHubAppointments } from "@/components/admin/CommandHubAppointmentsProvider";
import { useInsuranceSessionCases } from "@/components/admin/useInsuranceSessionCases";
import { getClinikoConnectionEmptyState } from "@/lib/cliniko-connection-copy";

export function BookingsPageContent() {
  const {
    loading,
    lastChecked,
    error,
    isLive,
    connected,
    hasLiveAppointments,
    clinikoStatus,
    reload,
  } = useCommandHubAppointments();
  const { enrichedBundles } = useInsuranceSessionCases();

  const bundles = enrichedBundles;
  const connectionEmpty = getClinikoConnectionEmptyState(clinikoStatus);

  return (
    <>
      <WorkflowPageHeader
        title="Bookings"
        purpose="Review appointments coming from Cliniko and see what each one needs next."
      >
        <DataSourcePill kind={isLive ? "cliniko-test" : "demo"} />
        {connected && (
          <button
            type="button"
            onClick={() => void reload()}
            disabled={loading}
            className="min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-semibold text-navy hover:bg-cream disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        )}
      </WorkflowPageHeader>

      {lastChecked && (
        <p className="mb-4 text-sm text-slate">Last checked {lastChecked}</p>
      )}

      {loading && <ClinikoLoadState loading />}
      {error && (
        <div className="mb-6">
          <ClinikoLoadState error={error} />
        </div>
      )}

      {!loading && !error && (
        <>
          {!connected ? (
            <PlainEmptyState
              title={connectionEmpty.title}
              description={connectionEmpty.description}
            />
          ) : isLive && !hasLiveAppointments ? (
            <PlainEmptyState
              title="No live Cliniko appointments found in the current date window."
              description="Create a DEMO appointment in Cliniko (within the next 90 days), then refresh. If appointments exist in Cliniko but not here, open the Cliniko test lab to probe the feed."
            />
          ) : isLive ? (
            <WorkflowBundleList bundles={bundles} />
          ) : (
            <PlainEmptyState
              title="Could not load live Cliniko appointments."
              description="Check the Cliniko connection in the test lab, confirm your API key shard matches CLINIKO_SHARD, then refresh."
            />
          )}
        </>
      )}
    </>
  );
}
