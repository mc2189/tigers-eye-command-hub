import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CalloutBox } from "@/components/admin/AdminUI";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { healthcodeFutureItems, healthcodeRequirements } from "@/lib/demo-data";

const workflowSteps = [
  "Insurance booking",
  "Claim details captured",
  "Authorisation / session tracker",
  "Invoice generated",
  "Healthcode submission",
  "Payment / rejection status returned",
  "Finance dashboard updated",
];

export default function HealthcodePage() {
  return (
    <>
      <AdminPageHeader
        title="Healthcode integration"
        subtitle="Serious future placeholder for electronic insurer claims and reconciliation."
      >
        <StatusBadge label="Placeholder" variant="neutral" />
      </AdminPageHeader>

      <CalloutBox title="Future integration placeholder" variant="warning">
        <p>
          Healthcode is not connected. This page is a roadmap placeholder only — no
          live claim submission or payment reconciliation.
        </p>
      </CalloutBox>

      <CalloutBox title="Current status" variant="info">
        <p>
          Healthcode integration is not yet connected. This page outlines the planned
          workflow for insurer claim validation, electronic submission and payment
          reconciliation.
        </p>
      </CalloutBox>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-navy">Why useful</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {healthcodeFutureItems.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-cream-dark bg-white p-4"
            >
              <h3 className="font-semibold text-navy">{item.title}</h3>
              <p className="mt-2 text-sm text-slate">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-navy">What is needed</h2>
        <ul className="rounded-xl border border-cream-dark bg-white divide-y divide-cream-dark">
          {healthcodeRequirements.map((req) => (
            <li key={req} className="flex items-center gap-3 p-4 text-sm">
              <span className="text-green" aria-hidden>○</span>
              {req}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-navy">Future workflow</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {workflowSteps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="rounded-lg bg-green-muted px-3 py-2 text-sm font-medium text-green">
                {step}
              </span>
              {i < workflowSteps.length - 1 && (
                <span className="hidden text-slate sm:inline" aria-hidden>→</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
