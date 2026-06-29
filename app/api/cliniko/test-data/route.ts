import { NextRequest, NextResponse } from "next/server";
import {
  archiveDemoPatient,
  cancelDemoAppointment,
  cleanupDemoTestData,
  createDemoAppointment,
  createDemoPatient,
  getDemoTestLabSnapshot,
  updateDemoPatient,
} from "@/lib/cliniko-test-lab";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getDemoTestLabSnapshot();
  return NextResponse.json(snapshot);
}

interface TestDataBody {
  action:
    | "create-patient"
    | "update-patient"
    | "create-appointment"
    | "cancel-appointment"
    | "archive-patient"
    | "cleanup";
  patientId?: string;
  appointmentId?: string;
  lastName?: string;
  businessId?: string;
  practitionerId?: string;
  appointmentTypeId?: string;
}

export async function POST(request: NextRequest) {
  let body: TestDataBody;
  try {
    body = (await request.json()) as TestDataBody;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  let result;
  switch (body.action) {
    case "create-patient":
      result = await createDemoPatient();
      break;
    case "update-patient":
      if (!body.patientId) {
        return NextResponse.json(
          { ok: false, message: "patientId is required." },
          { status: 400 }
        );
      }
      result = await updateDemoPatient(body.patientId, { lastName: body.lastName });
      break;
    case "create-appointment":
      result = await createDemoAppointment({
        patientId: body.patientId,
        businessId: body.businessId,
        practitionerId: body.practitionerId,
        appointmentTypeId: body.appointmentTypeId,
      });
      break;
    case "cancel-appointment":
      if (!body.appointmentId) {
        return NextResponse.json(
          { ok: false, message: "appointmentId is required." },
          { status: 400 }
        );
      }
      result = await cancelDemoAppointment(body.appointmentId);
      break;
    case "archive-patient":
      if (!body.patientId) {
        return NextResponse.json(
          { ok: false, message: "patientId is required." },
          { status: 400 }
        );
      }
      result = await archiveDemoPatient(body.patientId);
      break;
    case "cleanup":
      result = await cleanupDemoTestData();
      break;
    default:
      return NextResponse.json({ ok: false, message: "Unknown action." }, { status: 400 });
  }

  const status = result.ok ? 200 : result.mode === "blocked" ? 403 : 502;
  return NextResponse.json(result, { status });
}
