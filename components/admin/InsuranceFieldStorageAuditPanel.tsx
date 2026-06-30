"use client";

import Link from "next/link";
import {
  INSURANCE_FIELD_AUDIT,
  insuranceStorageLabel,
} from "@/lib/cliniko-insurance-field-audit";

export function InsuranceFieldStorageAuditPanel() {
  return (
    <section className="rounded-xl border border-cream-dark bg-white p-5">
      <h2 className="text-lg font-bold text-navy">Insurance field storage audit</h2>
      <p className="mt-1 text-sm text-slate">
        Where each insurance field is stored today — Cliniko test account vs Command Hub demo case
        vs future integration.
      </p>
      <p className="sr-only">Insurance field storage audit</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-cream-dark text-slate">
              <th className="py-2 pr-3 font-medium">Field</th>
              <th className="py-2 pr-3 font-medium">Storage</th>
              <th className="py-2 pr-3 font-medium">Cliniko write</th>
              <th className="py-2 font-medium">Next step</th>
            </tr>
          </thead>
          <tbody>
            {INSURANCE_FIELD_AUDIT.map((field) => (
              <tr key={field.fieldName} className="border-b border-cream-dark/60 last:border-0">
                <td className="py-2 pr-3 font-medium text-navy">{field.displayLabel}</td>
                <td className="py-2 pr-3 text-slate">{insuranceStorageLabel(field.currentStorage)}</td>
                <td className="py-2 pr-3 text-slate">
                  {field.canWriteToClinikoNow ? "Yes" : "No"}
                </td>
                <td className="py-2 text-slate">{field.recommendedNextStep}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link
        href="/admin/insurance"
        className="mt-4 inline-block text-sm font-medium text-green hover:underline"
      >
        Open Insurance page →
      </Link>
    </section>
  );
}
