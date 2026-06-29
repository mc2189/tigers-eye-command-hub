import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CalloutBox } from "@/components/admin/AdminUI";
import { ClinikoFinancePanel } from "@/components/admin/ClinikoFinancePanel";
import { MetricCard } from "@/components/admin/MetricCard";
import { ProgressBar } from "@/components/admin/AdminUI";
import { financeSummary } from "@/lib/demo-data";

export default function FinancePage() {
  const f = financeSummary;

  return (
    <>
      <AdminPageHeader
        title="Finance"
        subtitle="Estimated income and workflow view — not a replacement for your accountant or Xero."
      />

      <CalloutBox title="Demo finance only" variant="info">
        <p>
          Figures here are estimated from demo and Cliniko sandbox data. This is a
          workflow dashboard — not accounting software. Use Cliniko reports and your
          accountant for official records.
        </p>
      </CalloutBox>

      <ClinikoFinancePanel />

      <h2 className="mb-4 text-lg font-bold text-navy">Command Hub demo finance</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Revenue this week" value={`£${f.revenueThisWeek.toLocaleString()}`} />
        <MetricCard label="Paid this week" value={`£${f.paidThisWeek.toLocaleString()}`} />
        <MetricCard label="Outstanding invoices" value={`£${f.outstandingInvoices}`} />
        <MetricCard label="Insurance pending" value={`£${f.insurancePending}`} />
        <MetricCard label="Cash to collect" value={`£${f.cashToCollect}`} />
        <MetricCard label="Expenses this month" value={`£${f.expensesThisMonth}`} />
        <MetricCard label="Estimated net" value={`£${f.estimatedNet.toLocaleString()}`} />
        <MetricCard label="Uninvoiced sessions" value={f.uninvoicedSessions} />
      </div>

      <CalloutBox title="Summary" variant="success">
        <p>{f.plainEnglish}</p>
      </CalloutBox>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="mb-4 font-bold text-navy">Revenue by workstream</h2>
          <div className="space-y-4">
            {f.revenueByWorkstream.map((item) => (
              <ProgressBar key={item.label} {...item} />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="mb-4 font-bold text-navy">Revenue by location</h2>
          <div className="space-y-4">
            {f.revenueByLocation.map((item) => (
              <ProgressBar key={item.label} {...item} />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="mb-4 font-bold text-navy">Revenue by practitioner</h2>
          <div className="space-y-4">
            {f.revenueByPractitioner.map((item) => (
              <ProgressBar key={item.label} {...item} />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="mb-4 font-bold text-navy">Payment method breakdown</h2>
          <div className="space-y-4">
            {f.paymentMethodBreakdown.map((item) => (
              <ProgressBar key={item.label} {...item} />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-cream-dark bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 font-bold text-navy">Outstanding money by age</h2>
          <div className="space-y-4 max-w-xl">
            {f.outstandingByAge.map((item) => (
              <ProgressBar key={item.label} {...item} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
