import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CalloutBox } from "@/components/admin/AdminUI";
import { MetricCard } from "@/components/admin/MetricCard";
import { bankingChecklist, bankingTotals } from "@/lib/demo-data";

export default function BankingPage() {
  return (
    <>
      <AdminPageHeader
        title="Banking"
        subtitle="Future-facing bank reconciliation and Xero readiness — demo placeholders."
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <MetricCard label="Cash takings" value={`£${bankingTotals.cash}`} />
        <MetricCard label="Card in clinic" value={`£${bankingTotals.card}`} />
        <MetricCard label="Online (Stripe)" value={`£${bankingTotals.online}`} />
      </div>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="mb-4 font-bold text-navy">Xero readiness checklist</h2>
          <ul className="space-y-3">
            {bankingChecklist.map((item) => (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    item.done ? "bg-green-muted text-green" : "bg-cream-dark text-slate"
                  }`}
                >
                  {item.done ? "✓" : "—"}
                </span>
                <span className={item.done ? "text-navy" : "text-slate"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <CalloutBox title="Bank reconciliation placeholder" variant="info">
            <p>
              Connect Xero for live bank feeds. This demo shows manual totals from
              Cliniko payment reports until integration is configured.
            </p>
            <p className="mt-2">{bankingTotals.notes}</p>
          </CalloutBox>

          <CalloutBox title="Manual banking notes" variant="info">
            <p>Weekly review: match Stripe payouts, cash takings and insurance payments to invoices.</p>
          </CalloutBox>

          <div className="rounded-xl border border-dashed border-cream-dark bg-white p-5 text-center">
            <p className="font-medium text-navy">Accountant export placeholder</p>
            <p className="mt-2 text-sm text-slate">CSV export for month-end — demo only</p>
            <button type="button" className="mt-4 min-h-10 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">
              Export demo CSV
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
