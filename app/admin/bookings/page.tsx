"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
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

export default function BookingsPage() {
  const [practitioner, setPractitioner] = useState<PractitionerId | "all">("all");
  const [location, setLocation] = useState<LocationId | "all">("all");
  const [payment, setPayment] = useState<PaymentStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "insurance" | "private" | "telehealth">("all");

  const filtered = bookings.filter((b) => {
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
        subtitle="All appointments from Cliniko sandbox with payment, note and invoice context."
      />

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
            {filtered.map((b) => (
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
                    <ActionBtn label="Cliniko" />
                    <ActionBtn label="Note" />
                    <ActionBtn label="Invoice" />
                    <ActionBtn label="Follow-up" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 lg:hidden">
        {filtered.map((b) => (
          <article key={b.id} className="rounded-xl border border-cream-dark bg-white p-4">
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-semibold text-navy">{b.clientName}</p>
                <p className="text-sm text-slate">{b.date} {b.time}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sourceBadgeColors[b.source]}`}>
                {sourceLabels[b.source]}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div><dt className="text-slate">Practitioner</dt><dd>{getPractitioner(b.practitionerId).shortName}</dd></div>
              <div><dt className="text-slate">Location</dt><dd>{getLocation(b.locationId).shortName}</dd></div>
              <div><dt className="text-slate">Payment</dt><dd>{paymentStatusLabels[b.paymentStatus]}</dd></div>
              <div><dt className="text-slate">Note</dt><dd>{b.noteStatus}</dd></div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <ActionBtn label="Open in Cliniko" />
              <ActionBtn label="Create note" />
              <ActionBtn label="Draft invoice" />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function ActionBtn({ label }: { label: string }) {
  return (
    <button type="button" className="min-h-9 rounded-lg border border-cream-dark px-3 py-1.5 text-xs font-medium text-green hover:bg-cream">
      {label}
    </button>
  );
}
