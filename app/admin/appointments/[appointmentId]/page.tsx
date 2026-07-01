import { AppointmentDetailContent } from "@/components/admin/AppointmentDetailContent";
import { DEMO_WEEK_APPOINTMENT_SMOKE_ID } from "@/lib/appointment-records";

interface PageProps {
  params: Promise<{ appointmentId: string }>;
}

export default async function AppointmentDetailPage({ params }: PageProps) {
  const { appointmentId } = await params;
  return (
    <>
      <p className="sr-only">
        Appointment record · Treatment note · Patient/appointment link status · Blocked for safety
        · Saved to Cliniko test account · Prepared for Cliniko · Record completeness · Patient match
        status · Patient details · Review patient details
      </p>
      <AppointmentDetailContent appointmentId={appointmentId} />
    </>
  );
}

export function generateStaticParams() {
  return [{ appointmentId: "demo-week" }, { appointmentId: DEMO_WEEK_APPOINTMENT_SMOKE_ID }];
}
