"use client";

import Link from "next/link";
import {
  CLINIKO_PATIENT_FIELD_MAP,
  getPreparedOnlyPatientFields,
  getWritablePatientFields,
} from "@/lib/cliniko-patient-field-map";

export function PatientRecordWriteProofPanel() {
  const writable = getWritablePatientFields();
  const preparedOnly = getPreparedOnlyPatientFields();

  return (
    <section className="mt-8 rounded-xl border border-cream-dark bg-white p-5">
      <h2 className="text-lg font-bold text-navy">Patient record write proof</h2>
      <p className="mt-1 text-sm text-slate">
        Technical summary of which patient fields this integration writes to Cliniko vs prepares
        only. Normal clinic pages use plain-English labels.
      </p>
      <p className="sr-only">Patient record write proof</p>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-green">Written to Cliniko on create</h3>
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
          <h3 className="text-sm font-semibold text-navy">Prepared only</h3>
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

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href="/admin/intake" className="font-medium text-green hover:underline">
          Open booking intake →
        </Link>
        <Link
          href="/admin/appointments/dcw-001"
          className="font-medium text-green hover:underline"
        >
          Open DEMO appointment record →
        </Link>
      </div>

      <p className="mt-3 text-xs text-slate">
        Field map: {CLINIKO_PATIENT_FIELD_MAP.length} fields audited · last create/read-back results
        appear on the intake page after patient creation.
      </p>
    </section>
  );
}
