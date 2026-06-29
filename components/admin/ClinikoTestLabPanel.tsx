"use client";

import { useCallback, useEffect, useState } from "react";
import { DataSourceBadge } from "./DataSourceBadge";
import { CalloutBox } from "./AdminUI";
import {
  DemoFeedbackToast,
  useDemoFeedback,
} from "./DemoActionFeedback";

interface DemoPatient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface DemoAppointment {
  id: string;
  patientId?: string;
  patientLabel?: string;
  startsAt: string;
  appointmentTypeName?: string;
  businessName?: string;
  cancelled?: boolean;
}

interface Snapshot {
  ok: boolean;
  mode: "live" | "demo" | "unavailable";
  writesEnabled: boolean;
  message?: string;
  patients: DemoPatient[];
  appointments: DemoAppointment[];
}

export function ClinikoTestLabPanel() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { message, show } = useDemoFeedback();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cliniko/test-data", { cache: "no-store" });
      const json = (await res.json()) as Snapshot;
      setSnapshot(json);
      setSelectedPatientId((prev) => prev ?? json.patients[0]?.id ?? null);
    } catch {
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(
    action: string,
    payload: Record<string, string | undefined> = {}
  ) {
    setBusy(action);
    try {
      const res = await fetch("/api/cliniko/test-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      show(json.message ?? (json.ok ? "Done." : "Action failed."));
      await load();
    } catch {
      show("Could not reach Cliniko test lab.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-xl border border-cream-dark bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Cliniko test lab</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate">
            Create, update, cancel and clean up fake <strong>DEMO</strong> patients and
            appointments in the sterile Cliniko test account only. No real patient data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DataSourceBadge source="cliniko" />
          {snapshot?.writesEnabled ? (
            <DataSourceBadge source="live" />
          ) : (
            <DataSourceBadge source="safety-gated" />
          )}
        </div>
      </div>

      <CalloutBox variant="warning" title="Sterile test account rules">
        <ul className="list-disc space-y-1 pl-4 text-sm">
          <li>Only patients whose first name starts with DEMO can be modified</li>
          <li>Emails use @{`demo.tigerseye.test`}</li>
          <li>Writes require CLINIKO_ENABLE_WRITES=true and staff login</li>
          <li>Cliniko remains the system of record</li>
        </ul>
      </CalloutBox>

      {loading && (
        <p className="mt-4 text-sm text-slate">Loading Cliniko sandbox test data…</p>
      )}

      {snapshot && !loading && (
        <>
          {snapshot.message && (
            <p className="mt-4 text-sm text-slate">{snapshot.message}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton
              label="Create DEMO patient"
              busy={busy === "create-patient"}
              onClick={() => void runAction("create-patient")}
            />
            <ActionButton
              label="Create DEMO appointment"
              busy={busy === "create-appointment"}
              disabled={!selectedPatientId}
              onClick={() =>
                void runAction("create-appointment", { patientId: selectedPatientId ?? undefined })
              }
            />
            <ActionButton
              label="Cleanup all DEMO records"
              busy={busy === "cleanup"}
              onClick={() => void runAction("cleanup")}
            />
            <button
              type="button"
              onClick={() => void load()}
              className="min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-green hover:bg-cream"
            >
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="font-semibold text-navy">DEMO patients ({snapshot.patients.length})</h3>
              {snapshot.patients.length === 0 ? (
                <p className="mt-2 text-sm text-slate">
                  No DEMO patients yet. Create one to prove live Cliniko writes.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {snapshot.patients.map((p) => (
                    <li
                      key={p.id}
                      className={`rounded-lg border p-3 text-sm ${
                        selectedPatientId === p.id
                          ? "border-green bg-green-muted/20"
                          : "border-cream-dark"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedPatientId(p.id)}
                        className="w-full text-left"
                      >
                        <span className="font-medium text-navy">
                          {p.firstName} {p.lastName}
                        </span>
                        {p.email && (
                          <span className="mt-1 block text-xs text-slate">{p.email}</span>
                        )}
                      </button>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <MiniButton
                          label="Update"
                          onClick={() => void runAction("update-patient", { patientId: p.id })}
                        />
                        <MiniButton
                          label="Archive"
                          onClick={() => void runAction("archive-patient", { patientId: p.id })}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-navy">
                DEMO appointments ({snapshot.appointments.length})
              </h3>
              {snapshot.appointments.length === 0 ? (
                <p className="mt-2 text-sm text-slate">No upcoming DEMO appointments loaded.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {snapshot.appointments.map((a) => (
                    <li key={a.id} className="rounded-lg border border-cream-dark p-3 text-sm">
                      <p className="font-medium text-navy">
                        {a.patientLabel ?? "DEMO patient"} · {a.startsAt}
                      </p>
                      <p className="text-xs text-slate">
                        {a.appointmentTypeName ?? "Appointment"}
                        {a.businessName ? ` · ${a.businessName}` : ""}
                        {a.cancelled ? " · Cancelled" : ""}
                      </p>
                      {!a.cancelled && (
                        <div className="mt-2">
                          <MiniButton
                            label="Cancel"
                            onClick={() =>
                              void runAction("cancel-appointment", { appointmentId: a.id })
                            }
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      <DemoFeedbackToast message={message} />
    </section>
  );
}

function ActionButton({
  label,
  onClick,
  busy,
  disabled,
}: {
  label: string;
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light disabled:opacity-50"
    >
      {busy ? "Working…" : label}
    </button>
  );
}

function MiniButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-8 rounded-lg border border-cream-dark px-2.5 py-1 text-xs font-medium text-green hover:bg-cream"
    >
      {label}
    </button>
  );
}
