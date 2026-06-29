"use client";

import { useState } from "react";
import { ClinikoLoadState } from "./ClinikoLoadState";
import { DataSourceBadge } from "./DataSourceBadge";
import { StatusBadge } from "./StatusBadge";
import {
  DemoFeedbackToast,
  runDemoAction,
  useDemoFeedback,
} from "./DemoActionFeedback";
import { useMappedClinikoBookings } from "./useMappedClinikoBookings";
import type { MappedBooking } from "@/lib/cliniko-mappers";

function invoiceActionFor(booking: MappedBooking): string {
  if (booking.workstream === "insurance") return "Claim details needed — draft insurer invoice";
  if (booking.workstream === "external") return "Manual external invoice route";
  if (booking.workstream === "telehealth") return "Payment confirmation needed";
  if (booking.paymentStatus === "unpaid") return "Payment link / check needed";
  if (booking.isPast) return "Possible invoice task — session completed";
  return "Review invoice status";
}

export function ClinikoInvoiceQueuePanel() {
  const { mapped, source, loading, load, error } = useMappedClinikoBookings();
  const [loaded, setLoaded] = useState(false);
  const { message, show } = useDemoFeedback();

  const queue = mapped.filter(
    (b) =>
      b.isPast ||
      b.workstream === "insurance" ||
      b.workstream === "external" ||
      b.paymentStatus === "unpaid" ||
      b.invoiceStatus === "draft-needed"
  );

  async function handleLoad() {
    await load();
    setLoaded(true);
  }

  return (
    <section className="mb-8 rounded-xl border border-cream-dark bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">Cliniko-derived invoice queue</h2>
        <button
          type="button"
          onClick={() => void handleLoad()}
          disabled={loading}
          className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load sandbox queue"}
        </button>
      </div>
      <p className="mt-2 text-sm text-slate">
        Inferred follow-up tasks from Cliniko bookings — no real invoice creation.
      </p>

      {loading && (
        <div className="mt-4">
          <ClinikoLoadState loading />
        </div>
      )}

      {loaded && !loading && (
        <ClinikoLoadState
          error={error}
          empty={!error && queue.length === 0}
          emptyMessage="No invoice tasks inferred from sandbox bookings yet."
        >
          <div className="mt-4 flex gap-2">
            <DataSourceBadge source={source} />
            <DataSourceBadge source="inferred" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {queue.map((b) => (
                <article
                  key={b.id}
                  className="rounded-lg border border-cream-dark p-4"
                >
                  <p className="font-semibold text-navy">{b.clientName}</p>
                  <p className="text-sm text-slate">
                    {b.date} · {b.appointmentTypeName}
                  </p>
                  <p className="mt-2 text-sm">{invoiceActionFor(b)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge label={b.workstream} variant="neutral" />
                    <StatusBadge label={`£${b.estimatedFee}`} variant="info" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["Draft invoice", "Copy invoice text", "Open in Cliniko"] as const).map(
                      (label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => void runDemoAction(label, show)}
                          className="min-h-9 rounded-lg border border-cream-dark px-3 py-1.5 text-xs font-medium text-green hover:bg-cream"
                        >
                          {label}
                        </button>
                      )
                    )}
                  </div>
                </article>
            ))}
          </div>
        </ClinikoLoadState>
      )}
      <DemoFeedbackToast message={message} />
    </section>
  );
}
