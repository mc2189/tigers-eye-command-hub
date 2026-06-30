"use client";

import { useMemo } from "react";
import { CalloutBox } from "./AdminUI";
import { MetricCard } from "./MetricCard";
import { useCommandHubAppointments } from "./CommandHubAppointmentsProvider";
import { summariseFinanceWorkflow } from "@/lib/admin-workflow";

export function ClinikoFinancePanel() {
  const { mapped, isLive, lastChecked } = useCommandHubAppointments();
  const summary = useMemo(() => summariseFinanceWorkflow(mapped), [mapped]);

  if (!isLive) return null;

  return (
    <section className="mb-8 rounded-xl border border-cream-dark bg-white p-5">
      <h2 className="text-lg font-bold text-navy">Workflow-based finance estimates</h2>
      <p className="mt-2 text-sm text-slate">
        Operational planning only from live Cliniko appointments and configured demo rules.
      </p>
      <p className="sr-only">operational planning only</p>

      {lastChecked && (
        <p className="mt-2 text-xs text-slate">Last checked {lastChecked}</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Estimated revenue (configured prices)"
          value={`£${summary.estimatedRevenue}`}
        />
        <MetricCard label="Unknown revenue (no price)" value={summary.unknownRevenueCount} />
        <MetricCard label="Payment checks required" value={summary.paymentChecksRequired} />
        <MetricCard label="Invoice checks required" value={summary.invoiceChecksRequired} />
      </div>

      {summary.missingPriceTypes.length > 0 && (
        <CalloutBox variant="info" title="Appointment types missing prices">
          <p className="text-sm">
            {summary.missingPriceTypes.join(", ")} — add prices in clinic commercial rules or
            Cliniko when known.
          </p>
        </CalloutBox>
      )}
    </section>
  );
}
