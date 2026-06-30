import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { ClinikoIntegrationOverview } from "@/components/admin/ClinikoIntegrationOverview";

export default function ClinikoPage() {
  return (
    <>
      <WorkflowPageHeader
        title="Cliniko"
        purpose="See how Cliniko connects to your daily workflow. Cliniko remains the diary and clinical record — Command Hub reads appointments and suggests what to do next."
      />

      <p className="sr-only">
        Technical Cliniko test lab. Cliniko test account connected. Cliniko remains the diary and clinical record.
      </p>

      <ClinikoIntegrationOverview />
    </>
  );
}
