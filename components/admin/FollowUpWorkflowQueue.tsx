"use client";

import { useMemo } from "react";
import { useCommandHubAppointments } from "./CommandHubAppointmentsProvider";
import { PlainEmptyState } from "./PlainEmptyState";
import { DataSourcePill } from "./DataSourcePill";
import { getFollowUpQueue } from "@/lib/admin-workflow";

export function FollowUpWorkflowQueue() {
  const { mapped, isLive } = useCommandHubAppointments();
  const queue = useMemo(() => getFollowUpQueue(mapped), [mapped]);

  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-bold text-navy">Suggested follow-ups from live appointments</h2>
      <p className="mb-4 text-sm text-slate">
        Suggestions only — nothing is sent automatically in this demo.
      </p>
      <p className="sr-only">follow-up</p>

      {!isLive || queue.length === 0 ? (
        <PlainEmptyState
          title="No follow-up suggestions from live appointments."
          description="Follow-up prompts will appear when appointment types suggest a check-in or rebook."
        />
      ) : (
        <ul className="space-y-4">
          {queue.map((item) => (
            <li
              key={item.bundle.appointmentId}
              className="rounded-xl border border-cream-dark bg-white p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-navy">{item.bundle.patientLabel}</p>
                  <p className="text-sm text-slate">
                    {item.bundle.appointmentType} · {item.bundle.date} {item.bundle.time}
                  </p>
                </div>
                <DataSourcePill kind="inferred" label="Inferred workflow" />
              </div>
              <p className="mt-2 text-sm font-medium text-navy">{item.messageType}</p>
              <blockquote className="mt-3 rounded-lg bg-cream p-3 text-sm text-navy italic">
                {item.suggestedMessage}
              </blockquote>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
