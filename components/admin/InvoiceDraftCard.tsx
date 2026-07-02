"use client";

import Link from "next/link";
import type { InvoiceDraftListItem } from "@/lib/invoice-draft-registry";
import { invoiceDraftDetailPath } from "@/lib/invoice-draft-ids";
import { InvoiceDraftActions } from "@/components/admin/InvoiceDraftActions";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface InvoiceDraftCardProps {
  item: InvoiceDraftListItem;
  compact?: boolean;
}

function readinessVariant(item: InvoiceDraftListItem): "success" | "warning" | "danger" {
  if (item.draft.readiness.readyToExport) return "success";
  if (item.draft.missingFields.length > 0) return "danger";
  return "warning";
}

export function InvoiceDraftCard({ item, compact = false }: InvoiceDraftCardProps) {
  const { draft, insuranceCase, workflow } = item;
  const treatmentDates = draft.sessionLines
    .filter((line) => line.includedOnInvoice)
    .map((line) => line.treatmentDate)
    .join(", ");

  return (
    <article className="rounded-xl border border-cream-dark bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-navy">{draft.patientLabel}</p>
          <p className="text-sm text-slate">{draft.insurer}</p>
        </div>
        <StatusBadge
          label={draft.readiness.readyToExport ? "Ready to invoice" : "Needs missing details"}
          variant={readinessVariant(item)}
        />
      </div>

      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate">Policy / member</dt>
          <dd className="font-medium text-navy">{draft.policyNumber ?? "Not captured"}</dd>
        </div>
        <div>
          <dt className="text-slate">Claim number</dt>
          <dd className="font-medium text-navy">{draft.claimNumber ?? "Missing"}</dd>
        </div>
        <div>
          <dt className="text-slate">Authorisation</dt>
          <dd className="font-medium text-navy">{draft.authorisationNumber ?? "Missing"}</dd>
        </div>
        <div>
          <dt className="text-slate">Sessions</dt>
          <dd className="font-medium text-navy">
            {draft.approvedSessions ?? "—"} approved · {draft.sessionsUsed} used ·{" "}
            {draft.sessionsRemaining ?? "—"} left · {draft.sessionsToInvoice} to invoice
          </dd>
        </div>
        <div>
          <dt className="text-slate">Treatment dates</dt>
          <dd className="font-medium text-navy">{treatmentDates || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate">Practitioner / location</dt>
          <dd className="font-medium text-navy">
            {item.practitioner ?? "—"}
            {item.location ? ` · ${item.location}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-slate">Fee / total</dt>
          <dd className="font-medium text-navy">
            £{draft.amountPerSession.toFixed(2)} per session · £{draft.totalAmount.toFixed(2)} draft
          </dd>
        </div>
        <div>
          <dt className="text-slate">Liability agreement</dt>
          <dd className="font-medium text-navy">
            {draft.liabilityAccepted ? "Accepted" : "Not captured"}
          </dd>
        </div>
      </dl>

      {draft.missingFields.length > 0 ? (
        <p className="mt-3 text-sm text-amber-800">
          Missing fields: {draft.missingFields.join(", ")}
        </p>
      ) : (
        <p className="mt-3 text-sm text-green">Ready for insurer invoice preparation pack</p>
      )}

      <p className="mt-2 text-sm text-navy">{draft.suggestedNextStep}</p>
      <p className="mt-2 text-xs text-slate">
        {draft.honestyNote} · Command Hub workflow state · Cliniko remains clinical system of record
      </p>

      {workflow.invoiceDraftPrepared ? (
        <p className="mt-2 text-sm font-medium text-green">
          Prepared invoice draft — not sent
          {workflow.invoiceDraftExported ? " · Exported in Command Hub" : ""}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={invoiceDraftDetailPath(item.id)}
          className="min-h-9 rounded-lg bg-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-light"
        >
          Open invoice draft
        </Link>
        {item.appointmentId ? (
          <Link
            href={`/admin/appointments/${item.appointmentId}`}
            className="min-h-9 rounded-lg border border-cream-dark px-3 py-1.5 text-xs font-medium text-navy hover:bg-cream"
          >
            Open appointment record
          </Link>
        ) : null}
        <Link
          href={`/admin/clients/${item.clientSlug}`}
          className="min-h-9 rounded-lg border border-cream-dark px-3 py-1.5 text-xs font-medium text-navy hover:bg-cream"
        >
          Open client record
        </Link>
      </div>

      {!compact ? (
        <div className="mt-4 border-t border-cream-dark pt-4">
          <InvoiceDraftActions item={item} />
        </div>
      ) : null}
    </article>
  );
}
