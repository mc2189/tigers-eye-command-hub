import { NextRequest, NextResponse } from "next/server";
import {
  updateDemoPatientWithVerification,
  type DemoPatientUpdateInput,
} from "@/lib/demo-patient-update";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: DemoPatientUpdateInput;
  try {
    body = (await request.json()) as DemoPatientUpdateInput;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  if (!body.patientId?.trim()) {
    return NextResponse.json({ ok: false, message: "patientId is required." }, { status: 400 });
  }

  const result = await updateDemoPatientWithVerification(body);

  if (result.status === "blocked") {
    return NextResponse.json(
      {
        ok: false,
        status: result.status,
        uiLabel: result.uiLabel,
        message: result.message,
        savedFields: result.savedFields,
        unchangedFields: result.unchangedFields,
        preparedOnlyFields: result.preparedOnlyFields,
        failedFields: result.failedFields,
        warnings: result.warnings,
        verification: result.verification,
      },
      { status: 403 }
    );
  }

  const httpStatus =
    result.status === "updated" || result.status === "verification-incomplete"
      ? 200
      : result.status === "prepared-only"
        ? 200
        : 502;

  return NextResponse.json(
    {
      ok: result.ok,
      status: result.status,
      uiLabel: result.uiLabel,
      message: result.message,
      patientId: result.patientId,
      savedFields: result.savedFields,
      unchangedFields: result.unchangedFields,
      preparedOnlyFields: result.preparedOnlyFields,
      failedFields: result.failedFields,
      warnings: result.warnings,
      verification: result.verification,
    },
    { status: httpStatus }
  );
}
