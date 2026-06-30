/**
 * Demo-only browser state for appointment/client record actions.
 */

const STORAGE_KEY = "tigers-eye-demo-record-state-v1";

export type RecordStatusLabel =
  | "Saved to Cliniko test account"
  | "Prepared for Cliniko"
  | "Suggested by Command Hub"
  | "Demo-only browser state"
  | "Needs staff confirmation"
  | "Future integration";

export interface AppointmentRecordState {
  linkedPatientId?: string;
  linkedPatientLabel?: string;
  noteSavedToCliniko?: boolean;
  noteClinikoId?: string;
  invoicePrepared?: boolean;
  followUpPrepared?: boolean;
  followUpBookedInCliniko?: boolean;
  followUpClinikoAppointmentId?: string;
  matchStatus?: string;
  lastPatientCreateResult?: {
    savedFieldLabels?: string[];
    verified?: boolean;
  };
}

export interface DemoRecordStore {
  appointments: Record<string, AppointmentRecordState>;
  patients: Record<string, { clinikoPatientId?: string; createdAt?: string }>;
}

function emptyStore(): DemoRecordStore {
  return { appointments: {}, patients: {} };
}

export function loadDemoRecordStore(): DemoRecordStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as DemoRecordStore;
    return {
      appointments: parsed.appointments ?? {},
      patients: parsed.patients ?? {},
    };
  } catch {
    return emptyStore();
  }
}

export function saveDemoRecordStore(store: DemoRecordStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getAppointmentState(appointmentId: string): AppointmentRecordState {
  return loadDemoRecordStore().appointments[appointmentId] ?? {};
}

export function updateAppointmentState(
  appointmentId: string,
  patch: Partial<AppointmentRecordState>
): AppointmentRecordState {
  const store = loadDemoRecordStore();
  const next = { ...(store.appointments[appointmentId] ?? {}), ...patch };
  store.appointments[appointmentId] = next;
  saveDemoRecordStore(store);
  window.dispatchEvent(new CustomEvent("demo-record-state-changed"));
  return next;
}
