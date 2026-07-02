"use client";

import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { InvoiceGenerator } from "@/components/admin/InvoiceGenerator";
import { ClinikoInvoiceQueuePanel } from "@/components/admin/ClinikoInvoiceQueuePanel";
import { DemoWeekInvoicesPanel } from "@/components/admin/DemoWeekInvoicesPanel";
import { DemoWeekReferenceStrip } from "@/components/admin/DemoWeekReferenceStrip";
import { InsuranceInvoicePreparationHub } from "@/components/admin/InsuranceInvoicePreparationHub";
import { WhatThisShows } from "@/components/admin/WhatThisShows";

export default function InvoicesPage() {
  return (
    <>
      <WorkflowPageHeader
        title="Invoices"
        purpose="Prepare insurance invoice packs, review missing insurer details and private payment checks — not connected to Xero or Healthcode yet."
      >
        <InvoiceGenerator />
      </WorkflowPageHeader>

      <WhatThisShows>
        Insurance invoice preparation hub — who can be invoiced, what is missing, what has been
        prepared, and what needs Future Xero / Future Healthcode integration. Prepared invoice draft
        — not sent.
      </WhatThisShows>

      <InsuranceInvoicePreparationHub />

      <ClinikoInvoiceQueuePanel />

      <DemoWeekInvoicesPanel />

      <h2 className="mb-2 text-lg font-bold text-navy">Ready to draft</h2>
      <p className="mb-6 text-sm text-slate">
        Legacy static demo invoice cards remain for comparison. Insurance cases use the preparation
        hub above with Open invoice draft links.
      </p>

      <DemoWeekReferenceStrip variant="invoices" />
    </>
  );
}
