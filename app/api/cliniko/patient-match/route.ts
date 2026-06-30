import { NextRequest, NextResponse } from "next/server";
import { clinikoFetch, getClinikoConfig } from "@/lib/cliniko";
import {
  matchBookingIntake,
  type BookingIntakeInput,
} from "@/lib/cliniko-patient-matching";
import { DEMO_CLINIC_WEEK_SCENARIOS } from "@/lib/demo-clinic-week";

export const dynamic = "force-dynamic";

async function fetchDemoPatientsFromCliniko() {
  const config = getClinikoConfig();
  if (!config.apiKey) return [];

  try {
    const res = await clinikoFetch<{
      patients?: Array<{
        id?: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        date_of_birth?: string;
      }>;
    }>("/patients?per_page=100&q[]=first_name:~DEMO");

    return (res.patients ?? [])
      .filter((p) => p.first_name?.trim().toUpperCase().startsWith("DEMO"))
      .map((p) => ({
        id: String(p.id ?? ""),
        firstName: String(p.first_name ?? ""),
        lastName: String(p.last_name ?? ""),
        email: p.email,
        phone: p.phone,
        dateOfBirth: p.date_of_birth,
      }));
  } catch {
    return [];
  }
}

function demoWeekCandidates() {
  const seen = new Set<string>();
  const candidates: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    postcode?: string;
    policyNumber?: string;
  }> = [];

  for (const s of DEMO_CLINIC_WEEK_SCENARIOS) {
    if (seen.has(s.patientLabel)) continue;
    seen.add(s.patientLabel);
    const parts = s.patientLabel.replace(/^DEMO\s+/i, "").split(/\s+/);
    candidates.push({
      id: `demo-week-${s.id}`,
      firstName: `DEMO ${parts[0] ?? "Patient"}`,
      lastName: parts.slice(1).join(" ") || "Week",
      email: s.clientProfile.email,
      phone: s.clientProfile.phone,
      dateOfBirth: s.clientProfile.dateOfBirth,
      postcode: s.clientProfile.address.includes("DD1") ? "DD1 1AA" : undefined,
      policyNumber: s.clientProfile.policyNumber,
    });
  }
  return candidates;
}

export async function POST(request: NextRequest) {
  let body: BookingIntakeInput;
  try {
    body = (await request.json()) as BookingIntakeInput;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  const clinikoPatients = await fetchDemoPatientsFromCliniko();
  const candidates = [...demoWeekCandidates(), ...clinikoPatients];
  const result = matchBookingIntake(body, candidates);

  return NextResponse.json({
    ok: true,
    ...result,
    candidateSource:
      clinikoPatients.length > 0
        ? "Cliniko test account + demo week library"
        : "Demo week library",
  });
}
