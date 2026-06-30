"use client";

import { useMemo, useState } from "react";
import type { AppointmentWorkflowBundle } from "@/lib/admin-workflow";
import {
  bundleIsReady,
  bundleMissingSetup,
  bundleNeedsAttention,
} from "@/lib/admin-workflow";
import { PlainEmptyState } from "./PlainEmptyState";
import { SectionTabs } from "./SectionTabs";
import { WorkflowBundleCard } from "./WorkflowBundleCard";

type FilterTab = "all" | "attention" | "ready" | "setup";

interface WorkflowBundleListProps {
  bundles: AppointmentWorkflowBundle[];
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

const TABS = [
  { id: "all", label: "All" },
  { id: "attention", label: "Needs attention" },
  { id: "ready", label: "Ready" },
  { id: "setup", label: "Missing setup" },
];

export function WorkflowBundleList({
  bundles,
  title = "Live Cliniko appointments",
  emptyTitle = "No live Cliniko appointments found.",
  emptyDescription = "Create a DEMO appointment in Cliniko, then refresh the live feed.",
}: WorkflowBundleListProps) {
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

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      <p className="sr-only">Needs attention</p>
      <SectionTabs
        tabs={TABS}
        activeId={tab}
        onChange={(id) => setTab(id as FilterTab)}
      />
      {filtered.length === 0 ? (
        <PlainEmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="space-y-3">
          {filtered.map((bundle) => (
            <li key={bundle.appointmentId}>
              <WorkflowBundleCard bundle={bundle} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
