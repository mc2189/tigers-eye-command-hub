"use client";

import { useMemo } from "react";
import { ActionQueue } from "./ActionQueue";
import { useCommandHubAppointments } from "./CommandHubAppointmentsProvider";
import { mappedBookingToWorkflowView } from "@/lib/admin-workflow";

export function ClinikoInsurancePanel() {
  const { mapped, isLive } = useCommandHubAppointments();

  const insuranceAppointments = useMemo(() => {
    const filtered = mapped.filter(
      (b) => b.workstream === "insurance" || b.insuranceContext
    );
    return filtered.map(mappedBookingToWorkflowView);
  }, [mapped]);

  return (
    <div className="mb-8">
      <ActionQueue
        title="Possible insurance cases from Cliniko"
        appointments={isLive ? insuranceAppointments : []}
        emptyTitle="No insurance appointments detected."
        emptyDescription="Insurance cases will appear here when an appointment type or case is marked as insurance-related."
      />
    </div>
  );
}
