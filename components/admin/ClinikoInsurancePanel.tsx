"use client";

import { useState } from "react";
import { CalloutBox } from "./AdminUI";
import { ClinikoLoadState } from "./ClinikoLoadState";
import { DataSourceBadge } from "./DataSourceBadge";
import { useMappedClinikoBookings } from "./useMappedClinikoBookings";

export function ClinikoInsurancePanel() {
  const { mapped, source, loading, load, error } = useMappedClinikoBookings();
  const [loaded, setLoaded] = useState(false);

  const insuranceBookings = mapped.filter(
    (b) => b.workstream === "insurance" || b.insuranceContext
  );

  async function handleLoad() {
    await load();
    setLoaded(true);
  }

  return (
    <section className="mb-8 rounded-xl border border-cream-dark bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">
          Possible insurance cases from Cliniko sandbox
        </h2>
        <button
          type="button"
          onClick={() => void handleLoad()}
          disabled={loading}
          className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load sandbox bookings"}
        </button>
      </div>

      <CalloutBox variant="info">
        <p>
          These are inferred insurance cases from Cliniko sandbox booking data. In the
          live version, claim/session details should be captured through Cliniko forms
          or custom fields.
        </p>
      </CalloutBox>

      {loading && (
        <div className="mt-4">
          <ClinikoLoadState loading />
        </div>
      )}

      {loaded && !loading && (
        <ClinikoLoadState
          error={error}
          empty={!error && insuranceBookings.length === 0}
          emptyMessage="No insurance-type sandbox bookings found yet. Add appointments in Cliniko or continue with demo data."
        >
          <div className="mt-4 flex gap-2">
            <DataSourceBadge source={source} />
            <DataSourceBadge source="inferred" />
          </div>
          <div className="mt-4 space-y-4">
            {insuranceBookings.map((b) => (
                <article
                  key={b.id}
                  className="rounded-lg border border-cream-dark p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-navy">{b.clientName}</p>
                      <p className="text-sm text-slate">
                        {b.appointmentTypeName} · {b.date} · {b.practitionerName}
                      </p>
                    </div>
                    <DataSourceBadge source="inferred" />
                  </div>
                  {b.insuranceContext?.likelyInsurer && (
                    <p className="mt-2 text-sm">
                      Likely insurer: <strong>{b.insuranceContext.likelyInsurer}</strong>
                    </p>
                  )}
                  <p className="mt-2 text-sm font-medium text-navy">Missing fields:</p>
                  <ul className="mt-1 space-y-0.5 text-sm text-slate">
                    {(b.insuranceContext?.missingFields ?? []).map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                </article>
              ))}
          </div>
        </ClinikoLoadState>
      )}
    </section>
  );
}
