"use client";

import Link from "next/link";
import { ActionCard } from "@/components/admin/ActionCard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MetricCard } from "@/components/admin/MetricCard";
import { MiniPanel } from "@/components/admin/MiniPanel";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataSourceBadge } from "@/components/admin/DataSourceBadge";
import { ClinikoLoadState } from "@/components/admin/ClinikoLoadState";
import { useCommandHubAppointments } from "@/components/admin/CommandHubAppointmentsProvider";
import {
  bookings,
  dashboardActions,
  dashboardToday,
  dashboardWeek,
  financeSummary,
  followUpTasks,
  insuranceCases,
  paymentRecords,
  stockItems,
  noteAppointments,
} from "@/lib/demo-data";
import { paymentStatusLabels } from "@/lib/demo-data";
import { mapClinikoBookingToNoteTask } from "@/lib/cliniko-mappers";

export function CommandHubDashboard() {
  const { mapped, loading, error, isLive, connected, source, lastChecked, reload } =
    useCommandHubAppointments();

  const todayIso = new Date().toISOString().split("T")[0];
  const todayAppointments = mapped.filter((b) => b.date === todayIso);
  const moneyWaiting = paymentRecords.filter(
    (p) => p.status === "unpaid" || p.status === "cash-approval-required"
  );
  const insuranceWarnings = insuranceCases.filter((c) => c.warning);
  const stockWarnings = stockItems.filter((s) => s.status !== "ok");

  const notesPending = isLive
    ? todayAppointments
        .filter((b) => b.noteStatus !== "complete")
        .map(mapClinikoBookingToNoteTask)
    : noteAppointments.filter((n) => n.noteStatus !== "complete");

  const demoTodayBookings = bookings.filter((b) => b.date === bookings[0].date);

  return (
    <>
      <AdminPageHeader
        title="Command Hub"
        subtitle="Your daily view — live Cliniko appointments, finance, insurance, stock and follow-ups in one place."
      >
        {connected && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <DataSourceBadge source={isLive ? source : "demo"} />
            {lastChecked && <span className="text-slate">Updated {lastChecked}</span>}
            <button
              type="button"
              onClick={() => void reload()}
              disabled={loading}
              className="text-green font-medium hover:underline disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        )}
      </AdminPageHeader>

      <section className="mb-8 rounded-xl border border-green/30 bg-green-muted/30 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-navy">Start demo walkthrough</h2>
        <p className="mt-2 max-w-2xl text-base text-slate">
          New to the Command Hub? Follow the guided walkthrough to see how the public
          website, Cliniko bookings, notes, payments, invoices, insurance and stock all
          connect.
        </p>
        <Link
          href="/admin/demo-walkthrough"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-light"
        >
          Start walkthrough
        </Link>
      </section>

      {connected && loading && (
        <div className="mb-6">
          <ClinikoLoadState loading />
        </div>
      )}

      {connected && error && (
        <div className="mb-6">
          <ClinikoLoadState error={error} />
        </div>
      )}

      <section aria-labelledby="today-heading">
        <h2 id="today-heading" className="mb-4 text-lg font-bold text-navy">
          Today at a glance
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="Appointments today"
            value={isLive ? todayAppointments.length : dashboardToday.appointmentsToday}
            hint={isLive ? "From Cliniko" : undefined}
          />
          <MetricCard label="Practitioners active" value={dashboardToday.practitionersActive} />
          <MetricCard label="Est. revenue today" value={`£${dashboardToday.estimatedRevenue}`} />
          <MetricCard label="Insurance clients" value={dashboardToday.insuranceClients} />
          <MetricCard label="External work blocks" value={dashboardToday.externalWorkBlocks} />
          <MetricCard label="Stock warnings" value={dashboardToday.stockWarnings} hint="K-tape low" />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="week-heading">
        <h2 id="week-heading" className="mb-4 text-lg font-bold text-navy">
          This week
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Est. income" value={`£${dashboardWeek.estimatedIncome.toLocaleString()}`} />
          <MetricCard label="Outstanding invoices" value={`£${dashboardWeek.outstandingInvoices}`} />
          <MetricCard label="Calendar gaps" value={dashboardWeek.calendarGaps} />
          <MetricCard label="Follow-ups due" value={dashboardWeek.followUpsDue} />
          <MetricCard label="Insurance near limit" value={dashboardWeek.insuranceNearLimit} />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="mb-4 text-lg font-bold text-navy">
          Recommended actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dashboardActions.map((action) => (
            <ActionCard key={action.id} {...action} />
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="panels-heading">
        <h2 id="panels-heading" className="mb-4 text-lg font-bold text-navy">
          Live panels
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MiniPanel title="Today's calendar" href="/admin/calendar">
            {(isLive ? todayAppointments : demoTodayBookings).slice(0, 4).map((b) => (
              <div
                key={b.id}
                className="flex justify-between gap-2 border-b border-cream-dark py-2 last:border-0"
              >
                <span className="text-navy">
                  {"time" in b && b.time ? `${b.time} ` : ""}
                  {b.clientName}
                </span>
                <StatusBadge
                  label={isLive ? "Cliniko" : String(b.source).replace("cliniko-", "")}
                  variant="neutral"
                />
              </div>
            ))}
            {isLive && todayAppointments.length === 0 && (
              <p className="text-sm text-slate">No Cliniko appointments today.</p>
            )}
          </MiniPanel>

          <MiniPanel title="Money waiting" href="/admin/payments">
            {moneyWaiting.map((p) => (
              <div key={p.id} className="flex justify-between gap-2 border-b border-cream-dark py-2 last:border-0">
                <span>{p.clientName}</span>
                <StatusBadge label={paymentStatusLabels[p.status]} variant="warning" />
              </div>
            ))}
          </MiniPanel>

          <MiniPanel title="Insurance warnings" href="/admin/insurance">
            {insuranceWarnings.map((c) => (
              <div key={c.id} className="border-b border-cream-dark py-2 last:border-0">
                <p className="font-medium text-navy">{c.clientName} — {c.insurer}</p>
                <p className="text-xs text-amber-700">{c.warning}</p>
              </div>
            ))}
          </MiniPanel>

          <MiniPanel title="Notes to complete" href="/admin/notes">
            {notesPending.slice(0, 4).map((n) => (
              <div key={n.id} className="flex justify-between gap-2 border-b border-cream-dark py-2 last:border-0">
                <span>{n.clientName}</span>
                <StatusBadge label={n.noteStatus} variant="warning" />
              </div>
            ))}
          </MiniPanel>

          <MiniPanel title="Stock warnings" href="/admin/stock">
            {stockWarnings.map((s) => (
              <div key={s.id} className="flex justify-between gap-2 border-b border-cream-dark py-2 last:border-0">
                <span>{s.name}</span>
                <StatusBadge
                  label={s.status === "low" ? "Low" : "Reorder soon"}
                  variant="warning"
                />
              </div>
            ))}
          </MiniPanel>

          <MiniPanel title="Finance snapshot" href="/admin/finance">
            <p className="text-slate">{financeSummary.plainEnglish}</p>
            <Link href="/admin/finance" className="mt-2 inline-block text-sm font-medium text-green hover:underline">
              Open finance dashboard →
            </Link>
          </MiniPanel>
        </div>
      </section>
    </>
  );
}
