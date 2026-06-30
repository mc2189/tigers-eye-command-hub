"use client";

import { useMemo } from "react";
import { DataSourcePill } from "./DataSourcePill";
import { PlainEmptyState } from "./PlainEmptyState";
import { StatusBadge } from "./StatusBadge";
import { useCommandHubAppointments } from "./CommandHubAppointmentsProvider";
import { getStockQueue } from "@/lib/admin-workflow";

export function ClinikoStockPanel() {
  const { mapped, isLive } = useCommandHubAppointments();
  const queue = useMemo(() => getStockQueue(mapped), [mapped]);

  const aggregated = useMemo(() => {
    const usage: Record<string, number> = {};
    for (const item of queue) {
      for (const stock of item.items) {
        usage[stock] = (usage[stock] ?? 0) + 1;
      }
    }
    return Object.entries(usage).map(([name, count]) => ({ name, count }));
  }, [queue]);

  return (
    <section className="mb-8 rounded-xl border border-cream-dark bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">Cliniko-driven stock estimate</h2>
        {isLive && <DataSourcePill kind="cliniko-test" />}
      </div>
      <p className="mt-2 text-sm text-slate">
        Estimated consumables from upcoming appointment types.{" "}
        <strong>Estimated only</strong> — not inventory management.
      </p>
      <p className="sr-only">Estimated only</p>

      {!isLive || queue.length === 0 ? (
        <div className="mt-4">
          <PlainEmptyState
            title="No stock usage inferred yet."
            description="When live Cliniko appointments include appointment types with stock rules, estimated consumables will appear here."
          />
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aggregated.map((s) => (
              <article key={s.name} className="rounded-lg border border-cream-dark p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-navy">{s.name}</p>
                  <StatusBadge
                    label={s.count >= 3 ? "Reorder soon" : "OK"}
                    variant={s.count >= 3 ? "warning" : "success"}
                  />
                </div>
                <p className="mt-2 text-sm text-slate">
                  Est. {s.count} use{s.count !== 1 ? "s" : ""} from upcoming appointments
                </p>
                <p className="mt-1 text-xs text-slate">Estimated only</p>
              </article>
            ))}
          </div>
          <ul className="mt-6 space-y-2 text-sm text-slate">
            {queue.map((item) => (
              <li key={item.bundle.appointmentId}>
                {item.bundle.patientLabel} · {item.bundle.appointmentType}:{" "}
                {item.items.join(", ") || "No stock rule configured"}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
