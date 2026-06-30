"use client";

import { useState } from "react";
import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { InvoiceGenerator } from "@/components/admin/InvoiceGenerator";
import { ClinikoInvoiceQueuePanel } from "@/components/admin/ClinikoInvoiceQueuePanel";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { invoices, invoiceStatusLabels, type InvoiceStatus } from "@/lib/demo-data";

const tabs: { id: InvoiceStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft-needed", label: "Draft needed" },
  { id: "ready-to-send", label: "Ready to send" },
  { id: "submitted", label: "Submitted" },
  { id: "paid", label: "Paid" },
  { id: "queried", label: "Queried / overdue" },
];

export default function InvoicesPage() {
  const [tab, setTab] = useState<InvoiceStatus | "all">("all");

  const filtered =
    tab === "all"
      ? invoices
      : tab === "queried"
        ? invoices.filter((i) => i.status === "queried" || i.status === "overdue")
        : invoices.filter((i) => i.status === tab);

  return (
    <>
      <WorkflowPageHeader
        title="Invoices"
        purpose="See which appointments may need an invoice or payment check."
      >
        <InvoiceGenerator />
      </WorkflowPageHeader>

      <ClinikoInvoiceQueuePanel />

      <h2 className="mb-4 text-lg font-bold text-navy">Command Hub demo invoices</h2>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-10 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-green text-white"
                : "border border-cream-dark bg-white text-navy hover:border-green"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((inv) => (
          <article key={inv.id} className="rounded-xl border border-cream-dark bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-semibold text-navy">{inv.ref}</p>
                <p className="mt-1 font-medium text-navy">{inv.clientOrPayer}</p>
              </div>
              <StatusBadge
                label={invoiceStatusLabels[inv.status]}
                variant={
                  inv.status === "overdue" || inv.status === "queried"
                    ? "danger"
                    : inv.status === "paid"
                      ? "success"
                      : "warning"
                }
              />
            </div>
            <p className="mt-2 text-2xl font-bold text-navy">£{inv.amount}</p>
            <p className="mt-1 text-sm text-slate">
              Sessions: {inv.sessionDates.join(", ")}
            </p>
            {inv.missingInfo && inv.missingInfo.length > 0 && (
              <div className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                Missing: {inv.missingInfo.join("; ")}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <InvoiceAction label="Draft" />
              <InvoiceAction label="Copy text" />
              <InvoiceAction label="Mark submitted" />
              <InvoiceAction label="Open Cliniko" />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function InvoiceAction({ label }: { label: string }) {
  return (
    <button type="button" className="min-h-9 rounded-lg border border-cream-dark px-3 py-1.5 text-xs font-medium text-green hover:bg-cream">
      {label}
    </button>
  );
}
