"use client";

import { useMemo, useState } from "react";
import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { WorkflowSummaryCard } from "@/components/admin/WorkflowSummaryCard";
import { SectionTabs } from "@/components/admin/SectionTabs";
import { PlainEmptyState } from "@/components/admin/PlainEmptyState";
import { InsuranceCaseCard } from "@/components/admin/InsuranceCaseCard";
import { InsuranceDemoControls } from "@/components/admin/InsuranceDemoControls";
import { useInsuranceSessionCases } from "@/components/admin/useInsuranceSessionCases";
import { filterInsuranceCasesByTab } from "@/lib/insurance-session-workflow";

type TabId = "all" | "needs-details" | "ready-to-invoice" | "sessions-used";

const TABS = [
  { id: "all", label: "All cases" },
  { id: "needs-details", label: "Needs details" },
  { id: "ready-to-invoice", label: "Ready to invoice" },
  { id: "sessions-used", label: "Sessions used" },
];

export function InsuranceCaseTracker() {
  const [tab, setTab] = useState<TabId>("all");
  const {
    cases,
    summary,
    reloadDemoDetails,
    isLive,
    hasLiveAppointments,
    hasInsuranceAppointments,
    mapped,
  } = useInsuranceSessionCases();

  const filtered = useMemo(() => filterInsuranceCasesByTab(cases, tab), [cases, tab]);

  const patientLabels = useMemo(
    () => mapped.map((b) => b.clientName).filter(Boolean),
    [mapped]
  );

  return (
    <>
      <WorkflowPageHeader
        title="Insurance cases"
        purpose="Track insurer-funded appointments, approved sessions, missing claim details and invoice readiness."
      />

      <InsuranceDemoControls patientLabels={patientLabels} onSaved={reloadDemoDetails} />

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <WorkflowSummaryCard
          label="Open insurance cases"
          value={summary.openCases}
          status={summary.openCases > 0 ? "ready" : "default"}
        />
        <WorkflowSummaryCard
          label="Sessions remaining"
          value={
            summary.sessionsRemainingTotal !== null ? summary.sessionsRemainingTotal : "—"
          }
          hint={
            summary.sessionsRemainingTotal === null
              ? "Approved sessions not captured yet"
              : undefined
          }
          status="default"
        />
        <WorkflowSummaryCard
          label="Cases missing details"
          value={summary.missingDetails}
          status={summary.missingDetails > 0 ? "attention" : "default"}
        />
        <WorkflowSummaryCard
          label="Ready to invoice"
          value={summary.readyToInvoice}
          status={summary.readyToInvoice > 0 ? "attention" : "default"}
        />
      </section>

      <SectionTabs tabs={TABS} activeId={tab} onChange={(id) => setTab(id as TabId)} />

      {cases.length === 0 ? (
        <PlainEmptyState
          title="No insurance cases detected yet."
          description="Insurance cases will appear here when appointment types or demo case details indicate insurer-funded work."
        />
      ) : filtered.length === 0 ? (
        <PlainEmptyState
          title="No cases in this tab."
          description="Try another tab or add demo case details for a DEMO patient."
        />
      ) : (
        <ul className="space-y-4">
          {filtered.map((insuranceCase) => (
            <li key={insuranceCase.id}>
              <InsuranceCaseCard insuranceCase={insuranceCase} />
            </li>
          ))}
        </ul>
      )}

      {hasLiveAppointments && !hasInsuranceAppointments && cases.length === 0 && (
        <p className="mt-4 text-sm text-slate">
          Live Cliniko appointments are being read correctly, but none currently look insurance-funded.
        </p>
      )}

      {!isLive && cases.length === 0 && (
        <p className="mt-4 text-sm text-slate">
          Connect the Cliniko test account and add demo case details to see insurance session tracking.
        </p>
      )}
    </>
  );
}
