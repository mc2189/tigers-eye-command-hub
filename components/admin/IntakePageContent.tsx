"use client";

import { useState, useMemo } from "react";
import { PatientMatchPanel } from "@/components/admin/PatientMatchPanel";
import { WhatThisShows } from "@/components/admin/WhatThisShows";
import { DEMO_INTAKE_SCENARIOS, buildIntakeMatchCandidates } from "@/lib/demo-intake-scenarios";
import type { PatientMatchResult } from "@/lib/cliniko-patient-matching";
import { matchBookingIntake } from "@/lib/cliniko-patient-matching";

export function IntakePageContent() {
  const [activeScenario, setActiveScenario] = useState(DEMO_INTAKE_SCENARIOS[0]!.id);
  const [matchPreview, setMatchPreview] = useState<PatientMatchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const scenario = DEMO_INTAKE_SCENARIOS.find((s) => s.id === activeScenario)!;
  const staticCandidates = useMemo(() => buildIntakeMatchCandidates(), []);
  const localPreview = useMemo(
    () => matchBookingIntake(scenario.input, staticCandidates),
    [scenario.input, staticCandidates]
  );

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

  const preview = matchPreview ?? localPreview;

  return (
    <>
      <WhatThisShows>
        Match website booking details to the correct Cliniko patient record, or create a new DEMO
        patient when no safe match exists. Staff confirmation is required for possible matches.
      </WhatThisShows>

      <p className="sr-only">
        Booking intake · Saved to Cliniko test account · Prepared for Cliniko · Blocked from writing
        · field not currently written · Suggested Cliniko match · Create new DEMO Cliniko patient ·
        staff confirmation · Unsafe/non-DEMO input blocked
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
          <h2 className="text-lg font-bold text-navy">What the website received</h2>
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
          <h2 className="text-lg font-bold text-navy">What Command Hub checked</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p>
              <strong>Suggested Cliniko match:</strong>{" "}
              {preview.suggestedMatches[0]
                ? `${preview.suggestedMatches[0].firstName} ${preview.suggestedMatches[0].lastName}`
                : "None"}
            </p>
            <p>
              <strong>Recommended action:</strong> {preview.recommendedAction}
            </p>
            <p>
              <strong>Staff confirmation needed?</strong>{" "}
              {preview.staffConfirmationRequired ? "Yes" : "No"}
            </p>
            <p>{preview.message}</p>
            {preview.unsafeReason && (
              <p className="text-red-700">
                Blocked from writing — This protects real patient records. Only DEMO-prefixed test
                patients can be created from this demo.
              </p>
            )}
          </div>

          <div className="mt-4 rounded-lg bg-cream/50 p-4 text-sm">
            <p className="font-semibold text-navy">What will be saved to Cliniko</p>
            <p className="mt-1 text-slate">
              {preview.recommendedAction === "create-new"
                ? "Name, email, phone, date of birth, address/postcode, emergency contact, referral, reason for visit, occupation (when provided)."
                : preview.recommendedAction === "do-not-write"
                  ? "Nothing — blocked from writing."
                  : "Existing DEMO patient link only — no new patient record."}
            </p>
            <p className="mt-3 font-semibold text-navy">What will remain prepared only</p>
            <p className="mt-1 text-slate">
              Insurance policy, claim and authorisation numbers stay in Command Hub demo case only.
              Preferred location/practitioner are not written by this integration.
            </p>
            <p className="sr-only">field not currently written by this integration</p>
          </div>
        </section>
      </div>

      <div className="mt-6">
        <PatientMatchPanel intake={scenario.input} appointmentId={`intake-${scenario.id}`} />
      </div>
    </>
  );
}
