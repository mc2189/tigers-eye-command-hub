"use client";

import { useEffect, useState } from "react";
import { DataSourceBadge } from "./DataSourceBadge";
import {
  buildMappingHealthSummary,
  type ClinikoAppointmentTypeInput,
  type ClinikoBookingInput,
  type ClinikoBusinessInput,
  type ClinikoPractitionerInput,
  type MappingHealthSummary,
  mapClinikoBookings,
} from "@/lib/cliniko-mappers";

export function ClinikoMappingHealthPanel() {
  const [summary, setSummary] = useState<MappingHealthSummary | null>(null);
  const [source, setSource] = useState<"cliniko" | "demo">("demo");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [businessesRes, practitionersRes, typesRes, bookingsRes] =
          await Promise.all([
            fetch("/api/cliniko/businesses", { cache: "no-store" }),
            fetch("/api/cliniko/practitioners", { cache: "no-store" }),
            fetch("/api/cliniko/appointment-types", { cache: "no-store" }),
            fetch("/api/cliniko/bookings?perPage=50", { cache: "no-store" }),
          ]);

        const businesses = ((await businessesRes.json()) as { businesses: ClinikoBusinessInput[]; source: "cliniko" | "demo" }).businesses ?? [];
        const practitioners = ((await practitionersRes.json()) as { practitioners: ClinikoPractitionerInput[] }).practitioners ?? [];
        const appointmentTypes = ((await typesRes.json()) as { appointmentTypes: ClinikoAppointmentTypeInput[] }).appointmentTypes ?? [];
        const bookingsJson = (await bookingsRes.json()) as {
          bookings: ClinikoBookingInput[];
          source: "cliniko" | "demo";
        };

        const mapped = mapClinikoBookings(bookingsJson.bookings ?? [], {
          appointmentTypes,
        });

        setSummary(
          buildMappingHealthSummary(
            businesses,
            practitioners,
            appointmentTypes,
            mapped
          )
        );
        setSource(bookingsJson.source ?? "demo");
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <section className="mb-8 rounded-xl border border-cream-dark bg-white p-5">
        <p className="text-sm text-slate">Loading mapping health…</p>
      </section>
    );
  }

  if (!summary) return null;

  return (
    <section className="mb-8 rounded-xl border border-cream-dark bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-navy">Mapping health</h2>
        <DataSourceBadge source={source} />
      </div>
      <p className="mb-4 text-sm text-slate">
        How Cliniko sandbox data maps into Command Hub workflows.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {(
          [
            ["locationsMapped", "Locations mapped"],
            ["practitionersMapped", "Practitioners mapped"],
            ["appointmentTypesMapped", "Appointment types mapped"],
            ["bookingsMapped", "Bookings mapped"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="rounded-lg border border-cream-dark p-3 text-center">
            <p className="text-2xl font-bold text-navy">{summary[key]}</p>
            <p className="text-xs text-slate">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 text-sm">
        <ListBlock title="Unknown workstream types" items={summary.unknownWorkstreamTypes} />
        <ListBlock title="Missing payment rule" items={summary.missingPaymentRuleTypes} />
        <ListBlock title="Missing price" items={summary.missingPriceTypes} />
        <ListBlock title="Insurance types detected" items={summary.insuranceTypesDetected} />
        <ListBlock title="Telehealth types detected" items={summary.telehealthTypesDetected} />
        <ListBlock title="Stock-linked types" items={summary.stockLinkedTypes} />
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-navy">Action recommendations</h3>
        <ul className="mt-2 space-y-1 text-sm text-slate">
          {summary.recommendations.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-green">→</span>
              {r}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg bg-cream/50 p-3">
      <p className="font-medium text-navy">{title}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-slate">None</p>
      ) : (
        <ul className="mt-1 space-y-0.5 text-slate">
          {items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
