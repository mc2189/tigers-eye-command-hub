"use client";

import { useState } from "react";
import { DEMO_CLINIC_WEEK_SCENARIOS, getDemoClinicWeekSummary } from "@/lib/demo-clinic-week";

type SeedAction =
  | "preview_demo_clinic_week"
  | "seed_demo_clinic_week"
  | "check_demo_clinic_week"
  | "cleanup_demo_clinic_week";

export function DemoClinicWeekPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const summary = getDemoClinicWeekSummary();

  async function runAction(action: SeedAction) {
    setLoading(true);
    setResult(null);
    setDetails([]);
    try {
      const res = await fetch("/api/cliniko/test-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      setResult(json.message ?? (json.ok ? "Done" : "Failed"));
      const seedResult = json.result;
      if (seedResult?.details?.length) {
        setDetails(seedResult.details);
      } else if (Array.isArray(seedResult)) {
        setDetails(seedResult);
      }
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-cream-dark bg-white p-5">
      <h2 className="text-lg font-bold text-navy">Demo Clinic Week</h2>
      <p className="mt-2 text-sm text-slate">
        Create a realistic fake clinic week in the sterile Cliniko test account. This creates
        DEMO-prefixed patients and appointments only.
      </p>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate">DEMO clients in scenario</dt>
          <dd className="font-semibold text-navy">{summary.patientCount}</dd>
        </div>
        <div>
          <dt className="text-slate">Appointments in scenario</dt>
          <dd className="font-semibold text-navy">{summary.appointmentCount}</dd>
        </div>
        <div>
          <dt className="text-slate">Insurance scenarios</dt>
          <dd className="font-semibold text-navy">{summary.insuranceCases}</dd>
        </div>
        <div>
          <dt className="text-slate">Notes needed</dt>
          <dd className="font-semibold text-navy">{summary.notesNeeded}</dd>
        </div>
      </dl>

      <div className="mt-4 rounded-lg border border-cream-dark bg-cream/40 p-3 text-xs text-slate">
        <p className="font-medium text-navy">Saved to Cliniko test account (when seed succeeds):</p>
        <ul className="mt-1 list-inside list-disc">
          <li>DEMO patient records</li>
          <li>DEMO appointments</li>
        </ul>
        <p className="mt-2 font-medium text-navy">Prepared by Command Hub (not written to Cliniko):</p>
        <ul className="mt-1 list-inside list-disc">
          <li>Treatment note drafts</li>
          <li>Invoice drafts</li>
          <li>Follow-up suggestions</li>
          <li>Insurance session tracker (demo-only browser state)</li>
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["preview_demo_clinic_week", "Preview demo week"],
            ["seed_demo_clinic_week", "Seed demo clinic week"],
            ["check_demo_clinic_week", "Check seeded demo week"],
            ["cleanup_demo_clinic_week", "Cleanup demo clinic week"],
          ] as const
        ).map(([action, label]) => (
          <button
            key={action}
            type="button"
            disabled={loading}
            onClick={() => void runAction(action)}
            className="rounded-lg border border-cream-dark px-3 py-2 text-sm font-medium text-navy hover:bg-cream disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>

      {result && (
        <p className="mt-4 text-sm text-navy" role="status">
          {result}
        </p>
      )}

      {details.length > 0 && (
        <ul className="mt-2 max-h-48 overflow-y-auto text-xs text-slate">
          {details.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-green">
          Scenario list ({DEMO_CLINIC_WEEK_SCENARIOS.length})
        </summary>
        <ul className="mt-2 space-y-1 text-xs text-slate">
          {DEMO_CLINIC_WEEK_SCENARIOS.map((s) => (
            <li key={s.id}>
              {s.patientLabel} — {s.appointmentType}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
