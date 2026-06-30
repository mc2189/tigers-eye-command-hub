"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCommandHubAppointments } from "@/components/admin/CommandHubAppointmentsProvider";
import { ClinikoDataQualityBanner } from "@/components/admin/ClinikoDataQualityBanner";
import { ClinikoFeedStatusRow } from "@/components/admin/ClinikoFeedStatusRow";
import { ClinikoLoadState } from "@/components/admin/ClinikoLoadState";
import { DemoWeekPreviewBanner, DemoWeekPreviewToggle } from "@/components/admin/DemoWeekPreviewToggle";
import { PlainEmptyState } from "@/components/admin/PlainEmptyState";
import { WhatThisShows } from "@/components/admin/WhatThisShows";
import { WorkflowBundleCard } from "@/components/admin/WorkflowBundleCard";
import { WorkflowHelpPanel } from "@/components/admin/WorkflowHelpPanel";
import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { WorkflowSummaryCard } from "@/components/admin/WorkflowSummaryCard";
import { useInsuranceSessionCases } from "@/components/admin/useInsuranceSessionCases";
import {
  bundleMissingSetup,
  bundleNeedsAttention,
  getCommandListContext,
  summariseWorkflowActions,
} from "@/lib/admin-workflow";
import { getClinikoConnectionEmptyState } from "@/lib/cliniko-connection-copy";
import { buildClientJourneys } from "@/lib/demo-client-journey";

const quickActions = [
  { href: "/admin/clients", label: "Client journeys" },
  { href: "/admin/calendar", label: "Open calendar" },
  { href: "/admin/bookings", label: "Review bookings" },
  { href: "/admin/notes", label: "Write notes" },
  { href: "/admin/invoices", label: "Check invoices" },
  { href: "/admin/insurance", label: "Review insurance cases" },
];

function BundleSection({
  title,
  hint,
  bundles,
}: {
  title: string;
  hint?: string;
  bundles: ReturnType<typeof useInsuranceSessionCases>["enrichedBundles"];
}) {
  if (bundles.length === 0) return null;
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate">{title}</h3>
        {hint && <p className="mt-1 text-sm text-slate">{hint}</p>}
      </div>
      <ul className="space-y-3">
        {bundles.map((bundle) => (
          <li key={bundle.appointmentId}>
            <WorkflowBundleCard bundle={bundle} showDetails={false} compact />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CommandHubDashboard() {
  const {
    mapped,
    loading,
    error,
    isLive,
    demoWeekPreview,
    connected,
    configured,
    hasLiveAppointments,
    hasDisplayQualityIssues,
    clinikoStatus,
    lastChecked,
    reload,
  } = useCommandHubAppointments();
  const { enrichedBundles, summary: insuranceSummary, cases } = useInsuranceSessionCases();
  const connectionEmpty = getClinikoConnectionEmptyState(clinikoStatus);

  const hasData = demoWeekPreview || isLive;
  const todayIso = new Date().toISOString().split("T")[0];

  const command = useMemo(() => {
    const ctx = getCommandListContext(mapped, todayIso);
    const ids = new Set(ctx.appointments.map((a) => a.id));
    return {
      ...ctx,
      bundles: enrichedBundles.filter((b) => ids.has(b.appointmentId)),
    };
  }, [mapped, todayIso, enrichedBundles]);

  const grouped = useMemo(() => {
    const money = command.bundles.filter(
      (b) =>
        b.summary.needsPaymentCheck ||
        b.summary.needsInvoiceCheck ||
        b.actions.some((a) => a.type === "payment" || a.type === "invoice")
    );
    const insurance = command.bundles.filter((b) => b.summary.insuranceLikely);
    return {
      attention: command.bundles.filter(bundleNeedsAttention),
      ready: command.bundles.filter(
        (b) => !bundleNeedsAttention(b) && !bundleMissingSetup(b)
      ),
      money,
      insurance,
      setup: command.bundles.filter(bundleMissingSetup),
    };
  }, [command.bundles]);

  const clientJourneys = useMemo(
    () => buildClientJourneys(demoWeekPreview ? "Demo week preview" : "Cliniko test account").slice(0, 4),
    [demoWeekPreview]
  );

  const metrics = useMemo(() => {
    const base = summariseWorkflowActions(command.bundles);
    return {
      ...base,
      insuranceItems:
        insuranceSummary.openCases > 0 ? insuranceSummary.openCases : base.insuranceItems,
    };
  }, [command.bundles, insuranceSummary.openCases]);

  return (
    <>
      <WorkflowPageHeader
        title="Today"
        purpose="Your daily clinic cockpit — what needs attention now and what each appointment needs next."
      />

      <WhatThisShows>
        This page turns Cliniko appointments into a daily action list: notes, payments, invoices,
        insurance checks, follow-ups, stock reminders and client journeys.
      </WhatThisShows>

      <p className="sr-only">Today at a glance · Urgent / needs action · Client journey · What this shows</p>

      <DemoWeekPreviewBanner />

      <ClinikoFeedStatusRow
        configured={configured}
        connected={connected}
        isLive={isLive}
        appointmentCount={mapped.length}
        lastChecked={lastChecked}
        loading={loading}
        onRefresh={() => void reload()}
        sourceLabel={demoWeekPreview ? "Demo week preview" : undefined}
      />

      <ClinikoDataQualityBanner visible={Boolean(isLive && hasDisplayQualityIssues)} />

      {loading && <ClinikoLoadState loading />}
      {error && !demoWeekPreview && (
        <div className="mb-6">
          <ClinikoLoadState error={error} />
        </div>
      )}

      <section className="mb-8" aria-label="Today at a glance">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate">
          Today at a glance
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <WorkflowSummaryCard
            label="Appointments"
            value={hasData ? metrics.appointments : "—"}
            hint={
              demoWeekPreview
                ? "Demo week preview"
                : isLive
                  ? "From Cliniko test account"
                  : "Preview demo clinic week"
            }
            href="/admin/bookings"
            status={metrics.appointments > 0 ? "ready" : "default"}
          />
          <WorkflowSummaryCard
            label="Needs action"
            value={hasData ? grouped.attention.length : "—"}
            href="/admin/bookings"
            status={grouped.attention.length > 0 ? "attention" : "default"}
          />
          <WorkflowSummaryCard
            label="Money checks"
            value={hasData ? metrics.paymentsToCheck + metrics.invoicesToReview : "—"}
            href="/admin/payments"
            status={
              metrics.paymentsToCheck + metrics.invoicesToReview > 0 ? "attention" : "default"
            }
          />
          <WorkflowSummaryCard
            label="Insurance cases"
            value={hasData ? cases.length || metrics.insuranceItems : "—"}
            href="/admin/insurance"
            status={metrics.insuranceItems > 0 ? "attention" : "default"}
          />
          <WorkflowSummaryCard
            label="Follow-ups"
            value={hasData ? metrics.followUpsSuggested : "—"}
            href="/admin/followups"
            status={metrics.followUpsSuggested > 0 ? "attention" : "default"}
          />
          <WorkflowSummaryCard
            label="Stock notes"
            value={hasData ? metrics.stockImpacts : "—"}
            href="/admin/stock"
            status={metrics.stockImpacts > 0 ? "attention" : "default"}
          />
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <section className="space-y-6" aria-labelledby="command-list-heading">
          <h2 id="command-list-heading" className="text-lg font-bold text-navy">
            {command.title}
          </h2>

          {!hasData && !loading ? (
            <>
              <PlainEmptyState
                title={connectionEmpty.title}
                description={connectionEmpty.description}
              />
              <DemoWeekPreviewToggle />
            </>
          ) : hasData && command.bundles.length === 0 ? (
            <>
              <PlainEmptyState
                title="Nothing urgent right now."
                description="Live Cliniko appointments are still listed below for review."
              />
              <DemoWeekPreviewToggle />
            </>
          ) : hasData ? (
            <div className="space-y-8">
              <BundleSection
                title="Urgent / needs action"
                hint="These are the appointments or cases that need George's attention before or after treatment."
                bundles={grouped.attention}
              />
              <BundleSection
                title="Ready for today"
                hint="Lower priority items that are on track."
                bundles={grouped.ready}
              />
              <BundleSection
                title="Money and invoices"
                hint="Payment checks and invoice readiness from the demo clinic week."
                bundles={grouped.money}
              />
              <BundleSection
                title="Insurance cases"
                hint="Insurer-funded work, session counts and invoice readiness."
                bundles={grouped.insurance}
              />
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate">
                  Client journey
                </h3>
                <p className="mt-1 text-sm text-slate">
                  Who each client is, what happened and what needs next.
                </p>
                <ul className="mt-3 space-y-2">
                  {clientJourneys.map((j) => (
                    <li key={j.patientLabel} className="rounded-lg border border-cream-dark p-3 text-sm">
                      <Link href="/admin/clients" className="font-semibold text-navy hover:underline">
                        {j.patientLabel}
                      </Link>
                      <p className="text-slate">{j.reasonForVisit}</p>
                      <p className="text-xs text-slate">{j.nextAction}</p>
                    </li>
                  ))}
                </ul>
                <Link href="/admin/clients" className="mt-2 inline-block text-sm text-green hover:underline">
                  View all client journeys →
                </Link>
              </section>
              <BundleSection
                title="Setup to improve later"
                hint="Configuration items that do not block today's clinic work."
                bundles={grouped.setup}
              />
            </div>
          ) : null}
        </section>

        <div className="space-y-6">
          <WorkflowHelpPanel
            title="Clinic flow"
            items={[
              demoWeekPreview
                ? "Current source: Demo week preview"
                : connected
                  ? "Current source: Cliniko test account"
                  : configured
                    ? "Cliniko test account configured"
                    : "Cliniko not configured",
              hasData
                ? `${mapped.length} appointment(s) loaded`
                : "No appointments loaded yet",
              lastChecked ? `Last checked ${lastChecked}` : "Not checked yet",
              "Sterile Cliniko test account — DEMO patients only",
            ]}
          />

          <section className="rounded-xl border border-cream-dark bg-white p-5 text-sm">
            <h2 className="font-semibold text-navy">Technical links</h2>
            <div className="mt-2 space-y-1">
              <Link href="/admin/cliniko/test-lab" className="block text-green hover:underline">
                Technical Cliniko test lab
              </Link>
              <Link href="/admin/proof" className="block text-green hover:underline">
                Demo proof page
              </Link>
            </div>
            <div className="mt-3">
              <DemoWeekPreviewToggle compact />
            </div>
          </section>

          <section className="rounded-xl border border-cream-dark bg-white p-5">
            <h2 className="text-sm font-semibold text-navy">Quick actions</h2>
            <div className="mt-3 grid gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rounded-lg border border-green/20 px-3 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-green-muted"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
