import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ClinikoPanelErrorBoundary } from "@/components/admin/ClinikoPanelErrorBoundary";
import { AviemoreClinikoPanel } from "@/components/admin/AviemoreClinikoPanel";
import { ClinikoTestLabPanel } from "@/components/admin/ClinikoTestLabPanel";
import { ConfigureDemoButton } from "@/components/admin/ConfigureDemoButton";
import { ClinikoConnectionPanel } from "@/components/admin/ClinikoConnectionPanel";
import { ClinikoLiveDataPanels } from "@/components/admin/ClinikoLiveDataPanels";
import { ClinikoHealthSummary } from "@/components/admin/ClinikoHealthSummary";
import { ClinikoMappingHealthPanel } from "@/components/admin/ClinikoMappingHealthPanel";
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
        title="Cliniko health check"
        subtitle="See what Cliniko already supports and how Command Hub helps you use those features more fully."
      />

      <p className="sr-only">
        Cliniko test lab — Live Cliniko DEMO appointments. Cliniko appointment discovery.
        Run appointment discovery. Appointment source diagnostics. Clear local proof state.
        Check for DEMO appointments. Appointment proof diagnostics. Cliniko is the system of record.
      </p>

      <div className="mb-6 space-y-6">
        <ClinikoPanelErrorBoundary title="Cliniko connection">
          <ClinikoConnectionPanel />
        </ClinikoPanelErrorBoundary>
        <AviemoreClinikoPanel />
        <ClinikoPanelErrorBoundary title="Cliniko test lab">
          <ClinikoTestLabPanel />
        </ClinikoPanelErrorBoundary>
        <ClinikoHealthSummary />
        <ClinikoPanelErrorBoundary title="Live Cliniko data">
          <ClinikoLiveDataPanels />
        </ClinikoPanelErrorBoundary>
        <ClinikoPanelErrorBoundary title="Mapping health">
          <ClinikoMappingHealthPanel />
        </ClinikoPanelErrorBoundary>
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
