import { InsuranceCaseTracker } from "@/components/admin/InsuranceCaseTracker";
import { DemoWeekReferenceStrip } from "@/components/admin/DemoWeekReferenceStrip";

export default function InsurancePage() {
  return (
    <>
      <p className="sr-only">
        Insurance cases · approved sessions · Demo case controls · Ready to invoice · authorised
        sessions
      </p>
      <InsuranceCaseTracker />
      <DemoWeekReferenceStrip variant="insurance" />
    </>
  );
}
