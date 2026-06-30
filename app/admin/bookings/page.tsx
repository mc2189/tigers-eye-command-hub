import { BookingsPageContent } from "@/components/admin/BookingsPageContent";
import { DemoWeekReferenceStrip } from "@/components/admin/DemoWeekReferenceStrip";

export default function BookingsPage() {
  return (
    <>
      <p className="sr-only">Needs attention · Ready · Missing setup · Open record</p>
      <p className="mb-4 text-sm text-slate">
        Each appointment card includes{" "}
        <span className="font-medium text-navy">Show all workflow actions</span> when you
        need the full checklist for that booking.
      </p>
      <BookingsPageContent />
      <DemoWeekReferenceStrip variant="bookings" />
    </>
  );
}
