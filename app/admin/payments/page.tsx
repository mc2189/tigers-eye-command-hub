import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CalloutBox } from "@/components/admin/AdminUI";
import { MetricCard } from "@/components/admin/MetricCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { paymentRules, paymentActionQueue } from "@/lib/demo-data";

const setupCards = [
  { label: "Stripe in Cliniko", value: "Demo ready", hint: "Sandbox connected" },
  { label: "Online payments", value: "Recommended", hint: "Deposits & full pay" },
  { label: "Deposits", value: "Configurable", hint: "By appointment type" },
  { label: "Cash", value: "Agreement required", hint: "Admin approval flag" },
  { label: "Insurance", value: "Claim captured", hint: "No online payment" },
  { label: "Telehealth", value: "Full payment", hint: "Before appointment" },
];

export default function PaymentsPage() {
  return (
    <>
      <AdminPageHeader
        title="Payments"
        subtitle="Payment rules, readiness and action queue — Cliniko/Stripe remains the payment engine."
      />

      <section>
        <h2 className="mb-4 text-lg font-bold text-navy">Setup status</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {setupCards.map((c) => (
            <MetricCard key={c.label} label={c.label} value={c.value} hint={c.hint} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-navy">Appointment payment rules</h2>
        <div className="overflow-x-auto rounded-xl border border-cream-dark bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-cream-dark bg-cream/50">
              <tr>
                <th className="px-4 py-3 font-semibold text-navy">Appointment type</th>
                <th className="px-4 py-3 font-semibold text-navy">Rule</th>
                <th className="px-4 py-3 font-semibold text-navy">Warning</th>
              </tr>
            </thead>
            <tbody>
              {paymentRules.map((r) => (
                <tr key={r.id} className="border-b border-cream-dark last:border-0">
                  <td className="px-4 py-3 font-medium">{r.appointmentType}</td>
                  <td className="px-4 py-3 text-slate">{r.rule}</td>
                  <td className="px-4 py-3">
                    {r.warning ? <StatusBadge label={r.warning} variant="warning" /> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <CalloutBox variant="warning" title="Cash payment warning">
          Cash payment should only be used where agreed with the clinic. These bookings
          should be flagged for review so they are not missed.
        </CalloutBox>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-navy">Payment action queue</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {paymentActionQueue.map((item) => (
            <Link
              key={item.id}
              href={item.modulePath}
              className="flex items-center justify-between rounded-xl border border-cream-dark bg-white p-4 transition-colors hover:border-green"
            >
              <div>
                <p className="font-medium text-navy">{item.description}</p>
                <p className="text-sm text-slate">{item.count} item{item.count !== 1 ? "s" : ""}</p>
              </div>
              <StatusBadge label="Review" variant="warning" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
