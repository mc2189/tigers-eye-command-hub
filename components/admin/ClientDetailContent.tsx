"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCommandHubAppointments } from "@/components/admin/CommandHubAppointmentsProvider";
import { DataSourcePill } from "@/components/admin/DataSourcePill";
import { OpenRecordButton } from "@/components/admin/OpenRecordButton";
import { WhatThisShows } from "@/components/admin/WhatThisShows";
import {
  findScenarioBySlug,
  getScenariosForPatient,
  patientLabelToSlug,
} from "@/lib/appointment-records";
import { buildClientJourneys } from "@/lib/demo-client-journey";
import { DEMO_CLINIC_WEEK_SCENARIOS } from "@/lib/demo-clinic-week";

interface ClientDetailContentProps {
  clientSlug: string;
}

export function ClientDetailContent({ clientSlug }: ClientDetailContentProps) {
  const { demoWeekPreview, isLive } = useCommandHubAppointments();

  const scenario = findScenarioBySlug(clientSlug);
  const patientLabel =
    scenario?.patientLabel ??
    DEMO_CLINIC_WEEK_SCENARIOS.find(
      (s) => patientLabelToSlug(s.patientLabel) === clientSlug
    )?.patientLabel;

  const dataSource = demoWeekPreview
    ? "Demo week preview"
    : isLive
      ? "Cliniko test account"
      : "Demo week preview";

  const journey = useMemo(() => {
    if (!patientLabel) return null;
    return buildClientJourneys(dataSource as "Demo week preview" | "Cliniko test account").find(
      (j) => j.patientLabel === patientLabel
    );
  }, [patientLabel, dataSource]);

  const appointments = patientLabel ? getScenariosForPatient(patientLabel) : [];

  if (!patientLabel || !journey) {
    return (
      <div className="rounded-xl border border-cream-dark bg-white p-6">
        <p className="font-semibold text-navy">Client not found</p>
        <Link href="/admin/clients" className="mt-3 inline-block text-green hover:underline">
          Back to clients
        </Link>
      </div>
    );
  }

  const profile = scenario?.clientProfile ?? appointments[0]?.clientProfile;

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-cream-dark bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">{patientLabel}</h1>
            <p className="mt-1 text-sm text-slate">{journey.reasonForVisit}</p>
          </div>
          <DataSourcePill kind={demoWeekPreview ? "demo" : "cliniko-test"} label={dataSource} />
        </div>
        <Link href="/admin/clients" className="mt-3 inline-block text-sm text-green hover:underline">
          ← All clients
        </Link>
      </header>

      <WhatThisShows>
        Full DEMO client journey — profile, appointments, notes, follow-up, payment and insurance
        status, with clear labels for what is saved to Cliniko vs prepared only.
      </WhatThisShows>

      {profile && (
        <section className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="text-lg font-bold text-navy">Client profile</h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-slate">Email</dt><dd>{profile.email}</dd></div>
            <div><dt className="text-slate">Phone</dt><dd>{profile.phone}</dd></div>
            <div><dt className="text-slate">DOB</dt><dd>{profile.dateOfBirth}</dd></div>
            <div><dt className="text-slate">Preferred location</dt><dd>{profile.preferredLocation}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate">Treatment plan</dt><dd>{journey.treatmentPlan}</dd></div>
          </dl>
        </section>
      )}

      <section className="rounded-xl border border-cream-dark bg-white p-5">
        <h2 className="text-lg font-bold text-navy">Appointments in demo week</h2>
        <ul className="mt-3 space-y-3">
          {appointments.map((appt) => (
            <li key={appt.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cream-dark p-4">
              <div>
                <p className="font-medium text-navy">{appt.appointmentType}</p>
                <p className="text-sm text-slate">{appt.time} · {appt.preferredPractitioner}</p>
              </div>
              <OpenRecordButton appointmentId={appt.id} variant="secondary" />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-cream-dark bg-white p-5">
        <h2 className="text-lg font-bold text-navy">Record status</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-slate">Notes status</dt><dd>{journey.notesStatus} ({journey.noteRecordStatus})</dd></div>
          <div><dt className="text-slate">Follow-up status</dt><dd>{journey.followUpStatus} ({journey.followUpRecordStatus})</dd></div>
          <div><dt className="text-slate">Invoice status</dt><dd>{journey.invoiceRecordStatus}</dd></div>
          <div><dt className="text-slate">Payment</dt><dd>{journey.paymentStatus}</dd></div>
          {journey.insuranceStatus && (
            <div className="sm:col-span-2"><dt className="text-slate">Insurance</dt><dd>{journey.insuranceStatus}</dd></div>
          )}
        </dl>
      </section>

      <section className="rounded-xl border border-cream-dark bg-cream/30 p-5 text-sm">
        <h2 className="font-semibold text-navy">What is saved vs prepared</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-slate">
          <li>Saved to Cliniko test account: patient/appointment when seeded via test lab</li>
          <li>Prepared for Cliniko: treatment notes, invoice drafts, follow-up suggestions</li>
          <li>Demo-only browser state: invoice prepared flags, match links</li>
          <li>Future integration: payment status, Xero, Healthcode</li>
        </ul>
        <p className="mt-3 font-medium text-navy">Next action: {journey.nextAction}</p>
      </section>
    </div>
  );
}
