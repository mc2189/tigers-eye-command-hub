"use client";

import { useEffect, useState } from "react";
import { DataSourceBadge } from "./DataSourceBadge";
import {
  appointmentTypes as demoAppointmentTypes,
  bookings as demoBookings,
  practitioners as demoPractitioners,
} from "@/lib/demo-data";
import { clinics } from "@/lib/tigers-eye-content";

type DataSource = "cliniko" | "demo" | "unavailable";

interface PanelProps<T> {
  title: string;
  endpoint: string;
  dataKey: string;
  renderItem: (item: T) => React.ReactNode;
  connectedEmptyMessage?: string;
  notConnectedEmptyMessage?: string;
}

function LiveDataPanel<T extends { id: string }>({
  title,
  endpoint,
  dataKey,
  renderItem,
  connectedEmptyMessage = "Connected to Cliniko, but no records were found.",
  notConnectedEmptyMessage = "Connect Cliniko to load live records.",
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
        const src = (json.source as string) ?? "demo";
        setSource(src === "cliniko" ? "cliniko" : src === "demo" ? "demo" : "unavailable");
        setItems((json[dataKey] as T[]) ?? []);
      })
      .catch(() => {
        setItems([]);
        setSource("unavailable");
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [endpoint, dataKey]);

  const emptyMessage =
    source === "cliniko" ? connectedEmptyMessage : notConnectedEmptyMessage;

  return (
    <article className="rounded-xl border border-cream-dark bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-navy">{title}</h3>
        <DataSourceBadge source={source === "cliniko" ? "cliniko" : "demo"} />
      </div>
      {loading ? (
        <p className="text-sm text-slate">Loading Cliniko data…</p>
      ) : error ? (
        <p className="text-sm text-amber-800">Cliniko could not be reached for this panel.</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-cream-dark p-3">
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function ClinikoLiveDataPanels() {
  return (
    <>
      <section className="mb-8">
        <h2 className="mb-2 text-lg font-bold text-navy">Live Cliniko data</h2>
        <p className="mb-4 text-sm text-slate">
          Real records from the connected Cliniko test account. Demo examples are shown separately
          below.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <LiveDataPanel<{ id: string; name: string; address?: string; timezone?: string }>
            title="Businesses / locations"
            endpoint="/api/cliniko/businesses"
            dataKey="businesses"
            connectedEmptyMessage="Connected to Cliniko, but no businesses were found."
            renderItem={(b) => (
              <>
                <p className="font-medium text-navy">{b.name}</p>
                {b.address && <p className="text-slate">{b.address}</p>}
                {b.timezone && <p className="text-xs text-slate">{b.timezone}</p>}
              </>
            )}
          />
          <LiveDataPanel<{ id: string; name: string; role?: string; email?: string }>
            title="Practitioners"
            endpoint="/api/cliniko/practitioners"
            dataKey="practitioners"
            connectedEmptyMessage="Connected to Cliniko, but no practitioners were found."
            renderItem={(p) => (
              <>
                <p className="font-medium text-navy">{p.name}</p>
                {p.role && <p className="text-slate">{p.role}</p>}
                {p.email && <p className="text-xs text-slate">{p.email}</p>}
              </>
            )}
          />
          <LiveDataPanel<{
            id: string;
            name: string;
            durationMinutes?: number;
            price?: number;
            telehealthEnabled?: boolean;
          }>
            title="Appointment types"
            endpoint="/api/cliniko/appointment-types"
            dataKey="appointmentTypes"
            connectedEmptyMessage="Connected to Cliniko, but no appointment types were found."
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
          <LiveDataPanel<{
            id: string;
            startsAt: string;
            patientLabel?: string;
            appointmentTypeName?: string;
            noteStatus?: string;
          }>
            title="Upcoming bookings"
            endpoint="/api/cliniko/bookings?perPage=8"
            dataKey="bookings"
            connectedEmptyMessage="Connected to Cliniko, but no upcoming bookings were found. Create a DEMO appointment or manually create one in Cliniko to prove booking read-back."
            renderItem={(b) => (
              <>
                <p className="font-medium text-navy">{b.patientLabel ?? "Cliniko patient"}</p>
                <p className="text-slate">
                  {formatDateTime(b.startsAt)}
                  {b.appointmentTypeName ? ` · ${b.appointmentTypeName}` : ""}
                </p>
                {b.noteStatus && <p className="text-xs text-slate">Note: {b.noteStatus}</p>}
              </>
            )}
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-bold text-navy">Demo examples</h2>
        <p className="mb-4 text-sm text-slate">
          Static Command Hub examples for walkthroughs. These are not live Cliniko records.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <DemoExamplesPanel title="Example businesses" badge="demo">
            <ul className="space-y-2 text-sm">
              {clinics.map((c) => (
                <li key={c.id} className="rounded-lg border border-cream-dark p-3">
                  <p className="font-medium text-navy">{c.name}</p>
                  <p className="text-slate">{c.address}</p>
                </li>
              ))}
            </ul>
          </DemoExamplesPanel>
          <DemoExamplesPanel title="Example practitioners" badge="demo">
            <ul className="space-y-2 text-sm">
              {demoPractitioners
                .filter((p) => !p.isPlaceholder)
                .map((p) => (
                  <li key={p.id} className="rounded-lg border border-cream-dark p-3">
                    <p className="font-medium text-navy">{p.name}</p>
                    <p className="text-slate">{p.role}</p>
                  </li>
                ))}
            </ul>
          </DemoExamplesPanel>
          <DemoExamplesPanel title="Example appointment types" badge="demo">
            <ul className="space-y-2 text-sm">
              {demoAppointmentTypes.map((t) => (
                <li key={t.id} className="rounded-lg border border-cream-dark p-3">
                  <p className="font-medium text-navy">{t.name}</p>
                  <p className="text-slate">{t.durationMinutes} min</p>
                </li>
              ))}
            </ul>
          </DemoExamplesPanel>
          <DemoExamplesPanel title="Example bookings" badge="demo">
            <ul className="space-y-2 text-sm">
              {demoBookings.slice(0, 6).map((b) => (
                <li key={b.id} className="rounded-lg border border-cream-dark p-3">
                  <p className="font-medium text-navy">{b.clientName}</p>
                  <p className="text-slate">
                    {b.date} {b.time}
                  </p>
                </li>
              ))}
            </ul>
          </DemoExamplesPanel>
        </div>
      </section>
    </>
  );
}

function DemoExamplesPanel({
  title,
  badge,
  children,
}: {
  title: string;
  badge: "demo";
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-xl border border-dashed border-cream-dark bg-cream/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-navy">{title}</h3>
        <DataSourceBadge source={badge} />
      </div>
      {children}
    </article>
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
