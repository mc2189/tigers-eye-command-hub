import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CalloutBox } from "@/components/admin/AdminUI";
import { WeeklyCalendar } from "@/components/admin/WeeklyCalendar";

export default function GeorgeCalendarPage() {
  return (
    <>
      <AdminPageHeader
        title="George Stewart — Calendar"
        subtitle="George's Cliniko bookings plus external commitments, finance context and tasks."
      />
      <CalloutBox variant="info">
        Cliniko remains the booking record for patient appointments. Command Hub adds
        external work blocks, finance overlays, note status and stock warnings.
      </CalloutBox>
      <div className="mt-6">
        <WeeklyCalendar
          practitionerFilter="george"
          practitionerNameMatcher="george|stewart"
        />
      </div>
    </>
  );
}
