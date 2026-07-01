"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { IntakeSnapshot } from "@/lib/patient-field-reconciliation";
import {
  groupRowsByStatus,
  reconcilePatientFields,
  type FieldReconciliationRow,
  type PatientFieldReconciliationResult,
} from "@/lib/patient-field-reconciliation";
import { profileToClinikoSnapshot } from "@/lib/patient-field-reconciliation";
import { DEMO_CLINIC_WEEK_SCENARIOS } from "@/lib/demo-clinic-week";

interface PatientFieldReconciliationPanelProps {
  intake: IntakeSnapshot;
  patientId: string | null;
  staffConfirmationRequired?: boolean;
  linkedToCliniko?: boolean;
  /** Use local demo-week snapshot instead of API (for preview IDs). */
  useLocalSnapshot?: boolean;
  onUpdated?: (message: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  matches: "Already matches Cliniko",
  "missing-in-cliniko": "Missing in Cliniko",
  different: "Different from Cliniko",
  "prepared-only": "Prepared-only",
  "not-supported": "Prepared-only",
  "not-safe": "Blocked / not safe",
};

function FieldGroup({
  title,
  rows,
  selected,
  onToggle,
}: {
  title: string;
  rows: FieldReconciliationRow[];
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-navy">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm">
        {rows.map((row) => (
          <li
            key={row.fieldKey}
            className="rounded-lg border border-cream-dark bg-cream/30 p-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-navy">{row.label}</p>
                <p className="mt-1 text-slate">
                  Intake: <strong>{row.intakeValue ?? "—"}</strong>
                </p>
                <p className="text-slate">
                  Cliniko: <strong>{row.clinikoValue ?? "—"}</strong>
                </p>
                {row.reason && <p className="mt-1 text-xs text-slate">{row.reason}</p>}
              </div>
              {row.canUpdateNow && (
                <label className="flex shrink-0 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.has(row.fieldKey)}
                    onChange={() => onToggle(row.fieldKey)}
                  />
                  Update
                </label>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PatientFieldReconciliationPanel({
  intake,
  patientId,
  staffConfirmationRequired = false,
  linkedToCliniko,
  useLocalSnapshot = false,
  onUpdated,
}: PatientFieldReconciliationPanelProps) {
  const [reconciliation, setReconciliation] = useState<PatientFieldReconciliationResult | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [staffConfirmed, setStaffConfirmed] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [updateResult, setUpdateResult] = useState<{
    uiLabel?: string;
    savedFields?: Array<{ label: string; oldValue?: string; newValue: string }>;
    preparedOnlyFields?: Array<{ label: string; value: string; reason: string }>;
    verification?: { message: string; verified: boolean };
  } | null>(null);

  const localReconciliation = useMemo(() => {
    if (!patientId || !useLocalSnapshot) return null;
    const scenarioId = patientId.replace(/^demo-week-/, "");
    const scenario = DEMO_CLINIC_WEEK_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return null;
    return reconcilePatientFields(
      intake,
      profileToClinikoSnapshot(scenario.clientProfile),
      {
        staffConfirmationRequired,
        linkedToCliniko: linkedToCliniko ?? false,
      }
    );
  }, [intake, patientId, useLocalSnapshot, staffConfirmationRequired, linkedToCliniko]);

  const loadReconciliation = useCallback(async () => {
    if (!patientId) return;
    if (useLocalSnapshot && localReconciliation) {
      setReconciliation(localReconciliation);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/cliniko/patient-reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          intakeSnapshot: intake,
          staffConfirmationRequired,
          linkedToCliniko,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setReconciliation(json as PatientFieldReconciliationResult);
      } else {
        setReconciliation(null);
        setUpdateMessage(json.message ?? "Could not load field comparison.");
      }
    } catch {
      setUpdateMessage("Could not load field comparison.");
    } finally {
      setLoading(false);
    }
  }, [patientId, intake, staffConfirmationRequired, linkedToCliniko, useLocalSnapshot, localReconciliation]);

  useEffect(() => {
    void loadReconciliation();
    setSelected(new Set());
    setStaffConfirmed(false);
    setUpdateResult(null);
    setUpdateMessage(null);
  }, [loadReconciliation]);

  function toggleField(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function runUpdate() {
    if (!patientId) return;
    setLoading(true);
    setUpdateMessage(null);
    setUpdateResult(null);
    try {
      const res = await fetch("/api/cliniko/update-demo-patient-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          selectedFieldsToUpdate: Array.from(selected),
          intakeSnapshot: intake,
          staffConfirmed,
        }),
      });
      const json = await res.json();
      setUpdateResult(json);
      setUpdateMessage(json.uiLabel ?? json.message);
      onUpdated?.(json.message ?? json.uiLabel);
      if (json.ok || json.status === "verification-incomplete") {
        void loadReconciliation();
      }
    } catch {
      setUpdateMessage("Update failed — could not reach server.");
    } finally {
      setLoading(false);
    }
  }

  if (!patientId) return null;

  const data = reconciliation;
  const groups = data ? groupRowsByStatus(data.rows) : null;
  const canSubmit =
    selected.size > 0 &&
    staffConfirmed &&
    data?.canUpdateAny &&
    !patientId.startsWith("demo-week-");

  return (
    <section className="mt-6 rounded-xl border border-cream-dark bg-white p-5">
      <h2 className="text-lg font-bold text-navy">Field comparison</h2>
      <p className="mt-1 text-sm text-slate">
        Nothing is updated automatically. Select the fields you want to update, then confirm.
      </p>
      <p className="sr-only">
        Field comparison · Already matches Cliniko · Missing in Cliniko · Different from Cliniko ·
        Nothing is updated automatically
      </p>

      {loading && !data && <p className="mt-3 text-sm text-slate">Loading comparison…</p>}

      {data?.blockedReason && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Blocked for safety — {data.blockedReason}
        </p>
      )}

      {groups && (
        <>
          <FieldGroup
            title="Already matches Cliniko"
            rows={groups.matches}
            selected={selected}
            onToggle={toggleField}
          />
          <FieldGroup
            title="Missing in Cliniko"
            rows={groups.missingInCliniko}
            selected={selected}
            onToggle={toggleField}
          />
          <FieldGroup
            title="Different from Cliniko"
            rows={groups.different}
            selected={selected}
            onToggle={toggleField}
          />
          <FieldGroup
            title="Prepared-only"
            rows={groups.preparedOnly}
            selected={selected}
            onToggle={toggleField}
          />
          {groups.notSafe.length > 0 && (
            <FieldGroup
              title="Blocked / not safe"
              rows={groups.notSafe}
              selected={selected}
              onToggle={toggleField}
            />
          )}
        </>
      )}

      {data?.canUpdateAny && !patientId.startsWith("demo-week-") && (
        <div className="mt-6 space-y-3 border-t border-cream-dark pt-4">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={staffConfirmed}
              onChange={(e) => setStaffConfirmed(e.target.checked)}
              className="mt-1"
            />
            <span>
              I confirm this is a DEMO test patient and I want to update the selected fields in the
              Cliniko test account. <span className="sr-only">staff confirmation</span>
            </span>
          </label>
          <button
            type="button"
            disabled={loading || !canSubmit}
            onClick={() => void runUpdate()}
            className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green/90 disabled:opacity-50"
          >
            {loading ? "Updating…" : "Update selected DEMO fields in Cliniko"}
          </button>
          {!staffConfirmed && selected.size > 0 && (
            <p className="text-sm text-slate">Staff confirmation required before update.</p>
          )}
        </div>
      )}

      {patientId.startsWith("demo-week-") && (
        <p className="mt-4 text-sm text-slate">
          Demo week preview — field comparison uses demo profile data. Updates require a numeric
          Cliniko patient ID after seeding.
        </p>
      )}

      {updateMessage && (
        <p className="mt-4 text-sm font-medium text-navy">{updateMessage}</p>
      )}

      {updateResult?.savedFields && updateResult.savedFields.length > 0 && (
        <div className="mt-3 text-sm">
          <p className="font-semibold text-green">Updated in Cliniko test account</p>
          <ul className="mt-1 list-inside list-disc text-navy">
            {updateResult.savedFields.map((f) => (
              <li key={f.label}>
                {f.label}: {f.oldValue ? `${f.oldValue} → ` : ""}
                {f.newValue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {updateResult?.preparedOnlyFields && updateResult.preparedOnlyFields.length > 0 && (
        <div className="mt-3 text-sm">
          <p className="font-semibold text-navy">Prepared for Cliniko</p>
          <ul className="mt-1 space-y-1 text-slate">
            {updateResult.preparedOnlyFields.map((f) => (
              <li key={f.label}>
                {f.label} — {f.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {updateResult?.verification && !updateResult.verification.verified && (
        <p className="mt-2 text-sm text-amber-800">{updateResult.verification.message}</p>
      )}
    </section>
  );
}

export function ReconciliationSummaryStrip({
  reconciliation,
}: {
  reconciliation: PatientFieldReconciliationResult;
}) {
  return (
    <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <dt className="text-slate">Already matches</dt>
        <dd className="font-medium text-navy">{reconciliation.summary.matches}</dd>
      </div>
      <div>
        <dt className="text-slate">Missing in Cliniko</dt>
        <dd className="font-medium text-navy">{reconciliation.summary.missingInCliniko}</dd>
      </div>
      <div>
        <dt className="text-slate">Different</dt>
        <dd className="font-medium text-navy">{reconciliation.summary.different}</dd>
      </div>
      <div>
        <dt className="text-slate">Prepared-only</dt>
        <dd className="font-medium text-navy">{reconciliation.summary.preparedOnly}</dd>
      </div>
    </dl>
  );
}

export { STATUS_LABELS };
