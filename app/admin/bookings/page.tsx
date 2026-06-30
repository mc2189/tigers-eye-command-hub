"use client";

import { useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CalloutBox } from "@/components/admin/AdminUI";
import { ClinikoLoadState } from "@/components/admin/ClinikoLoadState";
import { DataSourceBadge } from "@/components/admin/DataSourceBadge";
import {
  DemoFeedbackToast,
  runDemoAction,
  useDemoFeedback,
} from "@/components/admin/DemoActionFeedback";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useCommandHubAppointments } from "@/components/admin/CommandHubAppointmentsProvider";
import {
  bookings,
  practitioners,
  locations,
  paymentStatusLabels,
  invoiceStatusLabels,
  sourceLabels,
  sourceBadgeColors,
  getPractitioner,
  getLocation,
  getAppointmentType,
  type PractitionerId,
  type LocationId,
  type PaymentStatus,
} from "@/lib/demo-data";
import type { MappedBooking } from "@/lib/cliniko-mappers";

export default function BookingsPage() {
  const [practitioner, setPractitioner] = useState<PractitionerId | "all">("all");
  const [location, setLocation] = useState<LocationId | "all">("all");
  const [payment, setPayment] = useState<PaymentStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "insurance" | "private" | "telehealth">("all");
  const { mapped, source, loading, lastChecked, error, isLive, connected, reload } =
    useCommandHubAppointments();
  const { message, show } = useDemoFeedback();

  const filteredLive = useMemo(() => {
    return mapped.filter((b) => {
      if (typeFilter === "insurance" && b.workstream !== "insurance") return false;
      if (typeFilter === "private" && b.workstream !== "private") return false;
      if (typeFilter === "telehealth" && b.workstream !== "telehealth") return false;
      return true;
    });
  }, [mapped, typeFilter]);

  const filteredDemo = bookings.filter((b) => {
    if (practitioner !== "all" && b.practitionerId !== practitioner) return false;
    if (location !== "all" && b.locationId !== location) return false;
    if (payment !== "all" && b.paymentStatus !== payment) return false;
    if (typeFilter === "insurance" && b.source !== "cliniko-insurance") return false;
    if (typeFilter === "private" && b.source !== "cliniko-private") return false;
    if (typeFilter === "telehealth" && b.source !== "telehealth") return false;
    return true;
  });

  return (
    <>
      <AdminPageHeader
        title="Bookings"
        subtitle="Live Cliniko appointments with Command Hub payment, note and invoice context."
      >
        <div className="flex flex-wrap items-center gap-3">
          <DataSourceBadge source={isLive ? source : "demo"} />
          {lastChecked && <span className="text-sm text-slate">Updated {lastChecked}</span>}
          {connected && (
            <button
              type="button"
              onClick={() => void reload()}
              disabled={loading}
              className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh from Cliniko"}
            </button>
          )}
        </div>
      </AdminPageHeader>

      <CalloutBox title="How this works">
        <p>
          Cliniko supplies the booking record. Command Hub adds payment, note, invoice,
          insurance and stock context around it. Technical proof tools live in the{" "}
          <a href="/admin/cliniko/test-lab" className="font-medium text-green hover:underline">
            Cliniko test lab
          </a>
          .
        </p>
      </CalloutBox>

      {loading && (
        <section className="mt-6">
          <ClinikoLoadState loading />
        </section>
      )}

      {error && (
        <section className="mt-6">
          <ClinikoLoadState error={error} />
        </section>
      )}

      {!loading && isLive && (
        <section className="mt-6">
          <h2 className="mb-3 font-semibold text-navy">Live Cliniko appointments</h2>
          <ClinikoLoadState empty={filteredLive.length === 0}>
            <div className="hidden overflow-x-auto rounded-xl border border-cream-dark bg-white lg:block">
              <MappedBookingsTable bookings={filteredLive} />
            </div>
            <div className="space-y-4 lg:hidden">
              {filteredLive.map((b) => (
                <MappedBookingCard key={b.id} booking={b} />
              ))}
            </div>
          </ClinikoLoadState>
        </section>
      )}

      {!isLive && !loading && (
        <>
          <h2 className="mt-6 mb-4 font-semibold text-navy">Demo bookings</h2>
          <p className="mb-4 text-sm text-slate">
            Connect Cliniko to replace this table with live sandbox appointments.
          </p>

          <div className="mb-6 flex flex-wrap gap-3">
            <select value={practitioner} onChange={(e) => setPractitioner(e.target.value as PractitionerId | "all")} className="min-h-10 rounded-lg border border-cream-dark bg-white px-3 text-sm" aria-label="Practitioner filter">
              <option value="all">All practitioners</option>
              {practitioners.filter((p) => !p.isPlaceholder).map((p) => (
                <option key={p.id} value={p.id}>{p.shortName}</option>
              ))}
            </select>
            <select value={location} onChange={(e) => setLocation(e.target.value as LocationId | "all")} className="min-h-10 rounded-lg border border-cream-dark bg-white px-3 text-sm" aria-label="Location filter">
              <option value="all">All locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <select value={payment} onChange={(e) => setPayment(e.target.value as PaymentStatus | "all")} className="min-h-10 rounded-lg border border-cream-dark bg-white px-3 text-sm" aria-label="Payment filter">
              <option value="all">All payment statuses</option>
              {(Object.keys(paymentStatusLabels) as PaymentStatus[]).map((s) => (
                <option key={s} value={s}>{paymentStatusLabels[s]}</option>
              ))}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="min-h-10 rounded-lg border border-cream-dark bg-white px-3 text-sm" aria-label="Type filter">
              <option value="all">All types</option>
              <option value="private">Private</option>
              <option value="insurance">Insurance</option>
              <option value="telehealth">Telehealth</option>
            </select>
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-cream-dark bg-white lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-cream-dark bg-cream/50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-navy">Date / time</th>
                  <th className="px-4 py-3 font-semibold text-navy">Client</th>
                  <th className="px-4 py-3 font-semibold text-navy">Practitioner</th>
                  <th className="px-4 py-3 font-semibold text-navy">Location</th>
                  <th className="px-4 py-3 font-semibold text-navy">Type</th>
                  <th className="px-4 py-3 font-semibold text-navy">Source</th>
                  <th className="px-4 py-3 font-semibold text-navy">Payment</th>
                  <th className="px-4 py-3 font-semibold text-navy">Note</th>
                  <th className="px-4 py-3 font-semibold text-navy">Invoice</th>
                  <th className="px-4 py-3 font-semibold text-navy">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDemo.map((b) => (
                  <tr key={b.id} className="border-b border-cream-dark last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap">{b.date}<br /><span className="text-slate">{b.time}</span></td>
                    <td className="px-4 py-3 font-medium">{b.clientName}</td>
                    <td className="px-4 py-3">{getPractitioner(b.practitionerId).shortName}</td>
                    <td className="px-4 py-3">{getLocation(b.locationId).shortName}</td>
                    <td className="px-4 py-3">{getAppointmentType(b.appointmentTypeId).name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sourceBadgeColors[b.source]}`}>
                        {sourceLabels[b.source]}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge label={paymentStatusLabels[b.paymentStatus]} variant={b.paymentStatus === "unpaid" ? "warning" : "neutral"} /></td>
                    <td className="px-4 py-3"><StatusBadge label={b.noteStatus} variant={b.noteStatus === "draft-needed" ? "warning" : "neutral"} /></td>
                    <td className="px-4 py-3"><StatusBadge label={invoiceStatusLabels[b.invoiceStatus]} variant="neutral" /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <ActionBtn label="Cliniko" onDemo={show} />
                        <ActionBtn label="Note" onDemo={show} />
                        <ActionBtn label="Invoice" onDemo={show} />
                        <ActionBtn label="Follow-up" onDemo={show} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <DemoFeedbackToast message={message} />
    </>
  );
}

function MappedBookingsTable({ bookings }: { bookings: MappedBooking[] }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-cream-dark bg-cream/50">
        <tr>
          <th className="px-4 py-3 font-semibold text-navy">Date / time</th>
          <th className="px-4 py-3 font-semibold text-navy">Client</th>
          <th className="px-4 py-3 font-semibold text-navy">Type</th>
          <th className="px-4 py-3 font-semibold text-navy">Practitioner</th>
          <th className="px-4 py-3 font-semibold text-navy">Workstream</th>
          <th className="px-4 py-3 font-semibold text-navy">Payment rule</th>
          <th className="px-4 py-3 font-semibold text-navy">Note</th>
          <th className="px-4 py-3 font-semibold text-navy">Warnings</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((b) => (
          <tr key={b.id} className="border-b border-cream-dark last:border-0">
            <td className="px-4 py-3 whitespace-nowrap">{b.date}<br /><span className="text-slate">{b.time}</span></td>
            <td className="px-4 py-3 font-medium">{b.clientName}</td>
            <td className="px-4 py-3">{b.appointmentTypeName}</td>
            <td className="px-4 py-3">
              {b.practitionerMatched ? b.practitionerName : (
                <span className="text-amber-700">Unmatched Cliniko practitioner</span>
              )}
            </td>
            <td className="px-4 py-3">
              <StatusBadge label={b.workstream} variant="neutral" />
            </td>
            <td className="px-4 py-3 text-slate">{b.paymentRule}</td>
            <td className="px-4 py-3"><StatusBadge label={b.noteStatus} variant="warning" /></td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {b.warnings.slice(0, 2).map((w) => (
                  <StatusBadge key={w} label={w} variant="warning" />
                ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MappedBookingCard({ booking: b }: { booking: MappedBooking }) {
  return (
    <article className="rounded-xl border border-blue-200 bg-blue-50/30 p-4">
      <div className="flex justify-between gap-2">
        <p className="font-semibold text-navy">{b.clientName}</p>
        <DataSourceBadge source="cliniko" />
      </div>
      <p className="text-sm text-slate">{b.date} {b.time} · {b.appointmentTypeName}</p>
      <p className="mt-2 text-sm">{b.paymentRule}</p>
      {b.warnings.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {b.warnings.map((w) => (
            <StatusBadge key={w} label={w} variant="warning" />
          ))}
        </div>
      )}
    </article>
  );
}

function ActionBtn({
  label,
  onDemo,
}: {
  label: string;
  onDemo: (msg: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => void runDemoAction(label, onDemo)}
      className="min-h-9 rounded-lg border border-cream-dark px-3 py-1.5 text-xs font-medium text-green hover:bg-cream"
    >
      {label}
    </button>
  );
}
