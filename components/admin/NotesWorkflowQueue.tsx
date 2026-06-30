"use client";

import { useMemo } from "react";
import { useCommandHubAppointments } from "./CommandHubAppointmentsProvider";
import { PlainEmptyState } from "./PlainEmptyState";
import { DataSourcePill } from "./DataSourcePill";
import { OpenRecordButton } from "./OpenRecordButton";
import { getNotesQueue } from "@/lib/admin-workflow";
import { DEMO_CLINIC_WEEK_SCENARIOS, DEMO_NOTE_SAFETY_COPY } from "@/lib/demo-clinic-week";

export function NotesWorkflowQueue() {
  const { mapped, isLive, demoWeekPreview } = useCommandHubAppointments();
  const queue = useMemo(() => getNotesQueue(mapped), [mapped]);
  const hasData = demoWeekPreview || isLive;

  const demoNotes = DEMO_CLINIC_WEEK_SCENARIOS.filter((s) => s.noteStatus !== "complete").slice(
    0,
    6
  );

  return (
    <section className="mb-8 rounded-xl border border-cream-dark bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">Appointments needing notes</h2>
        {hasData && (
          <DataSourcePill
            kind={demoWeekPreview ? "demo" : "cliniko-test"}
            label={demoWeekPreview ? "Demo week preview" : "Cliniko test account"}
          />
        )}
      </div>
      <p className="mt-2 text-sm text-slate">{DEMO_NOTE_SAFETY_COPY.join(" ")}</p>
      <p className="sr-only">
        Notes can only be saved for DEMO-linked patients · No audio stored · Open record
      </p>

      {!hasData || (queue.length === 0 && demoNotes.length === 0) ? (
        <div className="mt-4">
          <PlainEmptyState
            title="No notes due."
            description="Appointments needing treatment notes will appear here when appointments are loaded."
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {(queue.length > 0
            ? queue.map(({ bundle, suggestedTemplate }) => ({
                id: bundle.appointmentId,
                patient: bundle.patientLabel,
                type: bundle.appointmentType,
                time: bundle.time,
                practitioner: bundle.practitioner,
                template: suggestedTemplate,
                status: "Suggested by Command Hub" as const,
              }))
            : demoNotes.map((s) => ({
                id: s.id,
                patient: s.patientLabel,
                type: s.appointmentType,
                time: s.time,
                practitioner: s.preferredPractitioner,
                template: s.noteDraft.templateName,
                status:
                  s.noteDraft.status === "prepared-for-cliniko"
                    ? ("Prepared for Cliniko" as const)
                    : ("Suggested by Command Hub" as const),
              }))
          ).map((item) => (
            <li key={item.id} className="rounded-lg border border-cream-dark p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-navy">{item.patient}</p>
                  <p className="text-sm text-slate">
                    {item.type} · {item.time} · {item.practitioner}
                  </p>
                </div>
                <DataSourcePill kind="inferred" label={item.status} />
              </div>
              <p className="mt-2 text-sm text-slate">
                Template: <strong>{item.template}</strong>
              </p>
              <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate">Can save?</dt>
                  <dd className="font-medium text-navy">No — Blocked for safety</dd>
                </div>
                <div>
                  <dt className="text-slate">Reason</dt>
                  <dd className="text-navy">Preview-only appointment is not linked to Cliniko</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <OpenRecordButton appointmentId={item.id} variant="secondary" />
                <span className="sr-only">Open record</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
