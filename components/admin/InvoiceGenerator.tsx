"use client";

import { useState } from "react";
import { CalloutBox } from "./AdminUI";

interface InvoiceDraft {
  payer: string;
  sessionDates: string;
  authorisation: string;
  treatmentType: string;
  amount: string;
  mileage: string;
  notes: string;
}

const emptyDraft: InvoiceDraft = {
  payer: "",
  sessionDates: "",
  authorisation: "",
  treatmentType: "",
  amount: "",
  mileage: "",
  notes: "",
};

export function InvoiceGenerator() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<InvoiceDraft>(emptyDraft);
  const [preview, setPreview] = useState<string | null>(null);

  function handleGenerate() {
    const ref = `TE-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(4, "0")}`;
    setPreview(
      `INVOICE DRAFT — ${ref}\n\n` +
        `Payer: ${draft.payer || "—"}\n` +
        `Session date(s): ${draft.sessionDates || "—"}\n` +
        `Authorisation/claim: ${draft.authorisation || "—"}\n` +
        `Treatment: ${draft.treatmentType || "—"}\n` +
        `Amount: £${draft.amount || "0.00"}\n` +
        (draft.mileage ? `Mileage: ${draft.mileage} miles\n` : "") +
        `\nNotes:\n${draft.notes || "—"}\n\n` +
        `Status: DRAFT — not sent. Review in Cliniko before submission.`
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-light"
      >
        Generate invoice draft
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-cream-dark bg-white p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-semibold text-navy">Invoice generator (demo)</h3>
        <button
          type="button"
          onClick={() => { setOpen(false); setPreview(null); }}
          className="text-sm text-slate hover:text-navy"
        >
          Close
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {(
          [
            ["payer", "Payer (client / insurer / external)"],
            ["sessionDates", "Appointment / session dates"],
            ["authorisation", "Authorisation / claim number"],
            ["treatmentType", "Treatment type"],
            ["amount", "Amount (£)"],
            ["mileage", "Mileage (if external)"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-navy">{label}</label>
            <input
              value={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              className="mt-1 w-full min-h-10 rounded-lg border border-cream-dark px-3 text-sm"
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-navy">Notes</label>
          <textarea
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border border-cream-dark px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        className="mt-4 min-h-10 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
      >
        Generate draft preview
      </button>

      {preview && (
        <div className="mt-4">
          <CalloutBox title="Invoice draft preview" variant="info">
            <pre className="whitespace-pre-wrap font-mono text-xs">{preview}</pre>
          </CalloutBox>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white">
              Copy invoice text
            </button>
            <button type="button" className="min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-slate">
              Mark submitted (demo)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
