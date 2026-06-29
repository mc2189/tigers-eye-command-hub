"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "./StatusBadge";
import type { ClinikoStatusData } from "./ClinikoConnectionPanel";

interface ClinikoSyncPanelProps {
  onBookingsCount?: (count: number) => void;
}

export function ClinikoSyncPanel({ onBookingsCount }: ClinikoSyncPanelProps) {
  const [status, setStatus] = useState<ClinikoStatusData | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [bookingsAvailable, setBookingsAvailable] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [statusRes, bookingsRes] = await Promise.all([
        fetch("/api/cliniko/status", { cache: "no-store" }),
        fetch("/api/cliniko/bookings?perPage=50", { cache: "no-store" }),
      ]);
      const statusJson = (await statusRes.json()) as ClinikoStatusData;
      const bookingsJson = (await bookingsRes.json()) as {
        totalEntries?: number;
        bookings?: unknown[];
      };
      setStatus(statusJson);
      const count =
        bookingsJson.totalEntries ?? bookingsJson.bookings?.length ?? 0;
      setBookingsAvailable(count);
      onBookingsCount?.(count);
      setLastChecked(new Date().toLocaleString("en-GB"));
    } catch {
      setStatus(null);
      setBookingsAvailable(null);
    }
  }, [onBookingsCount]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connected = status?.status === "connected" && status.source === "cliniko";

  return (
    <div className="mb-6 rounded-xl border border-cream-dark bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-navy">Cliniko sandbox sync</h2>
        <StatusBadge
          label={connected ? "Cliniko sandbox" : "Demo data"}
          variant={connected ? "success" : "warning"}
        />
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate">Last checked</dt>
          <dd className="font-medium text-navy">{lastChecked ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate">Bookings available</dt>
          <dd className="font-medium text-navy">{bookingsAvailable ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate">Overlays</dt>
          <dd className="font-medium text-navy">External / admin / stock remain demo</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={() => void refresh()}
        className="mt-3 min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-green hover:bg-cream"
      >
        Refresh Cliniko sync
      </button>
    </div>
  );
}
