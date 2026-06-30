"use client";

import { useState } from "react";
import { PatientMatchPanel } from "@/components/admin/PatientMatchPanel";
import { WhatThisShows } from "@/components/admin/WhatThisShows";
import { DEMO_INTAKE_SCENARIOS } from "@/lib/demo-intake-scenarios";
import type { PatientMatchResult } from "@/lib/cliniko-patient-matching";

export function IntakePageContent() {
  const [activeScenario, setActiveScenario] = useState(DEMO_INTAKE_SCENARIOS[0]!.id);
  const [matchPreview, setMatchPreview] = useState<PatientMatchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const scenario = DEMO_INTAKE_SCENARIOS.find((s) => s.id === activeScenario)!;

  async function runMatch() {
    setLoading(true);
    try {
      const res = await fetch("/api/cliniko/patient-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario.input),
      });
      setMatchPreview(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <WhatThisShows>
        Match website booking details to the correct Cliniko patient record, or create a new DEMO
        patient when no safe match exists. Staff confirmation is required for possible matches.
      </WhatThisShows>

      <p className="sr-only">
        Booking intake · Suggested Cliniko match · Create new DEMO Cliniko patient · staff
        confirmation · Unsafe/non-DEMO input blocked
      </p>

      <section className="mb-6 flex flex-wrap gap-2">
        {DEMO_INTAKE_SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setActiveScenario(s.id);
              setMatchPreview(null);
            }}
            className={`min-h-10 rounded-lg px-4 py-2 text-sm font-medium ${
              activeScenario === s.id
                ? "bg-green text-white"
                : "border border-cream-dark bg-white text-navy hover:border-green"
            }`}
          >
            {s.title}
          </button>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="text-lg font-bold text-navy">Submitted booking details</h2>
          <p className="mt-1 text-sm text-slate">{scenario.description}</p>
          <dl className="mt-4 space-y-2 text-sm">
            {Object.entries(scenario.input).map(([key, value]) =>
              value ? (
                <div key={key}>
                  <dt className="capitalize text-slate">{key.replace(/([A-Z])/g, " $1")}</dt>
                  <dd className="font-medium text-navy">{value}</dd>
                </div>
              ) : null
            )}
          </dl>
          <button
            type="button"
            disabled={loading}
            onClick={() => void runMatch()}
            className="mt-4 min-h-10 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50"
          >
            {loading ? "Running…" : "Run match"}
          </button>
        </section>

        <section className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="text-lg font-bold text-navy">Match result</h2>
          {matchPreview ? (
            <div className="mt-3 space-y-2 text-sm">
              <p><strong>Status:</strong> {matchPreview.matchStatus}</p>
              <p><strong>Recommended action:</strong> {matchPreview.recommendedAction}</p>
              <p><strong>Staff confirmation required:</strong> {matchPreview.staffConfirmationRequired ? "Yes" : "No"}</p>
              <p>{matchPreview.message}</p>
              {matchPreview.unsafeReason && (
                <p className="text-red-700">Unsafe/non-DEMO input blocked</p>
              )}
              {matchPreview.suggestedMatches.length > 0 && (
                <div>
                  <p className="font-medium text-navy">Suggested Cliniko match</p>
                  <ul className="mt-2 list-inside list-disc">
                    {matchPreview.suggestedMatches.map((m) => (
                      <li key={m.id}>{m.firstName} {m.lastName} (score {m.score})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate">Run match to see suggested Cliniko matches.</p>
          )}
        </section>
      </div>

      <div className="mt-6">
        <PatientMatchPanel intake={scenario.input} appointmentId={`intake-${scenario.id}`} />
      </div>
    </>
  );
}
