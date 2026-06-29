import { NextRequest, NextResponse } from "next/server";
import {
  archiveDemoPatient,
  cancelDemoAppointment,
  checkDemoAppointments,
  cleanupDemoTestData,
  createDemoAppointment,
  createDemoPatient,
  getDemoTestLabSnapshot,
  lookupDemoAppointmentById,
  runAppointmentDiscoveryProbe,
  updateDemoPatient,
  type DemoTestLabSnapshot,
  type TestLabAction,
} from "@/lib/cliniko-test-lab";

export const dynamic = "force-dynamic";

function emptySnapshot(message: string): DemoTestLabSnapshot {
  const generatedAt = new Date().toISOString();
  return {
    ok: false,
    source: "unavailable",
    mode: "unavailable",
    writesEnabled: false,
    message,
    generatedAt,
    counts: { patients: 0, appointments: 0 },
    demoFallbackActive: false,
    patients: [],
    appointments: [],
    businesses: [],
    appointmentTypes: [],
    practitionerSource: "none",
    practitionerBookable: false,
    practitionerSourceLabel: "none",
    appointmentSourceDiagnostics: {
      lastRefreshAt: generatedAt,
      endpoint: "/individual_appointments",
      returnedByCliniko: 0,
      excludedInvalid: 0,
      displayed: 0,
      demoFallbackActive: false,
      localProofStateActive: false,
      warnings: [message],
    },
  };
}

function formatSnapshotResponse(snapshot: DemoTestLabSnapshot) {
  return {
    ok: snapshot.ok,
    source: snapshot.source,
    mode: snapshot.mode,
    writesEnabled: snapshot.writesEnabled,
    message: snapshot.message,
    generatedAt: snapshot.generatedAt,
    counts: snapshot.counts,
    demoFallbackActive: snapshot.demoFallbackActive,
    patients: snapshot.patients ?? [],
    appointments: snapshot.appointments ?? [],
    businesses: snapshot.businesses ?? [],
    appointmentTypes: snapshot.appointmentTypes ?? [],
    practitionerSource: snapshot.practitionerSource,
    practitionerBookable: snapshot.practitionerBookable,
    practitionerId: snapshot.practitionerId,
    practitionerName: snapshot.practitionerName,
    practitionerSourceLabel: snapshot.practitionerSourceLabel,
    defaults: snapshot.defaults,
    preflight: snapshot.preflight,
    proofDiagnostics: snapshot.proofDiagnostics,
    appointmentSourceDiagnostics: snapshot.appointmentSourceDiagnostics,
    diagnostics: snapshot.appointmentSourceDiagnostics,
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
    return NextResponse.json(formatSnapshotResponse(snapshot));
  } catch (err) {
    return NextResponse.json(
      formatSnapshotResponse(
        emptySnapshot(
          err instanceof Error ? err.message : "Could not load Cliniko test lab snapshot."
        )
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
        source: "unavailable",
        patients: [],
        appointments: [],
        counts: { patients: 0, appointments: 0 },
        generatedAt: new Date().toISOString(),
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
            source: "unavailable",
            patients: [],
            appointments: [],
            counts: { patients: 0, appointments: 0 },
            generatedAt: new Date().toISOString(),
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
            source: "unavailable",
            patients: [],
            appointments: [],
            counts: { patients: 0, appointments: 0 },
            generatedAt: new Date().toISOString(),
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
            source: "unavailable",
            patients: [],
            appointments: [],
            counts: { patients: 0, appointments: 0 },
            generatedAt: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
      result = await archiveDemoPatient(body.patientId);
      break;
    case "check_demo_appointments":
      result = await checkDemoAppointments();
      break;
    case "probe_individual_appointments":
      result = await runAppointmentDiscoveryProbe({
        businessId: body.businessId,
        practitionerId: body.practitionerId,
      });
      break;
    case "lookup_appointment_by_id":
      if (!body.appointmentId) {
        return NextResponse.json(
          {
            ok: false,
            action: body.action,
            proofStatus: "failed",
            message: "appointmentId is required.",
            source: "unavailable",
            patients: [],
            appointments: [],
            counts: { patients: 0, appointments: 0 },
            generatedAt: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
      result = await lookupDemoAppointmentById(body.appointmentId);
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
          source: "unavailable",
          patients: [],
          appointments: [],
          counts: { patients: 0, appointments: 0 },
          generatedAt: new Date().toISOString(),
        },
        { status: 400 }
      );
  }

  const snapshot =
    body.action === "check_demo_appointments" ||
    body.action === "cleanup_demo_records" ||
    body.action === "probe_individual_appointments" ||
    body.action === "lookup_appointment_by_id"
      ? await getDemoTestLabSnapshot()
      : null;

  const status = result.ok ? 200 : result.proofStatus === "needs-setup" ? 403 : 502;
  return NextResponse.json(
    {
      ...result,
      source: snapshot?.source ?? "cliniko-test-account",
      patients: snapshot?.patients ?? [],
      appointments: snapshot?.appointments ?? [],
      counts: snapshot?.counts ?? { patients: 0, appointments: 0 },
      generatedAt: snapshot?.generatedAt ?? new Date().toISOString(),
      message: result.message,
      appointmentSourceDiagnostics: snapshot?.appointmentSourceDiagnostics,
      diagnostics: snapshot?.appointmentSourceDiagnostics ?? result.diagnostics,
    },
    { status }
  );
}
