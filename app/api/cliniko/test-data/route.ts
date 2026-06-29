import { NextRequest, NextResponse } from "next/server";
import {
  archiveDemoPatient,
  cancelDemoAppointment,
  checkDemoAppointments,
  cleanupDemoTestData,
  createDemoAppointment,
  createDemoPatient,
  getDemoTestLabSnapshot,
  updateDemoPatient,
  type DemoTestLabSnapshot,
  type TestLabAction,
} from "@/lib/cliniko-test-lab";

export const dynamic = "force-dynamic";

function emptySnapshot(message: string): DemoTestLabSnapshot {
  return {
    ok: false,
    mode: "unavailable",
    writesEnabled: false,
    message,
    patients: [],
    appointments: [],
    businesses: [],
    appointmentTypes: [],
    practitionerSource: "none",
    practitionerBookable: false,
    practitionerSourceLabel: "none",
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const snapshot = await getDemoTestLabSnapshot({
      patientId: searchParams.get("patientId") ?? undefined,
      businessId: searchParams.get("businessId") ?? undefined,
      practitionerId: searchParams.get("practitionerId") ?? undefined,
      appointmentTypeId: searchParams.get("appointmentTypeId") ?? undefined,
    });
    return NextResponse.json({
      ...snapshot,
      patients: snapshot.patients ?? [],
      appointments: snapshot.appointments ?? [],
      businesses: snapshot.businesses ?? [],
      appointmentTypes: snapshot.appointmentTypes ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      emptySnapshot(
        err instanceof Error ? err.message : "Could not load Cliniko test lab snapshot."
      ),
      { status: 502 }
    );
  }
}

interface TestDataBody {
  action: TestLabAction;
  patientId?: string;
  appointmentId?: string;
  lastName?: string;
  businessId?: string;
  practitionerId?: string;
  appointmentTypeId?: string;
  startsAt?: string;
}

export async function POST(request: NextRequest) {
  let body: TestDataBody;
  try {
    body = (await request.json()) as TestDataBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        action: "unknown",
        proofStatus: "failed",
        message: "Invalid JSON.",
      },
      { status: 400 }
    );
  }

  let result;
  switch (body.action) {
    case "create_demo_patient":
      result = await createDemoPatient();
      break;
    case "update_demo_patient":
      if (!body.patientId) {
        return NextResponse.json(
          {
            ok: false,
            action: body.action,
            proofStatus: "failed",
            message: "patientId is required.",
          },
          { status: 400 }
        );
      }
      result = await updateDemoPatient(body.patientId, { lastName: body.lastName });
      break;
    case "create_demo_appointment":
      result = await createDemoAppointment({
        patientId: body.patientId,
        businessId: body.businessId,
        practitionerId: body.practitionerId,
        appointmentTypeId: body.appointmentTypeId,
        startsAt: body.startsAt,
      });
      break;
    case "cancel_demo_appointment":
      if (!body.appointmentId) {
        return NextResponse.json(
          {
            ok: false,
            action: body.action,
            proofStatus: "failed",
            message: "appointmentId is required.",
          },
          { status: 400 }
        );
      }
      result = await cancelDemoAppointment(body.appointmentId);
      break;
    case "archive_demo_patient":
      if (!body.patientId) {
        return NextResponse.json(
          {
            ok: false,
            action: body.action,
            proofStatus: "failed",
            message: "patientId is required.",
          },
          { status: 400 }
        );
      }
      result = await archiveDemoPatient(body.patientId);
      break;
    case "check_demo_appointments":
      result = await checkDemoAppointments();
      break;
    case "cleanup_demo_records":
      result = await cleanupDemoTestData();
      break;
    default:
      return NextResponse.json(
        {
          ok: false,
          action: "unknown",
          proofStatus: "failed",
          message: "Unknown action.",
        },
        { status: 400 }
      );
  }

  const status = result.ok ? 200 : result.proofStatus === "needs-setup" ? 403 : 502;
  return NextResponse.json(
    {
      ...result,
      patients: [],
      appointments: [],
    },
    { status }
  );
}
