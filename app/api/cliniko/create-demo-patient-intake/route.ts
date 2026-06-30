import { NextRequest, NextResponse } from "next/server";
import { clinikoFetch, getClinikoConfig } from "@/lib/cliniko";
import { validateDemoWriteInput } from "@/lib/demo-write-safety";
import { DEMO_EMAIL_DOMAIN } from "@/lib/cliniko-test-lab";

export const dynamic = "force-dynamic";

interface CreatePatientBody {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  reasonForVisit?: string;
}

export async function POST(request: NextRequest) {
  let body: CreatePatientBody;
  try {
    body = (await request.json()) as CreatePatientBody;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const safety = validateDemoWriteInput({
    firstName: body.firstName,
    lastName: body.lastName,
  });
  if (!safety.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: safety.reason,
        label: "Unsafe/non-DEMO input blocked",
      },
      { status: 403 }
    );
  }

  const config = getClinikoConfig();
  if (!config.apiKey) {
    return NextResponse.json({
      ok: false,
      mode: "prepared",
      message: "Cliniko not configured — patient prepared only.",
      label: "Prepared for Cliniko",
    });
  }

  if (!config.writesEnabled) {
    return NextResponse.json({
      ok: false,
      mode: "prepared",
      message: "Cliniko writes disabled — patient prepared only.",
      label: "Prepared for Cliniko",
    });
  }

  const email =
    body.email?.trim() ||
    `${body.firstName}.${body.lastName}@${DEMO_EMAIL_DOMAIN}`.toLowerCase().replace(/\s+/g, ".");

  try {
    const created = await clinikoFetch<{ patient?: { id?: string; first_name?: string; last_name?: string } }>(
      "/patients",
      {
        method: "POST",
        body: JSON.stringify({
          patient: {
            first_name: body.firstName.trim(),
            last_name: body.lastName.trim(),
            email,
          },
        }),
      }
    );

    const patientId = created.patient?.id ? String(created.patient.id) : undefined;
    if (!patientId) {
      return NextResponse.json(
        { ok: false, message: "Cliniko did not return a patient ID." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      mode: "created",
      message: "Patient created in Cliniko test account",
      label: "Saved to Cliniko test account",
      patientId,
      patient: {
        id: patientId,
        firstName: created.patient?.first_name,
        lastName: created.patient?.last_name,
        email,
      },
      preparedOnly: {
        phone: body.phone,
        dateOfBirth: body.dateOfBirth,
        address: body.address,
        emergencyContact: body.emergencyContact,
        reasonForVisit: body.reasonForVisit,
        note: "Prepared for Cliniko — field not currently written by API",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        message: err instanceof Error ? err.message : "Patient creation failed.",
        label: "Prepared for Cliniko",
      },
      { status: 502 }
    );
  }
}
