"use client";

import { useCallback, useState } from "react";
import { useCommandHubWorkflow } from "@/components/admin/CommandHubWorkflowProvider";
import type { InvoiceDraftListItem } from "@/lib/invoice-draft-registry";
import {
  copyTextToClipboard,
  downloadTextFile,
  formatInvoiceDetailsText,
  formatInvoiceDraftCsv,
  formatInvoiceDraftJson,
  formatInvoiceSummaryText,
  formatSessionTableText,
} from "@/lib/invoice-export-formatters";

interface InvoiceDraftActionsProps {
  item: InvoiceDraftListItem;
  layout?: "card" | "detail";
}

export function InvoiceDraftActions({ item, layout = "card" }: InvoiceDraftActionsProps) {
  const { updateInvoiceDraftState } = useCommandHubWorkflow();
  const [message, setMessage] = useState<string | null>(null);
  const { id, draft } = item;

  const stamp = useCallback(
    async (patch: Record<string, string | boolean>) => {
      await updateInvoiceDraftState(id, patch);
    },
    [id, updateInvoiceDraftState]
  );

  const runCopy = useCallback(
    async (label: string, text: string) => {
      const ok = await copyTextToClipboard(text);
      const now = new Date().toISOString();
      if (ok) {
        await stamp({
          invoiceDraftCopiedAt: now,
          invoiceDraftLastAction: `Copied ${label}`,
        });
        setMessage(`${label} copied — Prepared invoice draft, not sent`);
      } else {
        setMessage("Clipboard unavailable — select and copy manually from the export pack below.");
      }
    },
    [stamp]
  );

  const markPrepared = useCallback(async () => {
    const now = new Date().toISOString();
    await stamp({
      invoiceDraftPrepared: true,
      invoiceDraftPreparedAt: now,
      invoiceDraftPreparedByDemoStaff: true,
      invoiceDraftLastAction: "Marked prepared",
    });
    setMessage("Marked prepared — Command Hub workflow state (not sent to insurer)");
  }, [stamp]);

  const markExported = useCallback(async () => {
    const now = new Date().toISOString();
    await stamp({
      invoiceDraftExported: true,
      invoiceDraftExportedAt: now,
      invoiceDraftLastAction: "Marked exported in Command Hub",
    });
    setMessage("Marked exported in Command Hub — not submitted to Xero or Healthcode");
  }, [stamp]);

  const buttonClass =
    layout === "detail"
      ? "min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-navy hover:bg-cream"
      : "min-h-9 rounded-lg border border-cream-dark px-3 py-1.5 text-xs font-medium text-navy hover:bg-cream";

  const primaryClass =
    layout === "detail"
      ? "min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light"
      : "min-h-9 rounded-lg bg-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-light";

  return (
    <div className="space-y-3">
      <p className="sr-only">
        Copy invoice details · Download invoice draft as CSV · Download invoice draft as JSON ·
        Prepared invoice draft
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonClass}
          onClick={() => void runCopy("Invoice summary", formatInvoiceSummaryText(draft))}
        >
          Copy invoice summary
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => void runCopy("Invoice details", formatInvoiceDetailsText(draft))}
        >
          Copy invoice details
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => void runCopy("Session table", formatSessionTableText(draft))}
        >
          Copy session table
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            downloadTextFile(
              `${draft.invoiceRef}.csv`,
              formatInvoiceDraftCsv(draft),
              "text/csv;charset=utf-8"
            );
            void stamp({
              invoiceDraftExportedAt: new Date().toISOString(),
              invoiceDraftLastAction: "Downloaded CSV draft",
            });
            setMessage("Download invoice draft as CSV — Prepared invoice draft, not sent");
          }}
        >
          Download invoice draft as CSV
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            downloadTextFile(
              `${draft.invoiceRef}.json`,
              formatInvoiceDraftJson(draft),
              "application/json;charset=utf-8"
            );
            void stamp({
              invoiceDraftExportedAt: new Date().toISOString(),
              invoiceDraftLastAction: "Downloaded JSON draft",
            });
            setMessage("Download invoice draft as JSON — Prepared invoice draft, not sent");
          }}
        >
          Download invoice draft as JSON
        </button>
        <button type="button" className={primaryClass} onClick={() => void markPrepared()}>
          Mark invoice draft prepared
        </button>
        <button type="button" className={buttonClass} onClick={() => void markExported()}>
          Mark exported in Command Hub
        </button>
      </div>
      {message ? <p className="text-sm text-green">{message}</p> : null}
      <p className="text-xs text-slate">
        Prepared invoice draft — not sent. Future Xero integration · Future Healthcode integration
      </p>
    </div>
  );
}
