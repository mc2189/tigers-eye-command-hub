"use client";

import { useState } from "react";
import type { BookingIntakeInput, PatientMatchResult } from "@/lib/cliniko-patient-matching";
import { updateAppointmentState } from "@/lib/demo-record-state";
import { PatientFieldResultPanel } from "@/components/admin/RecordCompletenessPanel";
import { PatientFieldReconciliationPanel } from "@/components/admin/PatientFieldReconciliationPanel";
import type { CreateDemoPatientInput } from "@/lib/demo-patient-create";

interface PatientMatchPanelProps {
  intake: BookingIntakeInput & Partial<CreateDemoPatientInput>;
  appointmentId: string;
  onLinked?: (patientId: string, label: string) => void;
}

export function PatientMatchPanel({
  intake,
  appointmentId,
  onLinked,
}: PatientMatchPanelProps) {
  const [result, setResult] = useState<PatientMatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [linkConfirmed, setLinkConfirmed] = useState(false);
  const [createResult, setCreateResult] = useState<{
    savedFields: Array<{ label: string; value: string }>;
    preparedOnlyFields: Array<{ label: string; value: string; reason: string }>;
    verified?: boolean;
    verificationMessage?: string;
    blocked?: boolean;
  } | null>(null);

  async function runMatch() {
    setLoading(true);
    setActionMessage(null);
    setCreateResult(null);
    setLinkConfirmed(false);
    try {
      const res = await fetch("/api/cliniko/patient-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intake),
      });
      const json = (await res.json()) as PatientMatchResult;
      setResult(json);
      if (json.matchStatus === "exact" && json.suggestedMatches[0]) {
        setSelectedId(json.suggestedMatches[0].id);
        setLinkConfirmed(true);
      }
    } catch {
      setActionMessage("Could not run match.");
    } finally {
      setLoading(false);
    }
  }

  function confirmMatch() {
    const match = result?.suggestedMatches.find((m) => m.id === selectedId);
    if (!match) return;
    const label = `${match.firstName} ${match.lastName}`.trim();
    updateAppointmentState(appointmentId, {
      linkedPatientId: match.id,
      linkedPatientLabel: label,
      matchStatus: "Linked to Cliniko patient record",
    });
    onLinked?.(match.id, label);
    setActionMessage("Linked to Cliniko patient record");
    setLinkConfirmed(true);
  }

  async function createNewPatient() {
    setLoading(true);
    setActionMessage(null);
    setCreateResult(null);
    try {
      const res = await fetch("/api/cliniko/create-demo-patient-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intake),
      });
      const json = await res.json();
      if (json.status === "blocked") {
        setCreateResult({
          savedFields: [],
          preparedOnlyFields: json.preparedOnlyFields ?? [],
          blocked: true,
        });
        setActionMessage("Blocked from writing");
        return;
      }
      if (json.ok && json.patientId) {
        updateAppointmentState(appointmentId, {
          linkedPatientId: json.patientId,
          linkedPatientLabel: `${intake.firstName} ${intake.lastName}`,
          matchStatus: "Saved to Cliniko test account",
          lastPatientCreateResult: {
            savedFieldLabels: (json.savedFields ?? []).map(
              (f: { label: string }) => f.label
            ),
            verified: json.verified,
          },
        });
        onLinked?.(json.patientId, `${intake.firstName} ${intake.lastName}`);
        setCreateResult({
          savedFields: json.savedFields ?? [],
          preparedOnlyFields: json.preparedOnlyFields ?? [],
          verified: json.verified,
          verificationMessage: json.verificationMessage,
        });
        setActionMessage(json.verificationMessage ?? json.message);
      } else {
        setCreateResult({
          savedFields: [],
          preparedOnlyFields: json.preparedOnlyFields ?? [],
          verificationMessage: json.message,
        });
        setActionMessage(json.message ?? "Prepared for Cliniko");
      }
    } catch {
      setActionMessage("Prepared for Cliniko — not saved yet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="text-lg font-bold text-navy">Patient match status</h2>
      <p className="mt-1 text-sm text-slate">
        Match website booking details to the correct Cliniko DEMO patient before writing notes or
        invoices.
      </p>
      <p className="sr-only">Suggested Cliniko match · staff confirmation</p>

      <button
        type="button"
        disabled={loading}
        onClick={() => void runMatch()}
        className="mt-3 min-h-10 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50"
      >
        {loading ? "Matching…" : "Run match"}
      </button>

      {result && (
        <div className="mt-4 space-y-3 text-sm">
          <p>
            <strong>Status:</strong> {result.matchStatus} · {result.message}
          </p>
          {result.unsafeReason && (
            <p className="text-red-700">Unsafe/non-DEMO input blocked — {result.unsafeReason}</p>
          )}
          {result.suggestedMatches.length > 0 && (
            <div>
              <p className="font-medium text-navy">Suggested Cliniko match</p>
              <ul className="mt-2 space-y-2">
                {result.suggestedMatches.map((m) => (
                  <li key={m.id}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-cream-dark bg-white p-3">
                      <input
                        type="radio"
                        name="match"
                        checked={selectedId === m.id}
                        onChange={() => setSelectedId(m.id)}
                      />
                      <span>
                        {m.firstName} {m.lastName} · score {m.score}
                        {m.email ? ` · ${m.email}` : ""}
                        <span className="block text-xs text-slate">{m.reasons.join(", ")}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {result.recommendedAction === "link-existing" && (
              <button type="button" onClick={confirmMatch} className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white">
                Use selected Cliniko patient
              </button>
            )}
            {result.staffConfirmationRequired && selectedId && (
              <button type="button" onClick={confirmMatch} className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white">
                Confirm selected match
              </button>
            )}
            {result.recommendedAction === "create-new" && (
              <button type="button" disabled={loading} onClick={() => void createNewPatient()} className="min-h-10 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Create new DEMO Cliniko patient
              </button>
            )}
            {result.recommendedAction === "do-not-write" && (
              <p className="text-red-700">Do not write — unsafe match</p>
            )}
          </div>
        </div>
      )}

      {createResult && (
        <PatientFieldResultPanel
          savedFields={createResult.savedFields}
          preparedOnlyFields={createResult.preparedOnlyFields}
          verified={createResult.verified}
          verificationMessage={createResult.verificationMessage}
          blocked={createResult.blocked}
        />
      )}

      {actionMessage && !createResult && (
        <p className="mt-2 text-sm font-medium text-navy">{actionMessage}</p>
      )}

      {result &&
        linkConfirmed &&
        selectedId &&
        (result.matchStatus === "exact" || result.matchStatus === "possible") &&
        result.recommendedAction !== "do-not-write" && (
          <PatientFieldReconciliationPanel
            intake={intake}
            patientId={selectedId}
            staffConfirmationRequired={result.staffConfirmationRequired}
            linkedToCliniko={!selectedId.startsWith("demo-week-")}
            useLocalSnapshot={selectedId.startsWith("demo-week-")}
          />
        )}
    </section>
  );
}
