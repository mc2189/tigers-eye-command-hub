"use client";

import { useMemo } from "react";
import { useCommandHubAppointments } from "./CommandHubAppointmentsProvider";
import { PlainEmptyState } from "./PlainEmptyState";
import { WorkflowBundleCard } from "./WorkflowBundleCard";
import { getInvoiceQueue } from "@/lib/admin-workflow";

export function ClinikoInvoiceQueuePanel() {
  const { mapped, isLive } = useCommandHubAppointments();
  const queue = useMemo(() => getInvoiceQueue(mapped), [mapped]);

  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-bold text-navy">Live Cliniko invoice checks</h2>
      <p className="mb-4 text-sm text-slate">
        Inferred invoice checks from live appointments — no real invoice creation in this demo.
      </p>
      <p className="sr-only">invoice check</p>

      {!isLive || queue.length === 0 ? (
        <PlainEmptyState
          title="No invoice checks needed from live appointments."
          description="When Cliniko appointments may need an invoice or payment check, they will appear here."
        />
      ) : (
        <ul className="space-y-3">
          {queue.map((item) => (
            <li key={item.bundle.appointmentId}>
              <WorkflowBundleCard bundle={item.bundle} showDetails={false} />
              <p className="mt-2 px-1 text-sm text-slate">{item.invoiceReason}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
