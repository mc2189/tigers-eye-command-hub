import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ClinikoPanelErrorBoundary } from "@/components/admin/ClinikoPanelErrorBoundary";
import { AviemoreClinikoPanel } from "@/components/admin/AviemoreClinikoPanel";
import { ConfigureDemoButton } from "@/components/admin/ConfigureDemoButton";
import { ClinikoConnectionPanel } from "@/components/admin/ClinikoConnectionPanel";
import { ClinikoHealthSummary } from "@/components/admin/ClinikoHealthSummary";
import { DataHandlingPanel } from "@/components/admin/DataHandlingPanel";
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
        title="Cliniko integration"
        subtitle="Connection status and roadmap. Cliniko is the system of record — Command Hub reads live appointments into your daily workflow."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cream-dark bg-white p-4">
        <div>
          <p className="font-semibold text-navy">Need proof tools or test data?</p>
          <p className="mt-1 text-sm text-slate">
            DEMO patient CRUD, appointment discovery, mapping diagnostics and proof state
            live in the dedicated test lab.
          </p>
        </div>
        <Link
          href="/admin/cliniko/test-lab"
          className="inline-flex min-h-10 items-center rounded-lg border border-cream-dark bg-cream px-4 py-2 text-sm font-semibold text-navy hover:bg-cream-dark"
        >
          Open test lab & proof tools
        </Link>
      </div>

      <div className="mb-6 space-y-6">
        <ClinikoPanelErrorBoundary title="Cliniko connection">
          <ClinikoConnectionPanel />
        </ClinikoPanelErrorBoundary>
        <AviemoreClinikoPanel />
        <ClinikoHealthSummary />
        <DataHandlingPanel />
      </div>

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
                  <ConfigureDemoButton label={item.action} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
