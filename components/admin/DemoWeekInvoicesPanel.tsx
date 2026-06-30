"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DEMO_CLINIC_WEEK_SCENARIOS } from "@/lib/demo-clinic-week";

export function DemoWeekInvoicesPanel() {
  const drafts = useMemo(
    () =>
      DEMO_CLINIC_WEEK_SCENARIOS.map((s) => ({
        id: s.id,
        patient: s.patientLabel,
        scenario: s.invoiceDraft,
        appointmentType: s.appointmentType,
      })),
    []
  );

  const privateDrafts = drafts.filter((d) => d.scenario.payerType === "private");
  const insuranceDrafts = drafts.filter((d) => d.scenario.payerType === "insurance");
  const externalDrafts = drafts.filter((d) => d.scenario.payerType === "external");

  return (
    <section className="mb-8 rounded-xl border border-cream-dark bg-white p-5">
      <h2 className="text-lg font-bold text-navy">Demo clinic week invoice drafts</h2>
      <p className="mt-2 text-sm text-slate">
        Prepared invoice drafts — not sent, not posted to accounting. Payment status is not
        connected yet. Future Xero integration · Future Healthcode integration.
      </p>
      <p className="sr-only">
        Ready to draft · Insurance invoice draft · Prepared invoice draft
      </p>

      {insuranceDrafts.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-navy">Insurance invoice draft</h3>
          <ul className="mt-2 space-y-3">
            {insuranceDrafts.map((d) => (
              <li key={d.id} className="rounded-lg border border-cream-dark p-4 text-sm">
                <p className="font-semibold text-navy">{d.patient}</p>
                <p className="text-slate">{d.appointmentType}</p>
                <p className="mt-1 text-navy">{d.scenario.insurer} · £{d.scenario.amount}</p>
                {d.scenario.approvedSessions != null && (
                  <p className="text-slate">
                    {d.scenario.sessionsUsed ?? 0} of {d.scenario.approvedSessions} sessions
                    used
                  </p>
                )}
                <p className="mt-1 text-slate">{d.scenario.suggestedNextStep}</p>
                <span className="mt-2 inline-block rounded bg-cream px-2 py-0.5 text-xs">
                  Prepared for Cliniko
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {privateDrafts.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-navy">Private invoice/check</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate">
            {privateDrafts.slice(0, 4).map((d) => (
              <li key={d.id}>
                {d.patient} — Ready to draft — {d.scenario.suggestedNextStep}
              </li>
            ))}
          </ul>
        </div>
      )}

      {externalDrafts.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-navy">External work invoice route</h3>
          {externalDrafts.map((d) => (
            <p key={d.id} className="text-sm text-slate">
              {d.patient} — {d.scenario.suggestedNextStep}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
