"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCommandHubAppointments } from "@/components/admin/CommandHubAppointmentsProvider";
import {
  useCommandHubWorkflow,
} from "@/components/admin/CommandHubWorkflowProvider";
import { useInvoiceDraftList } from "@/components/admin/useInvoiceDraftList";
import { DataSourcePill } from "@/components/admin/DataSourcePill";
import { OpenClientButton } from "@/components/admin/OpenRecordButton";
import { PatientMatchPanel } from "@/components/admin/PatientMatchPanel";
import { RecordCompletenessPanel } from "@/components/admin/RecordCompletenessPanel";
import { WhatThisShows } from "@/components/admin/WhatThisShows";
import { resolveAppointmentRecord } from "@/lib/appointment-records";
import { DEMO_NOTE_SAFETY_COPY } from "@/lib/demo-clinic-week";
import type { BookingIntakeInput } from "@/lib/cliniko-patient-matching";
import { buildAppointmentCompleteness } from "@/lib/record-completeness";
import { patientLabelToSlug } from "@/lib/appointment-records";
import { invoiceDraftDetailPath } from "@/lib/invoice-draft-ids";
import { getTreatmentNoteEligibility } from "@/lib/treatment-note-eligibility";

interface AppointmentDetailContentProps {
  appointmentId: string;
}

function formatDay(date: string): string {
  try {
    return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return date;
  }
}

export function AppointmentDetailContent({ appointmentId }: AppointmentDetailContentProps) {
  const { mapped, demoWeekPreview, configured } = useCommandHubAppointments();
  const { store, updateAppointmentState } = useCommandHubWorkflow();
  const { items: invoiceDraftItems } = useInvoiceDraftList();
  const recordState = useMemo(
    () => store?.appointments[appointmentId] ?? {},
    [store?.appointments, appointmentId]
  );
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteMessage, setNoteMessage] = useState<string | null>(null);
  const [followUpMessage, setFollowUpMessage] = useState<string | null>(null);
  const [followUpBooking, setFollowUpBooking] = useState(false);
  const [writesEnabled, setWritesEnabled] = useState(false);

  const record = useMemo(
    () => resolveAppointmentRecord(appointmentId, mapped, { isPreview: demoWeekPreview }),
    [appointmentId, mapped, demoWeekPreview]
  );

  useEffect(() => {
    fetch("/api/cliniko/status")
      .then((r) => r.json())
      .then((json: { writesEnabled?: boolean }) => setWritesEnabled(Boolean(json.writesEnabled)))
      .catch(() => setWritesEnabled(false));
  }, []);

  const scenario = record?.scenario;
  const profile = scenario?.clientProfile;

  const invoiceDraftItem = useMemo(() => {
    if (!scenario?.patientLabel) return undefined;
    const slug = patientLabelToSlug(scenario.patientLabel);
    return invoiceDraftItems.find((item) => item.clientSlug === slug);
  }, [invoiceDraftItems, scenario?.patientLabel]);

  const sourceLabel = record?.isDemoWeekPreview
    ? "Demo week preview"
    : record?.isLiveCliniko
      ? "Cliniko test account"
      : "Demo week preview";

  const intakeInput: BookingIntakeInput | null = profile
    ? (() => {
        const withoutPrefix = profile.patientLabel.replace(/^DEMO\s+/i, "").trim();
        const nameParts = withoutPrefix.split(/\s+/);
        return {
          firstName: `DEMO ${nameParts[0] ?? "Patient"}`,
          lastName: nameParts.slice(1).join(" ") || "Patient",
          email: profile.email,
          phone: profile.phone,
          dateOfBirth: profile.dateOfBirth,
          insuranceProvider: profile.insurer,
          policyNumber: profile.policyNumber,
          claimNumber: profile.claimNumber,
          authorisationNumber: profile.authorisationNumber,
          reasonForVisit: profile.reasonForVisit,
          postcode: profile.address.match(/\b([A-Z]{1,2}\d[\dA-Z]?\s*\d[A-Z]{2})\b/i)?.[1],
          address: profile.address,
          emergencyContact: profile.emergencyContact,
          gpOrReferrer: profile.gpOrReferrer,
          occupationOrActivity: profile.occupationOrSport,
          medicalWarning: profile.medicalWarning,
          marketingSource: profile.marketingSource,
          preferredLocation: profile.preferredLocation,
          preferredPractitioner: profile.preferredPractitioner,
        };
      })()
    : null;

  const linkedPatientId = recordState.linkedPatientId ?? record?.clinikoPatientId ?? undefined;

  const saveNoteToCliniko = useCallback(async () => {
    if (!scenario || !record) return;
    setNoteSaving(true);
    setNoteMessage(null);
    try {
      const res = await fetch("/api/cliniko/treatment-note-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: record.clinikoAppointmentId ?? record.appointmentId,
          clinikoAppointmentId: record.clinikoAppointmentId,
          patientId: linkedPatientId,
          patientLabel: record.patientLabel,
          isLiveCliniko: record.isLiveCliniko,
          isDemoWeekPreview: record.isDemoWeekPreview,
          title: scenario.noteDraft.templateName,
          templateName: scenario.noteDraft.templateName,
          sections: scenario.noteDraft.sections,
        }),
      });
      const json = await res.json();
      void updateAppointmentState(appointmentId, {
        noteSavedToCliniko:
          json.status === "saved" && json.verified !== false && json.mode === "created",
        noteClinikoId: json.noteId,
        lastNoteSaveResult: {
          status: json.status,
          uiLabel: json.uiLabel,
          verified: json.verified,
          linkStatusMessage: json.linkStatusMessage,
          blocked: json.status === "blocked",
        },
      });
      setNoteMessage(json.uiLabel ?? json.message ?? "Prepared for Cliniko — not saved yet");
    } catch {
      setNoteMessage("Prepared for Cliniko — not saved yet");
    } finally {
      setNoteSaving(false);
    }
  }, [scenario, record, linkedPatientId, appointmentId, updateAppointmentState]);

  const copyNoteDraft = useCallback(async () => {
    if (!scenario) return;
    const text = Object.entries(scenario.noteDraft.sections)
      .map(([k, v]) => `${k}\n${v}`)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setNoteMessage("Note draft copied");
  }, [scenario]);

  const prepareInvoice = useCallback(() => {
    void updateAppointmentState(appointmentId, { invoicePrepared: true });
    setFollowUpMessage("Prepared invoice draft — Command Hub demo case");
  }, [appointmentId, updateAppointmentState]);

  const copyInvoice = useCallback(async () => {
    if (!scenario) return;
    const draft = scenario.invoiceDraft;
    const lines = [
      `Patient: ${scenario.patientLabel}`,
      `Amount: £${draft.amount}`,
      draft.insurer ? `Insurer: ${draft.insurer}` : "",
      draft.policyNumber ? `Policy: ${draft.policyNumber}` : "",
      draft.claimNumber ? `Claim: ${draft.claimNumber}` : "",
      draft.authorisationNumber ? `Auth: ${draft.authorisationNumber}` : "",
      draft.suggestedNextStep,
    ].filter(Boolean);
    await navigator.clipboard.writeText(lines.join("\n"));
    setFollowUpMessage("Invoice details copied");
  }, [scenario]);

  const bookFollowUpInCliniko = useCallback(async () => {
    if (!scenario || !linkedPatientId) {
      setFollowUpMessage("Prepared follow-up appointment — not yet booked in Cliniko");
      return;
    }
    setFollowUpBooking(true);
    setFollowUpMessage(null);
    try {
      const res = await fetch("/api/cliniko/create-demo-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: linkedPatientId,
          patientFirstName: intakeInput?.firstName,
          suggestedInDays: scenario.followUpScenario?.suggestedInDays ?? 7,
          durationMinutes: scenario.durationMinutes,
          appointmentTypeName: scenario.appointmentType,
        }),
      });
      const json = await res.json();
      if (json.status === "created" || json.status === "duplicate") {
        void updateAppointmentState(appointmentId, {
          followUpBookedInCliniko: true,
          followUpClinikoAppointmentId: json.appointmentId ?? json.duplicateOf,
        });
        setFollowUpMessage(json.message ?? json.label);
      } else {
        setFollowUpMessage(json.message ?? "Prepared for Cliniko — booking was not created");
      }
    } catch {
      setFollowUpMessage("Prepared for Cliniko — booking was not created");
    } finally {
      setFollowUpBooking(false);
    }
  }, [scenario, linkedPatientId, intakeInput, appointmentId, updateAppointmentState]);

  const completeness = useMemo(() => {
    if (!record) return null;
    return buildAppointmentCompleteness(record, recordState, { writesEnabled });
  }, [record, recordState, writesEnabled]);

  const noteEligibility = useMemo(() => {
    if (!record) return null;
    return getTreatmentNoteEligibility(record, recordState, { writesEnabled, configured });
  }, [record, recordState, writesEnabled, configured]);

  if (!record) {
    return (
      <div className="rounded-xl border border-cream-dark bg-white p-6">
        <p className="font-semibold text-navy">Appointment not found</p>
        <Link href="/admin/bookings" className="mt-3 inline-block text-green hover:underline">
          Back to bookings
        </Link>
      </div>
    );
  }

  const noteStatusLabel = recordState.noteSavedToCliniko
    ? "Saved to Cliniko test account"
    : scenario?.noteDraft.status === "prepared-for-cliniko"
      ? "Prepared for Cliniko"
      : "Suggested by Command Hub";

  const matchStatusLabel = recordState.linkedPatientId
    ? "Linked to Cliniko patient record"
    : record.isDemoWeekPreview
      ? "Demo week preview — not linked to Cliniko unless seeded"
      : record.isLiveCliniko
        ? "Linked to Cliniko test account"
        : "No match — create new DEMO patient";

  return (
    <div className="space-y-6">
      <p className="sr-only">
        Appointment record · Treatment note · Patient/appointment link status · Blocked for safety
        · Saved to Cliniko test account · Prepared for Cliniko · Record completeness
      </p>

      <header className="rounded-xl border border-cream-dark bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">{record.patientLabel}</h1>
            <p className="mt-1 text-lg font-medium text-navy">{record.appointmentType}</p>
            <p className="mt-1 text-sm text-slate">
              {formatDay(record.date)} · {record.time}–{record.endTime}
            </p>
          </div>
          <DataSourcePill
            kind={record.isDemoWeekPreview ? "demo" : "cliniko-test"}
            label={sourceLabel}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/bookings"
            className="min-h-9 rounded-lg border border-cream-dark px-3 py-1.5 text-sm font-medium text-navy hover:bg-cream"
          >
            Back to bookings
          </Link>
          <OpenClientButton patientLabel={record.patientLabel} variant="secondary" />
        </div>
      </header>

      <WhatThisShows>
        Review this appointment&apos;s client journey, confirm the Cliniko patient match, prepare
        notes and invoice drafts, and see what is saved vs prepared only.
      </WhatThisShows>

      {profile && (
        <section className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="text-lg font-bold text-navy">Client record</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate">Name</dt><dd className="font-medium text-navy">{profile.patientLabel}</dd></div>
            <div><dt className="text-slate">DOB</dt><dd>{profile.dateOfBirth}</dd></div>
            <div><dt className="text-slate">Email</dt><dd>{profile.email}</dd></div>
            <div><dt className="text-slate">Phone</dt><dd>{profile.phone}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate">Address</dt><dd>{profile.address}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate">Emergency contact</dt><dd>{profile.emergencyContact}</dd></div>
            <div><dt className="text-slate">GP / referral</dt><dd>{profile.gpOrReferrer}</dd></div>
            <div><dt className="text-slate">Occupation / activity</dt><dd>{profile.occupationOrSport}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate">Reason for visit</dt><dd>{profile.reasonForVisit}</dd></div>
            {profile.medicalWarning && (
              <div className="sm:col-span-2"><dt className="text-slate">Medical flags</dt><dd>{profile.medicalWarning}</dd></div>
            )}
            {profile.insurer && (
              <>
                <div><dt className="text-slate">Insurer</dt><dd>{profile.insurer}</dd></div>
                <div><dt className="text-slate">Policy number</dt><dd>{profile.policyNumber ?? "—"}</dd></div>
                <div><dt className="text-slate">Claim number</dt><dd>{profile.claimNumber ?? "—"}</dd></div>
                <div><dt className="text-slate">Authorisation</dt><dd>{profile.authorisationNumber ?? "—"}</dd></div>
              </>
            )}
          </dl>
        </section>
      )}

      <section className="rounded-xl border border-cream-dark bg-white p-5">
        <h2 className="text-lg font-bold text-navy">Cliniko record status</h2>
        <p className="mt-1 text-sm text-slate">Patient match status: {matchStatusLabel}</p>
        <ul className="mt-3 space-y-2 text-sm">
          <li>Appointment: {record.isLiveCliniko ? "Saved to Cliniko test account" : "Prepared for Cliniko"}</li>
          <li>Treatment note: {noteStatusLabel}</li>
          <li>Follow-up: {scenario?.followUpScenario?.bookedInCliniko ? "Saved to Cliniko test account" : "Suggested by Command Hub"}</li>
          <li>Invoice: {recordState.invoicePrepared ? "Command Hub demo case" : "Prepared for Cliniko"}</li>
          <li>Payment: Future integration</li>
          {scenario?.insuranceScenario && (
            <li>Insurance: {scenario.insuranceScenario}</li>
          )}
        </ul>
        {record.clinikoAppointmentId && (
          <p className="mt-2 text-xs text-slate">Cliniko record ID available in test account</p>
        )}
      </section>

      <section className="rounded-xl border border-cream-dark bg-white p-5">
        <h2 className="text-lg font-bold text-navy">Patient details</h2>
        <p className="sr-only">Patient details · Review patient details</p>
        <ul className="mt-3 space-y-1 text-sm text-navy">
          <li>
            Matched to Cliniko:{" "}
            {recordState.linkedPatientId ? "Yes — patient linked" : "Not yet linked"}
          </li>
          <li>
            Fields already saved:{" "}
            {recordState.linkedPatientId
              ? "Core DEMO patient fields when seeded/linked"
              : "None — preview only"}
          </li>
          <li>
            Fields prepared-only: Insurance (Command Hub demo case — not Cliniko-saved unless custom
            fields configured), preferred location/practitioner
          </li>
          <li>
            Fields needing review:{" "}
            {record.isDemoWeekPreview && !recordState.linkedPatientId
              ? "Link patient via intake first"
              : "Compare intake vs Cliniko on intake page"}
          </li>
        </ul>
        <p className="mt-3 text-sm text-slate">
          {record.isDemoWeekPreview && !recordState.linkedPatientId
            ? "Demo week preview — patient fields are prepared only until seeded or linked."
            : recordState.linkedPatientId
              ? "Patient record linked to Cliniko test account."
              : "Patient record not yet linked."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/intake"
            className="min-h-9 rounded-lg border border-cream-dark px-3 py-1.5 text-sm font-medium text-navy hover:bg-cream"
          >
            Review patient details
          </Link>
          <Link
            href={`/admin/clients/${patientLabelToSlug(record.patientLabel)}`}
            className="min-h-9 rounded-lg border border-cream-dark px-3 py-1.5 text-sm font-medium text-navy hover:bg-cream"
          >
            Open client record
          </Link>
        </div>
      </section>

      {completeness && <RecordCompletenessPanel summary={completeness} />}

      {intakeInput && !recordState.linkedPatientId && record.isDemoWeekPreview && (
        <PatientMatchPanel
          intake={intakeInput}
          appointmentId={appointmentId}
          onLinked={(patientId, label) => {
            void updateAppointmentState(appointmentId, {
              linkedPatientId: patientId,
              linkedPatientLabel: label,
              matchStatus: "Linked to Cliniko patient record",
            });
          }}
        />
      )}

      {scenario && (
        <>
          <section id="treatment-note" className="rounded-xl border border-cream-dark bg-white p-5">
            <h2 className="text-lg font-bold text-navy">Treatment note</h2>
            <p className="mt-1 text-sm text-slate">{DEMO_NOTE_SAFETY_COPY.join(" ")}</p>

            <dl className="mt-4 grid gap-2 rounded-lg bg-cream/40 p-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate">Note status</dt>
                <dd className="font-medium text-navy">
                  {recordState.lastNoteSaveResult?.uiLabel ??
                    (recordState.noteSavedToCliniko
                      ? "Saved to Cliniko test account"
                      : "Prepared for Cliniko")}
                </dd>
              </div>
              <div>
                <dt className="text-slate">Patient/appointment link status</dt>
                <dd className="font-medium text-navy">
                  {recordState.lastNoteSaveResult?.linkStatusMessage ??
                    noteEligibility?.linkStatus ??
                    "Not verified"}
                </dd>
              </div>
              <div>
                <dt className="text-slate">Can save to Cliniko?</dt>
                <dd className="font-medium text-navy">{noteEligibility?.canSave ? "Yes" : "No"}</dd>
              </div>
              {noteEligibility?.reason && (
                <div className="sm:col-span-2">
                  <dt className="text-slate">Reason if not</dt>
                  <dd className="text-navy">{noteEligibility.reason}</dd>
                </div>
              )}
            </dl>

            <p className="mt-2 text-sm font-medium text-navy">{scenario.noteDraft.templateName}</p>
            <dl className="mt-4 space-y-3 text-sm">
              {Object.entries(scenario.noteDraft.sections).map(([key, value]) => (
                <div key={key}>
                  <dt className="font-medium text-navy">{key}</dt>
                  <dd className="text-slate">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => setNoteMessage("Prepared for Cliniko")} className="min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-navy hover:bg-cream">
                Prepare note
              </button>
              <button
                type="button"
                disabled={noteSaving || !noteEligibility?.canSave}
                onClick={() => void saveNoteToCliniko()}
                className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light disabled:opacity-50"
              >
                {noteSaving ? "Saving…" : "Save DEMO note to Cliniko test account"}
              </button>
              <button type="button" onClick={() => void copyNoteDraft()} className="min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-navy hover:bg-cream">
                Copy note draft
              </button>
            </div>
            {noteMessage && <p className="mt-2 text-sm text-navy">{noteMessage}</p>}
            {recordState.lastNoteSaveResult?.verified && (
              <p className="mt-1 text-sm text-green">Saved and verified in Cliniko test account</p>
            )}
          </section>

          <section id="follow-up" className="rounded-xl border border-cream-dark bg-white p-5">
            <h2 className="text-lg font-bold text-navy">Follow-up</h2>
            {scenario.followUpScenario ? (
              <>
                <p className="text-sm text-navy">{scenario.followUpScenario.summary}</p>
                <p className="mt-1 text-sm text-slate">
                  {recordState.followUpBookedInCliniko || scenario.followUpScenario.bookedInCliniko
                    ? "Saved to Cliniko test account"
                    : "Prepared follow-up appointment — not yet booked in Cliniko"}
                </p>
                {scenario.followUpScenario.checkInMessage && (
                  <blockquote className="mt-3 rounded-lg bg-cream p-3 text-sm italic text-navy">
                    {scenario.followUpScenario.checkInMessage}
                  </blockquote>
                )}
              </>
            ) : (
              <p className="text-sm text-slate">No follow-up suggested for this scenario.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={
                  followUpBooking ||
                  !writesEnabled ||
                  !linkedPatientId ||
                  recordState.followUpBookedInCliniko
                }
                onClick={() => void bookFollowUpInCliniko()}
                className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light disabled:opacity-50"
              >
                {followUpBooking
                  ? "Booking…"
                  : "Book DEMO follow-up in Cliniko test account"}
              </button>
              <button type="button" onClick={() => {
                void updateAppointmentState(appointmentId, { followUpPrepared: true });
                setFollowUpMessage("Prepared follow-up appointment — Prepared for Cliniko");
              }} className="min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-navy hover:bg-cream">
                Prepare follow-up
              </button>
              <button type="button" onClick={() => void navigator.clipboard.writeText(scenario.followUpScenario?.checkInMessage ?? scenario.followUpScenario?.summary ?? "")} className="min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-navy hover:bg-cream">
                Copy follow-up message
              </button>
            </div>
            {!linkedPatientId && (
              <p className="mt-2 text-xs text-amber-800">
                Link a DEMO patient before booking a follow-up in Cliniko.
              </p>
            )}
            {!writesEnabled && (
              <p className="mt-2 text-xs text-slate">
                Cliniko writes disabled — follow-up remains prepared only.
              </p>
            )}
            {followUpMessage && <p className="mt-2 text-sm text-navy">{followUpMessage}</p>}
          </section>

          <section id="invoice-payment" className="rounded-xl border border-cream-dark bg-white p-5">
            <h2 className="text-lg font-bold text-navy">Invoice / payment</h2>
            <p className="sr-only">Open invoice draft · Prepared invoice draft</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-slate">Expected fee</dt><dd>£{scenario.expectedFee}</dd></div>
              <div><dt className="text-slate">Payment status</dt><dd>Future integration — payment check suggested</dd></div>
              <div><dt className="text-slate">Invoice readiness</dt><dd>{scenario.invoiceDraft.suggestedNextStep}</dd></div>
            </dl>
            {scenario.invoiceDraft.insurer && (
              <div className="mt-4 rounded-lg bg-cream/50 p-4 text-sm">
                <p className="font-semibold text-navy">Insurance invoice draft</p>
                <p>Insurer: {scenario.invoiceDraft.insurer}</p>
                <p>Policy: {scenario.invoiceDraft.policyNumber ?? "—"}</p>
                <p>Claim: {scenario.invoiceDraft.claimNumber ?? "—"}</p>
                <p>Auth: {scenario.invoiceDraft.authorisationNumber ?? "—"}</p>
                <p>Approved: {scenario.invoiceDraft.approvedSessions ?? "—"} · Used: {scenario.invoiceDraft.sessionsUsed ?? "—"}</p>
                <p>Sessions to invoice: {scenario.invoiceDraft.sessionsToInvoice ?? "—"}</p>
                <p>Patient liability agreement: {profile?.liabilityAccepted ? "Yes" : "Needs confirmation"}</p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={prepareInvoice} className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light">
                Prepare invoice draft
              </button>
              <button type="button" onClick={() => void copyInvoice()} className="min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-navy hover:bg-cream">
                Copy invoice details
              </button>
              {invoiceDraftItem ? (
                <Link
                  href={invoiceDraftDetailPath(invoiceDraftItem.id)}
                  className="min-h-10 inline-flex items-center rounded-lg border border-green/40 bg-green-muted/30 px-4 py-2 text-sm font-medium text-navy hover:bg-cream"
                >
                  Open invoice draft
                </Link>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-slate">
              {recordState.invoicePrepared
                ? "Prepared invoice draft — not sent"
                : "Prepared for Cliniko — use Open invoice draft for insurance export pack"}
              {" · "}Future Xero integration · Future Healthcode integration
            </p>
            {followUpMessage && <p className="mt-2 text-sm text-navy">{followUpMessage}</p>}
          </section>

          {scenario.stockScenario && scenario.stockScenario.length > 0 && (
            <section className="rounded-xl border border-cream-dark bg-white p-5">
              <h2 className="text-lg font-bold text-navy">Stock / treatment impact</h2>
              <p className="text-sm text-slate">{scenario.stockScenario.join(", ")}</p>
            </section>
          )}
        </>
      )}

      <section className="rounded-xl border border-cream-dark bg-cream/30 p-5 text-sm text-slate">
        <h2 className="font-semibold text-navy">Source summary</h2>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>This appointment came from the {sourceLabel.toLowerCase()}.</li>
          <li>The treatment note is prepared by Command Hub{recordState.noteSavedToCliniko ? " and saved to Cliniko." : "."}</li>
          <li>The invoice is a demo draft and has not been sent.</li>
          <li>Payment status is not connected yet.</li>
        </ul>
      </section>
    </div>
  );
}
