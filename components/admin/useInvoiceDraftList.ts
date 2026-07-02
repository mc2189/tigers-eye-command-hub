"use client";

import { useMemo } from "react";
import { useCommandHubWorkflow } from "@/components/admin/CommandHubWorkflowProvider";
import { useInsuranceSessionCases } from "@/components/admin/useInsuranceSessionCases";
import {
  buildInsuranceInvoiceDraftList,
  getInvoiceDraftListItemById,
  type InvoiceDraftListItem,
} from "@/lib/invoice-draft-registry";

export function useInvoiceDraftList() {
  const { cases, demoDetails } = useInsuranceSessionCases();
  const { store } = useCommandHubWorkflow();
  const invoiceDraftWorkflow = useMemo(() => store?.invoiceDrafts ?? {}, [store?.invoiceDrafts]);

  const items = useMemo(
    () => buildInsuranceInvoiceDraftList(cases, invoiceDraftWorkflow, demoDetails),
    [cases, invoiceDraftWorkflow, demoDetails]
  );

  return { items, cases, demoDetails };
}

export function useInvoiceDraftDetail(draftId: string): InvoiceDraftListItem | undefined {
  const { cases, demoDetails } = useInsuranceSessionCases();
  const { store } = useCommandHubWorkflow();
  const invoiceDraftWorkflow = useMemo(() => store?.invoiceDrafts ?? {}, [store?.invoiceDrafts]);

  return useMemo(
    () => getInvoiceDraftListItemById(cases, draftId, invoiceDraftWorkflow, demoDetails),
    [cases, draftId, invoiceDraftWorkflow, demoDetails]
  );
}
