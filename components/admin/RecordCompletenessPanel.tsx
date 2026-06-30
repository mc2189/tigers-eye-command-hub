"use client";

import type { RecordCompletenessSummary } from "@/lib/record-completeness";

interface RecordCompletenessPanelProps {
  summary: RecordCompletenessSummary;
  title?: string;
}

export function RecordCompletenessPanel({
  summary,
  title = "Record completeness",
}: RecordCompletenessPanelProps) {
  return (
    <section className="rounded-xl border border-cream-dark bg-white p-5">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      <p className="sr-only">
        Saved fields · Prepared-only fields · Future integration
      </p>

      <ul className="mt-4 space-y-2 text-sm">
        {summary.sections.map((row) => (
          <li key={row.label} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-cream-dark/60 pb-2">
            <span className="font-medium text-navy">{row.label}</span>
            <span className="text-slate">{row.status}</span>
          </li>
        ))}
      </ul>

      {summary.savedFields.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-green">Saved to Cliniko test account</h3>
          <p className="sr-only">Saved fields</p>
          <ul className="mt-2 list-inside list-disc text-sm text-navy">
            {summary.savedFields.map((f) => (
              <li key={f.label}>
                {f.label}
                {f.value ? ` — ${f.value}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.preparedOnlyFields.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-navy">Prepared for Cliniko</h3>
          <p className="sr-only">Prepared-only fields</p>
          <ul className="mt-2 space-y-2 text-sm">
            {summary.preparedOnlyFields.map((f) => (
              <li key={f.label} className="text-slate">
                <span className="font-medium text-navy">{f.label}</span>
                {f.reason.includes("not currently written") && (
                  <span className="sr-only"> field not currently written</span>
                )}
                {" — "}
                {f.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.missingFields.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-amber-800">Missing fields</h3>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-900">
            {summary.missingFields.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {summary.futureIntegrations.length > 0 && (
        <div className="mt-4 rounded-lg bg-cream/40 p-3 text-sm">
          <h3 className="font-semibold text-navy">Future integration</h3>
          <ul className="mt-2 list-inside list-disc text-slate">
            {summary.futureIntegrations.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

interface PatientFieldResultPanelProps {
  savedFields: Array<{ label: string; value: string; source?: string }>;
  preparedOnlyFields: Array<{ label: string; value: string; reason: string }>;
  verificationMessage?: string;
  verified?: boolean;
  blocked?: boolean;
}

export function PatientFieldResultPanel({
  savedFields,
  preparedOnlyFields,
  verificationMessage,
  verified,
  blocked,
}: PatientFieldResultPanelProps) {
  if (blocked) {
    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
        <p className="font-semibold text-red-800">Blocked from writing</p>
        <p className="mt-1 text-red-700">
          This protects real patient records. Only DEMO-prefixed test patients can be created from
          this demo.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4 text-sm">
      {savedFields.length > 0 && (
        <div>
          <p className="font-semibold text-green">Saved to Cliniko test account</p>
          <ul className="mt-2 list-inside list-disc text-navy">
            {savedFields.map((f) => (
              <li key={f.label}>
                {f.label}
                {f.value ? `: ${f.value}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      {preparedOnlyFields.length > 0 && (
        <div>
          <p className="font-semibold text-navy">Prepared for Cliniko</p>
          <ul className="mt-2 space-y-1 text-slate">
            {preparedOnlyFields.map((f) => (
              <li key={f.label}>
                {f.label}
                {f.value ? ` — ${f.value}` : ""} — {f.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      {verificationMessage && (
        <p className="text-navy">
          {verified ? "✓ " : ""}
          {verificationMessage}
        </p>
      )}
    </div>
  );
}
