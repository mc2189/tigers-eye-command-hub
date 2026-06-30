"use client";

import { useMemo } from "react";
import { useCommandHubAppointments } from "./CommandHubAppointmentsProvider";
import { PlainEmptyState } from "./PlainEmptyState";
import { DataSourcePill } from "./DataSourcePill";
import { getFollowUpQueue } from "@/lib/admin-workflow";
import { DEMO_CLINIC_WEEK_SCENARIOS } from "@/lib/demo-clinic-week";

export function FollowUpWorkflowQueue() {
  const { mapped, isLive, demoWeekPreview } = useCommandHubAppointments();
  const queue = useMemo(() => getFollowUpQueue(mapped), [mapped]);
  const hasData = demoWeekPreview || isLive;

  const demoFollowUps = DEMO_CLINIC_WEEK_SCENARIOS.filter((s) => s.followUpScenario).slice(0, 6);

  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-bold text-navy">Suggested follow-ups</h2>
      <p className="mb-4 text-sm text-slate">
        Suggested by Command Hub — nothing is sent automatically in this demo.
      </p>
      <p className="sr-only">Follow-up suggested in 7 days · Not yet booked in Cliniko</p>

      {!hasData || (queue.length === 0 && demoFollowUps.length === 0) ? (
        <PlainEmptyState
          title="No follow-up suggestions."
          description="Follow-up prompts appear when appointment types suggest a check-in or rebook."
        />
      ) : (
        <ul className="space-y-4">
          {(queue.length > 0
            ? queue.map((item) => ({
                id: item.bundle.appointmentId,
                patient: item.bundle.patientLabel,
                detail: `${item.bundle.appointmentType} · ${item.bundle.date} ${item.bundle.time}`,
                messageType: item.messageType,
                message: item.suggestedMessage,
              }))
            : demoFollowUps.map((s) => ({
                id: s.id,
                patient: s.patientLabel,
                detail: s.appointmentType,
                messageType: s.followUpScenario!.summary,
                message:
                  s.followUpScenario!.checkInMessage ??
                  (s.followUpScenario!.bookedInCliniko
                    ? "Booked in Cliniko test account"
                    : "Not yet booked in Cliniko"),
              }))
          ).map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-cream-dark bg-white p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-navy">{item.patient}</p>
                  <p className="text-sm text-slate">{item.detail}</p>
                </div>
                <DataSourcePill kind="inferred" label="Suggested by Command Hub" />
              </div>
              <p className="mt-2 text-sm font-medium text-navy">{item.messageType}</p>
              <blockquote className="mt-3 rounded-lg bg-cream p-3 text-sm text-navy italic">
                {item.message}
              </blockquote>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
