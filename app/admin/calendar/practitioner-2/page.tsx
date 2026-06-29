import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CalloutBox } from "@/components/admin/AdminUI";
import { WeeklyCalendar } from "@/components/admin/WeeklyCalendar";

export default function Practitioner2CalendarPage() {
  return (
    <>
      <AdminPageHeader
        title="Jamie Lee Thomson — Calendar"
        subtitle="Practitioner 2 bookings, room use and shared clinic commitments."
      />
      <CalloutBox variant="info">
        Jamie Lee&apos;s appointments from Cliniko/Setmore, plus room bookings for future
        practitioners such as Dicker. Cliniko remains the patient booking record.
      </CalloutBox>
      <div className="mt-6">
        <WeeklyCalendar practitionerFilter="jamie-lee" />
      </div>
    </>
  );
}
