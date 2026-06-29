"use client";

import { useState } from "react";
import { CalloutBox } from "./AdminUI";
import { ClinikoLoadState } from "./ClinikoLoadState";
import { DataSourceBadge } from "./DataSourceBadge";
import { MetricCard } from "./MetricCard";
import { ProgressBar } from "./AdminUI";
import { useMappedClinikoBookings } from "./useMappedClinikoBookings";
import {
  groupByLocation,
  groupByPractitioner,
  groupByWorkstream,
  mapClinikoBookingToFinanceItem,
} from "@/lib/cliniko-mappers";

export function ClinikoFinancePanel() {
  const { mapped, source, loading, lastChecked, load, error } = useMappedClinikoBookings();
  const [loaded, setLoaded] = useState(false);

  async function handleLoad() {
    await load();
    setLoaded(true);
  }

  const financeItems = mapped.map(mapClinikoBookingToFinanceItem);
  const totalIncome = financeItems.reduce((sum, i) => sum + i.estimatedFee, 0);
  const missingPrices = financeItems.filter((i) => i.priceSource === "missing");
  const needsAction = financeItems.filter((i) => i.needsAction);
  const byWorkstream = groupByWorkstream(mapped);
  const byPractitioner = groupByPractitioner(mapped);
  const byLocation = groupByLocation(mapped);

  function workstreamTotal(ws: keyof typeof byWorkstream) {
    return byWorkstream[ws].reduce((s, b) => s + b.estimatedFee, 0);
  }

  return (
    <section className="mb-8 rounded-xl border border-cream-dark bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">
            Estimated income from Cliniko sandbox bookings
          </h2>
          <p className="mt-1 text-sm text-slate">
            Estimated/demo values only — not accounting records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleLoad()}
          disabled={loading}
          className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load Cliniko sandbox preview"}
        </button>
      </div>

      {loading && (
        <div className="mt-4">
          <ClinikoLoadState loading />
        </div>
      )}

      {loaded && !loading && (
        <ClinikoLoadState error={error} empty={!error && mapped.length === 0}>
          <div className="mt-4 flex flex-wrap gap-2">
            <DataSourceBadge source={source} />
            {lastChecked && (
              <span className="text-xs text-slate">Last checked: {lastChecked}</span>
            )}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total estimated income" value={`£${totalIncome}`} />
            <MetricCard label="Bookings loaded" value={mapped.length} />
            <MetricCard label="Missing prices" value={missingPrices.length} />
            <MetricCard label="Needs action" value={needsAction.length} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div>
              <h3 className="mb-3 font-semibold text-navy">By workstream</h3>
              <div className="space-y-3">
                {(["private", "insurance", "telehealth", "external"] as const).map((ws) => {
                  const amount = workstreamTotal(ws);
                  const pct = totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0;
                  return (
                    <ProgressBar
                      key={ws}
                      label={ws.charAt(0).toUpperCase() + ws.slice(1)}
                      amount={amount}
                      percent={pct}
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-navy">By practitioner</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(byPractitioner).map(([name, items]) => (
                  <div key={name} className="flex justify-between">
                    <span>{name}</span>
                    <span className="font-medium">
                      £{items.reduce((s, b) => s + b.estimatedFee, 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-navy">By location</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(byLocation).map(([name, items]) => (
                  <div key={name} className="flex justify-between">
                    <span>{name}</span>
                    <span className="font-medium">
                      £{items.reduce((s, b) => s + b.estimatedFee, 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {(missingPrices.length > 0 || needsAction.length > 0) && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {missingPrices.length > 0 && (
                <CalloutBox variant="warning" title="Appointment types missing prices">
                  <p>{missingPrices.length} booking(s) used fallback or £0 pricing.</p>
                </CalloutBox>
              )}
              {mapped.some((b) => b.workstream === "insurance") && (
                <CalloutBox variant="warning" title="Insurance bookings">
                  <p>Insurance bookings need claim/session details captured in Cliniko.</p>
                </CalloutBox>
              )}
              {mapped.some((b) => b.workstream === "telehealth") && (
                <CalloutBox variant="warning" title="Telehealth bookings">
                  <p>Telehealth bookings should require payment before appointment.</p>
                </CalloutBox>
              )}
            </div>
          )}
        </ClinikoLoadState>
      )}
    </section>
  );
}
