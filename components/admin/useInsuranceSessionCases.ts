"use client";

import { useCallback, useMemo } from "react";
import { useCommandHubAppointments } from "./CommandHubAppointmentsProvider";
import { useCommandHubWorkflow } from "./CommandHubWorkflowProvider";
import {
  buildInsuranceCasesFromAppointments,
  summariseInsuranceCases,
  type InsuranceCase,
} from "@/lib/insurance-session-workflow";
import type { DemoInsuranceCaseDetail } from "@/lib/demo-insurance-cases";
import {
  buildWorkflowActionsForAppointments,
  enrichBundlesWithInsuranceCases,
  type AppointmentWorkflowBundle,
} from "@/lib/admin-workflow";

export function useInsuranceSessionCases() {
  const { mapped, isLive } = useCommandHubAppointments();
  const { insuranceCases, reload } = useCommandHubWorkflow();

  const demoDetails = insuranceCases as Record<string, DemoInsuranceCaseDetail>;

  const reloadDemoDetails = useCallback(() => {
    void reload();
  }, [reload]);

  const cases = useMemo(
    () => buildInsuranceCasesFromAppointments(mapped, demoDetails),
    [mapped, demoDetails]
  );

  const summary = useMemo(() => summariseInsuranceCases(cases), [cases]);

  const enrichedBundles = useMemo((): AppointmentWorkflowBundle[] => {
    const bundles = buildWorkflowActionsForAppointments(mapped);
    return enrichBundlesWithInsuranceCases(bundles, cases);
  }, [mapped, cases]);

  const hasLiveAppointments = isLive && mapped.length > 0;
  const hasInsuranceAppointments = mapped.some(
    (b) =>
      b.workstream === "insurance" ||
      /insurance|aviva|vitality|claim|authorisation/i.test(b.appointmentTypeName ?? "")
  );

  return {
    cases,
    summary,
    demoDetails,
    reloadDemoDetails,
    enrichedBundles,
    isLive,
    hasLiveAppointments,
    hasInsuranceAppointments,
    mapped,
  };
}

export type { InsuranceCase };
