"use client";

import Link from "next/link";
import { TREATMENT_NOTE_SAFETY_CHECKS } from "@/lib/treatment-note-safety-checks";

interface TreatmentNoteSafetyProofPanelProps {
  writesEnabled?: boolean;
}

export function TreatmentNoteSafetyProofPanel({
  writesEnabled = false,
}: TreatmentNoteSafetyProofPanelProps) {
  return (
    <section className="rounded-xl border border-cream-dark bg-white p-5">
      <h2 className="text-lg font-bold text-navy">Treatment note safety proof</h2>
      <p className="mt-1 text-sm text-slate">
        Server-side checks enforced before any DEMO treatment note is written to Cliniko.
      </p>
      <p className="sr-only">Treatment note safety proof</p>

      <ul className="mt-4 list-inside list-disc text-sm text-navy">
        {TREATMENT_NOTE_SAFETY_CHECKS.map((check) => (
          <li key={check}>{check}</li>
        ))}
      </ul>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate">Writes enabled</dt>
          <dd className="font-medium text-navy">{writesEnabled ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-slate">DEMO validation</dt>
          <dd className="font-medium text-green">Enforced server-side</dd>
        </div>
      </dl>

      <Link
        href="/admin/appointments/dcw-001#treatment-note"
        className="mt-4 inline-block text-sm font-medium text-green hover:underline"
      >
        Open DEMO appointment record →
      </Link>
    </section>
  );
}
