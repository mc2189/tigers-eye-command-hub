import { DataSourceBadge } from "./DataSourceBadge";
import { bookingLinks, bookingStrategy } from "@/lib/tigers-eye-content";

export function AviemoreClinikoPanel() {
  return (
    <section className="rounded-xl border border-green/30 bg-green-muted/20 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">Aviemore Cliniko migration</h2>
        <DataSourceBadge source="cliniko" />
      </div>
      <p className="mt-3 max-w-3xl text-sm text-slate leading-relaxed">
        {bookingStrategy.solution} Aviemore is configured as a separate Cliniko
        location or business with filtered booking links — not a second booking system.
      </p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg border border-cream-dark bg-white p-3">
          <dt className="font-semibold text-navy">Aviemore status</dt>
          <dd className="mt-1 text-slate capitalize">
            {bookingLinks.aviemore.status.replace(/-/g, " ")}
          </dd>
        </div>
        <div className="rounded-lg border border-cream-dark bg-white p-3">
          <dt className="font-semibold text-navy">Dundee status</dt>
          <dd className="mt-1 text-slate capitalize">{bookingLinks.dundee.status}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-slate">
        <strong className="text-navy">Setmore (legacy):</strong>{" "}
        {bookingLinks.legacySetmore.note}
      </p>
    </section>
  );
}
