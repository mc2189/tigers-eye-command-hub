"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataSourceBadge } from "./DataSourceBadge";
import { CalloutBox } from "./AdminUI";
import { DemoFeedbackToast, useDemoFeedback } from "./DemoActionFeedback";
import { asArray, safeDateLabel, safeString } from "@/lib/safe-data";

type ProofStatus = "proven" | "failed" | "not-tested" | "needs-setup";

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

interface NamedResource {
  id: string;
  name: string;
  durationMinutes?: number;
}

interface PreflightCheck {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
  severity: "hard" | "soft";
}

interface ProofDiagnostics {
  lastEndpoint?: string;
  dataSource: "individual_appointments" | "bookings";
  availableTimeEndpoint?: string;
  availableTimeResult?: string;
  availableTimeHttpStatus?: number;
  availableTimeSeverity: "hard" | "soft";
  proposedStartsAt?: string;
  proposedEndsAt?: string;
  usingManualTime?: boolean;
  selectedPatientId?: string;
  selectedBusinessId?: string;
  selectedPractitionerId?: string;
  selectedAppointmentTypeId?: string;
}

interface Diagnostics {
  endpoint?: string;
  httpStatus?: number;
  clinikoMessage?: string;
  likelyCause?: string;
  suggestedFix?: string;
}

interface ActionResult {
  ok: boolean;
  action: string;
  proofStatus: ProofStatus;
  message: string;
  diagnostics?: Diagnostics;
  result?: unknown;
}

interface Snapshot {
  ok: boolean;
  mode: "live" | "demo" | "unavailable";
  writesEnabled: boolean;
  message?: string;
  patients: DemoPatient[];
  appointments: DemoAppointment[];
  businesses: NamedResource[];
  appointmentTypes: NamedResource[];
  practitionerSource: string;
  practitionerBookable: boolean;
  practitionerId?: string;
  practitionerName?: string;
  practitionerSourceLabel: string;
  defaults?: {
    businessId?: string;
    practitionerId?: string;
    appointmentTypeId?: string;
    proposedStartsAt?: string;
  };
  preflight?: {
    ready: boolean;
    checks: PreflightCheck[];
    proposedStartsAt?: string;
    proposedEndsAt?: string;
    usingManualTime?: boolean;
    manualTimeMessage?: string;
  };
  proofDiagnostics?: ProofDiagnostics;
}

interface ProofCard {
  id: string;
  label: string;
  status: ProofStatus;
}

const PROOF_STORAGE_KEY = "cliniko-proof-status-v1";

const DEFAULT_PROOF: ProofCard[] = [
  { id: "connection", label: "Cliniko connection", status: "not-tested" },
  { id: "auth_read", label: "Authenticated user read", status: "not-tested" },
  { id: "patient_create", label: "DEMO patient create", status: "not-tested" },
  { id: "patient_update", label: "DEMO patient update", status: "not-tested" },
  { id: "patient_archive", label: "DEMO patient cleanup/archive", status: "not-tested" },
  { id: "appointment_create", label: "DEMO appointment create", status: "not-tested" },
  { id: "appointment_read", label: "DEMO appointment read-back", status: "not-tested" },
  { id: "mapping", label: "Command Hub mapping", status: "not-tested" },
];

function normalizeSnapshot(raw: Partial<Snapshot> | null | undefined): Snapshot | null {
  if (!raw || typeof raw !== "object") return null;

  return {
    ok: Boolean(raw.ok),
    mode: raw.mode ?? "unavailable",
    writesEnabled: Boolean(raw.writesEnabled),
    message: raw.message,
    patients: asArray<DemoPatient>(raw.patients).map((patient) => ({
      id: safeString(patient.id, "unknown"),
      firstName: safeString(patient.firstName, "DEMO"),
      lastName: safeString(patient.lastName, "Patient"),
      email: patient.email ? safeString(patient.email) : undefined,
    })),
    appointments: asArray<DemoAppointment>(raw.appointments).map((appointment) => ({
      id: safeString(appointment.id, "unknown"),
      patientId: appointment.patientId,
      patientLabel: safeString(appointment.patientLabel, "DEMO patient"),
      startsAt: safeString(appointment.startsAt),
      appointmentTypeName: safeString(appointment.appointmentTypeName, "Appointment"),
      businessName: safeString(appointment.businessName, "Clinic"),
      cancelled: Boolean(appointment.cancelled),
    })),
    businesses: asArray<NamedResource>(raw.businesses).map((business) => ({
      id: safeString(business.id, "unknown"),
      name: safeString(business.name, "Clinic"),
      durationMinutes: business.durationMinutes,
    })),
    appointmentTypes: asArray<NamedResource>(raw.appointmentTypes).map((type) => ({
      id: safeString(type.id, "unknown"),
      name: safeString(type.name, "Appointment"),
      durationMinutes: type.durationMinutes,
    })),
    practitionerSource: safeString(raw.practitionerSource, "none"),
    practitionerBookable: Boolean(raw.practitionerBookable),
    practitionerId: raw.practitionerId,
    practitionerName: raw.practitionerName,
    practitionerSourceLabel: safeString(raw.practitionerSourceLabel, "unknown"),
    defaults: raw.defaults,
    preflight: raw.preflight
      ? {
          ready: Boolean(raw.preflight.ready),
          checks: asArray<PreflightCheck>(raw.preflight.checks),
          proposedStartsAt: raw.preflight.proposedStartsAt,
          proposedEndsAt: raw.preflight.proposedEndsAt,
          usingManualTime: raw.preflight.usingManualTime,
          manualTimeMessage: raw.preflight.manualTimeMessage,
        }
      : undefined,
    proofDiagnostics: raw.proofDiagnostics
      ? {
          lastEndpoint: raw.proofDiagnostics.lastEndpoint,
          dataSource: raw.proofDiagnostics.dataSource ?? "individual_appointments",
          availableTimeEndpoint: raw.proofDiagnostics.availableTimeEndpoint,
          availableTimeResult: raw.proofDiagnostics.availableTimeResult,
          availableTimeHttpStatus: raw.proofDiagnostics.availableTimeHttpStatus,
          availableTimeSeverity: raw.proofDiagnostics.availableTimeSeverity ?? "soft",
          proposedStartsAt: raw.proofDiagnostics.proposedStartsAt,
          proposedEndsAt: raw.proofDiagnostics.proposedEndsAt,
          usingManualTime: raw.proofDiagnostics.usingManualTime,
          selectedPatientId: raw.proofDiagnostics.selectedPatientId,
          selectedBusinessId: raw.proofDiagnostics.selectedBusinessId,
          selectedPractitionerId: raw.proofDiagnostics.selectedPractitionerId,
          selectedAppointmentTypeId: raw.proofDiagnostics.selectedAppointmentTypeId,
        }
      : undefined,
  };
}

function loadProofCards(): ProofCard[] {
  if (typeof window === "undefined") return DEFAULT_PROOF;
  try {
    const raw = window.localStorage.getItem(PROOF_STORAGE_KEY);
    if (!raw) return DEFAULT_PROOF;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_PROOF;
    return parsed
      .filter(
        (card): card is ProofCard =>
          Boolean(card) &&
          typeof card === "object" &&
          typeof (card as ProofCard).id === "string" &&
          typeof (card as ProofCard).label === "string"
      )
      .map((card) => ({
        id: card.id,
        label: card.label,
        status: card.status ?? "not-tested",
      }));
  } catch {
    return DEFAULT_PROOF;
  }
}

function saveProofCards(cards: ProofCard[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROOF_STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // Ignore storage failures in private browsing or quota errors.
  }
}

function updateProofFromAction(cards: ProofCard[], result: ActionResult): ProofCard[] {
  const next = cards.map((c) => ({ ...c }));
  const set = (id: string, status: ProofStatus) => {
    const card = next.find((c) => c.id === id);
    if (card) card.status = status;
  };

  switch (result.action) {
    case "create_demo_patient":
      set("patient_create", result.proofStatus);
      break;
    case "update_demo_patient":
      set("patient_update", result.proofStatus);
      break;
    case "archive_demo_patient":
    case "cleanup_demo_records":
      set("patient_archive", result.proofStatus);
      break;
    case "create_demo_appointment":
      set("appointment_create", result.proofStatus);
      if (result.ok) set("mapping", "not-tested");
      break;
    case "check_demo_appointments":
      set("appointment_read", result.proofStatus);
      if (result.ok && result.proofStatus === "proven") set("mapping", "not-tested");
      break;
    case "cancel_demo_appointment":
      break;
  }
  return next;
}

export function ClinikoTestLabPanel() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [selectedAppointmentTypeId, setSelectedAppointmentTypeId] = useState<string | null>(null);
  const [lastDiagnostics, setLastDiagnostics] = useState<Diagnostics | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [cleanupConfirm, setCleanupConfirm] = useState(false);
  const [proofCards, setProofCards] = useState<ProofCard[]>(DEFAULT_PROOF);
  const { message, show } = useDemoFeedback();

  useEffect(() => {
    setProofCards(loadProofCards());
  }, []);

  const snapshotQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedPatientId) params.set("patientId", selectedPatientId);
    if (selectedBusinessId) params.set("businessId", selectedBusinessId);
    if (snapshot?.practitionerId) params.set("practitionerId", snapshot.practitionerId);
    if (selectedAppointmentTypeId) params.set("appointmentTypeId", selectedAppointmentTypeId);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [selectedPatientId, selectedBusinessId, selectedAppointmentTypeId, snapshot?.practitionerId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cliniko/test-data${snapshotQuery}`, { cache: "no-store" });
      const json = normalizeSnapshot((await res.json()) as Partial<Snapshot>);
      if (!json) {
        setSnapshot(null);
        return;
      }
      setSnapshot(json);
      setSelectedPatientId((prev) => prev ?? json.patients[0]?.id ?? null);
      setSelectedBusinessId((prev) => prev ?? json.defaults?.businessId ?? json.businesses[0]?.id ?? null);
      setSelectedAppointmentTypeId(
        (prev) => prev ?? json.defaults?.appointmentTypeId ?? json.appointmentTypes[0]?.id ?? null
      );
      setSelectedAppointmentId((prev) => prev ?? json.appointments[0]?.id ?? null);

      setProofCards((cards) => {
        const next = cards.map((c) => ({ ...c }));
        const set = (id: string, status: ProofStatus) => {
          const card = next.find((c) => c.id === id);
          if (card) card.status = status;
        };
        if (json.mode === "live") {
          set("connection", "proven");
          set("auth_read", "proven");
        }
        if (json.patients.length > 0 && next.find((c) => c.id === "patient_create")?.status === "not-tested") {
          set("patient_create", "proven");
        }
        saveProofCards(next);
        return next;
      });
    } catch {
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [snapshotQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(
    action: string,
    payload: Record<string, string | undefined> = {}
  ) {
    setBusy(action);
    setLastAction(action);
    setLastDiagnostics(null);
    try {
      const res = await fetch("/api/cliniko/test-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = (await res.json()) as ActionResult;
      show(json.message ?? (json.ok ? "Done." : "Action failed."));
      if (json.diagnostics) setLastDiagnostics(json.diagnostics);
      setProofCards((cards) => {
        const next = updateProofFromAction(cards, json);
        saveProofCards(next);
        return next;
      });
      await load();
    } catch {
      show("Could not reach Cliniko test lab.");
    } finally {
      setBusy(null);
      setCleanupConfirm(false);
    }
  }

  const selectedPatient = snapshot?.patients.find((p) => p.id === selectedPatientId);
  const selectedAppointment = snapshot?.appointments.find((a) => a.id === selectedAppointmentId);
  const selectedBusiness = snapshot?.businesses.find((b) => b.id === selectedBusinessId);
  const selectedType = snapshot?.appointmentTypes.find((t) => t.id === selectedAppointmentTypeId);
  const canCreateAppointment =
    Boolean(selectedPatientId) &&
    snapshot?.practitionerBookable &&
    snapshot?.preflight?.ready;

  return (
    <section className="rounded-xl border border-cream-dark bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Cliniko test lab</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate">
            Independent proof steps for fake <strong>DEMO</strong> patients and appointments in
            the sterile Cliniko test account only.
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

      <ProofStatusGrid cards={proofCards} />

      <CalloutBox variant="warning" title="Sterile test account rules">
        <ul className="list-disc space-y-1 pl-4 text-sm">
          <li>Only patients whose first name starts with DEMO can be modified</li>
          <li>Emails use @{`demo.tigerseye.test`}</li>
          <li>Writes require CLINIKO_ENABLE_WRITES=true and staff login</li>
          <li>Cleanup runs only when you confirm it explicitly</li>
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

          <SelectionSummary
            patient={selectedPatient}
            practitionerName={snapshot.practitionerName}
            practitionerSourceLabel={snapshot.practitionerSourceLabel}
            business={selectedBusiness}
            appointmentType={selectedType}
            proposedStartsAt={snapshot.defaults?.proposedStartsAt ?? snapshot.preflight?.proposedStartsAt}
            proposedEndsAt={snapshot.preflight?.proposedEndsAt}
            usingManualTime={snapshot.preflight?.usingManualTime}
            appointment={selectedAppointment}
          />

          <section className="mt-6">
            <h3 className="font-semibold text-navy">Patient actions</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <ActionButton
                label="Create DEMO patient"
                busy={busy === "create_demo_patient"}
                onClick={() => void runAction("create_demo_patient")}
              />
              <ActionButton
                label="Update selected DEMO patient"
                busy={busy === "update_demo_patient"}
                disabled={!selectedPatientId}
                onClick={() =>
                  void runAction("update_demo_patient", { patientId: selectedPatientId ?? undefined })
                }
              />
              <ActionButton
                label="Archive selected DEMO patient"
                busy={busy === "archive_demo_patient"}
                disabled={!selectedPatientId}
                onClick={() =>
                  void runAction("archive_demo_patient", { patientId: selectedPatientId ?? undefined })
                }
              />
            </div>
          </section>

          <section className="mt-6">
            <h3 className="font-semibold text-navy">Appointment actions</h3>
            {!snapshot.practitionerBookable && (
              <p className="mt-2 text-sm text-amber-800">
                A real Cliniko practitioner is required before appointments can be created.
              </p>
            )}
            {!selectedPatientId && (
              <p className="mt-2 text-sm text-amber-800">Create a DEMO patient first.</p>
            )}

          {snapshot.preflight && (
            <PreflightPanel preflight={snapshot.preflight} />
          )}

          {snapshot.proofDiagnostics && (
            <AppointmentProofDiagnosticsPanel diagnostics={snapshot.proofDiagnostics} />
          )}

            <div className="mt-3 flex flex-wrap gap-2">
              <ActionButton
                label="Create DEMO appointment for selected DEMO patient"
                busy={busy === "create_demo_appointment"}
                disabled={!canCreateAppointment}
                onClick={() =>
                  void runAction("create_demo_appointment", {
                    patientId: selectedPatientId ?? undefined,
                    businessId: selectedBusinessId ?? undefined,
                    practitionerId: snapshot.practitionerId,
                    appointmentTypeId: selectedAppointmentTypeId ?? undefined,
                    startsAt: snapshot.preflight?.proposedStartsAt ?? snapshot.defaults?.proposedStartsAt,
                  })
                }
              />
              <ActionButton
                label="Cancel selected DEMO appointment"
                busy={busy === "cancel_demo_appointment"}
                disabled={!selectedAppointmentId}
                onClick={() =>
                  void runAction("cancel_demo_appointment", {
                    appointmentId: selectedAppointmentId ?? undefined,
                  })
                }
              />
              <ActionButton
                label="Check for DEMO appointments"
                busy={busy === "check_demo_appointments"}
                onClick={() => void runAction("check_demo_appointments")}
              />
            </div>
          </section>

          <section className="mt-6 rounded-lg border border-cream-dark bg-cream/40 p-4">
            <h3 className="font-semibold text-navy">Manual Cliniko appointment test</h3>
            <p className="mt-2 text-sm text-slate">
              If API appointment creation fails, create an appointment manually inside Cliniko for
              a DEMO patient, then click &ldquo;Check for DEMO appointments&rdquo;. This proves
              whether Command Hub can read and map Cliniko bookings even before API appointment
              creation is fixed.
            </p>
          </section>

          <section className="mt-6">
            <h3 className="font-semibold text-navy">Refresh &amp; cleanup</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void load()}
                className="min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-green hover:bg-cream"
              >
                Refresh DEMO records
              </button>
              {!cleanupConfirm ? (
                <button
                  type="button"
                  onClick={() => setCleanupConfirm(true)}
                  className="min-h-10 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                >
                  Cleanup all DEMO records
                </button>
              ) : (
                <>
                  <p className="w-full text-sm text-amber-900">
                    This will cancel DEMO appointments then archive DEMO patients. Continue?
                  </p>
                  <ActionButton
                    label="Confirm cleanup"
                    busy={busy === "cleanup_demo_records"}
                    onClick={() => void runAction("cleanup_demo_records")}
                  />
                  <button
                    type="button"
                    onClick={() => setCleanupConfirm(false)}
                    className="min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm text-slate"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </section>

          {lastDiagnostics && (
            <DiagnosticPanel action={lastAction} diagnostics={lastDiagnostics} />
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <PatientList
              patients={snapshot.patients}
              selectedPatientId={selectedPatientId}
              onSelect={setSelectedPatientId}
            />
            <AppointmentList
              appointments={snapshot.appointments}
              selectedAppointmentId={selectedAppointmentId}
              onSelect={setSelectedAppointmentId}
            />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <ResourcePicker
              label="Business / location"
              items={snapshot.businesses}
              selectedId={selectedBusinessId}
              onSelect={setSelectedBusinessId}
            />
            <ResourcePicker
              label="Appointment type"
              items={snapshot.appointmentTypes}
              selectedId={selectedAppointmentTypeId}
              onSelect={setSelectedAppointmentTypeId}
              renderExtra={(item) =>
                item.durationMinutes ? `${item.durationMinutes} min` : undefined
              }
            />
          </div>
        </>
      )}

      <DemoFeedbackToast message={message} />
    </section>
  );
}

function ProofStatusGrid({ cards }: { cards: ProofCard[] }) {
  const safeCards = asArray<ProofCard>(cards);
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {safeCards.map((card) => (
        <div
          key={card.id}
          className="rounded-lg border border-cream-dark px-3 py-2 text-sm"
        >
          <p className="font-medium text-navy">{card.label}</p>
          <p className={`mt-0.5 capitalize ${proofStatusColor(card.status)}`}>{card.status}</p>
        </div>
      ))}
    </div>
  );
}

function proofStatusColor(status: ProofStatus): string {
  switch (status) {
    case "proven":
      return "text-green";
    case "failed":
      return "text-red-700";
    case "needs-setup":
      return "text-amber-800";
    default:
      return "text-slate";
  }
}

function SelectionSummary({
  patient,
  practitionerName,
  practitionerSourceLabel,
  business,
  appointmentType,
  proposedStartsAt,
  proposedEndsAt,
  usingManualTime,
  appointment,
}: {
  patient?: DemoPatient;
  practitionerName?: string;
  practitionerSourceLabel: string;
  business?: NamedResource;
  appointmentType?: NamedResource;
  proposedStartsAt?: string;
  proposedEndsAt?: string;
  usingManualTime?: boolean;
  appointment?: DemoAppointment;
}) {
  return (
    <div className="mt-4 rounded-lg border border-cream-dark bg-cream/30 p-4 text-sm">
      <h3 className="font-semibold text-navy">Current selection</h3>
      <dl className="mt-2 grid gap-1 sm:grid-cols-2">
        <Row label="DEMO patient" value={patient ? `${patient.firstName} ${patient.lastName}` : "—"} />
        <Row label="Practitioner" value={practitionerName ?? "—"} />
        <Row label="Practitioner source" value={practitionerSourceLabel} />
        <Row label="Business / location" value={business?.name ?? "—"} />
        <Row label="Appointment type" value={appointmentType?.name ?? "—"} />
        <Row label="Proposed date/time" value={proposedStartsAt ? safeDateLabel(proposedStartsAt) : "—"} />
        <Row label="Proposed ends_at" value={proposedEndsAt ? safeDateLabel(proposedEndsAt) : "—"} />
        <Row
          label="Manual test time"
          value={usingManualTime ? "Using safe manual test time" : "—"}
        />
        <Row
          label="DEMO appointment"
          value={
            appointment
              ? `${safeDateLabel(appointment.startsAt)}${appointment.cancelled ? " (cancelled)" : ""}`
              : "—"
          }
        />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate">{label}</dt>
      <dd className="font-medium text-navy">{value}</dd>
    </div>
  );
}

function PreflightPanel({
  preflight,
}: {
  preflight: {
    ready: boolean;
    checks: PreflightCheck[];
    usingManualTime?: boolean;
    manualTimeMessage?: string;
  };
}) {
  return (
    <div className="mt-3 rounded-lg border border-cream-dark p-3 text-sm">
      <p className="font-medium text-navy">
        Appointment preflight: {preflight.ready ? "ready" : "blocked"}
      </p>
      {preflight.usingManualTime && preflight.manualTimeMessage && (
        <p className="mt-2 text-amber-800">{preflight.manualTimeMessage}</p>
      )}
      <ul className="mt-2 space-y-1">
        {asArray<PreflightCheck>(preflight.checks).map((check) => (
          <li
            key={check.id}
            className={
              check.passed
                ? check.severity === "soft"
                  ? "text-slate"
                  : "text-green"
                : check.severity === "soft"
                  ? "text-slate"
                  : "text-amber-800"
            }
          >
            {check.passed ? "✓" : check.severity === "soft" ? "!" : "✗"} {check.label}
            {check.detail ? ` — ${check.detail}` : ""}
            {check.severity === "soft" ? " (soft warning)" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AppointmentProofDiagnosticsPanel({
  diagnostics,
}: {
  diagnostics: ProofDiagnostics;
}) {
  return (
    <div className="mt-4 rounded-lg border border-cream-dark bg-cream/30 p-4 text-sm">
      <h3 className="font-semibold text-navy">Appointment proof diagnostics</h3>
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
        <DiagRow label="Last endpoint" value={diagnostics.lastEndpoint ?? "—"} />
        <DiagRow
          label="Data source"
          value={
            diagnostics.dataSource === "individual_appointments"
              ? "/individual_appointments"
              : "/bookings"
          }
        />
        <DiagRow label="Available-time endpoint" value={diagnostics.availableTimeEndpoint ?? "—"} />
        <DiagRow
          label="Available-time result"
          value={
            diagnostics.availableTimeHttpStatus
              ? `HTTP ${diagnostics.availableTimeHttpStatus}: ${diagnostics.availableTimeResult ?? "—"}`
              : diagnostics.availableTimeResult ?? "—"
          }
        />
        <DiagRow
          label="Available-time treated as"
          value={
            diagnostics.availableTimeSeverity === "soft" ? "soft warning" : "hard block"
          }
        />
        <DiagRow label="Proposed starts_at" value={diagnostics.proposedStartsAt ?? "—"} />
        <DiagRow label="Proposed ends_at" value={diagnostics.proposedEndsAt ?? "—"} />
        <DiagRow
          label="Using manual test time"
          value={diagnostics.usingManualTime ? "yes" : "no"}
        />
        <DiagRow label="Patient id" value={diagnostics.selectedPatientId ?? "—"} />
        <DiagRow label="Business id" value={diagnostics.selectedBusinessId ?? "—"} />
        <DiagRow label="Practitioner id" value={diagnostics.selectedPractitionerId ?? "—"} />
        <DiagRow
          label="Appointment type id"
          value={diagnostics.selectedAppointmentTypeId ?? "—"}
        />
      </dl>
      <p className="mt-3 text-xs text-slate">
        Online booking availability is separate from direct individual appointment creation.
        Manual Cliniko appointments are read from /individual_appointments, not /bookings.
      </p>
    </div>
  );
}

function DiagRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate">{label}</dt>
      <dd className="break-all font-medium text-navy">{value}</dd>
    </div>
  );
}

function DiagnosticPanel({
  action,
  diagnostics,
}: {
  action: string | null;
  diagnostics: Diagnostics;
}) {
  return (
    <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
      <h3 className="font-semibold text-red-900">Cliniko error diagnostics</h3>
      <dl className="mt-2 space-y-1 text-red-900">
        {action && (
          <div>
            <dt className="text-xs opacity-80">Action attempted</dt>
            <dd>{action}</dd>
          </div>
        )}
        {diagnostics.endpoint && (
          <div>
            <dt className="text-xs opacity-80">Endpoint</dt>
            <dd className="font-mono text-xs">{diagnostics.endpoint}</dd>
          </div>
        )}
        {diagnostics.httpStatus !== undefined && (
          <div>
            <dt className="text-xs opacity-80">HTTP status</dt>
            <dd>{diagnostics.httpStatus}</dd>
          </div>
        )}
        {diagnostics.clinikoMessage && (
          <div>
            <dt className="text-xs opacity-80">Cliniko message</dt>
            <dd>{diagnostics.clinikoMessage}</dd>
          </div>
        )}
        {diagnostics.likelyCause && (
          <div>
            <dt className="text-xs opacity-80">Likely cause</dt>
            <dd>{diagnostics.likelyCause}</dd>
          </div>
        )}
        {diagnostics.suggestedFix && (
          <div>
            <dt className="text-xs opacity-80">Suggested fix</dt>
            <dd>{diagnostics.suggestedFix}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function PatientList({
  patients,
  selectedPatientId,
  onSelect,
}: {
  patients: DemoPatient[];
  selectedPatientId: string | null;
  onSelect: (id: string) => void;
}) {
  const safePatients = asArray<DemoPatient>(patients);
  return (
    <div>
      <h3 className="font-semibold text-navy">DEMO patients ({safePatients.length})</h3>
      {safePatients.length === 0 ? (
        <p className="mt-2 text-sm text-slate">
          No DEMO patients yet. Create one to prove live Cliniko writes.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {safePatients.map((p) => (
            <li
              key={p.id}
              className={`rounded-lg border p-3 text-sm ${
                selectedPatientId === p.id
                  ? "border-green bg-green-muted/20"
                  : "border-cream-dark"
              }`}
            >
              <button type="button" onClick={() => onSelect(p.id)} className="w-full text-left">
                <span className="font-medium text-navy">
                  {p.firstName} {p.lastName}
                </span>
                {p.email && <span className="mt-1 block text-xs text-slate">{p.email}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AppointmentList({
  appointments,
  selectedAppointmentId,
  onSelect,
}: {
  appointments: DemoAppointment[];
  selectedAppointmentId: string | null;
  onSelect: (id: string) => void;
}) {
  const safeAppointments = asArray<DemoAppointment>(appointments);
  return (
    <div>
      <h3 className="font-semibold text-navy">DEMO appointments ({safeAppointments.length})</h3>
      {safeAppointments.length === 0 ? (
        <p className="mt-2 text-sm text-slate">No upcoming DEMO appointments loaded.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {safeAppointments.map((a) => (
            <li
              key={a.id || a.startsAt}
              className={`rounded-lg border p-3 text-sm ${
                selectedAppointmentId === a.id
                  ? "border-green bg-green-muted/20"
                  : "border-cream-dark"
              }`}
            >
              <button type="button" onClick={() => onSelect(a.id)} className="w-full text-left">
                <p className="font-medium text-navy">
                  {safeString(a.patientLabel, "DEMO patient")} · {safeDateLabel(a.startsAt)}
                </p>
                <p className="text-xs text-slate">
                  {safeString(a.appointmentTypeName, "Appointment")}
                  {safeString(a.businessName) ? ` · ${safeString(a.businessName, "Clinic")}` : ""}
                  {a.cancelled ? " · Cancelled" : ""}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResourcePicker({
  label,
  items,
  selectedId,
  onSelect,
  renderExtra,
}: {
  label: string;
  items: NamedResource[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  renderExtra?: (item: NamedResource) => string | undefined;
}) {
  const safeItems = asArray<NamedResource>(items);
  return (
    <div>
      <label className="text-sm font-medium text-navy">{label}</label>
      <select
        className="mt-1 w-full rounded-lg border border-cream-dark px-3 py-2 text-sm"
        value={selectedId ?? ""}
        onChange={(e) => onSelect(e.target.value)}
      >
        {safeItems.length === 0 ? (
          <option value="">None available</option>
        ) : (
          safeItems.map((item) => (
            <option key={item.id || item.name} value={item.id}>
              {safeString(item.name, "Unknown")}
              {renderExtra?.(item) ? ` (${renderExtra(item)})` : ""}
            </option>
          ))
        )}
      </select>
    </div>
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

function formatDateTime(iso: string): string {
  return safeDateLabel(iso, iso);
}
