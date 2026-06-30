"use client";

import { useMemo, useState } from "react";
import type { AppointmentWorkflowBundle } from "@/lib/admin-workflow";
import {
  bundleIsReady,
  bundleMissingSetup,
  bundleNeedsAttention,
} from "@/lib/admin-workflow";
import { DEMO_CLINIC_WEEK_SCENARIOS } from "@/lib/demo-clinic-week";
import { PlainEmptyState } from "./PlainEmptyState";
import { SectionTabs } from "./SectionTabs";
import { WorkflowBundleCard } from "./WorkflowBundleCard";

type FilterTab = "all" | "attention" | "ready" | "setup";

interface GroupedWorkflowBundleListProps {
  bundles: AppointmentWorkflowBundle[];
  groupByDay?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

const TABS = [
  { id: "all", label: "All" },
  { id: "attention", label: "Needs attention" },
  { id: "ready", label: "Ready" },
  { id: "setup", label: "Missing setup" },
];

function journeySummaryForBundle(bundle: AppointmentWorkflowBundle): string | undefined {
  const scenario = DEMO_CLINIC_WEEK_SCENARIOS.find((s) => s.id === bundle.appointmentId);
  if (!scenario) return undefined;
  const parts: string[] = [];
  if (scenario.noteStatus !== "complete") parts.push("Note needed");
  if (scenario.paymentScenario === "payment-check-needed") parts.push("Payment check");
  if (scenario.followUpScenario) parts.push("Follow-up suggested");
  if (scenario.insuranceScenario?.toLowerCase().includes("invoice")) {
    parts.push(`Insurance · ${scenario.insuranceScenario}`);
  }
  return parts.length ? parts.join(" · ") : undefined;
}

function groupLabelForDate(date: string, today: string, tomorrow: string): string {
  if (date === today) return "Today";
  if (date === tomorrow) return "Tomorrow";
  if (date > tomorrow) return "Later this week";
  return "Upcoming bookings";
}

export function GroupedWorkflowBundleList({
  bundles,
  groupByDay = true,
  emptyTitle = "No appointments found.",
  emptyDescription = "Preview demo clinic week or seed appointments in the Cliniko test lab.",
}: GroupedWorkflowBundleListProps) {
  const [tab, setTab] = useState<FilterTab>("all");

  const filtered = useMemo(() => {
    switch (tab) {
      case "attention":
        return bundles.filter(bundleNeedsAttention);
      case "ready":
        return bundles.filter(bundleIsReady);
      case "setup":
        return bundles.filter(bundleMissingSetup);
      default:
        return bundles;
    }
  }, [bundles, tab]);

  const dayGroups = useMemo(() => {
    if (!groupByDay) return null;
    const today = new Date().toISOString().split("T")[0];
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    const tomorrow = tmr.toISOString().split("T")[0];

    const byLabel = new Map<string, AppointmentWorkflowBundle[]>();
    for (const bundle of filtered) {
      const label = groupLabelForDate(bundle.date, today, tomorrow);
      const list = byLabel.get(label) ?? [];
      list.push(bundle);
      byLabel.set(label, list);
    }

    const order = ["Today", "Tomorrow", "Later this week", "Upcoming bookings", "Needs setup"];
    return order
      .filter((l) => byLabel.has(l))
      .map((label) => ({ label, bundles: byLabel.get(label)! }));
  }, [filtered, groupByDay]);

  const hasToday = dayGroups?.some((g) => g.label === "Today");

  return (
    <section className="space-y-4">
      <p className="sr-only">Needs attention</p>
      <p className="sr-only">Note needed</p>
      <p className="sr-only">Follow-up suggested</p>
      <p className="sr-only">Show all workflow actions</p>
      {!hasToday && filtered.length > 0 && (
        <p className="text-sm text-slate">Upcoming bookings</p>
      )}
      <SectionTabs tabs={TABS} activeId={tab} onChange={(id) => setTab(id as FilterTab)} />

      {filtered.length === 0 ? (
        <PlainEmptyState title={emptyTitle} description={emptyDescription} />
      ) : groupByDay && dayGroups && dayGroups.length > 0 ? (
        dayGroups.map((group) => (
          <div key={group.label} className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate">
              {group.label}
            </h3>
            <ul className="space-y-3">
              {group.bundles.map((bundle) => (
                <li key={bundle.appointmentId}>
                  <WorkflowBundleCard
                    bundle={bundle}
                    journeySummary={journeySummaryForBundle(bundle)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <ul className="space-y-3">
          {filtered.map((bundle) => (
            <li key={bundle.appointmentId}>
              <WorkflowBundleCard
                bundle={bundle}
                journeySummary={journeySummaryForBundle(bundle)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
