"use client";

import { useCallback, useEffect, useState } from "react";
import type { WorkflowMigrationStatus } from "@/lib/workflow-storage/types";
import type { WorkflowStorageInfo } from "@/lib/workflow-storage/types";
import { useCommandHubWorkflowOptional } from "@/components/admin/CommandHubWorkflowProvider";

interface StorageStatusResponse {
  ok: boolean;
  storage?: WorkflowStorageInfo;
  canRead?: boolean;
  canWrite?: boolean;
  lastChecked?: string;
}

function durabilityBadgeClass(durability: WorkflowStorageInfo["durability"]): string {
  if (durability === "durable") return "bg-green/15 text-green border-green/30";
  if (durability === "local-dev") return "bg-blue-50 text-blue-900 border-blue-200";
  return "bg-amber-50 text-amber-900 border-amber-200";
}

function durabilityHeading(durability: WorkflowStorageInfo["durability"]): string {
  if (durability === "durable") return "Durable workflow storage";
  if (durability === "local-dev") return "Local workflow storage";
  return "Ephemeral workflow storage";
}

interface WorkflowStorageProofPanelProps {
  compact?: boolean;
}

export function WorkflowStorageProofPanel({ compact = false }: WorkflowStorageProofPanelProps) {
  const workflow = useCommandHubWorkflowOptional();
  const [status, setStatus] = useState<StorageStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/command-hub/workflow-storage/status", { cache: "no-store" });
      const json = (await res.json()) as StorageStatusResponse;
      if (!json.ok) throw new Error("Workflow storage status check failed.");
      setStatus(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load workflow storage status.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, workflow?.storage?.mode]);

  const storage = workflow?.storage ?? status?.storage;
  const migration: WorkflowMigrationStatus | null = workflow?.migration ?? null;

  if (compact) {
    if (!storage) return null;
    return (
      <p className="text-xs text-slate">
        <span className="font-medium text-navy">Workflow storage:</span> {storage.label}
        {storage.warning ? ` — ${storage.warning}` : null}
      </p>
    );
  }

  return (
    <section className="rounded-xl border border-cream-dark bg-white p-5">
      <p className="sr-only">
        Workflow storage · Cliniko remains the system of record · Durable workflow storage ·
        Ephemeral workflow storage · Local workflow storage
      </p>

      <h2 className="text-lg font-bold text-navy">Workflow storage</h2>
      <p className="mt-1 text-sm text-slate">
        Cliniko remains the system of record for patients, appointments and treatment notes.
        Command Hub stores operational workflow state such as invoice flags, insurance demo cases and
        follow-up workflow decisions.
      </p>

      {storage ? (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${durabilityBadgeClass(storage.durability)}`}
        >
          <p className="font-semibold">{durabilityHeading(storage.durability)}</p>
          <p className="mt-1">{storage.description}</p>
          {storage.warning ? <p className="mt-2 text-xs">{storage.warning}</p> : null}
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="font-medium">Current storage mode</dt>
              <dd className="font-mono">{storage.mode}</dd>
            </div>
            <div>
              <dt className="font-medium">Durability</dt>
              <dd>{storage.durability}</dd>
            </div>
            <div>
              <dt className="font-medium">Configured</dt>
              <dd>{storage.configured ? "Yes" : "No"}</dd>
            </div>
            {status?.lastChecked ? (
              <div>
                <dt className="font-medium">Last workflow API check</dt>
                <dd>{new Date(status.lastChecked).toLocaleString()}</dd>
              </div>
            ) : null}
            {status ? (
              <>
                <div>
                  <dt className="font-medium">Can read</dt>
                  <dd>{status.canRead ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt className="font-medium">Can write</dt>
                  <dd>{status.canWrite ? "Yes" : "No"}</dd>
                </div>
              </>
            ) : null}
          </dl>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate">Loading workflow storage status…</p>
      )}

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-4 grid gap-3 text-sm text-slate sm:grid-cols-3">
        <div className="rounded-lg border border-cream-dark bg-cream/30 p-3">
          <p className="font-semibold text-navy">Stored in Command Hub</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Invoice prepared flags</li>
            <li>Note/follow-up workflow flags</li>
            <li>Linked patient decisions</li>
            <li>Insurance demo case details</li>
            <li>Demo week preview preference</li>
          </ul>
        </div>
        <div className="rounded-lg border border-cream-dark bg-cream/30 p-3">
          <p className="font-semibold text-navy">Remains in Cliniko</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Patient records</li>
            <li>Appointments</li>
            <li>Treatment notes (when safely written)</li>
            <li>Follow-up appointments (when safely written)</li>
          </ul>
        </div>
        <div className="rounded-lg border border-cream-dark bg-cream/30 p-3">
          <p className="font-semibold text-navy">Future integration</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Xero invoice posting</li>
            <li>Healthcode submission</li>
            <li>Real payment status</li>
            <li>Production audit log</li>
          </ul>
        </div>
      </div>

      {migration?.attempted ? (
        <p className="mt-4 text-xs text-slate">
          Migration: {migration.migrated ? "legacy browser state migrated" : "no migration needed"} —{" "}
          {migration.message}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void refresh()}
        className="mt-4 min-h-9 rounded-lg border border-cream-dark px-3 py-1.5 text-sm font-medium text-navy hover:bg-cream"
      >
        Re-check workflow storage
      </button>
    </section>
  );
}
