import { NextRequest, NextResponse } from "next/server";
import { createDraftTreatmentNote } from "@/lib/cliniko";

export const dynamic = "force-dynamic";

interface TreatmentNoteBody {
  bookingId?: string;
  patientId?: string;
  title?: string;
  templateName?: string;
  sections?: Record<string, string>;
  audio?: unknown;
  transcript?: unknown;
}

export async function POST(request: NextRequest) {
  let body: TreatmentNoteBody;

  try {
    body = (await request.json()) as TreatmentNoteBody;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  if (body.audio !== undefined || body.transcript !== undefined) {
    return NextResponse.json(
      {
        ok: false,
        message: "Audio and transcript payloads are not accepted.",
        localContentStored: false,
      },
      { status: 400 }
    );
  }

  if (!body.sections || typeof body.sections !== "object") {
    return NextResponse.json(
      {
        ok: false,
        message: "Structured sections are required.",
        localContentStored: false,
      },
      { status: 400 }
    );
  }

  const result = await createDraftTreatmentNote({
    bookingId: body.bookingId,
    patientId: body.patientId,
    title: body.title,
    templateName: body.templateName,
    sections: body.sections,
  });

  if (!result.ok && result.mode === "dry_run" && result.message.includes("required")) {
    return NextResponse.json(result, { status: 400 });
  }

  if (!result.ok && result.mode !== "dry_run") {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}
