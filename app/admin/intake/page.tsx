import { IntakePageContent } from "@/components/admin/IntakePageContent";
import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";

export default function IntakePage() {
  return (
    <>
      <WorkflowPageHeader
        title="Booking intake"
        purpose="Match website booking details to the correct Cliniko patient record, or create a new DEMO patient when no safe match exists."
      />
      <p className="sr-only">
        Booking intake · Saved to Cliniko test account · Prepared for Cliniko · Blocked from writing
        · field not currently written · Suggested Cliniko match · Create new DEMO Cliniko patient ·
        staff confirmation · Unsafe/non-DEMO input blocked · Field comparison · Already matches Cliniko
        · Missing in Cliniko · Different from Cliniko · Update selected DEMO fields in Cliniko ·
        Nothing is updated automatically · Blocked for safety
      </p>
      <IntakePageContent />
    </>
  );
}
