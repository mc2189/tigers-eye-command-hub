"use client";

import { useMemo } from "react";
import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { ActionQueue } from "@/components/admin/ActionQueue";
import { ClinikoLoadState } from "@/components/admin/ClinikoLoadState";
import { DataSourcePill } from "@/components/admin/DataSourcePill";
import { PlainEmptyState } from "@/components/admin/PlainEmptyState";
import { useCommandHubAppointments } from "@/components/admin/CommandHubAppointmentsProvider";
import { mappedBookingToWorkflowView } from "@/lib/admin-workflow";

export default function BookingsPage() {
  const { mapped, source, loading, lastChecked, error, isLive, connected, reload } =
    useCommandHubAppointments();

  const appointments = useMemo(
    () => mapped.map(mappedBookingToWorkflowView),
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
      {error && <div className="mb-6"><ClinikoLoadState error={error} /></div>}

      {isLive ? (
        <ActionQueue
          title="Live Cliniko appointments"
          appointments={appointments}
          emptyTitle="No live Cliniko appointments found."
          emptyDescription="Create a DEMO appointment in Cliniko, then refresh the live feed."
        />
      ) : (
        <PlainEmptyState
          title="No live Cliniko appointments found."
          description="Connect the Cliniko test account and create DEMO appointments to see your live booking list here. Demo examples are hidden from this daily view."
        />
      )}
    </>
  );
}
