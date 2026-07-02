"use client";

import Link from "next/link";
import type { InvoiceDraftListItem } from "@/lib/invoice-draft-registry";
import { InvoiceDraftActions } from "@/components/admin/InvoiceDraftActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { INVOICE_BUSINESS_NAME } from "@/lib/invoice-defaults";

interface InvoiceDraftDetailProps {
  item: InvoiceDraftListItem;
}

export function InvoiceDraftDetail({ item }: InvoiceDraftDetailProps) {
  const { draft, workflow } = item;

  return (
    <div className="space-y-6">
      <p className="sr-only">
        Invoice draft · Copy invoice details · Download invoice draft as CSV · Prepared invoice draft
      </p>

      <header className="rounded-xl border border-cream-dark bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate">Insurance invoice preparation pack</p>
            <h1 className="text-2xl font-bold text-navy">Invoice draft — {draft.patientLabel}</h1>
            <p className="mt-1 font-mono text-sm text-slate">{draft.invoiceRef}</p>
          </div>
          <StatusBadge
            label={draft.draftStatus.replace(/-/g, " ")}
            variant={draft.readiness.readyToExport ? "success" : "warning"}
          />
        </div>
        <p className="mt-3 text-sm text-slate">
          Prepared invoice draft — not sent. Command Hub workflow state. Cliniko remains the clinical
          system of record. Supabase stores operational workflow metadata only.
        </p>
      </header>

      <section className="rounded-xl border border-cream-dark bg-white p-5">
        <h2 className="text-lg font-bold text-navy">Billing summary</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate">Business</dt>
            <dd className="font-medium text-navy">{INVOICE_BUSINESS_NAME}</dd>
          </div>
          <div>
            <dt className="text-slate">Sessions to invoice</dt>
            <dd className="font-medium text-navy">{draft.sessionsToInvoice}</dd>
          </div>
          <div>
            <dt className="text-slate">Fee per session</dt>
            <dd className="font-medium text-navy">£{draft.amountPerSession.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-slate">Total draft amount</dt>
            <dd className="text-xl font-bold text-navy">£{draft.totalAmount.toFixed(2)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-cream-dark bg-white p-5">
        <h2 className="text-lg font-bold text-navy">Insurer details</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate">Insurer</dt>
            <dd className="font-medium text-navy">{draft.insurer}</dd>
          </div>
          <div>
            <dt className="text-slate">Policy / member number</dt>
            <dd className="font-medium text-navy">{draft.policyNumber ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate">Claim number</dt>
            <dd className="font-medium text-navy">{draft.claimNumber ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate">Authorisation number</dt>
            <dd className="font-medium text-navy">{draft.authorisationNumber ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate">Approved sessions</dt>
            <dd className="font-medium text-navy">{draft.approvedSessions ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate">Sessions used / remaining</dt>
            <dd className="font-medium text-navy">
              {draft.sessionsUsed} / {draft.sessionsRemaining ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate">Patient liability agreement</dt>
            <dd className="font-medium text-navy">
              {draft.liabilityAccepted ? "Accepted" : "Not captured"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-cream-dark bg-white p-5">
        <h2 className="text-lg font-bold text-navy">Treatment sessions</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-cream-dark text-slate">
                <th className="py-2 pr-3 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Date</th>
                <th className="py-2 pr-3 font-medium">Type</th>
                <th className="py-2 pr-3 font-medium">Practitioner</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 font-medium">On invoice</th>
              </tr>
            </thead>
            <tbody>
              {draft.sessionLines.map((line) => (
                <tr key={`${line.sessionNumber}-${line.treatmentDate}`} className="border-b border-cream-dark/60">
                  <td className="py-2 pr-3 text-navy">{line.sessionNumber}</td>
                  <td className="py-2 pr-3 text-navy">
                    {line.treatmentDate} {line.treatmentTime ?? ""}
                  </td>
                  <td className="py-2 pr-3 text-navy">{line.appointmentType}</td>
                  <td className="py-2 pr-3 text-navy">{line.practitioner}</td>
                  <td className="py-2 pr-3 text-navy">{line.status}</td>
                  <td className="py-2 text-navy">{line.includedOnInvoice ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-cream-dark bg-white p-5">
        <h2 className="text-lg font-bold text-navy">Missing fields</h2>
        {draft.missingFields.length > 0 ? (
          <ul className="mt-2 list-inside list-disc text-sm text-amber-800">
            {draft.missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-green">All required demo insurer fields are present.</p>
        )}
        <p className="mt-3 text-sm text-navy">{draft.suggestedNextStep}</p>
      </section>

      <section className="rounded-xl border border-cream-dark bg-white p-5">
        <h2 className="text-lg font-bold text-navy">Copy / export</h2>
        <InvoiceDraftActions item={item} layout="detail" />
      </section>

      <section className="rounded-xl border border-cream-dark bg-cream/40 p-5 text-sm">
        <h2 className="font-bold text-navy">Record completeness &amp; storage</h2>
        <ul className="mt-2 list-inside list-disc text-slate">
          <li>Patient label: DEMO workflow reference only — clinical record in Cliniko</li>
          <li>
            Prepared: {workflow.invoiceDraftPrepared ? "Yes — Command Hub workflow state" : "Not yet"}
          </li>
          <li>
            Exported in Command Hub: {workflow.invoiceDraftExported ? "Yes" : "Not yet"}
          </li>
          <li>Full invoice draft object is not persisted — derived on each page load</li>
        </ul>
        <p className="mt-3 text-xs text-slate">
          Future Xero integration · Future Healthcode integration · Not connected to insurer submission
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {item.appointmentId ? (
            <Link
              href={`/admin/appointments/${item.appointmentId}`}
              className="min-h-9 rounded-lg border border-cream-dark px-3 py-1.5 text-xs font-medium text-navy hover:bg-cream"
            >
              Open related appointment
            </Link>
          ) : null}
          <Link
            href={`/admin/clients/${item.clientSlug}`}
            className="min-h-9 rounded-lg border border-cream-dark px-3 py-1.5 text-xs font-medium text-navy hover:bg-cream"
          >
            Open client record
          </Link>
          <Link
            href="/admin/insurance"
            className="min-h-9 rounded-lg border border-cream-dark px-3 py-1.5 text-xs font-medium text-navy hover:bg-cream"
          >
            Open insurance cases
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-cream-dark bg-white p-5">
        <h2 className="text-lg font-bold text-navy">Export pack preview</h2>
        <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-cream/50 p-3 text-xs text-navy whitespace-pre-wrap">
          {draft.exportPack.plainText}
        </pre>
      </section>
    </div>
  );
}
