import "server-only";

import {
  createTestIndividualAppointment,
  getAppointmentTypes,
  getBusinesses,
  getClinikoConfig,
  resolvePractitionerForBooking,
} from "@/lib/cliniko";
import { clinikoFetch } from "@/lib/cliniko";
import { isDemoSafeFirstName } from "@/lib/demo-write-safety";
import { buildClinikoDateTime, offsetClinikoDate } from "@/lib/cliniko-query";

export interface DemoFollowUpBookingInput {
  patientId: string;
  patientFirstName?: string;
  suggestedInDays?: number;
  durationMinutes?: number;
  appointmentTypeName?: string;
  startsAt?: string;
}

export interface DemoFollowUpBookingResult {
  ok: boolean;
  status: "created" | "duplicate" | "prepared-only" | "blocked" | "failed";
  message: string;
  label: string;
  appointmentId?: string;
  startsAt?: string;
  endsAt?: string;
  duplicateOf?: string;
}

async function assertDemoPatientId(patientId: string): Promise<void> {
  const raw = await clinikoFetch<{ patient?: { first_name?: string } }>(
    `/patients/${patientId}`
  );
  const firstName = raw.patient?.first_name ?? "";
  if (!isDemoSafeFirstName(firstName)) {
    throw new Error("Only DEMO-linked patients can receive follow-up bookings.");
  }
}

function buildSuggestedStartsAt(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

function sameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

function withinMinutes(a: string, b: string, windowMinutes: number): boolean {
  const diff = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return diff <= windowMinutes * 60 * 1000;
}

export async function findDuplicateFollowUp(input: {
  patientId: string;
  startsAt: string;
  appointmentTypeId?: string;
}): Promise<{ duplicate: boolean; existingId?: string }> {
  const startsDate = new Date(input.startsAt);
  const from = buildClinikoDateTime(offsetClinikoDate(-1, startsDate));
  const to = buildClinikoDateTime(offsetClinikoDate(1, startsDate));

  try {
    const res = await clinikoFetch<{
      individual_appointments?: Array<{
        id?: string;
        starts_at?: string;
        appointment_type_id?: string;
        patient_id?: string;
        cancelled_at?: string | null;
      }>;
    }>(
      `/individual_appointments?per_page=50&q[]=patient_id:=${input.patientId}&q[]=starts_at:>=${from}&q[]=starts_at:<=${to}`
    );

    for (const appt of res.individual_appointments ?? []) {
      if (appt.cancelled_at) continue;
      if (!appt.starts_at || !sameDay(appt.starts_at, input.startsAt)) continue;
      if (!withinMinutes(appt.starts_at, input.startsAt, 120)) continue;
      if (
        input.appointmentTypeId &&
        appt.appointment_type_id &&
        String(appt.appointment_type_id) !== String(input.appointmentTypeId)
      ) {
        continue;
      }
      return { duplicate: true, existingId: appt.id ? String(appt.id) : undefined };
    }
  } catch {
    /* duplicate check is best-effort */
  }

  return { duplicate: false };
}

export async function createDemoFollowUpBooking(
  input: DemoFollowUpBookingInput
): Promise<DemoFollowUpBookingResult> {
  const config = getClinikoConfig();
  if (!config.apiKey || !config.writesEnabled) {
    return {
      ok: false,
      status: "prepared-only",
      message: "Cliniko writes not available — follow-up prepared only.",
      label: "Prepared for Cliniko",
    };
  }

  if (!input.patientId?.trim()) {
    return {
      ok: false,
      status: "blocked",
      message: "Patient must be DEMO-linked before booking a follow-up.",
      label: "Prepared follow-up appointment — not yet booked in Cliniko",
    };
  }

  try {
    await assertDemoPatientId(input.patientId);
  } catch (err) {
    return {
      ok: false,
      status: "blocked",
      message: err instanceof Error ? err.message : "DEMO patient check failed.",
      label: "Prepared follow-up appointment — not yet booked in Cliniko",
    };
  }

  const practitionerResolution = await resolvePractitionerForBooking();
  if (!practitionerResolution.bookable || !practitionerResolution.practitionerId) {
    return {
      ok: false,
      status: "prepared-only",
      message: practitionerResolution.message ?? "No bookable practitioner available.",
      label: "Prepared for Cliniko — booking was not created",
    };
  }

  const businesses = await getBusinesses();
  const businessId = businesses.data?.[0]?.id;
  const types = await getAppointmentTypes();
  const appointmentType =
    types.data?.find(
      (t) =>
        !t.archived &&
        (input.appointmentTypeName
          ? t.name.toLowerCase().includes("follow") ||
            t.name.toLowerCase().includes("review") ||
            t.name.toLowerCase().includes("physio")
          : true)
    ) ?? types.data?.find((t) => !t.archived);

  const appointmentTypeId = appointmentType?.id;
  const durationMinutes =
    input.durationMinutes ?? appointmentType?.durationMinutes ?? 45;

  const startsAt =
    input.startsAt ?? buildSuggestedStartsAt(input.suggestedInDays ?? 7);
  const endsAt = new Date(
    new Date(startsAt).getTime() + durationMinutes * 60 * 1000
  ).toISOString();

  if (!businessId || !appointmentTypeId) {
    return {
      ok: false,
      status: "prepared-only",
      message: "Missing Cliniko business or appointment type for follow-up.",
      label: "Prepared for Cliniko — booking was not created",
    };
  }

  const dup = await findDuplicateFollowUp({
    patientId: input.patientId,
    startsAt,
    appointmentTypeId,
  });

  if (dup.duplicate) {
    return {
      ok: true,
      status: "duplicate",
      message: "Follow-up already exists in Cliniko test account",
      label: "Saved to Cliniko test account",
      duplicateOf: dup.existingId,
      startsAt,
      endsAt,
    };
  }

  const created = await createTestIndividualAppointment({
    patientId: input.patientId,
    businessId,
    practitionerId: practitionerResolution.practitionerId,
    appointmentTypeId,
    startsAt,
    endsAt,
  });

  if (!created.ok || !created.data?.id) {
    return {
      ok: false,
      status: "failed",
      message: created.error ?? "Follow-up booking was not created.",
      label: "Prepared for Cliniko — booking was not created",
      startsAt,
      endsAt,
    };
  }

  return {
    ok: true,
    status: "created",
    message: "Follow-up appointment saved to Cliniko test account",
    label: "Saved to Cliniko test account",
    appointmentId: created.data.id,
    startsAt,
    endsAt,
  };
}
