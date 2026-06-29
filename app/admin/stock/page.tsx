import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ClinikoStockPanel } from "@/components/admin/ClinikoStockPanel";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { stockItems, stockUsageRules } from "@/lib/demo-data";

const statusVariant = {
  ok: "success" as const,
  "reorder-soon": "warning" as const,
  low: "danger" as const,
};

const statusLabel = {
  ok: "OK",
  "reorder-soon": "Reorder soon",
  low: "Low",
};

export default function StockPage() {
  return (
    <>
      <AdminPageHeader
        title="Stock & consumables"
        subtitle="Lightweight inventory linked to appointment types and external work."
      />

      <ClinikoStockPanel />

      <h2 className="mb-4 text-lg font-bold text-navy">Demo stock levels</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stockItems.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-cream-dark bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-bold text-navy">{item.name}</h2>
              <StatusBadge label={statusLabel[item.status]} variant={statusVariant[item.status]} />
            </div>
            <p className="mt-2 text-2xl font-bold text-navy">
              {item.currentLevel} <span className="text-sm font-normal text-slate">{item.unit}</span>
            </p>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate">Reorder at</dt>
                <dd>{item.reorderThreshold} {item.unit}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate">Weekly usage</dt>
                <dd>~{item.estimatedWeeklyUsage}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-slate">
              Linked: {item.linkedAppointmentTypes.join(", ")}
            </p>
            <button type="button" className="mt-3 min-h-9 w-full rounded-lg border border-cream-dark text-xs font-medium text-green hover:bg-cream">
              Estimate stock used
            </button>
          </article>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-navy">Stock usage rules</h2>
        <div className="rounded-xl border border-cream-dark bg-white divide-y divide-cream-dark">
          {stockUsageRules.map((rule) => (
            <div key={rule.id} className="p-4 sm:p-5">
              <p className="font-semibold text-navy">{rule.appointmentType}</p>
              <p className="mt-1 text-sm text-slate">Uses: {rule.itemsUsed.join(", ")}</p>
              {rule.notes && <p className="mt-1 text-xs italic text-slate">{rule.notes}</p>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
