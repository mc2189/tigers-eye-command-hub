import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { CalloutBox } from "@/components/admin/AdminUI";
import { WeeklyCalendar } from "@/components/admin/WeeklyCalendar";
import Link from "next/link";

export default function CalendarPage() {
  return (
    <>
      <WorkflowPageHeader
        title="Calendar"
        purpose="See the week ahead — live Cliniko appointments plus clinic commitments that need planning."
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/calendar/george" className="text-sm font-medium text-green hover:underline">
            George&apos;s calendar →
          </Link>
          <Link href="/admin/calendar/practitioner-2" className="text-sm font-medium text-green hover:underline">
            Practitioner 2 calendar →
          </Link>
        </div>
      </WorkflowPageHeader>

      <CalloutBox title="Cliniko remains the booking record">
        Appointments booked through Cliniko appear alongside external work, admin
        blocks and stock tasks added in the Command Hub.
      </CalloutBox>

      <p className="sr-only">Note needed</p>

      <div className="mt-6">
        <WeeklyCalendar />
      </div>
    </>
  );
}
