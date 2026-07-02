import type { DemoInsuranceCaseDetail } from "@/lib/demo-insurance-cases";
import { patientLabelToSlug } from "@/lib/appointment-records";
import { buildInsuranceInvoiceDraftFromCase } from "@/lib/build-insurance-invoice-draft";
import type { InvoiceDraftWorkflowState } from "@/lib/command-hub-workflow-types";
import { DEMO_CLINIC_WEEK_SCENARIOS } from "@/lib/demo-clinic-week";
import {
  DEMO_AVIVA_INVOICE_DRAFT_ID,
  getStableInvoiceDraftId,
} from "@/lib/invoice-draft-ids";
import type { InsuranceInvoiceDraft } from "@/lib/invoice-draft-types";
import type { InsuranceCase } from "@/lib/insurance-session-workflow";

export interface InvoiceDraftListItem {
  id: string;
  draft: InsuranceInvoiceDraft;
  insuranceCase: InsuranceCase;
  appointmentId?: string;
  clientSlug: string;
  location?: string;
  practitioner?: string;
  workflow: InvoiceDraftWorkflowState;
}

function scenarioForPatient(patientLabel: string) {
  return DEMO_CLINIC_WEEK_SCENARIOS.find((s) => s.patientLabel === patientLabel);
}

function workflowFlagsToDraftOptions(workflow: InvoiceDraftWorkflowState) {
  return {
    invoicePrepared: workflow.invoiceDraftPrepared,
  };
}

export function findInsuranceCaseByDraftId(
  cases: InsuranceCase[],
  draftId: string
): InsuranceCase | undefined {
  if (draftId === DEMO_AVIVA_INVOICE_DRAFT_ID) {
    return cases.find((c) => c.patientLabel === "DEMO Sarah McKay");
  }
  return cases.find((c) => getStableInvoiceDraftId(c) === draftId);
}

export function buildInvoiceDraftListItem(
  insuranceCase: InsuranceCase,
  workflow: InvoiceDraftWorkflowState = {},
  demoCaseDetail?: DemoInsuranceCaseDetail
): InvoiceDraftListItem {
  const scenario = scenarioForPatient(insuranceCase.patientLabel);
  const detail = demoCaseDetail ?? undefined;
  const draft = buildInsuranceInvoiceDraftFromCase(insuranceCase, {
    demoCaseDetail: detail,
    scenario: scenario ? { invoiceDraft: scenario.invoiceDraft } : undefined,
    ...workflowFlagsToDraftOptions(workflow),
    invoicePrepared: workflow.invoiceDraftPrepared ?? workflowFlagsToDraftOptions(workflow).invoicePrepared,
  });

  if (workflow.invoiceDraftPrepared) {
    draft.draftStatus = workflow.invoiceDraftExported ? "prepared" : "prepared";
    draft.recordStatus = "command-hub-demo-case";
  }

  const appointmentId = insuranceCase.sessions[0]?.appointmentId ?? scenario?.id;

  return {
    id: getStableInvoiceDraftId(insuranceCase),
    draft,
    insuranceCase,
    appointmentId,
    clientSlug: patientLabelToSlug(insuranceCase.patientLabel),
    location: scenario?.location,
    practitioner: scenario?.preferredPractitioner ?? insuranceCase.sessions[0]?.practitioner,
    workflow,
  };
}

export function buildInsuranceInvoiceDraftList(
  cases: InsuranceCase[],
  invoiceDraftWorkflow: Record<string, InvoiceDraftWorkflowState> = {},
  demoCaseDetails: Record<string, DemoInsuranceCaseDetail> = {}
): InvoiceDraftListItem[] {
  return cases.map((insuranceCase) =>
    buildInvoiceDraftListItem(
      insuranceCase,
      invoiceDraftWorkflow[getStableInvoiceDraftId(insuranceCase)] ?? {},
      demoCaseDetails[insuranceCase.patientLabel]
    )
  );
}

export function getInvoiceDraftListItemById(
  cases: InsuranceCase[],
  draftId: string,
  invoiceDraftWorkflow: Record<string, InvoiceDraftWorkflowState> = {},
  demoCaseDetails: Record<string, DemoInsuranceCaseDetail> = {}
): InvoiceDraftListItem | undefined {
  const insuranceCase = findInsuranceCaseByDraftId(cases, draftId);
  if (!insuranceCase) return undefined;
  return buildInvoiceDraftListItem(
    insuranceCase,
    invoiceDraftWorkflow[getStableInvoiceDraftId(insuranceCase)] ?? {},
    demoCaseDetails[insuranceCase.patientLabel]
  );
}
