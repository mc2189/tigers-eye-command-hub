"use client";

import { useMemo } from "react";
import { useCommandHubAppointments } from "./CommandHubAppointmentsProvider";
import { PlainEmptyState } from "./PlainEmptyState";
import { DataSourcePill } from "./DataSourcePill";
import { WorkflowBundleCard } from "./WorkflowBundleCard";
import { getInsuranceQueue } from "@/lib/admin-workflow";

export function ClinikoInsurancePanel() {
  const { mapped, isLive } = useCommandHubAppointments();
  const queue = useMemo(() => getInsuranceQueue(mapped), [mapped]);

  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-bold text-navy">Likely insurance cases from Cliniko</h2>
      <p className="mb-4 text-sm text-slate">
        Inferred from appointment types only. Claim details are not captured unless stored in Cliniko.
      </p>

      {!isLive || queue.length === 0 ? (
        <PlainEmptyState
          title="No insurance appointments detected from current Cliniko test appointments."
          description="Insurance cases will appear here when appointment types or case details indicate insurer-funded work."
        />
      ) : (
        <ul className="space-y-4">
          {queue.map((item) => (
            <li key={item.bundle.appointmentId}>
              <WorkflowBundleCard bundle={item.bundle} showDetails={false} />
              <dl className="mt-3 grid gap-2 rounded-lg bg-cream/40 p-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {item.checklist.map((row) => (
                  <div key={row.field}>
                    <dt className="text-slate">{row.field}</dt>
                    <dd className="font-medium text-navy">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-2">
                <DataSourcePill kind="inferred" label="Inferred workflow" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
