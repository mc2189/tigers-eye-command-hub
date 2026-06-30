"use client";

import { useMemo } from "react";
import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { WorkflowBundleList } from "@/components/admin/WorkflowBundleList";
import { ClinikoLoadState } from "@/components/admin/ClinikoLoadState";
import { DataSourcePill } from "@/components/admin/DataSourcePill";
import { PlainEmptyState } from "@/components/admin/PlainEmptyState";
import { useCommandHubAppointments } from "@/components/admin/CommandHubAppointmentsProvider";
import { buildWorkflowActionsForAppointments } from "@/lib/admin-workflow";

export function BookingsPageContent() {
  const { mapped, loading, lastChecked, error, isLive, connected, reload } =
    useCommandHubAppointments();

  const bundles = useMemo(
    () => buildWorkflowActionsForAppointments(mapped),
    [mapped]
  );

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

      {isLive ? (
        <WorkflowBundleList bundles={bundles} />
      ) : (
        <PlainEmptyState
          title="No live Cliniko appointments found."
          description="Connect the Cliniko test account and create DEMO appointments to see your live booking list here."
        />
      )}
    </>
  );
}
