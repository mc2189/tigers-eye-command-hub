"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCommandHubAppointments } from "@/components/admin/CommandHubAppointmentsProvider";
import { ClinikoDataQualityBanner } from "@/components/admin/ClinikoDataQualityBanner";
import { ClinikoFeedStatusRow } from "@/components/admin/ClinikoFeedStatusRow";
import { ClinikoLoadState } from "@/components/admin/ClinikoLoadState";
import { PlainEmptyState } from "@/components/admin/PlainEmptyState";
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

const quickActions = [
  { href: "/admin/calendar", label: "Open calendar" },
  { href: "/admin/bookings", label: "Review bookings" },
  { href: "/admin/notes", label: "Write notes" },
  { href: "/admin/invoices", label: "Check invoices" },
  { href: "/admin/insurance", label: "Review insurance cases" },
];

function BundleSection({
  title,
  bundles,
}: {
  title: string;
  bundles: ReturnType<typeof useInsuranceSessionCases>["enrichedBundles"];
}) {
  if (bundles.length === 0) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate">{title}</h3>
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
    connected,
    configured,
    hasLiveAppointments,
    hasDisplayQualityIssues,
    clinikoStatus,
    lastChecked,
    reload,
  } = useCommandHubAppointments();
  const { enrichedBundles, summary: insuranceSummary } = useInsuranceSessionCases();
  const connectionEmpty = getClinikoConnectionEmptyState(clinikoStatus);

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
    return {
      attention: command.bundles.filter(bundleNeedsAttention),
      ready: command.bundles.filter(
        (b) => !bundleNeedsAttention(b) && !bundleMissingSetup(b)
      ),
      setup: command.bundles.filter(bundleMissingSetup),
    };
  }, [command.bundles]);

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

      <ClinikoFeedStatusRow
        configured={configured}
        connected={connected}
        isLive={isLive}
        appointmentCount={mapped.length}
        lastChecked={lastChecked}
        loading={loading}
        onRefresh={() => void reload()}
      />

      <ClinikoDataQualityBanner visible={Boolean(isLive && hasDisplayQualityIssues)} />

      {loading && <ClinikoLoadState loading />}
      {error && (
        <div className="mb-6">
          <ClinikoLoadState error={error} />
        </div>
      )}

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <WorkflowSummaryCard
          label="Appointments"
          value={isLive ? metrics.appointments : "—"}
          hint={isLive ? "From Cliniko test account" : "Connect Cliniko to see live appointments"}
          href="/admin/bookings"
          status={metrics.appointments > 0 ? "ready" : "default"}
        />
        <WorkflowSummaryCard
          label="Needs action"
          value={isLive ? grouped.attention.length : "—"}
          href="/admin/bookings"
          status={grouped.attention.length > 0 ? "attention" : "default"}
        />
        <WorkflowSummaryCard
          label="Money checks"
          value={isLive ? metrics.paymentsToCheck + metrics.invoicesToReview : "—"}
          href="/admin/payments"
          status={
            metrics.paymentsToCheck + metrics.invoicesToReview > 0 ? "attention" : "default"
          }
        />
        <WorkflowSummaryCard
          label="Insurance items"
          value={isLive ? metrics.insuranceItems : "—"}
          href="/admin/insurance"
          status={metrics.insuranceItems > 0 ? "attention" : "default"}
        />
        <WorkflowSummaryCard
          label="Follow-ups"
          value={isLive ? metrics.followUpsSuggested : "—"}
          href="/admin/followups"
          status={metrics.followUpsSuggested > 0 ? "attention" : "default"}
        />
        <WorkflowSummaryCard
          label="Stock notes"
          value={isLive ? metrics.stockImpacts : "—"}
          href="/admin/stock"
          status={metrics.stockImpacts > 0 ? "attention" : "default"}
        />
      </section>

      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <section className="space-y-6" aria-labelledby="command-list-heading">
          <h2 id="command-list-heading" className="text-lg font-bold text-navy">
            {command.title}
          </h2>

          {!configured && !loading ? (
            <PlainEmptyState
              title={connectionEmpty.title}
              description={connectionEmpty.description}
            />
          ) : isLive && command.bundles.length === 0 ? (
            <PlainEmptyState
              title={
                hasLiveAppointments
                  ? command.isToday
                    ? "No appointments scheduled for today."
                    : "No upcoming appointments found."
                  : "No live Cliniko appointments found in the current date window."
              }
              description={
                hasLiveAppointments
                  ? "Nothing urgent right now. Live Cliniko appointments are still listed below for review."
                  : "Create a DEMO appointment in Cliniko (within the next 90 days), then refresh the live feed."
              }
            />
          ) : isLive && grouped.attention.length === 0 && grouped.ready.length === 0 ? (
            <PlainEmptyState
              title="Nothing urgent right now."
              description="Live Cliniko appointments are still listed below for review."
            />
          ) : isLive ? (
            <div className="space-y-8">
              <BundleSection title="Needs attention" bundles={grouped.attention} />
              <BundleSection title="Ready / lower priority" bundles={grouped.ready} />
              <BundleSection title="Setup to improve" bundles={grouped.setup} />
            </div>
          ) : (
            <PlainEmptyState
              title={connectionEmpty.title}
              description={connectionEmpty.description}
            />
          )}
        </section>

        <div className="space-y-6">
          <WorkflowHelpPanel
            title="Clinic status"
            items={[
              connected
                ? "Cliniko test account connected"
                : configured
                  ? "Cliniko test account configured"
                  : "Cliniko test account not configured on this server",
              isLive
                ? `${mapped.length} live appointment(s) loaded from Cliniko`
                : "No live appointments loaded yet",
              lastChecked ? `Last checked ${lastChecked}` : "Not checked yet",
              "Sterile Cliniko test account — safe to book and manage DEMO patients",
            ]}
          />

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
