"use client";

import { useState } from "react";
import Link from "next/link";
import type { AppointmentWorkflowBundle } from "@/lib/admin-workflow";
import { ActionChip } from "./ActionChip";
import { DataSourcePill } from "./DataSourcePill";
import { OpenRecordButton } from "./OpenRecordButton";

interface WorkflowBundleCardProps {
  bundle: AppointmentWorkflowBundle;
  showDetails?: boolean;
  compact?: boolean;
  journeySummary?: string;
  sourceLabel?: string;
}

function formatWhen(bundle: AppointmentWorkflowBundle): string {
  if (!bundle.date) return bundle.time || "Time not returned";
  try {
    const day = new Date(`${bundle.date}T12:00:00`).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const range = bundle.endTime
      ? `${bundle.time}–${bundle.endTime}`
      : bundle.time;
    return `${range} · ${day}`;
  } catch {
    return `${bundle.time}${bundle.date ? ` · ${bundle.date}` : ""}`;
  }
}

export function WorkflowBundleCard({
  bundle,
  showDetails = true,
  compact = false,
  journeySummary,
  sourceLabel,
}: WorkflowBundleCardProps) {
  const [showAllActions, setShowAllActions] = useState(false);
  const sourcePill =
    bundle.source === "demo" ? "demo" : bundle.source === "inferred" ? "inferred" : "cliniko-test";

  const extraActions = [
    ...bundle.secondaryActions,
    ...(showAllActions ? bundle.hiddenActions : []),
  ];

  return (
    <article className="rounded-xl border border-cream-dark bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-slate">{formatWhen(bundle)}</p>
          <div>
            <h3 className="text-lg font-semibold text-navy">{bundle.patientLabel}</h3>
            <p className="mt-1 text-sm font-medium text-navy">{bundle.appointmentType}</p>
            <p className="mt-1 text-sm text-slate">
              {bundle.practitioner} · {bundle.location}
            </p>
          </div>
        </div>
        <DataSourcePill
          kind={sourcePill}
          label={
            sourceLabel ??
            (bundle.source === "demo"
              ? "Demo week preview"
              : bundle.source === "inferred"
                ? "Suggested by Command Hub"
                : "Cliniko test account")
          }
        />
      </div>

      {journeySummary && (
        <p className="mt-2 text-xs font-medium text-slate">{journeySummary}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <OpenRecordButton appointmentId={bundle.appointmentId} />
        {bundle.summary.needsNote && (
          <Link
            href={`/admin/appointments/${bundle.appointmentId}#treatment-note`}
            className="inline-flex min-h-9 items-center rounded-lg border border-cream-dark px-3 py-1.5 text-sm font-medium text-navy hover:bg-cream"
          >
            Add note
          </Link>
        )}
        {(bundle.summary.needsInvoiceCheck || bundle.summary.needsPaymentCheck) && (
          <Link
            href={`/admin/appointments/${bundle.appointmentId}#invoice-payment`}
            className="inline-flex min-h-9 items-center rounded-lg border border-cream-dark px-3 py-1.5 text-sm font-medium text-navy hover:bg-cream"
          >
            Prepare invoice
          </Link>
        )}
        {bundle.summary.insuranceLikely && (
          <Link
            href={`/admin/appointments/${bundle.appointmentId}#invoice-payment`}
            className="inline-flex min-h-9 items-center rounded-lg border border-cream-dark px-3 py-1.5 text-sm font-medium text-navy hover:bg-cream"
          >
            Review insurance case
          </Link>
        )}
        {bundle.summary.followUpSuggested && (
          <Link
            href={`/admin/appointments/${bundle.appointmentId}#follow-up`}
            className="inline-flex min-h-9 items-center rounded-lg border border-cream-dark px-3 py-1.5 text-sm font-medium text-navy hover:bg-cream"
          >
            Review follow-up
          </Link>
        )}
      </div>

      {bundle.primaryAction && (
        <div className="mt-4 rounded-lg border border-green/20 bg-green-muted/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">
            Primary action
          </p>
          <p className="mt-1 font-semibold text-navy">{bundle.primaryAction.label}</p>
          {showDetails && bundle.primaryAction.suggestedNextStep && !compact && (
            <p className="mt-2 text-sm text-slate">{bundle.primaryAction.suggestedNextStep}</p>
          )}
        </div>
      )}

      {extraActions.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">
            Secondary actions
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {extraActions.slice(0, showAllActions ? extraActions.length : 2).map((action) => (
              <ActionChip
                key={`${bundle.appointmentId}-${action.label}`}
                label={action.label}
                kind={action.type}
                inferred={action.source === "inferred"}
              />
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowAllActions((open) => !open)}
        className="mt-3 text-sm font-semibold text-green hover:underline"
      >
        {showAllActions ? "Hide workflow actions" : "Show all workflow actions"}
      </button>

      {showAllActions && bundle.hiddenActions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {bundle.hiddenActions.map((action) => (
            <ActionChip
              key={`${bundle.appointmentId}-hidden-${action.label}`}
              label={action.label}
              kind={action.type}
              inferred={action.source === "inferred"}
            />
          ))}
        </div>
      )}

      {bundle.setupActions.length > 0 && (
        <div className="mt-4 rounded-lg border border-cream-dark bg-cream/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">
            Setup to improve later
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate">
            {bundle.setupActions.map((action) => (
              <li key={`${bundle.appointmentId}-setup-${action.label}`}>· {action.label}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
