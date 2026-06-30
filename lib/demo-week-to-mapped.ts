/**
 * Maps Demo Clinic Week scenarios to MappedBooking for workflow engine consumption.
 */

import type { MappedBooking, MappedCalendarItem } from "@/lib/cliniko-mappers";
import {
  DEMO_CLINIC_WEEK_SCENARIOS,
  getDemoClinicWeekDate,
  getDemoClinicWeekEndTime,
  type DemoClinicWeekScenario,
} from "@/lib/demo-clinic-week";
import type { BookingSource, PractitionerId } from "@/lib/demo-data";

function initials(name: string): string {
  const parts = name.replace(/^DEMO\s+/i, "").split(/\s+/);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("").slice(0, 3);
}

function workstreamFor(scenario: DemoClinicWeekScenario): MappedBooking["workstream"] {
  if (scenario.workflowScenario.startsWith("insurance")) return "insurance";
  if (scenario.workflowScenario === "telehealth") return "telehealth";
  if (scenario.workflowScenario === "external-work") return "external";
  return "private";
}

function bookingSourceFor(scenario: DemoClinicWeekScenario): BookingSource {
  const ws = workstreamFor(scenario);
  if (ws === "insurance") return "cliniko-insurance";
  if (ws === "telehealth") return "telehealth";
  if (ws === "external") return "external-work";
  return "cliniko-private";
}

function mapScenarioToBooking(
  scenario: DemoClinicWeekScenario,
  dataSource: "demo" | "cliniko-test" = "demo"
): MappedBooking {
  const date = getDemoClinicWeekDate(scenario);
  const endTime = getDemoClinicWeekEndTime(scenario);
  const today = new Date().toISOString().split("T")[0];
  const ws = workstreamFor(scenario);

  const insuranceContext =
    ws === "insurance"
      ? {
          likelyInsurance: true as const,
          likelyInsurer: scenario.clientProfile.insurer,
          missingFields: scenario.invoiceDraft.missingDetails ?? [],
          recommendation: scenario.invoiceDraft.suggestedNextStep,
        }
      : undefined;

  return {
    id: scenario.id,
    clinikoId: scenario.clinikoSaved.appointment ? scenario.id : "",
    dataSource,
    date,
    time: scenario.time,
    endsAt: `${date}T${endTime}:00`,
    endTime,
    clientName: scenario.patientLabel,
    clientInitials: initials(scenario.patientLabel),
    appointmentTypeName: scenario.appointmentType,
    appointmentTypeId: scenario.workflowScenario,
    practitionerName: scenario.preferredPractitioner,
    practitionerId: scenario.practitionerId,
    practitionerMatched: true,
    businessName: scenario.location,
    locationId: scenario.locationId,
    locationLabel: scenario.location,
    source: bookingSourceFor(scenario),
    workstream: ws,
    paymentRule:
      ws === "insurance"
        ? "Insurance-funded — invoice insurer after session"
        : "Private payment at appointment",
    paymentStatus: scenario.paymentStatus,
    noteStatus: scenario.noteStatus,
    invoiceStatus: scenario.invoiceStatus,
    estimatedFee: scenario.expectedFee,
    priceSource: scenario.expectedFee > 0 ? "fallback" : "missing",
    stockImpact: scenario.stockScenario ?? [],
    insuranceContext,
    warnings: [],
    isPast: date < today,
    isToday: date === today,
    clinikoRef: scenario.clinikoSaved.appointment ? `CLN-DEMO-${scenario.id}` : "",
  };
}

export function mapDemoClinicWeekToBookings(
  dataSource: "demo" | "cliniko-test" = "demo"
): MappedBooking[] {
  return DEMO_CLINIC_WEEK_SCENARIOS.filter((s) => !s.cancelled)
    .map((s) => mapScenarioToBooking(s, dataSource))
    .sort((a, b) => {
      const da = `${a.date}T${a.time}`;
      const db = `${b.date}T${b.time}`;
      return da.localeCompare(db);
    });
}

export function mapDemoClinicWeekToCalendarItems(): MappedCalendarItem[] {
  return mapDemoClinicWeekToBookings().map((b) => ({
    id: b.id,
    date: b.date,
    startTime: b.time,
    endTime: b.endTime,
    title: b.appointmentTypeName,
    clientName: b.clientName,
    practitionerId: b.practitionerId as PractitionerId,
    practitionerName: b.practitionerName,
    practitionerMatched: true,
    locationId: b.locationId,
    source: b.source,
    paymentStatus: b.paymentStatus,
    noteStatus: b.noteStatus,
    invoiceStatus: b.invoiceStatus,
    estimatedFee: b.estimatedFee,
    stockWarning: b.stockImpact.length ? b.stockImpact.join(", ") : undefined,
    workstream: b.workstream,
    paymentRule: b.paymentRule,
    stockImpact: b.stockImpact,
    warnings: b.warnings,
    isCliniko: false,
  }));
}

export function markScenariosSeeded(
  patientLabels: string[],
  appointmentIds: string[]
): void {
  for (const scenario of DEMO_CLINIC_WEEK_SCENARIOS) {
    if (patientLabels.includes(scenario.patientLabel)) {
      scenario.clinikoSaved.patient = true;
    }
    if (appointmentIds.includes(scenario.id)) {
      scenario.clinikoSaved.appointment = true;
    }
  }
}

export type BookingDayGroup = "today" | "tomorrow" | "later" | "setup";

export function groupBookingsByDay(
  bookings: MappedBooking[]
): { group: BookingDayGroup; label: string; bookings: MappedBooking[] }[] {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split("T")[0];

  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const endIso = endOfWeek.toISOString().split("T")[0];

  const todayItems = bookings.filter((b) => b.date === today);
  const tomorrowItems = bookings.filter((b) => b.date === tomorrowIso);
  const laterItems = bookings.filter(
    (b) => b.date > tomorrowIso && b.date <= endIso
  );
  const setupItems = bookings.filter((b) => b.warnings.length > 0);

  const groups: { group: BookingDayGroup; label: string; bookings: MappedBooking[] }[] = [];

  if (todayItems.length) {
    groups.push({ group: "today", label: "Today", bookings: todayItems });
  }
  if (tomorrowItems.length) {
    groups.push({ group: "tomorrow", label: "Tomorrow", bookings: tomorrowItems });
  }
  if (laterItems.length) {
    groups.push({ group: "later", label: "Later this week", bookings: laterItems });
  }
  if (!todayItems.length && !tomorrowItems.length && bookings.length) {
    groups.push({
      group: "later",
      label: "Upcoming bookings",
      bookings,
    });
  }
  if (setupItems.length) {
    groups.push({ group: "setup", label: "Needs setup", bookings: setupItems });
  }

  return groups;
}
