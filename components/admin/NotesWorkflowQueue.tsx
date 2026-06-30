"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCommandHubAppointments } from "./CommandHubAppointmentsProvider";
import { PlainEmptyState } from "./PlainEmptyState";
import { DataSourcePill } from "./DataSourcePill";
import { getNotesQueue } from "@/lib/admin-workflow";

export function NotesWorkflowQueue() {
  const { mapped, isLive } = useCommandHubAppointments();
  const queue = useMemo(() => getNotesQueue(mapped), [mapped]);

  return (
    <section className="mb-8 rounded-xl border border-cream-dark bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">Appointments needing notes</h2>
        {isLive && <DataSourcePill kind="cliniko-test" />}
      </div>
      <p className="sr-only">Appointments needing notes</p>
      <p className="mt-2 text-sm text-slate">
        No audio is stored. There is no local clinical-note database. The practitioner reviews
        before save. Cliniko remains the clinical record.
      </p>

      {!isLive || queue.length === 0 ? (
        <div className="mt-4">
          <PlainEmptyState
            title="No notes due."
            description="Appointments needing treatment notes will appear here when live Cliniko appointments are loaded."
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {queue.map(({ bundle, suggestedTemplate }) => (
            <li
              key={bundle.appointmentId}
              className="rounded-lg border border-cream-dark p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-navy">{bundle.patientLabel}</p>
                  <p className="text-sm text-slate">
                    {bundle.appointmentType} · {bundle.time} · {bundle.practitioner}
                  </p>
                </div>
                <DataSourcePill kind="inferred" label="Inferred workflow" />
              </div>
              <p className="mt-2 text-sm text-slate">
                Suggested template: <strong>{suggestedTemplate}</strong>
              </p>
              <Link
                href="/admin/notes#notes-assistant"
                className="mt-3 inline-flex min-h-9 items-center rounded-lg bg-green px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-light"
              >
                Open note assistant
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
