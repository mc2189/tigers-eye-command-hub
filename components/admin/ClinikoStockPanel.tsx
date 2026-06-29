"use client";

import { useMemo, useState } from "react";
import { ClinikoLoadState } from "./ClinikoLoadState";
import { DataSourceBadge } from "./DataSourceBadge";
import { StatusBadge } from "./StatusBadge";
import { useMappedClinikoBookings } from "./useMappedClinikoBookings";

export function ClinikoStockPanel() {
  const { mapped, source, loading, load, error } = useMappedClinikoBookings();
  const [loaded, setLoaded] = useState(false);

  const stockEstimate = useMemo(() => {
    const usage: Record<string, { count: number; types: Set<string> }> = {};
    for (const b of mapped) {
      for (const item of b.stockImpact) {
        if (!usage[item]) usage[item] = { count: 0, types: new Set() };
        usage[item].count += 1;
        usage[item].types.add(b.appointmentTypeName);
      }
    }
    return Object.entries(usage).map(([item, data]) => ({
      item,
      count: data.count,
      types: [...data.types],
    }));
  }, [mapped]);

  async function handleLoad() {
    await load();
    setLoaded(true);
  }

  return (
    <section className="mb-8 rounded-xl border border-cream-dark bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">Cliniko-driven stock estimate</h2>
        <button
          type="button"
          onClick={() => void handleLoad()}
          disabled={loading}
          className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light disabled:opacity-50"
        >
          {loading ? "Loading…" : "Estimate from sandbox bookings"}
        </button>
      </div>
      <p className="mt-2 text-sm text-slate">
        Estimated consumable usage from mapped Cliniko bookings + demo usage rules.
      </p>

      {loading && (
        <div className="mt-4">
          <ClinikoLoadState loading />
        </div>
      )}

      {loaded && !loading && (
        <ClinikoLoadState
          error={error}
          empty={!error && stockEstimate.length === 0}
          emptyMessage="No stock usage inferred from sandbox bookings yet."
        >
          <div className="mt-4 flex gap-2">
            <DataSourceBadge source={source} />
            <DataSourceBadge source="inferred" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stockEstimate.map((s) => (
                <article
                  key={s.item}
                  className="rounded-lg border border-cream-dark p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-navy">{s.item}</p>
                    <StatusBadge
                      label={s.count >= 3 ? "Reorder soon" : "OK"}
                      variant={s.count >= 3 ? "warning" : "success"}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate">
                    Est. {s.count} use{s.count !== 1 ? "s" : ""} this load
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    From: {s.types.join(", ")}
                  </p>
                </article>
            ))}
          </div>
        </ClinikoLoadState>
      )}
    </section>
  );
}
