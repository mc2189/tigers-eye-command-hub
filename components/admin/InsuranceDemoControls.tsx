"use client";

import { useState } from "react";
import type { InsuranceProvider } from "@/lib/insurance-session-workflow";
import {
  getDemoPatientOptions,
  isDemoPatientLabel,
  resetDemoInsuranceCases,
  saveDemoInsuranceCase,
  type DemoInsuranceCaseDetail,
} from "@/lib/demo-insurance-cases";

const INSURERS: InsuranceProvider[] = [
  "Aviva",
  "Vitality",
  "Bupa",
  "AXA",
  "WPA",
  "Other",
  "Unknown",
];

interface InsuranceDemoControlsProps {
  patientLabels: string[];
  onSaved: () => void;
}

export function InsuranceDemoControls({ patientLabels, onSaved }: InsuranceDemoControlsProps) {
  const options = getDemoPatientOptions(patientLabels);
  const [patientLabel, setPatientLabel] = useState(options[0] ?? "DEMO Test Patient 001");
  const [insurer, setInsurer] = useState<InsuranceProvider>("Aviva");
  const [claimNumber, setClaimNumber] = useState("DEMO-CLAIM-001");
  const [authorisationNumber, setAuthorisationNumber] = useState("DEMO-AUTH-001");
  const [approvedSessions, setApprovedSessions] = useState("6");
  const [liabilityAccepted, setLiabilityAccepted] = useState(true);
  const [invoiceStatus, setInvoiceStatus] = useState<DemoInsuranceCaseDetail["invoiceStatus"]>(
    "ready-to-invoice"
  );
  const [message, setMessage] = useState<string | null>(null);

  function handleSave() {
    if (!isDemoPatientLabel(patientLabel)) {
      setMessage("Only DEMO patient labels are allowed.");
      return;
    }
    const detail: DemoInsuranceCaseDetail = {
      patientLabel,
      insurer,
      claimNumber: claimNumber.trim() || undefined,
      authorisationNumber: authorisationNumber.trim() || undefined,
      approvedSessions: approvedSessions ? Number(approvedSessions) : undefined,
      liabilityAccepted,
      invoiceStatus,
    };
    saveDemoInsuranceCase(detail);
    setMessage("Demo case detail saved in browser only.");
    onSaved();
  }

  function handleReset() {
    resetDemoInsuranceCases();
    setMessage("Demo case details reset.");
    onSaved();
  }

  return (
    <details className="mb-8 rounded-xl border border-cream-dark bg-cream/30">
      <summary className="cursor-pointer px-4 py-3 font-semibold text-navy">
        Demo case controls
      </summary>
      <div className="border-t border-cream-dark px-4 py-4">
        <p className="text-sm text-slate">
          Demo-only browser state. This does not write to Cliniko and must not be used for real
          patient data.
        </p>
        <p className="sr-only">Demo case controls</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm">
            <span className="text-slate">DEMO patient</span>
            <select
              value={patientLabel}
              onChange={(e) => setPatientLabel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-cream-dark px-3 py-2"
            >
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate">Insurer</span>
            <select
              value={insurer}
              onChange={(e) => setInsurer(e.target.value as InsuranceProvider)}
              className="mt-1 w-full rounded-lg border border-cream-dark px-3 py-2"
            >
              {INSURERS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate">Claim number</span>
            <input
              value={claimNumber}
              onChange={(e) => setClaimNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-cream-dark px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate">Authorisation number</span>
            <input
              value={authorisationNumber}
              onChange={(e) => setAuthorisationNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-cream-dark px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate">Approved sessions</span>
            <input
              type="number"
              min={0}
              value={approvedSessions}
              onChange={(e) => setApprovedSessions(e.target.value)}
              className="mt-1 w-full rounded-lg border border-cream-dark px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate">Invoice status</span>
            <select
              value={invoiceStatus}
              onChange={(e) =>
                setInvoiceStatus(e.target.value as DemoInsuranceCaseDetail["invoiceStatus"])
              }
              className="mt-1 w-full rounded-lg border border-cream-dark px-3 py-2"
            >
              <option value="not-ready">Not ready</option>
              <option value="ready-to-invoice">Ready to invoice</option>
              <option value="part-invoiced">Part invoiced</option>
              <option value="invoiced">Invoiced</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={liabilityAccepted}
              onChange={(e) => setLiabilityAccepted(e.target.checked)}
            />
            Liability accepted
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light"
          >
            Save demo case detail
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-navy hover:bg-cream"
          >
            Reset demo case details
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-slate">{message}</p>}
      </div>
    </details>
  );
}
