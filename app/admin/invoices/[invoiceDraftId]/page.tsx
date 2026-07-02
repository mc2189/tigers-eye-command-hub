import Link from "next/link";
import { InvoiceDraftDetailClient } from "@/components/admin/InvoiceDraftDetailClient";
import { DEMO_AVIVA_INVOICE_DRAFT_ID } from "@/lib/invoice-draft-ids";

interface PageProps {
  params: Promise<{ invoiceDraftId: string }>;
}

export function generateStaticParams() {
  return [{ invoiceDraftId: DEMO_AVIVA_INVOICE_DRAFT_ID }];
}

export default async function InvoiceDraftDetailPage({ params }: PageProps) {
  const { invoiceDraftId } = await params;

  return (
    <>
      <p className="sr-only">
        Invoice draft · Copy invoice details · Download invoice draft as CSV · Prepared invoice draft
      </p>
      <div className="mb-4">
        <Link href="/admin/invoices" className="text-sm font-medium text-green hover:underline">
          ← Back to invoices
        </Link>
      </div>
      <InvoiceDraftDetailClient invoiceDraftId={invoiceDraftId} />
    </>
  );
}
