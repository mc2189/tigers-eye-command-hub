import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { WorkflowHelpPanel } from "@/components/admin/WorkflowHelpPanel";
import Link from "next/link";

const workingNow = [
  "Cliniko connection",
  "Live appointment read-back",
  "Workflow actions generated from live appointments",
  "Today command list",
  "Notes, payment, invoice, insurance and stock queues",
  "Insurance session tracking from live/demo appointment data",
  "Approved-session counting",
  "Missing insurance detail checklist",
  "Insurance invoice readiness queue",
];

const inferredWorkflow = [
  "Price and payment checks",
  "Insurance case details",
  "Stock estimates",
  "Follow-up suggestions",
];

const futureIntegrations = [
  "Real payment status",
  "Xero",
  "Healthcode submission",
  "Insurer portal automation",
  "Real insurer eligibility checks",
  "Production staff auth",
  "Audit log",
];

export default function ProofPage() {
  return (
    <>
      <WorkflowPageHeader
        title="Proof"
        purpose="What is working now versus what is inferred or planned — honest demo status for George."
      />

      <p className="sr-only">Insurance session tracking</p>

      <div className="grid gap-6 lg:grid-cols-3">
        <WorkflowHelpPanel title="Working now" items={workingNow} />
        <WorkflowHelpPanel title="Inferred workflow" items={inferredWorkflow} />
        <WorkflowHelpPanel title="Future integrations" items={futureIntegrations} />
      </div>

      <div className="mt-8 rounded-xl border border-cream-dark bg-cream/40 p-5">
        <p className="font-semibold text-navy">Technical Cliniko proof</p>
        <p className="mt-2 text-sm text-slate">
          DEMO record creation, discovery probes and diagnostics live in the technical test lab.
        </p>
        <Link
          href="/admin/cliniko/test-lab"
          className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
        >
          Open technical test lab
        </Link>
      </div>
    </>
  );
}
