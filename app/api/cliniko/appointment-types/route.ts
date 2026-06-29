import { NextResponse } from "next/server";
import { getAppointmentTypes } from "@/lib/cliniko";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getAppointmentTypes();
  return NextResponse.json({
    ok: result.ok,
    source: result.source,
    status: result.status,
    appointmentTypes: result.data ?? [],
    error: result.error,
    warning: result.warning,
  });
}
