"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { followUpTasks } from "@/lib/demo-data";

export default function FollowupsPage() {
  const [tasks, setTasks] = useState(followUpTasks);

  function markSent(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "sent" as const } : t))
    );
  }

  function snooze(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "snoozed" as const } : t))
    );
  }

  function copyMessage(message: string) {
    void navigator.clipboard.writeText(message);
  }

  return (
    <>
      <AdminPageHeader
        title="Follow-ups"
        subtitle="Injury check-ins, rebook prompts, insurance reminders and review requests."
      />

      <div className="space-y-4">
        {tasks.map((task) => (
          <article
            key={task.id}
            className="rounded-xl border border-cream-dark bg-white p-4 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-navy">{task.type}</h2>
                <p className="text-sm text-slate">
                  {task.clientName} · Due {task.dueDate}
                </p>
              </div>
              <StatusBadge
                label={task.status}
                variant={
                  task.status === "pending"
                    ? "warning"
                    : task.status === "sent"
                      ? "success"
                      : "neutral"
                }
              />
            </div>
            <p className="mt-2 text-sm text-slate">
              <strong>Trigger:</strong> {task.trigger}
            </p>
            <blockquote className="mt-3 rounded-lg bg-cream p-3 text-sm text-navy italic">
              {task.suggestedMessage}
            </blockquote>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyMessage(task.suggestedMessage)}
                className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white"
              >
                Copy message
              </button>
              <button
                type="button"
                onClick={() => markSent(task.id)}
                className="min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-navy"
              >
                Mark sent
              </button>
              <button
                type="button"
                onClick={() => snooze(task.id)}
                className="min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-slate"
              >
                Snooze
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
