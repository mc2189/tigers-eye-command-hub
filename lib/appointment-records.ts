/**
 * Appointment and client record resolution for detail pages.
 */

import {
  DEMO_CLINIC_WEEK_SCENARIOS,
  getDemoClinicWeekDate,
  getDemoClinicWeekEndTime,
  type DemoClinicWeekScenario,
} from "@/lib/demo-clinic-week";
import type { MappedBooking } from "@/lib/cliniko-mappers";

export const DEMO_WEEK_APPOINTMENT_SMOKE_ID = "dcw-001";

export function patientLabelToSlug(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, "-");
}

export function findScenarioBySlug(slug: string): DemoClinicWeekScenario | undefined {
  return DEMO_CLINIC_WEEK_SCENARIOS.find(
    (s) => patientLabelToSlug(s.patientLabel) === slug
  );
}

export function getScenarioById(id: string): DemoClinicWeekScenario | undefined {
  return DEMO_CLINIC_WEEK_SCENARIOS.find((s) => s.id === id);
}

export function getScenariosForPatient(patientLabel: string): DemoClinicWeekScenario[] {
  return DEMO_CLINIC_WEEK_SCENARIOS.filter((s) => s.patientLabel === patientLabel);
}

export function getFirstDemoWeekScenario(): DemoClinicWeekScenario {
  return DEMO_CLINIC_WEEK_SCENARIOS[0]!;
}

export interface AppointmentRecordView {
  appointmentId: string;
  patientLabel: string;
  patientSlug: string;
  appointmentType: string;
  date: string;
  time: string;
  endTime: string;
  practitioner: string;
  location: string;
  scenario: DemoClinicWeekScenario | null;
  mapped: MappedBooking | null;
  isDemoWeekPreview: boolean;
  isLiveCliniko: boolean;
  clinikoAppointmentId: string | null;
  clinikoPatientId: string | null;
}

export function buildRecordFromScenario(
  scenario: DemoClinicWeekScenario,
  options?: { mapped?: MappedBooking | null; isLive?: boolean; isPreview?: boolean }
): AppointmentRecordView {
  return {
    appointmentId: scenario.id,
    patientLabel: scenario.patientLabel,
    patientSlug: patientLabelToSlug(scenario.patientLabel),
    appointmentType: scenario.appointmentType,
    date: getDemoClinicWeekDate(scenario),
    time: scenario.time,
    endTime: getDemoClinicWeekEndTime(scenario),
    practitioner: scenario.preferredPractitioner,
    location: scenario.location,
    scenario,
    mapped: options?.mapped ?? null,
    isDemoWeekPreview: Boolean(options?.isPreview ?? !scenario.clinikoSaved.appointment),
    isLiveCliniko: Boolean(scenario.clinikoSaved.appointment || options?.isLive),
    clinikoAppointmentId: scenario.clinikoSaved.appointment ? scenario.id : null,
    clinikoPatientId: scenario.clinikoSaved.patient ? scenario.clientProfile.email : null,
  };
}

export function buildRecordFromMapped(
  mapped: MappedBooking,
  scenario?: DemoClinicWeekScenario | null
): AppointmentRecordView {
  const isLive = mapped.dataSource === "cliniko-test" || mapped.dataSource === "cliniko";
  return {
    appointmentId: mapped.id,
    patientLabel: mapped.clientName,
    patientSlug: patientLabelToSlug(mapped.clientName),
    appointmentType: mapped.appointmentTypeName,
    date: mapped.date,
    time: mapped.time,
    endTime: mapped.endTime,
    practitioner: mapped.practitionerName,
    location: mapped.locationLabel,
    scenario: scenario ?? getScenarioById(mapped.id) ?? null,
    mapped,
    isDemoWeekPreview: mapped.dataSource === "demo",
    isLiveCliniko: isLive,
    clinikoAppointmentId: mapped.clinikoId || null,
    clinikoPatientId: null,
  };
}

export function resolveAppointmentRecord(
  appointmentId: string,
  mappedBookings: MappedBooking[],
  options?: { isPreview?: boolean }
): AppointmentRecordView | null {
  const scenario = getScenarioById(appointmentId);
  if (scenario) {
    const mapped = mappedBookings.find((b) => b.id === appointmentId) ?? null;
    return buildRecordFromScenario(scenario, {
      mapped,
      isPreview: options?.isPreview,
      isLive: mapped?.dataSource === "cliniko-test",
    });
  }

  const mapped = mappedBookings.find((b) => b.id === appointmentId);
  if (mapped) {
    return buildRecordFromMapped(mapped, getScenarioById(mapped.id));
  }

  if (appointmentId === "demo-week" || appointmentId === DEMO_WEEK_APPOINTMENT_SMOKE_ID) {
    return buildRecordFromScenario(getFirstDemoWeekScenario(), { isPreview: true });
  }

  return null;
}
