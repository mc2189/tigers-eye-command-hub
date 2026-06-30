import { NextRequest, NextResponse } from "next/server";
import { createDemoFollowUpBooking } from "@/lib/demo-followup-booking";
import { validateDemoWriteInput } from "@/lib/demo-write-safety";

export const dynamic = "force-dynamic";

interface FollowUpBody {
  patientId: string;
  patientFirstName?: string;
  appointmentId?: string;
  suggestedInDays?: number;
  durationMinutes?: number;
  appointmentTypeName?: string;
  startsAt?: string;
}

export async function POST(request: NextRequest) {
  let body: FollowUpBody;
  try {
    body = (await request.json()) as FollowUpBody;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const safety = validateDemoWriteInput({ firstName: body.patientFirstName });
  if (body.patientFirstName && !safety.ok) {
    return NextResponse.json(
      {
        ok: false,
        status: "blocked",
        message: safety.reason,
        label: "Prepared follow-up appointment — not yet booked in Cliniko",
      },
      { status: 403 }
    );
  }

  if (!body.patientId?.trim()) {
    return NextResponse.json(
      {
        ok: false,
        status: "blocked",
        message: "DEMO patient must be linked before booking a follow-up.",
        label: "Prepared follow-up appointment — not yet booked in Cliniko",
      },
      { status: 400 }
    );
  }

  const result = await createDemoFollowUpBooking({
    patientId: body.patientId,
    patientFirstName: body.patientFirstName,
    suggestedInDays: body.suggestedInDays,
    durationMinutes: body.durationMinutes,
    appointmentTypeName: body.appointmentTypeName,
    startsAt: body.startsAt,
  });

  return NextResponse.json(result);
}
