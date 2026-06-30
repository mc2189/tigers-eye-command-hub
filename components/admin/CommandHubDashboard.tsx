"use client";

import Link from "next/link";
import { useCommandHubAppointments } from "@/components/admin/CommandHubAppointmentsProvider";
import { ActionQueue } from "@/components/admin/ActionQueue";
import { ClinikoLoadState } from "@/components/admin/ClinikoLoadState";
import { WorkflowHelpPanel } from "@/components/admin/WorkflowHelpPanel";
import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { WorkflowSummaryCard } from "@/components/admin/WorkflowSummaryCard";
import {
  countTodayWorkflowMetrics,
  mappedBookingToWorkflowView,
} from "@/lib/admin-workflow";

const quickActions = [
  { href: "/admin/calendar", label: "Open calendar" },
  { href: "/admin/bookings", label: "Review bookings" },
  { href: "/admin/notes", label: "Write notes" },
  { href: "/admin/invoices", label: "Check invoices" },
  { href: "/admin/insurance", label: "Review insurance cases" },
  { href: "/admin/cliniko/test-lab", label: "Open Cliniko test lab", technical: true },
];

export function CommandHubDashboard() {
  const { mapped, loading, error, isLive, connected, lastChecked, reload } =
    useCommandHubAppointments();

  const todayIso = new Date().toISOString().split("T")[0];
  const todayAppointments = mapped.filter((b) => b.date === todayIso);
  const metrics = countTodayWorkflowMetrics(mapped, todayIso);
  const commandList = todayAppointments.map(mappedBookingToWorkflowView);

  return (
    <>
      <WorkflowPageHeader
        title="Today"
        purpose="Here is what needs attention today, what each appointment needs, and what to do next."
      >
        {connected && (
          <button
            type="button"
            onClick={() => void reload()}
            disabled={loading}
            className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh live feed"}
          </button>
        )}
      </WorkflowPageHeader>

      <p className="sr-only">Today&apos;s command list · Cliniko connected</p>

      {loading && <ClinikoLoadState loading />}
      {error && <div className="mb-6"><ClinikoLoadState error={error} /></div>}

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WorkflowSummaryCard
          label="Today's appointments"
          value={isLive ? metrics.appointments : "—"}
          hint={isLive ? "From Cliniko test account" : "Connect Cliniko to see live appointments"}
          href="/admin/bookings"
          status={metrics.appointments > 0 ? "ready" : "default"}
        />
        <WorkflowSummaryCard
          label="Notes to complete"
          value={isLive ? metrics.notesToComplete : "—"}
          href="/admin/notes"
          status={metrics.notesToComplete > 0 ? "attention" : "default"}
        />
        <WorkflowSummaryCard
          label="Payments to check"
          value={isLive ? metrics.paymentsToCheck : "—"}
          href="/admin/payments"
          status={metrics.paymentsToCheck > 0 ? "attention" : "default"}
        />
        <WorkflowSummaryCard
          label="Invoices to send"
          value={isLive ? metrics.invoicesToSend : "—"}
          href="/admin/invoices"
          status={metrics.invoicesToSend > 0 ? "attention" : "default"}
        />
      </section>

      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <ActionQueue
          title="Today's command list"
          appointments={isLive ? commandList : []}
          emptyTitle={
            isLive ? "No appointments scheduled for today." : "No live Cliniko appointments found."
          }
          emptyDescription={
            isLive
              ? "When appointments appear in Cliniko for today, they will show here with the actions each one needs."
              : "Create a DEMO appointment in Cliniko, then refresh the live feed."
          }
        />

        <div className="space-y-6">
          <WorkflowHelpPanel
            title="Clinic status"
            items={[
              connected ? "Cliniko connected" : "Cliniko not connected — showing demo examples",
              isLive
                ? `Live appointments found (${mapped.length} this week)`
                : "No live appointments found",
              lastChecked ? `Last checked ${lastChecked}` : "Not checked yet",
              "Demo mode active",
              "No real patient data stored",
            ]}
          />

          <section className="rounded-xl border border-cream-dark bg-white p-5">
            <h2 className="text-sm font-semibold text-navy">Quick actions</h2>
            <div className="mt-3 grid gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    action.technical
                      ? "border-cream-dark text-slate hover:bg-cream"
                      : "border-green/20 text-navy hover:bg-green-muted"
                  }`}
                >
                  {action.label}
                  {action.technical ? (
                    <span className="mt-0.5 block text-xs font-normal text-slate">
                      Technical demo proof only
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
