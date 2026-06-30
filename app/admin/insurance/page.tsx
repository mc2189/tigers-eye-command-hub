import { InsuranceCaseTracker } from "@/components/admin/InsuranceCaseTracker";

export default function InsurancePage() {
  return (
    <>
      <p className="sr-only">
        Insurance cases · approved sessions · Demo case controls · Ready to invoice · authorised
        sessions
      </p>
      <InsuranceCaseTracker />
    </>
  );
}
