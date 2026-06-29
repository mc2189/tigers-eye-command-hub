import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { clinikoHealthCheck } from "@/lib/demo-data";

const sections = [...new Set(clinikoHealthCheck.map((i) => i.section))];

const statusVariant = {
  demo: "success" as const,
  recommended: "warning" as const,
  future: "neutral" as const,
};

const impactVariant = {
  low: "neutral" as const,
  medium: "info" as const,
  high: "danger" as const,
};

export default function ClinikoPage() {
  const demoCount = clinikoHealthCheck.filter((i) => i.status === "demo").length;
  const recommendedCount = clinikoHealthCheck.filter((i) => i.status === "recommended").length;
  const futureCount = clinikoHealthCheck.filter((i) => i.status === "future").length;

  return (
    <>
      <AdminPageHeader
        title="Cliniko health check"
        subtitle="See what Cliniko can already do — booking, payments, insurance, notes and operations."
      />

      <div className="mb-8 flex flex-wrap gap-3">
        <StatusBadge label={`${demoCount} Demo ready`} variant="success" />
        <StatusBadge label={`${recommendedCount} Recommended`} variant="warning" />
        <StatusBadge label={`${futureCount} Future`} variant="neutral" />
      </div>

      {sections.map((section) => {
        const items = clinikoHealthCheck.filter((i) => i.section === section);
        return (
          <section key={section} className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-navy">{section}</h2>
            <div className="rounded-xl border border-cream-dark bg-white divide-y divide-cream-dark">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-navy">{item.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge
                        label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        variant={statusVariant[item.status]}
                      />
                      <StatusBadge
                        label={`${item.impact} impact`}
                        variant={impactVariant[item.impact]}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-green hover:bg-cream"
                  >
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
