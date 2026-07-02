"use client";

import { InvoiceDraftDetail } from "@/components/admin/InvoiceDraftDetail";
import { useInvoiceDraftDetail } from "@/components/admin/useInvoiceDraftList";
import Link from "next/link";

export function InvoiceDraftDetailClient({ invoiceDraftId }: { invoiceDraftId: string }) {
  const item = useInvoiceDraftDetail(invoiceDraftId);

  if (!item) {
    return (
      <section className="rounded-xl border border-cream-dark bg-white p-6">
        <h1 className="text-xl font-bold text-navy">Invoice draft not found</h1>
        <p className="mt-2 text-sm text-slate">
          No insurance invoice draft matches <code className="text-xs">{invoiceDraftId}</code>.
          Open the invoices hub to see available DEMO cases.
        </p>
        <Link
          href="/admin/invoices"
          className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-green px-4 text-sm font-semibold text-white"
        >
          Back to invoices
        </Link>
      </section>
    );
  }

  return <InvoiceDraftDetail item={item} />;
}
