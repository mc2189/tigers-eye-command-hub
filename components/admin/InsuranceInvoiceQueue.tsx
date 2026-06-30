"use client";

import { PlainEmptyState } from "./PlainEmptyState";
import { InsuranceCaseCard } from "./InsuranceCaseCard";
import { useInsuranceSessionCases } from "./useInsuranceSessionCases";

export function InsuranceInvoiceQueue() {
  const { cases } = useInsuranceSessionCases();

  const queue = cases.filter(
    (c) =>
      c.invoiceStatus === "ready-to-invoice" ||
      c.invoiceStatus === "part-invoiced" ||
      c.missingFields.length > 0
  );

  return (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-bold text-navy">Insurance invoice queue</h2>
      <p className="mb-4 text-sm text-slate">
        Healthcode is a future integration. This queue helps prepare the information needed for
        insurer billing.
      </p>
      <p className="sr-only">Insurance invoice queue</p>

      {queue.length === 0 ? (
        <PlainEmptyState
          title="No insurance cases in the invoice queue."
          description="Cases will appear when demo case details or appointment types indicate insurer-funded work."
        />
      ) : (
        <ul className="space-y-4">
          {queue.map((insuranceCase) => (
            <li key={insuranceCase.id}>
              <article className="rounded-xl border border-cream-dark bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-navy">{insuranceCase.patientLabel}</p>
                    <p className="text-sm text-slate">{insuranceCase.insurer}</p>
                  </div>
                  <p className="text-sm font-medium text-navy">
                    {insuranceCase.claimNumber ?? "No claim ref"} /{" "}
                    {insuranceCase.authorisationNumber ?? "No auth ref"}
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate">
                  Sessions to invoice: {insuranceCase.sessions.filter((s) => s.invoiceStatus === "not-invoiced").length}
                </p>
                {insuranceCase.missingFields.length > 0 ? (
                  <p className="mt-2 text-sm text-amber-800">
                    Missing details: {insuranceCase.missingFields.join(", ")}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-green">Ready for insurer invoice preparation</p>
                )}
                <p className="mt-2 text-sm text-navy">{insuranceCase.nextAction}</p>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
