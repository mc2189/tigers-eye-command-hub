export class ClinikoApiError extends Error {
  readonly status: number;
  readonly path: string;
  readonly bodyText?: string;
  readonly clinikoMessage?: string;

  constructor(opts: {
    message: string;
    status: number;
    path: string;
    bodyText?: string;
    clinikoMessage?: string;
  }) {
    super(opts.message);
    this.name = "ClinikoApiError";
    this.status = opts.status;
    this.path = opts.path;
    this.bodyText = opts.bodyText;
    this.clinikoMessage = opts.clinikoMessage;
  }
}

export function redactClinikoBody(body: string): string {
  return body
    .replace(/api[_-]?key/gi, "[redacted]")
    .replace(/Bearer\s+\S+/gi, "[redacted]")
    .replace(/Basic\s+\S+/gi, "[redacted]")
    .slice(0, 500);
}

export function parseClinikoErrorBody(bodyText: string): string | undefined {
  try {
    const json = JSON.parse(bodyText) as {
      message?: string;
      error?: string;
      errors?: Record<string, string | string[]>;
    };
    if (json.message) return json.message;
    if (json.error) return json.error;
    if (json.errors) {
      const parts = Object.entries(json.errors).flatMap(([k, v]) =>
        (Array.isArray(v) ? v : [v]).map((msg) => `${k}: ${msg}`)
      );
      return parts.join("; ");
    }
  } catch {
    return bodyText.slice(0, 200) || undefined;
  }
  return undefined;
}

export type AppointmentFailureCause =
  | "no_demo_patient"
  | "no_practitioner"
  | "user_not_practitioner"
  | "no_business"
  | "no_appointment_type"
  | "no_duration"
  | "time_not_future"
  | "no_available_time"
  | "appointment_type_not_bookable"
  | "practitioner_availability_missing"
  | "payload_rejected"
  | "unknown";

export function classifyAppointmentFailure(
  cause: string,
  status?: number,
  clinikoMessage?: string
): {
  likelyCause: AppointmentFailureCause;
  suggestedFix: string;
} {
  const msg = `${cause} ${clinikoMessage ?? ""}`.toLowerCase();

  if (msg.includes("demo patient") || msg.includes("patient")) {
    if (msg.includes("select") || msg.includes("no demo")) {
      return {
        likelyCause: "no_demo_patient",
        suggestedFix: "Create and select a DEMO patient first.",
      };
    }
  }
  if (msg.includes("practitioner is required") || msg.includes("user not practitioner")) {
    return {
      likelyCause: "user_not_practitioner",
      suggestedFix:
        "Use a practitioner from the /practitioners endpoint. Users who are not practitioners cannot receive appointments.",
    };
  }
  if (msg.includes("no practitioner") || msg.includes("practitioner found")) {
    return {
      likelyCause: "no_practitioner",
      suggestedFix: "Add a practitioner in Cliniko and ensure the practitioners API returns them.",
    };
  }
  if (msg.includes("business") || msg.includes("location")) {
    return {
      likelyCause: "no_business",
      suggestedFix: "Ensure at least one business/location exists in the Cliniko test account.",
    };
  }
  if (msg.includes("appointment type")) {
    return {
      likelyCause: "no_appointment_type",
      suggestedFix: "Create an appointment type in Cliniko and retry.",
    };
  }
  if (msg.includes("available time") || msg.includes("availability")) {
    return {
      likelyCause: "no_available_time",
      suggestedFix:
        "Set practitioner daily availability in Cliniko, or create the appointment manually and use Check for DEMO appointments.",
    };
  }
  if (msg.includes("validation") || status === 422) {
    return {
      likelyCause: "payload_rejected",
      suggestedFix: "Review Cliniko validation message and adjust practitioner, type, or time.",
    };
  }
  return {
    likelyCause: "unknown",
    suggestedFix: "Check Cliniko test account setup and retry with diagnostics shown above.",
  };
}
