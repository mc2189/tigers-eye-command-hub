import { NextRequest, NextResponse } from "next/server";
import {
  saveTreatmentNoteSafely,
  type TreatmentNoteSaveInput,
} from "@/lib/demo-treatment-note-safety";

export const dynamic = "force-dynamic";

interface TreatmentNoteBody extends TreatmentNoteSaveInput {
  audio?: unknown;
  transcript?: unknown;
}

export async function POST(request: NextRequest) {
  let body: TreatmentNoteBody;

  try {
    body = (await request.json()) as TreatmentNoteBody;
  } catch {
    return NextResponse.json(
      { ok: false, status: "failed", message: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  if (body.audio !== undefined || body.transcript !== undefined) {
    return NextResponse.json(
      {
        ok: false,
        status: "blocked",
        message: "Audio and transcript payloads are not accepted.",
        uiLabel: "Blocked for safety",
        localContentStored: false,
      },
      { status: 400 }
    );
  }

  if (!body.sections || typeof body.sections !== "object") {
    return NextResponse.json(
      {
        ok: false,
        status: "failed",
        message: "Structured sections are required.",
        localContentStored: false,
      },
      { status: 400 }
    );
  }

  const result = await saveTreatmentNoteSafely({
    bookingId: body.bookingId,
    patientId: body.patientId,
    patientLabel: body.patientLabel,
    title: body.title,
    templateName: body.templateName,
    sections: body.sections,
    isLiveCliniko: body.isLiveCliniko,
    isDemoWeekPreview: body.isDemoWeekPreview,
    clinikoAppointmentId: body.clinikoAppointmentId,
  });

  const httpStatus =
    result.status === "blocked"
      ? 403
      : result.status === "failed"
        ? 502
        : 200;

  return NextResponse.json({
    ...result,
    mode: result.mode,
  }, { status: httpStatus });
}
