"use client";

import Link from "next/link";
import {
  CLINIKO_PATIENT_FIELD_MAP,
  getPreparedOnlyPatientFields,
  getWritablePatientFields,
} from "@/lib/cliniko-patient-field-map";

export function PatientUpdateSafetyProofPanel() {
  const writable = getWritablePatientFields();
  const preparedOnly = getPreparedOnlyPatientFields();

  return (
    <section className="rounded-xl border border-cream-dark bg-white p-5">
      <h2 className="text-lg font-bold text-navy">Patient update safety proof</h2>
      <p className="mt-1 text-sm text-slate">
        Server-side checks for DEMO patient field updates — staff confirmation required, selected
        fields only, read-back verification after PATCH.
      </p>
      <p className="sr-only">
        Patient update safety proof · staff confirmation · read-back verification
      </p>

      <ul className="mt-4 list-inside list-disc text-sm text-navy">
        <li>Update requires DEMO-prefixed patient (read-back before PATCH)</li>
        <li>staff confirmation required on every update request</li>
        <li>Only selected fields are sent — no automatic overwrite</li>
        <li>Non-DEMO patient update blocked server-side</li>
        <li>Demo week preview IDs blocked until numeric Cliniko ID linked</li>
        <li>read-back verification after PATCH via GET /patients/&#123;id&#125;</li>
      </ul>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-green">Supported writable fields (PATCH)</h3>
          <ul className="mt-2 space-y-1 text-sm text-navy">
            {writable.map((f) => (
              <li key={f.fieldName}>
                {f.displayLabel}{" "}
                <span className="text-xs text-slate">({f.clinikoField})</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-navy">Prepared-only (not PATCHed)</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate">
            {preparedOnly.map((f) => (
              <li key={f.fieldName}>
                <span className="font-medium text-navy">{f.displayLabel}</span>
                <span className="block text-xs">{f.preparedOnlyReason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Link
        href="/admin/intake"
        className="mt-4 inline-block text-sm font-medium text-green hover:underline"
      >
        Open booking intake →
      </Link>

      <p className="mt-3 text-xs text-slate">
        Field map: {CLINIKO_PATIENT_FIELD_MAP.length} fields · API: POST
        /api/cliniko/update-demo-patient-intake
      </p>
    </section>
  );
}
