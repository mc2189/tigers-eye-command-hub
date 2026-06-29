"use client";

import { useEffect, useState } from "react";
import { DataSourceBadge } from "./DataSourceBadge";
import { StatusBadge } from "./StatusBadge";

type DataSource = "cliniko" | "demo";

interface PanelProps<T> {
  title: string;
  endpoint: string;
  dataKey: string;
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

function DataPanel<T extends { id: string }>({
  title,
  endpoint,
  dataKey,
  renderItem,
  emptyMessage = "No items available.",
}: PanelProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [source, setSource] = useState<DataSource>("demo");
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(endpoint, { cache: "no-store" })
      .then((r) => r.json())
      .then((json: Record<string, unknown>) => {
        setSource((json.source as DataSource) ?? "demo");
        setItems((json[dataKey] as T[]) ?? []);
      })
      .catch(() => {
        setItems([]);
        setSource("demo");
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [endpoint, dataKey]);

  return (
    <article className="rounded-xl border border-cream-dark bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-navy">{title}</h3>
        <DataSourceBadge source={source === "cliniko" ? "cliniko" : "demo"} />
      </div>
      {loading ? (
        <p className="text-sm text-slate">Loading Cliniko sandbox data…</p>
      ) : error ? (
        <p className="text-sm text-amber-800">
          Cliniko could not be reached. Demo data is still available.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2 text-sm">{items.map((item) => (
          <li key={item.id} className="rounded-lg border border-cream-dark p-3">
            {renderItem(item)}
          </li>
        ))}</ul>
      )}
    </article>
  );
}

export function ClinikoLiveDataPanels() {
  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-bold text-navy">Live / sandbox data</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <DataPanel<{ id: string; name: string; address?: string; timezone?: string }>
          title="Businesses / locations"
          endpoint="/api/cliniko/businesses"
          dataKey="businesses"
          renderItem={(b) => (
            <>
              <p className="font-medium text-navy">{b.name}</p>
              {b.address && <p className="text-slate">{b.address}</p>}
              {b.timezone && <p className="text-xs text-slate">{b.timezone}</p>}
            </>
          )}
        />
        <DataPanel<{ id: string; name: string; role?: string; email?: string }>
          title="Practitioners / users"
          endpoint="/api/cliniko/practitioners"
          dataKey="practitioners"
          renderItem={(p) => (
            <>
              <p className="font-medium text-navy">{p.name}</p>
              {p.role && <p className="text-slate">{p.role}</p>}
              {p.email && <p className="text-xs text-slate">{p.email}</p>}
            </>
          )}
        />
        <DataPanel<{
          id: string;
          name: string;
          durationMinutes?: number;
          price?: number;
          telehealthEnabled?: boolean;
        }>
          title="Appointment types"
          endpoint="/api/cliniko/appointment-types"
          dataKey="appointmentTypes"
          renderItem={(t) => (
            <>
              <p className="font-medium text-navy">{t.name}</p>
              <p className="text-slate">
                {t.durationMinutes ? `${t.durationMinutes} min` : "—"}
                {t.price !== undefined ? ` · £${t.price}` : ""}
                {t.telehealthEnabled ? " · Telehealth" : ""}
              </p>
            </>
          )}
        />
        <DataPanel<{
          id: string;
          startsAt: string;
          patientLabel?: string;
          appointmentTypeName?: string;
          noteStatus?: string;
        }>
          title="Recent bookings"
          endpoint="/api/cliniko/bookings?perPage=8"
          dataKey="bookings"
          renderItem={(b) => (
            <>
              <p className="font-medium text-navy">
                {b.patientLabel ?? "Cliniko patient"}
              </p>
              <p className="text-slate">
                {formatDateTime(b.startsAt)}
                {b.appointmentTypeName ? ` · ${b.appointmentTypeName}` : ""}
              </p>
              {b.noteStatus && (
                <p className="text-xs text-slate">Note: {b.noteStatus}</p>
              )}
            </>
          )}
        />
      </div>
    </section>
  );
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
