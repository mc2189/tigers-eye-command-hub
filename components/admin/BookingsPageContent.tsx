"use client";

import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { GroupedWorkflowBundleList } from "@/components/admin/GroupedWorkflowBundleList";
import { ClinikoLoadState } from "@/components/admin/ClinikoLoadState";
import { ClinikoDataQualityBanner } from "@/components/admin/ClinikoDataQualityBanner";
import { ClinikoFeedStatusRow } from "@/components/admin/ClinikoFeedStatusRow";
import { DemoWeekPreviewBanner, DemoWeekPreviewToggle } from "@/components/admin/DemoWeekPreviewToggle";
import { PlainEmptyState } from "@/components/admin/PlainEmptyState";
import { WhatThisShows } from "@/components/admin/WhatThisShows";
import { useCommandHubAppointments } from "@/components/admin/CommandHubAppointmentsProvider";
import { useInsuranceSessionCases } from "@/components/admin/useInsuranceSessionCases";
import { getClinikoConnectionEmptyState } from "@/lib/cliniko-connection-copy";

export function BookingsPageContent() {
  const {
    loading,
    lastChecked,
    error,
    isLive,
    demoWeekPreview,
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
  const hasData = demoWeekPreview || isLive;

  return (
    <>
      <WorkflowPageHeader
        title="Bookings"
        purpose="Review appointments from Cliniko and see what each one needs next."
      />

      <WhatThisShows>
        This page shows appointments from Cliniko and the next operational step for each one.
      </WhatThisShows>

      <DemoWeekPreviewBanner />

      <ClinikoFeedStatusRow
        configured={configured}
        connected={connected}
        isLive={isLive}
        appointmentCount={mapped.length}
        lastChecked={lastChecked}
        loading={loading}
        onRefresh={() => void reload()}
        sourceLabel={demoWeekPreview ? "Demo week preview" : undefined}
      />

      <ClinikoDataQualityBanner visible={Boolean(isLive && hasDisplayQualityIssues)} />

      {loading && <ClinikoLoadState loading />}
      {error && !demoWeekPreview && (
        <div className="mb-6">
          <ClinikoLoadState error={error} />
        </div>
      )}

      {!loading && (
        <>
          {!hasData && !loading ? (
            <>
              <PlainEmptyState
                title={connectionEmpty.title}
                description={connectionEmpty.description}
              />
              <div className="mt-4">
                <DemoWeekPreviewToggle />
              </div>
            </>
          ) : hasData && enrichedBundles.length === 0 ? (
            <PlainEmptyState
              title="No appointments in the current view."
              description="Preview demo clinic week or refresh the Cliniko feed."
            />
          ) : hasData ? (
            <GroupedWorkflowBundleList
              bundles={enrichedBundles}
              groupByDay
              emptyTitle="No appointments match this filter."
            />
          ) : isLive && !hasLiveAppointments ? (
            <>
              <PlainEmptyState
                title="No live Cliniko appointments found in the current date window."
                description="Create a DEMO appointment in Cliniko or preview the demo clinic week."
              />
              <div className="mt-4">
                <DemoWeekPreviewToggle />
              </div>
            </>
          ) : null}
        </>
      )}
    </>
  );
}
