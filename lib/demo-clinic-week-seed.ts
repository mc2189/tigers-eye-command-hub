import "server-only";

import {
  DEMO_CLINIC_WEEK_SCENARIOS,
  getDemoClinicWeekDate,
  getDemoClinicWeekEndTime,
} from "@/lib/demo-clinic-week";
import {
  createTestIndividualAppointment,
  getClinikoConfig,
  getDemoIndividualAppointments,
  resolvePractitionerForBooking,
  clinikoFetch,
} from "@/lib/cliniko";
import {
  DEMO_PATIENT_FIRST_NAME_PREFIX,
  type DemoTestLabActionResult,
  type ProofStatus,
} from "@/lib/cliniko-test-lab";

export interface DemoClinicWeekSeedResult {
  ok: boolean;
  proofStatus: ProofStatus;
  message: string;
  patientsCreated: number;
  appointmentsCreated: number;
  followUpAppointmentsCreated: number;
  noteDraftsPrepared: number;
  invoiceDraftsPrepared: number;
  skippedExisting: number;
  failed: number;
  warnings: string[];
  details: string[];
}

function splitDemoName(label: string): { firstName: string; lastName: string } {
  const parts = label.replace(/^DEMO\s+/i, "").trim().split(/\s+/);
  return {
    firstName: `${DEMO_PATIENT_FIRST_NAME_PREFIX} ${parts[0] ?? "Patient"}`,
    lastName: parts.slice(1).join(" ") || "Week",
  };
}

async function findExistingDemoPatient(
  firstName: string,
  lastName: string
): Promise<string | null> {
  try {
    const res = await clinikoFetch<{ patients?: { id?: string; first_name?: string; last_name?: string }[] }>(
      "/patients?per_page=100&q[]=first_name:~DEMO"
    );
    const match = (res.patients ?? []).find(
      (p) =>
        p.first_name?.startsWith("DEMO") &&
        p.first_name === firstName &&
        p.last_name === lastName
    );
    return match?.id ?? null;
  } catch {
    return null;
  }
}

async function createDemoPatientRecord(
  firstName: string,
  lastName: string,
  email: string
): Promise<{ id: string; created: boolean }> {
  const existing = await findExistingDemoPatient(firstName, lastName);
  if (existing) return { id: existing, created: false };

  const res = await clinikoFetch<{ patient?: { id?: string } }>("/patients", {
    method: "POST",
    body: JSON.stringify({
      patient: {
        first_name: firstName,
        last_name: lastName,
        email,
      },
    }),
  });
  const id = res.patient?.id;
  if (!id) throw new Error(`Could not create DEMO patient ${firstName} ${lastName}`);
  return { id, created: true };
}

function buildStartsAt(date: string, time: string): string {
  return `${date}T${time}:00`;
}

export async function previewDemoClinicWeek(): Promise<DemoClinicWeekSeedResult> {
  const scenarios = DEMO_CLINIC_WEEK_SCENARIOS.filter((s) => !s.cancelled);
  return {
    ok: true,
    proofStatus: "proven",
    message: `Preview: ${scenarios.length} DEMO appointments across ${new Set(scenarios.map((s) => s.patientLabel)).size} clients.`,
    patientsCreated: 0,
    appointmentsCreated: 0,
    followUpAppointmentsCreated: 0,
    noteDraftsPrepared: scenarios.length,
    invoiceDraftsPrepared: scenarios.length,
    skippedExisting: 0,
    failed: 0,
    warnings: [],
    details: scenarios.map(
      (s) =>
        `${getDemoClinicWeekDate(s)} ${s.time} — ${s.patientLabel} — ${s.appointmentType}`
    ),
  };
}

export async function seedDemoClinicWeek(): Promise<DemoTestLabActionResult> {
  const config = getClinikoConfig();
  if (!config.apiKey) {
    return {
      ok: false,
      action: "seed_demo_clinic_week",
      proofStatus: "needs-setup",
      message: "Cliniko API key not configured.",
    };
  }
  if (!config.writesEnabled) {
    return {
      ok: false,
      action: "seed_demo_clinic_week",
      proofStatus: "needs-setup",
      message: "Cliniko writes disabled. Set CLINIKO_ENABLE_WRITES=true to seed DEMO clinic week.",
    };
  }

  const result: DemoClinicWeekSeedResult = {
    ok: true,
    proofStatus: "proven",
    message: "",
    patientsCreated: 0,
    appointmentsCreated: 0,
    followUpAppointmentsCreated: 0,
    noteDraftsPrepared: 0,
    invoiceDraftsPrepared: 0,
    skippedExisting: 0,
    failed: 0,
    warnings: [],
    details: [],
  };

  try {
    const practitioner = await resolvePractitionerForBooking();
    if (!practitioner?.practitionerId) {
      return {
        ok: false,
        action: "seed_demo_clinic_week",
        proofStatus: "needs-setup",
        message: "No bookable practitioner found in Cliniko test account.",
      };
    }

    const businesses = await clinikoFetch<{ businesses?: { id?: string }[] }>("/businesses?per_page=5");
    const businessId = businesses.businesses?.[0]?.id;
    if (!businessId) {
      return {
        ok: false,
        action: "seed_demo_clinic_week",
        proofStatus: "needs-setup",
        message: "No business/location found in Cliniko test account.",
      };
    }

    const appointmentTypes = await clinikoFetch<{ appointment_types?: { id?: string; name?: string }[] }>(
      "/appointment_types?per_page=50"
    );
    const defaultTypeId = appointmentTypes.appointment_types?.[0]?.id;
    if (!defaultTypeId) {
      return {
        ok: false,
        action: "seed_demo_clinic_week",
        proofStatus: "needs-setup",
        message: "No appointment type found in Cliniko test account.",
      };
    }

    const from = new Date();
    from.setDate(from.getDate() - 7);
    const to = new Date();
    to.setDate(to.getDate() + 14);
    const existingResult = await getDemoIndividualAppointments({
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    });
    const existingAppts = existingResult.data?.appointments ?? [];
    const existingLabels = new Set(
      existingAppts.map((a) => a.patientLabel?.toLowerCase()).filter(Boolean)
    );

    const patientIdMap = new Map<string, string>();

    for (const scenario of DEMO_CLINIC_WEEK_SCENARIOS.filter((s) => !s.cancelled)) {
      const { firstName, lastName } = splitDemoName(scenario.patientLabel);
      const email = scenario.clientProfile.email;

      try {
        let patientId = patientIdMap.get(scenario.patientLabel);
        if (!patientId) {
          const { id, created } = await createDemoPatientRecord(firstName, lastName, email);
          patientId = id;
          patientIdMap.set(scenario.patientLabel, id);
          if (created) result.patientsCreated++;
          else result.skippedExisting++;
        }

        if (existingLabels.has(scenario.patientLabel.toLowerCase())) {
          result.skippedExisting++;
          result.details.push(`Skipped existing appointment pattern for ${scenario.patientLabel}`);
          continue;
        }

        const date = getDemoClinicWeekDate(scenario);
        const startsAt = buildStartsAt(date, scenario.time);
        const endsAt = buildStartsAt(date, getDemoClinicWeekEndTime(scenario));

        const createResult = await createTestIndividualAppointment({
          patientId,
          businessId,
          practitionerId: practitioner.practitionerId,
          appointmentTypeId: defaultTypeId,
          startsAt,
          endsAt,
        });

        if (!createResult.ok) {
          throw new Error(createResult.error ?? "Appointment create failed");
        }

        result.appointmentsCreated++;
        scenario.clinikoSaved.patient = true;
        scenario.clinikoSaved.appointment = true;
        result.details.push(`Created: ${date} ${scenario.time} — ${scenario.patientLabel}`);

        result.noteDraftsPrepared++;
        result.invoiceDraftsPrepared++;

        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        result.failed++;
        result.warnings.push(
          `${scenario.patientLabel}: ${err instanceof Error ? err.message : "Failed"}`
        );
      }
    }

    result.message = `Seeded ${result.patientsCreated} patients, ${result.appointmentsCreated} appointments. ${result.noteDraftsPrepared} note drafts prepared. ${result.invoiceDraftsPrepared} invoice drafts prepared.`;
    if (result.failed > 0) result.proofStatus = "failed";
    if (result.warnings.length) result.proofStatus = result.failed ? "failed" : "needs-setup";

    return {
      ok: result.ok && result.failed === 0,
      action: "seed_demo_clinic_week",
      proofStatus: result.proofStatus,
      message: result.message,
      result,
    };
  } catch (err) {
    return {
      ok: false,
      action: "seed_demo_clinic_week",
      proofStatus: "failed",
      message: err instanceof Error ? err.message : "Demo clinic week seed failed.",
    };
  }
}

export async function checkSeededDemoClinicWeek(): Promise<DemoTestLabActionResult> {
  try {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const to = new Date();
    to.setDate(to.getDate() + 14);
    const result = await getDemoIndividualAppointments({
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    });
    const appts = result.data?.appointments ?? [];
    const demoWeekLabels = new Set(DEMO_CLINIC_WEEK_SCENARIOS.map((s) => s.patientLabel.toLowerCase()));
    const matched = appts.filter((a) =>
      demoWeekLabels.has((a.patientLabel ?? "").toLowerCase())
    );
    return {
      ok: true,
      action: "check_demo_clinic_week",
      proofStatus: matched.length > 0 ? "proven" : "not-tested",
      message: `Found ${matched.length} DEMO clinic week appointments in Cliniko test account.`,
      result: { matched: matched.length, total: appts.length },
    };
  } catch (err) {
    return {
      ok: false,
      action: "check_demo_clinic_week",
      proofStatus: "failed",
      message: err instanceof Error ? err.message : "Check failed.",
    };
  }
}

export async function cleanupDemoClinicWeek(): Promise<DemoTestLabActionResult> {
  const config = getClinikoConfig();
  if (!config.writesEnabled) {
    return {
      ok: false,
      action: "cleanup_demo_clinic_week",
      proofStatus: "needs-setup",
      message: "Cliniko writes disabled.",
    };
  }

  const weekLabels = new Set(DEMO_CLINIC_WEEK_SCENARIOS.map((s) => s.patientLabel.toLowerCase()));
  let cancelled = 0;
  let archived = 0;
  const warnings: string[] = [];

  try {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const to = new Date();
    to.setDate(to.getDate() + 14);
    const apptResult = await getDemoIndividualAppointments({
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    });
    const appts = apptResult.data?.appointments ?? [];
    for (const appt of appts) {
      if (!weekLabels.has((appt.patientLabel ?? "").toLowerCase())) continue;
      try {
        await clinikoFetch(`/individual_appointments/${appt.id}/cancel`, { method: "PATCH" });
        cancelled++;
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        warnings.push(`Cancel ${appt.id}: ${err instanceof Error ? err.message : "failed"}`);
      }
    }

    const patients = await clinikoFetch<{ patients?: { id?: string; first_name?: string; last_name?: string }[] }>(
      "/patients?per_page=100&q[]=first_name:~DEMO"
    );
    for (const p of patients.patients ?? []) {
      const label = `DEMO ${p.last_name}`.toLowerCase();
      const fullLabel = `${p.first_name} ${p.last_name}`.toLowerCase();
      const isWeekPatient = [...weekLabels].some(
        (wl) => fullLabel.includes(wl.replace("demo ", "")) || label.includes("week")
      );
      if (!isWeekPatient && !p.first_name?.includes("DEMO")) continue;
      const scenarioMatch = DEMO_CLINIC_WEEK_SCENARIOS.some((s) => {
        const { firstName, lastName } = splitDemoName(s.patientLabel);
        return p.first_name === firstName && p.last_name === lastName;
      });
      if (!scenarioMatch) continue;
      try {
        await clinikoFetch(`/patients/${p.id}`, { method: "DELETE" });
        archived++;
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        warnings.push(`Archive ${p.id}: ${err instanceof Error ? err.message : "failed"}`);
      }
    }

    for (const s of DEMO_CLINIC_WEEK_SCENARIOS) {
      s.clinikoSaved = { patient: false, appointment: false, note: false, invoice: false };
    }

    return {
      ok: warnings.length === 0,
      action: "cleanup_demo_clinic_week",
      proofStatus: warnings.length ? "needs-setup" : "proven",
      message: `Cancelled ${cancelled} appointments, archived ${archived} DEMO patients.`,
      result: { cancelled, archived, warnings },
    };
  } catch (err) {
    return {
      ok: false,
      action: "cleanup_demo_clinic_week",
      proofStatus: "failed",
      message: err instanceof Error ? err.message : "Cleanup failed.",
    };
  }
}
