import { NextRequest, NextResponse } from "next/server";
import { fetchPatientSnapshot } from "@/lib/demo-patient-update";
import {
  reconcilePatientFields,
  type IntakeSnapshot,
} from "@/lib/patient-field-reconciliation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    patientId?: string;
    intakeSnapshot?: IntakeSnapshot;
    staffConfirmationRequired?: boolean;
    linkedToCliniko?: boolean;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  if (!body.patientId?.trim()) {
    return NextResponse.json({ ok: false, message: "patientId is required." }, { status: 400 });
  }
  if (!body.intakeSnapshot) {
    return NextResponse.json({ ok: false, message: "intakeSnapshot is required." }, { status: 400 });
  }

  const fetched = await fetchPatientSnapshot(body.patientId);
  if (!fetched.ok || !fetched.snapshot) {
    return NextResponse.json(
      {
        ok: false,
        message: fetched.message ?? "Could not load patient for reconciliation.",
        blocked: true,
      },
      { status: fetched.message?.includes("Blocked") ? 403 : 404 }
    );
  }

  const linkedToCliniko =
    body.linkedToCliniko ?? !body.patientId.startsWith("demo-week-");

  const reconciliation = reconcilePatientFields(body.intakeSnapshot, fetched.snapshot, {
    staffConfirmationRequired: body.staffConfirmationRequired ?? false,
    linkedToCliniko,
  });

  return NextResponse.json({
    ok: true,
    patientId: body.patientId,
    ...reconciliation,
  });
}
