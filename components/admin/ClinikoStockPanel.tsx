"use client";

import { useMemo } from "react";
import { DataSourcePill } from "./DataSourcePill";
import { PlainEmptyState } from "./PlainEmptyState";
import { StatusBadge } from "./StatusBadge";
import { useCommandHubAppointments } from "./CommandHubAppointmentsProvider";

export function ClinikoStockPanel() {
  const { mapped, isLive } = useCommandHubAppointments();

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

  return (
    <section className="mb-8 rounded-xl border border-cream-dark bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">Cliniko-driven stock estimate</h2>
        {isLive && <DataSourcePill kind="cliniko-test" />}
      </div>
      <p className="mt-2 text-sm text-slate">
        Estimated consumable usage from live Cliniko appointments. Stock estimate only — not
        inventory management.
      </p>

      {!isLive || stockEstimate.length === 0 ? (
        <div className="mt-4">
          <PlainEmptyState
            title="No stock usage inferred yet."
            description="When live Cliniko appointments include appointment types with stock rules, estimated consumables will appear here."
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stockEstimate.map((s) => (
            <article key={s.item} className="rounded-lg border border-cream-dark p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-navy">{s.item}</p>
                <StatusBadge
                  label={s.count >= 3 ? "Reorder soon" : "OK"}
                  variant={s.count >= 3 ? "warning" : "success"}
                />
              </div>
              <p className="mt-2 text-sm text-slate">
                Est. {s.count} use{s.count !== 1 ? "s" : ""} from upcoming appointments
              </p>
              <p className="mt-1 text-xs text-slate">Inferred from appointment type: {s.types.join(", ")}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
