"use client";

import { useMemo } from "react";
import { useCommandHubAppointments } from "./CommandHubAppointmentsProvider";
import { PlainEmptyState } from "./PlainEmptyState";
import { DataSourcePill } from "./DataSourcePill";
import { WorkflowBundleCard } from "./WorkflowBundleCard";
import { getPaymentQueue } from "@/lib/admin-workflow";

export function PaymentsWorkflowQueue() {
  const { mapped, isLive } = useCommandHubAppointments();
  const queue = useMemo(() => getPaymentQueue(mapped), [mapped]);

  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-bold text-navy">Live Cliniko payment checks</h2>
      <p className="mb-4 text-sm text-slate">
        Payment status is not connected yet. This queue shows appointments that should be checked.
      </p>
      <p className="sr-only">Payment status is not connected yet</p>

      {!isLive || queue.length === 0 ? (
        <PlainEmptyState
          title="No payment checks needed from live appointments."
          description="When Cliniko appointments need a payment status check, they will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {queue.map((item) => (
            <li key={item.bundle.appointmentId}>
              <WorkflowBundleCard bundle={item.bundle} showDetails={false} />
              <div className="mt-2 flex flex-wrap gap-2 px-1">
                {item.paymentExpected && (
                  <DataSourcePill kind="inferred" label="Payment expected" />
                )}
                {item.depositSuggested && (
                  <DataSourcePill kind="inferred" label="Deposit suggested" />
                )}
                {item.paymentRuleMissing && (
                  <DataSourcePill kind="inferred" label="Payment rule missing" />
                )}
                <DataSourcePill kind="future" label="Payment link · future integration" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
