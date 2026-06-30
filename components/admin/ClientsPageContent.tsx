"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCommandHubAppointments } from "@/components/admin/CommandHubAppointmentsProvider";
import { useInsuranceSessionCases } from "@/components/admin/useInsuranceSessionCases";
import { WhatThisShows } from "@/components/admin/WhatThisShows";
import { DataSourcePill } from "@/components/admin/DataSourcePill";
import { OpenClientButton, OpenRecordButton } from "@/components/admin/OpenRecordButton";
import { buildClientJourneys, getClientJourneySummary } from "@/lib/demo-client-journey";
import { DEMO_CLINIC_WEEK_SCENARIOS } from "@/lib/demo-clinic-week";

export function ClientsPageContent() {
  const { demoWeekPreview, isLive, mapped } = useCommandHubAppointments();
  const { enrichedBundles } = useInsuranceSessionCases();

  const dataSource = demoWeekPreview
    ? "Demo week preview"
    : isLive
      ? "Cliniko test account"
      : "Demo week preview";

  const journeys = useMemo(
    () => buildClientJourneys(dataSource as "Demo week preview" | "Cliniko test account"),
    [dataSource]
  );

  const bundleByPatient = useMemo(() => {
    const map = new Map<string, (typeof enrichedBundles)[0]>();
    for (const b of enrichedBundles) {
      map.set(b.patientLabel, b);
    }
    return map;
  }, [enrichedBundles]);

  return (
    <>
      <WhatThisShows>
        This page shows each DEMO client&apos;s journey: appointment, notes, follow-up,
        invoice/payment status and next action.
      </WhatThisShows>

      <p className="sr-only">Client journeys · Notes status · Invoice status · Follow-up status</p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <DataSourcePill
          kind={demoWeekPreview ? "demo" : "cliniko-test"}
          label={dataSource}
        />
        <span className="text-sm text-slate">{journeys.length} DEMO clients</span>
      </div>

      <ul className="space-y-4">
        {journeys.map((journey) => {
          const bundle = bundleByPatient.get(journey.patientLabel);
          const scenario = DEMO_CLINIC_WEEK_SCENARIOS.find(
            (s) => s.patientLabel === journey.patientLabel
          );
          return (
            <li
              key={journey.patientLabel}
              className="rounded-xl border border-cream-dark bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-navy">{journey.patientLabel}</h2>
                  <p className="mt-1 text-sm text-slate">{journey.reasonForVisit}</p>
                </div>
                <DataSourcePill kind="demo" label={journey.dataSource} />
              </div>

              {journey.currentAppointment && (
                <p className="mt-3 text-sm text-navy">
                  <span className="font-medium">Current appointment:</span>{" "}
                  {journey.currentAppointment.type} · {journey.currentAppointment.date}{" "}
                  {journey.currentAppointment.time}
                </p>
              )}

              <p className="mt-2 text-sm text-slate">
                <span className="font-medium text-navy">Treatment journey:</span>{" "}
                {journey.treatmentPlan}
              </p>

              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate">Notes status</dt>
                  <dd className="font-medium text-navy">
                    {journey.notesStatus} ({journey.noteRecordStatus})
                  </dd>
                </div>
                <div>
                  <dt className="text-slate">Follow-up status</dt>
                  <dd className="font-medium text-navy">
                    {journey.followUpStatus} ({journey.followUpRecordStatus})
                  </dd>
                </div>
                <div>
                  <dt className="text-slate">Payment</dt>
                  <dd className="font-medium text-navy">{journey.paymentStatus}</dd>
                </div>
                <div>
                  <dt className="text-slate">Invoice status</dt>
                  <dd className="font-medium text-navy">
                    {journey.invoiceStatus} ({journey.invoiceRecordStatus})
                  </dd>
                </div>
                {journey.insuranceStatus && (
                  <div className="sm:col-span-2">
                    <dt className="text-slate">Insurance</dt>
                    <dd className="font-medium text-navy">{journey.insuranceStatus}</dd>
                  </div>
                )}
              </dl>

              {journey.stockImpact.length > 0 && (
                <p className="mt-2 text-sm text-slate">
                  Stock: {journey.stockImpact.join(", ")}
                </p>
              )}

              <p className="mt-3 text-sm font-medium text-green">
                Next action: {bundle?.primaryAction?.label ?? journey.nextAction}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <OpenClientButton patientLabel={journey.patientLabel} variant="secondary" />
                {scenario && (
                  <OpenRecordButton appointmentId={scenario.id} variant="secondary" label="Review appointment" />
                )}
              </div>

              <Link
                href="/admin/bookings"
                className="mt-2 inline-block text-sm font-medium text-green hover:underline"
              >
                View in bookings →
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
