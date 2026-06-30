import { redirect } from "next/navigation";
import { DEMO_WEEK_APPOINTMENT_SMOKE_ID } from "@/lib/appointment-records";

export default function DemoWeekAppointmentRedirect() {
  redirect(`/admin/appointments/${DEMO_WEEK_APPOINTMENT_SMOKE_ID}`);
}
