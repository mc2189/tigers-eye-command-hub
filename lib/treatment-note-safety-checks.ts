/** Shared treatment note safety check labels (client + server safe). */
export const TREATMENT_NOTE_SAFETY_CHECKS = [
  "CLINIKO_ENABLE_WRITES=true",
  "Patient is DEMO-prefixed or DEMO-linked",
  "Appointment has numeric Cliniko ID",
  "Appointment patient_id matches linked patient",
  "Note content is DEMO-safe",
  "Sterile Cliniko test account only",
] as const;
