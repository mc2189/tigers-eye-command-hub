"use client";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  waitlistEntries,
  getPractitioner,
  getLocation,
} from "@/lib/demo-data";

export default function WaitlistPage() {
  return (
    <>
      <AdminPageHeader
        title="Waitlist"
        subtitle="Match patients to calendar gaps — offer slots from recommended actions."
      />

      <div className="space-y-4">
        {waitlistEntries.map((entry) => (
          <article
            key={entry.id}
            className="rounded-xl border border-cream-dark bg-white p-4 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-navy">{entry.clientName}</h2>
              {entry.matchScore && (
                <StatusBadge
                  label={`${entry.matchScore}% match`}
                  variant={entry.matchScore >= 80 ? "success" : "neutral"}
                />
              )}
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <div>
                <dt className="text-slate">Location</dt>
                <dd className="font-medium">{getLocation(entry.desiredLocation).name}</dd>
              </div>
              <div>
                <dt className="text-slate">Practitioner</dt>
                <dd className="font-medium">
                  {getPractitioner(entry.desiredPractitionerId).name}
                </dd>
              </div>
              <div>
                <dt className="text-slate">Appointment type</dt>
                <dd className="font-medium">{entry.appointmentType}</dd>
              </div>
              <div>
                <dt className="text-slate">Availability</dt>
                <dd className="font-medium">{entry.availabilityWindow}</dd>
              </div>
              <div>
                <dt className="text-slate">Contact preference</dt>
                <dd className="font-medium">{entry.contactPreference}</dd>
              </div>
              {entry.matchedGap && (
                <div>
                  <dt className="text-slate">Matched gap</dt>
                  <dd className="font-medium text-green">{entry.matchedGap}</dd>
                </div>
              )}
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <WlAction label="Offer slot" primary />
              <WlAction label="Draft message" />
              <WlAction label="Mark contacted" />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function WlAction({ label, primary }: { label: string; primary?: boolean }) {
  return (
    <button
      type="button"
      className={`min-h-10 rounded-lg px-4 py-2 text-sm font-semibold ${
        primary
          ? "bg-green text-white hover:bg-green-light"
          : "border border-cream-dark text-navy hover:bg-cream"
      }`}
    >
      {label}
    </button>
  );
}
