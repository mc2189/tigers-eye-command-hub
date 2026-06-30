"use client";

import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { WorkflowBundleList } from "@/components/admin/WorkflowBundleList";
import { ClinikoLoadState } from "@/components/admin/ClinikoLoadState";
import { ClinikoDataQualityBanner } from "@/components/admin/ClinikoDataQualityBanner";
import { ClinikoFeedStatusRow } from "@/components/admin/ClinikoFeedStatusRow";
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
    configured,
    hasLiveAppointments,
    clinikoStatus,
    mapped,
    hasDisplayQualityIssues,
    reload,
  } = useCommandHubAppointments();
  const { enrichedBundles } = useInsuranceSessionCases();

  const connectionEmpty = getClinikoConnectionEmptyState(clinikoStatus);

  return (
    <>
      <WorkflowPageHeader
        title="Bookings"
        purpose="Review appointments from Cliniko and see what each one needs next."
      />

      <ClinikoFeedStatusRow
        configured={configured}
        connected={connected}
        isLive={isLive}
        appointmentCount={mapped.length}
        lastChecked={lastChecked}
        loading={loading}
        onRefresh={() => void reload()}
      />

      <ClinikoDataQualityBanner visible={Boolean(isLive && hasDisplayQualityIssues)} />

      {loading && <ClinikoLoadState loading />}
      {error && (
        <div className="mb-6">
          <ClinikoLoadState error={error} />
        </div>
      )}

      {!loading && !error && (
        <>
          {!configured && !loading ? (
            <PlainEmptyState
              title={connectionEmpty.title}
              description={connectionEmpty.description}
            />
          ) : error && !hasLiveAppointments && !loading ? (
            <PlainEmptyState
              title="Cliniko appointments could not be loaded."
              description={error}
            />
          ) : isLive && !hasLiveAppointments ? (
            <PlainEmptyState
              title="No live Cliniko appointments found in the current date window."
              description="Create a DEMO appointment in Cliniko (within the next 90 days), then refresh. If appointments exist in Cliniko but not here, open the technical test lab to probe the feed."
            />
          ) : isLive ? (
            <WorkflowBundleList
              bundles={enrichedBundles}
              title="Live Cliniko appointments"
            />
          ) : !loading ? (
            <PlainEmptyState
              title={connectionEmpty.title}
              description={connectionEmpty.description}
            />
          ) : null}
        </>
      )}
    </>
  );
}
