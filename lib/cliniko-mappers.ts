import type {
  BookingSource,
  InvoiceStatus,
  LocationId,
  NoteStatus,
  PaymentStatus,
  PractitionerId,
} from "@/lib/demo-data";
import {
  getFallbackPriceForAppointmentType,
  getFinanceWarningsForAppointmentType,
  getPaymentRuleForAppointmentType,
} from "@/lib/pricing-rules";
import { safeString } from "@/lib/safe-data";

// ─── Shared input shapes (match API route outputs) ───────────────────────────

export interface ClinikoBusinessInput {
  id: string;
  name: string;
  address?: string;
  timezone?: string;
  archived?: boolean;
}

export interface ClinikoPractitionerInput {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  active?: boolean;
}

export interface ClinikoAppointmentTypeInput {
  id: string;
  name: string;
  category?: string;
  durationMinutes?: number;
  price?: number;
  onlineBookingsEnabled?: boolean;
  telehealthEnabled?: boolean;
  archived?: boolean;
}

export interface ClinikoBookingInput {
  id: string;
  startsAt: string;
  endsAt: string;
  appointmentTypeName?: string;
  practitionerName?: string;
  businessName?: string;
  patientLabel?: string;
  paymentStatus?: string;
  noteStatus?: string;
  invoiceStatus?: string;
}

export type Workstream = "private" | "insurance" | "telehealth" | "external";
export type DataSource = "cliniko" | "cliniko-test" | "demo";

export interface ClinikoIndividualAppointmentInput {
  id: string;
  startsAt: string;
  endsAt: string;
  patientName?: string;
  patientLabel?: string;
  appointmentTypeName?: string;
  practitionerName?: string;
  businessName?: string;
  noteStatus?: string;
  invoiceStatus?: string;
  telehealthUrl?: string;
  cancelledAt?: string;
  archivedAt?: string;
  source?: "cliniko-test";
}

export interface InsuranceContext {
  likelyInsurance: true;
  likelyInsurer?: string;
  missingFields: string[];
  recommendation: string;
}

export interface MappedLocation {
  id: string;
  clinikoId: string;
  name: string;
  address?: string;
  timezone?: string;
  locationId: LocationId;
  archived?: boolean;
}

export interface MappedPractitioner {
  id: string;
  clinikoId: string;
  name: string;
  shortName: string;
  practitionerId?: PractitionerId;
  matched: boolean;
  email?: string;
  role?: string;
  active?: boolean;
}

export interface MappedAppointmentType {
  id: string;
  clinikoId: string;
  name: string;
  category?: string;
  durationMinutes?: number;
  price?: number;
  priceSource: "cliniko" | "fallback" | "missing";
  workstream: Workstream;
  paymentRule: string;
  stockItems: string[];
  financeWarnings: string[];
  onlineBookingsEnabled?: boolean;
  telehealthEnabled?: boolean;
}

export interface MappedBooking {
  id: string;
  clinikoId: string;
  dataSource: "cliniko" | "cliniko-test" | "demo";
  date: string;
  time: string;
  endsAt: string;
  endTime: string;
  clientName: string;
  clientInitials: string;
  appointmentTypeName: string;
  appointmentTypeId: string;
  practitionerName: string;
  practitionerId: PractitionerId;
  practitionerMatched: boolean;
  businessName: string;
  locationId: LocationId;
  locationLabel: string;
  source: BookingSource;
  workstream: Workstream;
  paymentRule: string;
  paymentStatus: PaymentStatus;
  noteStatus: NoteStatus;
  invoiceStatus: InvoiceStatus;
  estimatedFee: number;
  priceSource: "cliniko" | "fallback" | "missing";
  stockImpact: string[];
  insuranceContext?: InsuranceContext;
  warnings: string[];
  isPast: boolean;
  isToday: boolean;
  clinikoRef: string;
}

export interface MappedCalendarItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  clientName: string;
  practitionerId: PractitionerId;
  practitionerName: string;
  practitionerMatched: boolean;
  locationId: LocationId;
  source: BookingSource;
  paymentStatus: PaymentStatus;
  noteStatus: NoteStatus;
  invoiceStatus: InvoiceStatus;
  estimatedFee: number;
  stockWarning?: string;
  workstream: Workstream;
  paymentRule: string;
  stockImpact: string[];
  warnings: string[];
  isCliniko: boolean;
  isGap?: boolean;
}

export interface MappedFinanceItem {
  bookingId: string;
  date: string;
  appointmentTypeName: string;
  practitionerName: string;
  businessName: string;
  workstream: Workstream;
  estimatedFee: number;
  priceSource: "cliniko" | "fallback" | "missing";
  needsAction: boolean;
  warnings: string[];
}

export interface MappedNoteTask {
  id: string;
  clinikoId: string;
  date: string;
  time: string;
  clientName: string;
  appointmentType: string;
  practitionerId: PractitionerId;
  practitionerName: string;
  practitionerMatched: boolean;
  businessName: string;
  locationLabel: string;
  noteStatus: NoteStatus;
  dataSource: "cliniko" | "cliniko-test" | "demo";
  bookingId: string;
}

export interface MappingHealthSummary {
  locationsMapped: number;
  practitionersMapped: number;
  appointmentTypesMapped: number;
  bookingsMapped: number;
  unknownWorkstreamTypes: string[];
  missingPaymentRuleTypes: string[];
  missingPriceTypes: string[];
  insuranceTypesDetected: string[];
  telehealthTypesDetected: string[];
  stockLinkedTypes: string[];
  recommendations: string[];
}

// ─── Name / date helpers ─────────────────────────────────────────────────────

export function normaliseClinikoName(value?: string | null): string {
  if (!value?.trim()) return "";
  return value.trim().replace(/\s+/g, " ");
}

export function normaliseClinikoDate(iso?: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  try {
    const d = new Date(iso);
    const date = d.toISOString().split("T")[0];
    const time = d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return { date, time };
  } catch {
    const [datePart, timePart] = iso.split("T");
    return {
      date: datePart ?? "",
      time: timePart?.slice(0, 5) ?? "",
    };
  }
}

export function isPastBooking(startsAt: string): boolean {
  try {
    return new Date(startsAt).getTime() < Date.now();
  } catch {
    return false;
  }
}

export function isTodayBooking(startsAt: string): boolean {
  try {
    const d = new Date(startsAt);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  } catch {
    return false;
  }
}

// ─── Inference ───────────────────────────────────────────────────────────────

export function inferWorkstreamFromAppointmentType(name?: string): Workstream {
  const lower = (name ?? "").toLowerCase();
  if (/insurance|aviva|vitality|claim|authorisation|approved session/i.test(lower)) {
    return "insurance";
  }
  if (/telehealth|online|video|remote|review/i.test(lower) && !/insurance/i.test(lower)) {
    return "telehealth";
  }
  if (/sse|health partners|sfa|external|site visit|corporate/i.test(lower)) {
    return "external";
  }
  if (
    /physio|assessment|follow-up|follow up|sports massage|massage|taping|acupuncture|injection|treatment/i.test(
      lower
    )
  ) {
    return "private";
  }
  return "private";
}

export function inferPaymentRuleFromAppointmentType(name?: string): string {
  return getPaymentRuleForAppointmentType(name ?? "");
}

export function inferStockUsageFromAppointmentType(name?: string): string[] {
  const lower = (name ?? "").toLowerCase();
  if (/taping|tape/i.test(lower)) return ["K-tape", "Rigid tape"];
  if (/acupuncture/i.test(lower)) return ["Acupuncture needles"];
  if (/sports massage|massage/i.test(lower)) return ["Couch roll", "Massage lotion"];
  if (/injection/i.test(lower)) return ["Injection consumables"];
  if (/external|sse|sfa|corporate|site visit/i.test(lower)) {
    return ["K-tape", "Kit", "Mileage placeholder"];
  }
  if (/telehealth|video|online/i.test(lower)) return [];
  if (/physio|assessment|follow-up|treatment/i.test(lower)) return [];
  return [];
}

export function inferInsuranceContextFromAppointmentType(
  name?: string
): InsuranceContext | undefined {
  const workstream = inferWorkstreamFromAppointmentType(name);
  if (workstream !== "insurance") return undefined;

  const lower = (name ?? "").toLowerCase();
  let likelyInsurer: string | undefined;
  if (/aviva/i.test(lower)) likelyInsurer = "Aviva";
  else if (/vitality/i.test(lower)) likelyInsurer = "Vitality";

  return {
    likelyInsurance: true,
    likelyInsurer,
    missingFields: [
      "insurer",
      "policy number",
      "claim number",
      "authorisation number",
      "approved sessions",
      "liability agreement",
    ],
    recommendation:
      "Capture claim/session details through Cliniko forms or custom fields.",
  };
}

// ─── Entity mappers ──────────────────────────────────────────────────────────

export function mapClinikoBusinessToLocation(
  business: ClinikoBusinessInput
): MappedLocation {
  const name = normaliseClinikoName(business.name);
  return {
    id: `cliniko-loc-${business.id}`,
    clinikoId: business.id,
    name,
    address: business.address,
    timezone: business.timezone,
    locationId: inferLocationIdFromName(name),
    archived: business.archived,
  };
}

export function mapClinikoPractitionerToPractitioner(
  practitioner: ClinikoPractitionerInput
): MappedPractitioner {
  const name = normaliseClinikoName(practitioner.name);
  const match = matchPractitionerId(name);
  return {
    id: `cliniko-prac-${practitioner.id}`,
    clinikoId: practitioner.id,
    name,
    shortName: name.split(" ")[0] || name,
    practitionerId: match.id,
    matched: match.matched,
    email: practitioner.email,
    role: practitioner.role,
    active: practitioner.active,
  };
}

export function mapClinikoAppointmentType(
  type: ClinikoAppointmentTypeInput
): MappedAppointmentType {
  const name = normaliseClinikoName(type.name);
  const workstream = inferWorkstreamFromAppointmentType(name);
  const priceFromCliniko =
    type.price !== undefined && type.price !== null ? type.price : undefined;
  const fallback = getFallbackPriceForAppointmentType(name);
  let priceSource: "cliniko" | "fallback" | "missing" = "missing";
  let price = 0;

  if (priceFromCliniko !== undefined) {
    price = priceFromCliniko;
    priceSource = "cliniko";
  } else if (fallback > 0 || workstream === "insurance" || workstream === "external") {
    price = fallback;
    priceSource = "fallback";
  }

  const paymentRule = inferPaymentRuleFromAppointmentType(name);
  const stockItems = inferStockUsageFromAppointmentType(name);

  return {
    id: `cliniko-type-${type.id}`,
    clinikoId: type.id,
    name,
    category: type.category,
    durationMinutes: type.durationMinutes,
    price,
    priceSource,
    workstream,
    paymentRule,
    stockItems,
    financeWarnings: getFinanceWarningsForAppointmentType(name, price),
    onlineBookingsEnabled: type.onlineBookingsEnabled,
    telehealthEnabled: type.telehealthEnabled,
  };
}

export function mapClinikoBookingToBooking(
  booking: ClinikoBookingInput,
  context?: {
    appointmentTypes?: ClinikoAppointmentTypeInput[];
    practitioners?: ClinikoPractitionerInput[];
  }
): MappedBooking {
  const { date, time } = normaliseClinikoDate(booking.startsAt);
  const end = normaliseClinikoDate(booking.endsAt);
  const appointmentTypeName = normaliseClinikoName(
    booking.appointmentTypeName ?? "Appointment"
  );
  const typeRecord = context?.appointmentTypes?.find(
    (t) => normaliseClinikoName(t.name) === appointmentTypeName
  );
  const mappedType = typeRecord
    ? mapClinikoAppointmentType(typeRecord)
    : mapClinikoAppointmentType({
        id: `inferred-${appointmentTypeName}`,
        name: appointmentTypeName,
      });

  const practitionerName = normaliseClinikoName(
    booking.practitionerName ?? "Unmatched Cliniko practitioner"
  );
  const pracMatch = matchPractitionerId(practitionerName);
  const businessName = normaliseClinikoName(booking.businessName ?? "Clinic");
  const clientName = normaliseClinikoName(booking.patientLabel ?? "Cliniko patient");
  const workstream = mappedType.workstream;
  const source = workstreamToSource(workstream);
  const warnings = [
    ...mappedType.financeWarnings,
    ...getMappingWarnings({
      appointmentTypeName,
      priceSource: mappedType.priceSource,
      workstream,
      noteStatus: mapNoteStatus(booking.noteStatus),
      practitionerMatched: pracMatch.matched,
    }),
  ];

  return {
    id: `mapped-${booking.id}`,
    clinikoId: booking.id,
    dataSource: "cliniko",
    date,
    time,
    endsAt: booking.endsAt,
    endTime: end.time,
    clientName,
    clientInitials: toInitials(clientName),
    appointmentTypeName,
    appointmentTypeId: mappedType.id,
    practitionerName,
    practitionerId: pracMatch.id,
    practitionerMatched: pracMatch.matched,
    businessName,
    locationId: inferLocationIdFromName(businessName),
    locationLabel: businessName,
    source,
    workstream,
    paymentRule: mappedType.paymentRule,
    paymentStatus: inferPaymentStatus(workstream, booking.paymentStatus),
    noteStatus: mapNoteStatus(booking.noteStatus),
    invoiceStatus: mapInvoiceStatus(booking.invoiceStatus, workstream),
    estimatedFee: mappedType.price ?? 0,
    priceSource: mappedType.priceSource,
    stockImpact: mappedType.stockItems,
    insuranceContext: inferInsuranceContextFromAppointmentType(appointmentTypeName),
    warnings,
    isPast: isPastBooking(booking.startsAt),
    isToday: isTodayBooking(booking.startsAt),
    clinikoRef: `CLN-${booking.id}`,
  };
}

export function mapClinikoBookingToCalendarItem(
  booking: MappedBooking
): MappedCalendarItem {
  return {
    id: `cal-cliniko-${booking.clinikoId}`,
    date: booking.date,
    startTime: booking.time,
    endTime: booking.endTime || booking.time,
    title: booking.appointmentTypeName,
    clientName: booking.clientName,
    practitionerId: booking.practitionerId,
    practitionerName: booking.practitionerName,
    practitionerMatched: booking.practitionerMatched,
    locationId: booking.locationId,
    source: booking.source,
    paymentStatus: booking.paymentStatus,
    noteStatus: booking.noteStatus,
    invoiceStatus: booking.invoiceStatus,
    estimatedFee: booking.estimatedFee,
    stockWarning:
      booking.stockImpact.length > 0
        ? `Est. stock: ${booking.stockImpact.join(", ")}`
        : undefined,
    workstream: booking.workstream,
    paymentRule: booking.paymentRule,
    stockImpact: booking.stockImpact,
    warnings: booking.warnings,
    isCliniko: true,
  };
}

export function mapClinikoBookingToFinanceItem(
  booking: MappedBooking
): MappedFinanceItem {
  return {
    bookingId: booking.clinikoId,
    date: booking.date,
    appointmentTypeName: booking.appointmentTypeName,
    practitionerName: booking.practitionerName,
    businessName: booking.businessName,
    workstream: booking.workstream,
    estimatedFee: booking.estimatedFee,
    priceSource: booking.priceSource,
    needsAction:
      booking.invoiceStatus !== "paid" ||
      booking.noteStatus !== "complete" ||
      booking.warnings.length > 0,
    warnings: booking.warnings,
  };
}

export function mapClinikoBookingToNoteTask(
  booking: MappedBooking
): MappedNoteTask {
  return {
    id: booking.id,
    clinikoId: booking.clinikoId,
    date: booking.date,
    time: booking.time,
    clientName: booking.clientName,
    appointmentType: booking.appointmentTypeName,
    practitionerId: booking.practitionerId,
    practitionerName: booking.practitionerName,
    practitionerMatched: booking.practitionerMatched,
    businessName: booking.businessName,
    locationLabel: booking.locationLabel,
    noteStatus: booking.noteStatus,
    dataSource: "cliniko",
    bookingId: booking.clinikoId,
  };
}

// ─── Batch mapping ───────────────────────────────────────────────────────────

export function mapClinikoIndividualAppointmentToBookingInput(
  appointment: ClinikoIndividualAppointmentInput
): ClinikoBookingInput {
  return {
    id: safeString(appointment.id, "unknown"),
    startsAt: safeString(appointment.startsAt),
    endsAt: safeString(appointment.endsAt, appointment.startsAt),
    appointmentTypeName: safeString(
      appointment.appointmentTypeName,
      "Appointment"
    ),
    practitionerName: safeString(appointment.practitionerName, "Practitioner"),
    businessName: safeString(appointment.businessName, "Clinic"),
    patientLabel: safeString(
      appointment.patientLabel ?? appointment.patientName,
      "Cliniko patient"
    ),
    noteStatus: appointment.noteStatus,
    invoiceStatus: appointment.invoiceStatus,
  };
}

export function mapClinikoIndividualAppointmentToBooking(
  appointment: ClinikoIndividualAppointmentInput,
  context?: {
    appointmentTypes?: ClinikoAppointmentTypeInput[];
    practitioners?: ClinikoPractitionerInput[];
  }
): MappedBooking {
  const mapped = mapClinikoBookingToBooking(
    mapClinikoIndividualAppointmentToBookingInput(appointment),
    context
  );
  return {
    ...mapped,
    dataSource: appointment.source === "cliniko-test" ? "cliniko-test" : "cliniko",
  };
}

export function mapClinikoIndividualAppointmentToCalendarItem(
  appointment: ClinikoIndividualAppointmentInput,
  context?: {
    appointmentTypes?: ClinikoAppointmentTypeInput[];
    practitioners?: ClinikoPractitionerInput[];
  }
): MappedCalendarItem {
  return mapClinikoBookingToCalendarItem(
    mapClinikoIndividualAppointmentToBooking(appointment, context)
  );
}

export function mapClinikoIndividualAppointmentToFinanceItem(
  appointment: ClinikoIndividualAppointmentInput,
  context?: {
    appointmentTypes?: ClinikoAppointmentTypeInput[];
    practitioners?: ClinikoPractitionerInput[];
  }
): MappedFinanceItem {
  return mapClinikoBookingToFinanceItem(
    mapClinikoIndividualAppointmentToBooking(appointment, context)
  );
}

export function mapClinikoIndividualAppointmentToNoteTask(
  appointment: ClinikoIndividualAppointmentInput,
  context?: {
    appointmentTypes?: ClinikoAppointmentTypeInput[];
    practitioners?: ClinikoPractitionerInput[];
  }
): MappedNoteTask {
  return mapClinikoBookingToNoteTask(
    mapClinikoIndividualAppointmentToBooking(appointment, context)
  );
}

export function mapClinikoIndividualAppointments(
  appointments: ClinikoIndividualAppointmentInput[],
  context?: {
    appointmentTypes?: ClinikoAppointmentTypeInput[];
    practitioners?: ClinikoPractitionerInput[];
  }
): MappedBooking[] {
  return appointments.map((appointment) =>
    mapClinikoIndividualAppointmentToBooking(appointment, context)
  );
}

export function mapClinikoBookings(
  bookings: ClinikoBookingInput[],
  context?: {
    appointmentTypes?: ClinikoAppointmentTypeInput[];
    practitioners?: ClinikoPractitionerInput[];
  }
): MappedBooking[] {
  return bookings.map((b) => mapClinikoBookingToBooking(b, context));
}

export function buildMappingHealthSummary(
  businesses: ClinikoBusinessInput[],
  practitioners: ClinikoPractitionerInput[],
  appointmentTypes: ClinikoAppointmentTypeInput[],
  bookings: MappedBooking[]
): MappingHealthSummary {
  const mappedTypes = appointmentTypes.map(mapClinikoAppointmentType);
  const unknownWorkstream = mappedTypes
    .filter((t) => t.workstream === "private" && t.paymentRule === "Review payment rule")
    .map((t) => t.name);
  const missingPaymentRule = mappedTypes
    .filter((t) => t.paymentRule === "Review payment rule")
    .map((t) => t.name);
  const missingPrice = mappedTypes
    .filter((t) => t.priceSource === "missing" && t.workstream === "private")
    .map((t) => t.name);

  const recommendations: string[] = [];
  if (missingPaymentRule.length > 0) {
    recommendations.push("Enable payment/deposit rules by appointment type");
  }
  if (missingPrice.length > 0) {
    recommendations.push("Add prices to appointment types");
  }
  if (mappedTypes.some((t) => t.workstream === "insurance")) {
    recommendations.push("Create Cliniko forms for insurance claim details");
    recommendations.push("Create separate insurance appointment types");
  }
  if (!mappedTypes.some((t) => t.telehealthEnabled || t.workstream === "telehealth")) {
    recommendations.push("Create telehealth review appointment type");
  }
  if (businesses.length > 1) {
    recommendations.push("Use location-specific booking links");
  }
  recommendations.push("Configure follow-up templates");
  recommendations.push("Review invoice/payment link settings");

  return {
    locationsMapped: businesses.length,
    practitionersMapped: practitioners.length,
    appointmentTypesMapped: appointmentTypes.length,
    bookingsMapped: bookings.length,
    unknownWorkstreamTypes: unknownWorkstream,
    missingPaymentRuleTypes: missingPaymentRule,
    missingPriceTypes: missingPrice,
    insuranceTypesDetected: mappedTypes
      .filter((t) => t.workstream === "insurance")
      .map((t) => t.name),
    telehealthTypesDetected: mappedTypes
      .filter((t) => t.workstream === "telehealth")
      .map((t) => t.name),
    stockLinkedTypes: mappedTypes
      .filter((t) => t.stockItems.length > 0)
      .map((t) => t.name),
    recommendations: [...new Set(recommendations)],
  };
}

// ─── Validation & grouping ───────────────────────────────────────────────────

export function validateMappedBooking(booking: MappedBooking): string[] {
  return getMappingWarnings({
    appointmentTypeName: booking.appointmentTypeName,
    priceSource: booking.priceSource,
    workstream: booking.workstream,
    noteStatus: booking.noteStatus,
    practitionerMatched: booking.practitionerMatched,
    insuranceContext: booking.insuranceContext,
  });
}

export function getMappingWarnings(input: {
  appointmentTypeName: string;
  priceSource: "cliniko" | "fallback" | "missing";
  workstream: Workstream;
  noteStatus: NoteStatus;
  practitionerMatched: boolean;
  insuranceContext?: InsuranceContext;
}): string[] {
  const warnings: string[] = [];

  if (input.priceSource === "missing" && input.workstream === "private") {
    warnings.push("Price missing");
  }
  if (inferPaymentRuleFromAppointmentType(input.appointmentTypeName) === "Review payment rule") {
    warnings.push("Payment rule needs review");
  }
  if (input.insuranceContext || input.workstream === "insurance") {
    warnings.push("Possible insurance booking — claim/session data may be missing");
  }
  if (input.noteStatus === "not-started" || input.noteStatus === "draft-needed") {
    warnings.push("Note likely needed");
  }
  if (input.noteStatus !== "complete") {
    warnings.push("Invoice action may be needed after note completion");
  }
  if (!input.practitionerMatched) {
    warnings.push("Unmatched Cliniko practitioner");
  }

  return [...new Set(warnings)];
}

export function groupByWorkstream<T extends { workstream: Workstream }>(
  items: T[]
): Record<Workstream, T[]> {
  return {
    private: items.filter((i) => i.workstream === "private"),
    insurance: items.filter((i) => i.workstream === "insurance"),
    telehealth: items.filter((i) => i.workstream === "telehealth"),
    external: items.filter((i) => i.workstream === "external"),
  };
}

export function groupByPractitioner<T extends { practitionerName: string }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = item.practitionerName || "Unknown";
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});
}

export function groupByLocation<T extends { businessName: string }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = item.businessName || "Unknown";
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function matchPractitionerId(name: string): {
  id: PractitionerId;
  matched: boolean;
} {
  const lower = name.toLowerCase();
  if (/george|stewart/i.test(lower)) return { id: "george", matched: true };
  if (/jamie|thomson/i.test(lower)) return { id: "jamie-lee", matched: true };
  if (/dicker/i.test(lower)) return { id: "dicker", matched: true };
  return { id: "george", matched: false };
}

function inferLocationIdFromName(name: string): LocationId {
  const lower = name.toLowerCase();
  if (/aviemore/i.test(lower)) return "aviemore";
  if (/dundee/i.test(lower)) return "dundee";
  if (/telehealth|video|online|remote/i.test(lower)) return "telehealth";
  if (/external|sse|sfa|corporate|site visit/i.test(lower)) return "external";
  return "dundee";
}

function workstreamToSource(workstream: Workstream): BookingSource {
  switch (workstream) {
    case "insurance":
      return "cliniko-insurance";
    case "telehealth":
      return "telehealth";
    case "external":
      return "external-work";
    default:
      return "cliniko-private";
  }
}

function toInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function mapNoteStatus(status?: string): NoteStatus {
  if (!status) return "not-started";
  const lower = status.toLowerCase();
  if (lower.includes("final") || lower.includes("complete")) return "complete";
  if (lower.includes("draft")) return "draft-needed";
  if (lower.includes("progress")) return "in-progress";
  return "not-started";
}

function mapInvoiceStatus(
  status?: string,
  workstream?: Workstream
): InvoiceStatus {
  if (!status) {
    if (workstream === "insurance" || workstream === "external") return "draft-needed";
    return "draft-needed";
  }
  const lower = status.toLowerCase();
  if (lower.includes("paid")) return "paid";
  if (lower.includes("submit")) return "submitted";
  if (lower.includes("overdue")) return "overdue";
  if (lower.includes("quer")) return "queried";
  if (lower.includes("ready")) return "ready-to-send";
  return "draft-needed";
}

function inferPaymentStatus(
  workstream: Workstream,
  status?: string
): PaymentStatus {
  if (status) {
    const lower = status.toLowerCase();
    if (lower.includes("paid")) return "paid-online";
    if (lower.includes("deposit")) return "deposit-paid";
    if (lower.includes("cash")) return "cash-approval-required";
  }
  switch (workstream) {
    case "insurance":
      return "insurance-invoice";
    case "external":
      return "external-invoice";
    case "telehealth":
      return "unpaid";
    default:
      return "pay-in-clinic";
  }
}
