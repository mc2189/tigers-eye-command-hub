import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CalloutBox } from "@/components/admin/AdminUI";
import { WeeklyCalendar } from "@/components/admin/WeeklyCalendar";
import Link from "next/link";

export default function CalendarPage() {
  return (
    <>
      <AdminPageHeader
        title="Calendar"
        subtitle="Combined weekly view across practitioners, locations and commitments."
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/calendar/george" className="text-sm font-medium text-green hover:underline">
            George&apos;s calendar →
          </Link>
          <Link href="/admin/calendar/practitioner-2" className="text-sm font-medium text-green hover:underline">
            Practitioner 2 calendar →
          </Link>
        </div>
      </AdminPageHeader>

      <CalloutBox title="Cliniko remains the booking record">
        Appointments booked through Cliniko appear alongside external work, admin
        blocks and stock tasks added in the Command Hub.
      </CalloutBox>

      <div className="mt-6">
        <WeeklyCalendar />
      </div>
    </>
  );
}
