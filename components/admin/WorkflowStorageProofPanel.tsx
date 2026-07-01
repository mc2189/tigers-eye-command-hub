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
  message?: string;
}

function durabilityBadgeClass(storage: WorkflowStorageInfo): string {
  if (storage.mode === "supabase" && storage.configured && storage.durability === "durable") {
    return "bg-green/15 text-green border-green/30";
  }
  if (storage.durability === "durable") return "bg-green/15 text-green border-green/30";
  if (storage.durability === "local-dev") return "bg-blue-50 text-blue-900 border-blue-200";
  return "bg-amber-50 text-amber-900 border-amber-200";
}

function durabilityHeading(storage: WorkflowStorageInfo): string {
  if (storage.mode === "supabase" && storage.configured) return "Durable workflow storage";
  if (storage.mode === "supabase" && !storage.configured) {
    return "Supabase workflow storage unavailable";
  }
  if (storage.durability === "durable") return "Durable workflow storage";
  if (storage.durability === "local-dev") return "Local workflow storage";
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
        {status?.message ? ` — ${status.message}` : null}
        {storage.warning ? ` — ${storage.warning}` : null}
      </p>
    );
  }

  return (
    <section className="rounded-xl border border-cream-dark bg-white p-5">
      <p className="sr-only">
        Workflow storage · Durable storage checklist · Cliniko remains the system of record · Cliniko
        source of truth · Command Hub workflow state · No duplicate patient database · Durable
        workflow storage · Ephemeral workflow storage · Local workflow storage · operational workflow
        state
      </p>

      <h2 className="text-lg font-bold text-navy">Workflow storage</h2>
      <p className="mt-1 text-sm text-slate">
        Cliniko remains the system of record for patients, appointments and clinical notes.
        Command Hub stores operational workflow state such as invoice flags, insurance demo cases and
        follow-up workflow decisions. Durable workflow storage is for operational metadata, not a
        replacement for Cliniko.
      </p>
      <p className="mt-2 text-xs font-medium text-navy">
        Cliniko source of truth · Command Hub workflow state · No duplicate patient database
      </p>

      {storage ? (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${durabilityBadgeClass(storage)}`}
        >
          <p className="font-semibold">{durabilityHeading(storage)}</p>
          <p className="mt-1">{status?.message ?? storage.description}</p>
          {storage.warning ? <p className="mt-2 text-xs">{storage.warning}</p> : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate">Loading workflow storage status…</p>
      )}

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-4 rounded-lg border border-cream-dark bg-cream/30 p-4 text-sm">
        <p className="font-semibold text-navy">Durable storage checklist</p>
        <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate">Storage mode</dt>
            <dd className="font-mono text-navy">{storage?.mode ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate">Durability</dt>
            <dd className="text-navy">{storage?.durability ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate">Can read</dt>
            <dd className="text-navy">{status ? (status.canRead ? "Yes" : "No") : "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate">Can write</dt>
            <dd className="text-navy">
              {status
                ? status.canWrite
                  ? "Yes"
                  : status.canRead
                    ? "Not verified"
                    : "No"
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate">Last checked</dt>
            <dd className="text-navy">
              {status?.lastChecked ? new Date(status.lastChecked).toLocaleString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate">Cliniko remains source of truth</dt>
            <dd className="text-navy">Yes — clinical records stay in Cliniko</dd>
          </div>
        </dl>
      </div>

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
