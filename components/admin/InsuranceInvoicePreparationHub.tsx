"use client";

import { useMemo } from "react";
import { InvoiceDraftCard } from "@/components/admin/InvoiceDraftCard";
import { useInvoiceDraftList } from "@/components/admin/useInvoiceDraftList";
import { PlainEmptyState } from "@/components/admin/PlainEmptyState";
import { invoices, invoiceStatusLabels, type InvoiceStatus } from "@/lib/demo-data";

export function InsuranceInvoicePreparationHub() {
  const { items } = useInvoiceDraftList();

  const ready = useMemo(
    () => items.filter((item) => item.draft.readiness.readyToExport),
    [items]
  );
  const needsDetails = useMemo(
    () => items.filter((item) => item.draft.missingFields.length > 0),
    [items]
  );
  const prepared = useMemo(
    () => items.filter((item) => item.workflow.invoiceDraftPrepared),
    [items]
  );

  const privateChecks = useMemo(
    () =>
      invoices.filter(
        (inv) => inv.payerType === "private" && (inv.status === "draft-needed" || inv.status === "ready-to-send")
      ),
    []
  );

  const externalWork = useMemo(
    () => invoices.filter((inv) => inv.payerType === "external"),
    []
  );

  return (
    <div className="space-y-8">
      <p className="sr-only">
        Ready to invoice · Needs missing details · Open invoice draft · Insurance invoice draft ·
        Prepared invoice draft · Future Xero integration · Future Healthcode integration
      </p>

      <section className="rounded-xl border border-green/20 bg-green-muted/20 p-4 text-sm">
        <p className="font-semibold text-navy">Insurance invoice preparation hub</p>
        <p className="mt-1 text-slate">
          This insurance case is ready to invoice when all demo insurer fields are present. Review
          sessions, treatment dates, insurer details, missing fields, invoice draft and export/copy
          options. Prepared invoice draft — not sent. Command Hub workflow state only.
        </p>
        <p className="mt-2 text-xs text-slate">
          Cliniko remains clinical system of record · Supabase stores operational workflow metadata
          only · Future Xero integration · Future Healthcode integration
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-navy">Ready to invoice</h2>
        {ready.length === 0 ? (
          <PlainEmptyState
            title="No insurance cases ready to invoice yet."
            description="Complete DEMO claim, authorisation and session details on the insurance page."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {ready.map((item) => (
              <InvoiceDraftCard key={item.id} item={item} compact />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-navy">Needs missing details</h2>
        {needsDetails.length === 0 ? (
          <p className="text-sm text-slate">No insurance cases with missing demo insurer fields.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {needsDetails.map((item) => (
              <InvoiceDraftCard key={item.id} item={item} compact />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-navy">Prepared invoice drafts</h2>
        {prepared.length === 0 ? (
          <p className="text-sm text-slate">
            No invoice drafts marked prepared yet — use Open invoice draft then Mark prepared.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {prepared.map((item) => (
              <InvoiceDraftCard key={item.id} item={item} compact />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-navy">Private payment checks</h2>
        <ul className="space-y-2 text-sm">
          {privateChecks.map((inv) => (
            <li key={inv.id} className="rounded-lg border border-cream-dark bg-white px-4 py-3">
              <span className="font-medium text-navy">{inv.clientOrPayer}</span> — £{inv.amount} —{" "}
              {invoiceStatusLabels[inv.status as InvoiceStatus]}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-navy">External work invoice route</h2>
        {externalWork.length === 0 ? (
          <p className="text-sm text-slate">No external-work demo invoices in the static queue.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {externalWork.map((inv) => (
              <li key={inv.id} className="rounded-lg border border-cream-dark bg-white px-4 py-3">
                {inv.clientOrPayer} — {inv.ref}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-cream-dark bg-cream/40 p-4 text-sm text-slate">
        <h2 className="font-bold text-navy">Future integrations</h2>
        <p className="mt-2">
          Future Xero integration — private and insurer reconciliation not connected yet.
        </p>
        <p className="mt-1">
          Future Healthcode integration — insurer submission not connected yet. Export packs are for
          staff preparation only.
        </p>
      </section>
    </div>
  );
}
