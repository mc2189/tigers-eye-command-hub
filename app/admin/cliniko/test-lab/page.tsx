import Link from "next/link";
import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { ClinikoPanelErrorBoundary } from "@/components/admin/ClinikoPanelErrorBoundary";
import { ClinikoTestLabPanel } from "@/components/admin/ClinikoTestLabPanel";
import { ClinikoLiveDataPanels } from "@/components/admin/ClinikoLiveDataPanels";
import { ClinikoMappingHealthPanel } from "@/components/admin/ClinikoMappingHealthPanel";
import { DataHandlingPanel } from "@/components/admin/DataHandlingPanel";
import { DemoClinicWeekPanel } from "@/components/admin/DemoClinicWeekPanel";

export default function ClinikoTestLabPage() {
  return (
    <>
      <WorkflowPageHeader
        title="Cliniko test lab"
        purpose="Technical proof area for the sterile Cliniko test account. Not part of George's daily clinic workflow."
      >
        <Link
          href="/admin/cliniko"
          className="text-sm font-medium text-green hover:underline"
        >
          ← Back to Cliniko overview
        </Link>
      </WorkflowPageHeader>

      <p className="sr-only">
        Technical test lab. Cliniko test lab — Live Cliniko DEMO appointments. Cliniko appointment discovery.
        Run appointment discovery. Appointment source diagnostics. Clear local proof state.
        Check for DEMO appointments. Appointment proof diagnostics.
      </p>

      <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
        <p className="font-semibold text-navy">Technical test lab</p>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          This page is for proving the Cliniko connection in the sterile test account. It is not
          part of the daily clinic workflow.
        </p>
      </div>

      <p className="sr-only">
        Demo Clinic Week · Seed demo clinic week · Technical test lab.
      </p>

      <div className="space-y-6">
        <DemoClinicWeekPanel />
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
