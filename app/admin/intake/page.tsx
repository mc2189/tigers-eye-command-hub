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
        Booking intake · Suggested Cliniko match · Create new DEMO Cliniko patient · staff
        confirmation · Unsafe/non-DEMO input blocked
      </p>
      <IntakePageContent />
    </>
  );
}
