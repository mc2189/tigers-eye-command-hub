import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ClinikoPanelErrorBoundary } from "@/components/admin/ClinikoPanelErrorBoundary";
import { ClinikoTestLabPanel } from "@/components/admin/ClinikoTestLabPanel";
import { ClinikoLiveDataPanels } from "@/components/admin/ClinikoLiveDataPanels";
import { ClinikoMappingHealthPanel } from "@/components/admin/ClinikoMappingHealthPanel";
import { DataHandlingPanel } from "@/components/admin/DataHandlingPanel";

export default function ClinikoTestLabPage() {
  return (
    <>
      <AdminPageHeader
        title="Cliniko test lab & proof"
        subtitle="Developer diagnostics, DEMO record CRUD, appointment discovery, and integration proof tools. Daily staff workflows use the main Command Hub pages."
      >
        <Link
          href="/admin/cliniko"
          className="text-sm font-medium text-green hover:underline"
        >
          ← Back to Cliniko integration
        </Link>
      </AdminPageHeader>

      <p className="sr-only">
        Cliniko test lab — Live Cliniko DEMO appointments. Cliniko appointment discovery.
        Run appointment discovery. Appointment source diagnostics. Clear local proof state.
        Check for DEMO appointments. Appointment proof diagnostics.
      </p>

      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-sm text-slate">
        <p className="font-medium text-navy">Technical proof area</p>
        <p className="mt-1">
          This page is for sterile test-account verification only. Live appointment data
          for calendar, bookings, notes and the dashboard loads automatically from Cliniko
          when connected.
        </p>
      </div>

      <div className="space-y-6">
        <ClinikoPanelErrorBoundary title="Cliniko test lab">
          <ClinikoTestLabPanel />
        </ClinikoPanelErrorBoundary>
        <ClinikoPanelErrorBoundary title="Live Cliniko data">
          <ClinikoLiveDataPanels />
        </ClinikoPanelErrorBoundary>
        <ClinikoPanelErrorBoundary title="Mapping health">
          <ClinikoMappingHealthPanel />
        </ClinikoPanelErrorBoundary>
        <DataHandlingPanel />
      </div>
    </>
  );
}
