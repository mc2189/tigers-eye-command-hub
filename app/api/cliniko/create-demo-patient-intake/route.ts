import { NextRequest, NextResponse } from "next/server";
import {
  createDemoPatientWithVerification,
  type CreateDemoPatientInput,
} from "@/lib/demo-patient-create";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: CreateDemoPatientInput;
  try {
    body = (await request.json()) as CreateDemoPatientInput;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const result = await createDemoPatientWithVerification(body);

  if (result.status === "blocked") {
    return NextResponse.json(
      {
        ok: false,
        status: result.status,
        message: result.message,
        label: "Blocked from writing",
        savedFields: result.savedFields,
        preparedOnlyFields: result.preparedOnlyFields,
        warnings: result.warnings,
        verified: false,
      },
      { status: 403 }
    );
  }

  const httpStatus =
    result.status === "created" ? 200 : result.status === "prepared-only" ? 200 : 502;

  return NextResponse.json(
    {
      ok: result.ok,
      status: result.status,
      mode: result.status === "created" ? "created" : "prepared",
      message: result.message,
      label: result.label,
      patientId: result.patientId,
      patient: result.patientId
        ? { id: result.patientId, firstName: body.firstName, lastName: body.lastName }
        : undefined,
      savedFields: result.savedFields,
      preparedOnlyFields: result.preparedOnlyFields,
      warnings: result.warnings,
      verified: result.verified,
      verificationMessage: result.verificationMessage,
    },
    { status: httpStatus }
  );
}
