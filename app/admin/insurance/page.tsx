import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { InsuranceCaseActions } from "@/components/admin/InsuranceCaseActions";
import { ClinikoInsurancePanel } from "@/components/admin/ClinikoInsurancePanel";
import { MetricCard } from "@/components/admin/MetricCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  insuranceCases,
  insuranceStatusLabels,
  invoiceStatusLabels,
} from "@/lib/demo-data";

const summary = {
  active: 8,
  invoicesPending: 3,
  needAuth: 2,
  incomePending: 620,
};

export default function InsurancePage() {
  return (
    <>
      <AdminPageHeader
        title="Insurance cases"
        subtitle="Track authorisations, sessions and invoices — claim details captured for admin follow-up."
      />

      <ClinikoInsurancePanel />

      <h2 className="mb-4 text-lg font-bold text-navy">Command Hub demo insurance cases</h2>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active insurance cases" value={summary.active} />
        <MetricCard label="Invoices pending" value={summary.invoicesPending} />
        <MetricCard label="Need authorisation info" value={summary.needAuth} />
        <MetricCard label="Insurance income pending" value={`£${summary.incomePending}`} />
      </div>

      <div className="space-y-4">
        {insuranceCases.map((c) => (
          <article
            key={c.id}
            className="rounded-xl border border-cream-dark bg-white p-4 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-navy">
                  {c.clientName} — {c.insurer}
                </h2>
                <p className="text-sm text-slate">
                  Policy {c.policyNumber} · Claim {c.claimNumber}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge label={insuranceStatusLabels[c.status]} variant="warning" />
                <StatusBadge label={invoiceStatusLabels[c.invoiceStatus]} variant="neutral" />
              </div>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div>
                <dt className="text-slate">Authorisation</dt>
                <dd className="font-medium">{c.authorisationNumber || "Missing"}</dd>
              </div>
              <div>
                <dt className="text-slate">Sessions</dt>
                <dd className="font-medium">
                  {c.usedSessions} / {c.approvedSessions} used
                  ({c.approvedSessions - c.usedSessions} remaining)
                </dd>
              </div>
              <div>
                <dt className="text-slate">Expiry</dt>
                <dd className="font-medium">{c.expiryDate}</dd>
              </div>
              <div>
                <dt className="text-slate">Liability agreed</dt>
                <dd className="font-medium">{c.liabilityAgreed ? "Yes" : "No"}</dd>
              </div>
            </dl>

            {c.warning && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                ⚠ {c.warning}
              </p>
            )}

            <InsuranceCaseActions
              actions={[
                "Add session",
                "Draft invoice",
                "Mark auth received",
                "Send reminder draft",
                "Open Cliniko booking",
              ]}
            />
          </article>
        ))}
      </div>
    </>
  );
}
