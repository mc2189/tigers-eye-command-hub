"use client";

import { useMemo } from "react";
import { ActionQueue } from "./ActionQueue";
import { useCommandHubAppointments } from "./CommandHubAppointmentsProvider";
import { mappedBookingToWorkflowView } from "@/lib/admin-workflow";

export function ClinikoInvoiceQueuePanel() {
  const { mapped, isLive } = useCommandHubAppointments();

  const queue = useMemo(() => {
    const filtered = mapped.filter(
      (b) =>
        b.isPast ||
        b.workstream === "insurance" ||
        b.workstream === "external" ||
        b.paymentStatus === "unpaid" ||
        b.invoiceStatus === "draft-needed"
    );
    return filtered.map(mappedBookingToWorkflowView);
  }, [mapped]);

  return (
    <div className="mb-8">
      <ActionQueue
        title="Live Cliniko invoice checks"
        appointments={isLive ? queue : []}
        emptyTitle="No invoice checks needed from live appointments."
        emptyDescription="When Cliniko appointments may need an invoice or payment check, they will appear here. Create a DEMO appointment in Cliniko, then refresh the live feed."
      />
    </div>
  );
}
