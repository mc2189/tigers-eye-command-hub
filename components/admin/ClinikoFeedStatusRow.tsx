"use client";

import { DataSourcePill } from "@/components/admin/DataSourcePill";

interface ClinikoFeedStatusRowProps {
  configured: boolean;
  connected: boolean;
  isLive: boolean;
  appointmentCount: number;
  lastChecked: string | null;
  loading: boolean;
  onRefresh: () => void;
  sourceLabel?: string;
}

export function ClinikoFeedStatusRow({
  configured,
  connected,
  isLive,
  appointmentCount,
  lastChecked,
  loading,
  onRefresh,
  sourceLabel,
}: ClinikoFeedStatusRowProps) {
  const connectionLabel = sourceLabel
    ? sourceLabel
    : connected
      ? "Cliniko test account connected"
      : configured
        ? "Cliniko test account configured"
        : "Cliniko test account not configured";

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-cream-dark bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <DataSourcePill
            kind={sourceLabel ? "demo" : isLive || configured ? "cliniko-test" : "demo"}
            label={sourceLabel}
          />
          <span className="font-medium text-navy">
            {sourceLabel ? connectionLabel : connectionLabel}
          </span>
        </div>
        <p className="text-slate">
          {appointmentCount > 0
            ? `${appointmentCount} appointment${appointmentCount === 1 ? "" : "s"} loaded`
            : "No appointments loaded yet"}
          {lastChecked ? ` · Last checked ${lastChecked}` : ""}
        </p>
      </div>
      {(connected || configured) && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="min-h-10 shrink-0 rounded-lg border border-cream-dark px-4 py-2 text-sm font-semibold text-navy hover:bg-cream disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      )}
    </div>
  );
}
