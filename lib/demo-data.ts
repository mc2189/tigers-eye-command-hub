// Demo data only — no real patient information

export type PractitionerId = "george" | "jamie-lee" | "dicker";
export type LocationId = "dundee" | "aviemore" | "telehealth" | "external";
export type BookingSource =
  | "cliniko-private"
  | "cliniko-insurance"
  | "telehealth"
  | "external-work"
  | "admin-block"
  | "stock-task";

export type PaymentStatus =
  | "paid-online"
  | "deposit-paid"
  | "unpaid"
  | "pay-in-clinic"
  | "cash-agreed"
  | "cash-approval-required"
  | "insurance-invoice"
  | "external-invoice";

export type InvoiceStatus =
  | "draft-needed"
  | "ready-to-send"
  | "submitted"
  | "paid"
  | "overdue"
  | "queried";

export type InsuranceStatus =
  | "authorisation-missing"
  | "active"
  | "one-session-remaining"
  | "expired-soon"
  | "invoice-pending"
  | "complete";

export type NoteStatus = "complete" | "draft-needed" | "in-progress" | "not-started";
export type Priority = "high" | "medium" | "low";
export type StockStatus = "ok" | "reorder-soon" | "low";
export type ClinikoItemStatus = "demo" | "recommended" | "future";
export type Impact = "low" | "medium" | "high";

export interface Practitioner {
  id: PractitionerId;
  name: string;
  shortName: string;
  role: string;
  calendarPath: string;
  isPlaceholder?: boolean;
}

export interface Location {
  id: LocationId;
  name: string;
  shortName: string;
}

export interface AppointmentType {
  id: string;
  name: string;
  durationMinutes: number;
  defaultFee: number;
}

export interface Booking {
  id: string;
  date: string;
  time: string;
  clientName: string;
  clientInitials: string;
  practitionerId: PractitionerId;
  locationId: LocationId;
  appointmentTypeId: string;
  source: BookingSource;
  paymentStatus: PaymentStatus;
  noteStatus: NoteStatus;
  invoiceStatus: InvoiceStatus;
  estimatedFee: number;
  clinikoRef: string;
}

export interface CalendarItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  clientName: string;
  practitionerId: PractitionerId;
  locationId: LocationId;
  source: BookingSource;
  paymentStatus: PaymentStatus;
  noteStatus: NoteStatus;
  invoiceStatus: InvoiceStatus;
  estimatedFee: number;
  isGap?: boolean;
  stockWarning?: string;
}

export interface InsuranceCase {
  id: string;
  clientName: string;
  clientInitials: string;
  insurer: string;
  policyNumber: string;
  claimNumber: string;
  authorisationNumber: string;
  approvedSessions: number;
  usedSessions: number;
  expiryDate: string;
  invoiceStatus: InvoiceStatus;
  status: InsuranceStatus;
  liabilityAgreed: boolean;
  warning?: string;
  practitionerId: PractitionerId;
}

export interface Invoice {
  id: string;
  ref: string;
  clientOrPayer: string;
  payerType: "private" | "insurance" | "external";
  amount: number;
  sessionDates: string[];
  status: InvoiceStatus;
  missingInfo?: string[];
  insurer?: string;
  claimNumber?: string;
}

export interface PaymentRecord {
  id: string;
  clientName: string;
  appointmentDate: string;
  amount: number;
  status: PaymentStatus;
  method?: string;
  action?: string;
}

export interface Expense {
  id: string;
  supplier: string;
  amount: number;
  category: string;
  date: string;
  paymentStatus: "paid" | "pending" | "due";
}

export interface ExternalWorkBlock {
  id: string;
  workstream: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  practitionerId: PractitionerId;
  estimatedFee: number;
  mileage: number;
  invoiceStatus: InvoiceStatus;
  stockNeeded: string[];
  notes: string;
}

export interface StockItem {
  id: string;
  name: string;
  currentLevel: number;
  unit: string;
  reorderThreshold: number;
  estimatedWeeklyUsage: number;
  linkedAppointmentTypes: string[];
  status: StockStatus;
}

export interface StockUsageRule {
  id: string;
  appointmentType: string;
  itemsUsed: string[];
  notes?: string;
}

export interface FollowUpTask {
  id: string;
  type: string;
  dueDate: string;
  clientName: string;
  trigger: string;
  suggestedMessage: string;
  status: "pending" | "sent" | "snoozed";
}

export interface WaitlistEntry {
  id: string;
  clientName: string;
  desiredLocation: LocationId;
  desiredPractitionerId: PractitionerId;
  appointmentType: string;
  availabilityWindow: string;
  contactPreference: string;
  matchedGap?: string;
  matchScore?: number;
}

export interface ClinikoHealthCheckItem {
  id: string;
  section: string;
  title: string;
  status: ClinikoItemStatus;
  impact: Impact;
  action: string;
}

export interface HealthcodeFutureItem {
  id: string;
  title: string;
  description: string;
}

export interface DashboardAction {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  modulePath: string;
  actionLabel: string;
}

export interface PaymentRule {
  id: string;
  appointmentType: string;
  rule: string;
  warning?: string;
}

export interface PaymentActionQueueItem {
  id: string;
  description: string;
  count: number;
  modulePath: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  sections: string[];
}

export interface NoteAppointment {
  id: string;
  date: string;
  time: string;
  clientName: string;
  appointmentType: string;
  practitionerId: PractitionerId;
  noteStatus: NoteStatus;
}

// ─── Practitioners & locations ───────────────────────────────────────────────

export const practitioners: Practitioner[] = [
  {
    id: "george",
    name: "George Stewart",
    shortName: "George",
    role: "Lead Physiotherapist",
    calendarPath: "/admin/calendar/george",
  },
  {
    id: "jamie-lee",
    name: "Jamie Lee Thomson",
    shortName: "Jamie Lee",
    role: "Sports Massage Therapist",
    calendarPath: "/admin/calendar/practitioner-2",
  },
  {
    id: "dicker",
    name: "Dicker / Future practitioner",
    shortName: "Dicker",
    role: "Room user placeholder",
    calendarPath: "/admin/calendar/practitioner-2",
    isPlaceholder: true,
  },
];

export const locations: Location[] = [
  { id: "dundee", name: "Dundee", shortName: "Dundee" },
  { id: "aviemore", name: "Aviemore", shortName: "Aviemore" },
  { id: "telehealth", name: "Telehealth", shortName: "Telehealth" },
  { id: "external", name: "External / site visit", shortName: "External" },
];

export const appointmentTypes: AppointmentType[] = [
  { id: "initial-physio", name: "Initial physio assessment", durationMinutes: 60, defaultFee: 75 },
  { id: "follow-up", name: "Follow-up treatment", durationMinutes: 45, defaultFee: 55 },
  { id: "sports-massage", name: "Sports massage", durationMinutes: 45, defaultFee: 50 },
  { id: "telehealth", name: "Telehealth review", durationMinutes: 30, defaultFee: 40 },
  { id: "insurance-initial", name: "Insurance initial assessment", durationMinutes: 60, defaultFee: 0 },
  { id: "insurance-followup", name: "Insurance follow-up", durationMinutes: 45, defaultFee: 0 },
  { id: "acupuncture", name: "Acupuncture", durationMinutes: 45, defaultFee: 55 },
  { id: "injection-consult", name: "Steroid injection consultation", durationMinutes: 30, defaultFee: 75 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function getPractitioner(id: PractitionerId): Practitioner {
  return practitioners.find((p) => p.id === id)!;
}

export function getLocation(id: LocationId): Location {
  return locations.find((l) => l.id === id)!;
}

export function getAppointmentType(id: string): AppointmentType {
  return appointmentTypes.find((a) => a.id === id)!;
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export const bookings: Booking[] = [
  {
    id: "bk-001",
    date: todayOffset(0),
    time: "09:00",
    clientName: "Sarah M.",
    clientInitials: "SM",
    practitionerId: "george",
    locationId: "dundee",
    appointmentTypeId: "insurance-followup",
    source: "cliniko-insurance",
    paymentStatus: "insurance-invoice",
    noteStatus: "draft-needed",
    invoiceStatus: "draft-needed",
    estimatedFee: 55,
    clinikoRef: "CLN-4821",
  },
  {
    id: "bk-002",
    date: todayOffset(0),
    time: "10:30",
    clientName: "James T.",
    clientInitials: "JT",
    practitionerId: "george",
    locationId: "dundee",
    appointmentTypeId: "initial-physio",
    source: "cliniko-private",
    paymentStatus: "deposit-paid",
    noteStatus: "not-started",
    invoiceStatus: "draft-needed",
    estimatedFee: 75,
    clinikoRef: "CLN-4822",
  },
  {
    id: "bk-003",
    date: todayOffset(0),
    time: "12:00",
    clientName: "Emma L.",
    clientInitials: "EL",
    practitionerId: "jamie-lee",
    locationId: "dundee",
    appointmentTypeId: "sports-massage",
    source: "cliniko-private",
    paymentStatus: "paid-online",
    noteStatus: "complete",
    invoiceStatus: "paid",
    estimatedFee: 50,
    clinikoRef: "CLN-4823",
  },
  {
    id: "bk-004",
    date: todayOffset(0),
    time: "14:00",
    clientName: "John R.",
    clientInitials: "JR",
    practitionerId: "george",
    locationId: "dundee",
    appointmentTypeId: "insurance-initial",
    source: "cliniko-insurance",
    paymentStatus: "insurance-invoice",
    noteStatus: "in-progress",
    invoiceStatus: "ready-to-send",
    estimatedFee: 0,
    clinikoRef: "CLN-4824",
  },
  {
    id: "bk-005",
    date: todayOffset(0),
    time: "15:30",
    clientName: "Anna K.",
    clientInitials: "AK",
    practitionerId: "jamie-lee",
    locationId: "aviemore",
    appointmentTypeId: "sports-massage",
    source: "cliniko-private",
    paymentStatus: "unpaid",
    noteStatus: "not-started",
    invoiceStatus: "draft-needed",
    estimatedFee: 50,
    clinikoRef: "CLN-4825",
  },
  {
    id: "bk-006",
    date: todayOffset(0),
    time: "16:30",
    clientName: "David P.",
    clientInitials: "DP",
    practitionerId: "george",
    locationId: "telehealth",
    appointmentTypeId: "telehealth",
    source: "telehealth",
    paymentStatus: "unpaid",
    noteStatus: "not-started",
    invoiceStatus: "draft-needed",
    estimatedFee: 40,
    clinikoRef: "CLN-4826",
  },
  {
    id: "bk-007",
    date: todayOffset(0),
    time: "17:00",
    clientName: "Rachel W.",
    clientInitials: "RW",
    practitionerId: "george",
    locationId: "dundee",
    appointmentTypeId: "follow-up",
    source: "cliniko-private",
    paymentStatus: "pay-in-clinic",
    noteStatus: "not-started",
    invoiceStatus: "draft-needed",
    estimatedFee: 55,
    clinikoRef: "CLN-4827",
  },
  {
    id: "bk-008",
    date: todayOffset(1),
    time: "09:30",
    clientName: "Mark H.",
    clientInitials: "MH",
    practitionerId: "george",
    locationId: "dundee",
    appointmentTypeId: "follow-up",
    source: "cliniko-private",
    paymentStatus: "cash-approval-required",
    noteStatus: "not-started",
    invoiceStatus: "draft-needed",
    estimatedFee: 55,
    clinikoRef: "CLN-4828",
  },
  {
    id: "bk-009",
    date: todayOffset(1),
    time: "11:00",
    clientName: "Lisa F.",
    clientInitials: "LF",
    practitionerId: "jamie-lee",
    locationId: "aviemore",
    appointmentTypeId: "sports-massage",
    source: "cliniko-private",
    paymentStatus: "paid-online",
    noteStatus: "not-started",
    invoiceStatus: "draft-needed",
    estimatedFee: 50,
    clinikoRef: "CLN-4829",
  },
  {
    id: "bk-010",
    date: todayOffset(2),
    time: "10:00",
    clientName: "Tom B.",
    clientInitials: "TB",
    practitionerId: "george",
    locationId: "dundee",
    appointmentTypeId: "acupuncture",
    source: "cliniko-private",
    paymentStatus: "deposit-paid",
    noteStatus: "not-started",
    invoiceStatus: "draft-needed",
    estimatedFee: 55,
    clinikoRef: "CLN-4830",
  },
];

// ─── Calendar items (week view) ──────────────────────────────────────────────

export const calendarItems: CalendarItem[] = [
  ...bookings.map((b) => ({
    id: `cal-${b.id}`,
    date: b.date,
    startTime: b.time,
    endTime: addMinutes(b.time, getAppointmentType(b.appointmentTypeId).durationMinutes),
    title: getAppointmentType(b.appointmentTypeId).name,
    clientName: b.clientName,
    practitionerId: b.practitionerId,
    locationId: b.locationId,
    source: b.source,
    paymentStatus: b.paymentStatus,
    noteStatus: b.noteStatus,
    invoiceStatus: b.invoiceStatus,
    estimatedFee: b.estimatedFee,
  })),
  {
    id: "cal-ext-001",
    date: todayOffset(2),
    startTime: "14:00",
    endTime: "17:00",
    title: "SSE pitch-side cover",
    clientName: "External commitment",
    practitionerId: "george",
    locationId: "external",
    source: "external-work",
    paymentStatus: "external-invoice",
    noteStatus: "not-started",
    invoiceStatus: "ready-to-send",
    estimatedFee: 280,
  },
  {
    id: "cal-gap-001",
    date: todayOffset(3),
    startTime: "14:00",
    endTime: "15:00",
    title: "Available gap",
    clientName: "",
    practitionerId: "george",
    locationId: "dundee",
    source: "admin-block",
    paymentStatus: "unpaid",
    noteStatus: "not-started",
    invoiceStatus: "draft-needed",
    estimatedFee: 0,
    isGap: true,
  },
  {
    id: "cal-gap-002",
    date: todayOffset(4),
    startTime: "11:00",
    endTime: "12:00",
    title: "Available gap",
    clientName: "",
    practitionerId: "jamie-lee",
    locationId: "dundee",
    source: "admin-block",
    paymentStatus: "unpaid",
    noteStatus: "not-started",
    invoiceStatus: "draft-needed",
    estimatedFee: 0,
    isGap: true,
  },
  {
    id: "cal-stock-001",
    date: todayOffset(0),
    startTime: "08:30",
    endTime: "08:45",
    title: "Stock check — K-tape",
    clientName: "Admin task",
    practitionerId: "george",
    locationId: "dundee",
    source: "stock-task",
    paymentStatus: "unpaid",
    noteStatus: "complete",
    invoiceStatus: "draft-needed",
    estimatedFee: 0,
    stockWarning: "K-tape below reorder threshold",
  },
];

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export const weekDays = Array.from({ length: 5 }, (_, i) => todayOffset(i));

// ─── Insurance cases ─────────────────────────────────────────────────────────

export const insuranceCases: InsuranceCase[] = [
  {
    id: "ins-001",
    clientName: "Sarah M.",
    clientInitials: "SM",
    insurer: "Aviva",
    policyNumber: "AV-88421",
    claimNumber: "CLM-22901",
    authorisationNumber: "AUTH-7712",
    approvedSessions: 6,
    usedSessions: 5,
    expiryDate: todayOffset(45),
    invoiceStatus: "draft-needed",
    status: "one-session-remaining",
    liabilityAgreed: true,
    warning: "1 session remaining — draft invoice after today",
    practitionerId: "george",
  },
  {
    id: "ins-002",
    clientName: "John R.",
    clientInitials: "JR",
    insurer: "Vitality",
    policyNumber: "VT-55210",
    claimNumber: "CLM-33842",
    authorisationNumber: "",
    approvedSessions: 4,
    usedSessions: 1,
    expiryDate: todayOffset(60),
    invoiceStatus: "ready-to-send",
    status: "authorisation-missing",
    liabilityAgreed: false,
    warning: "Authorisation number missing",
    practitionerId: "george",
  },
  {
    id: "ins-003",
    clientName: "Helen C.",
    clientInitials: "HC",
    insurer: "Aviva",
    policyNumber: "AV-99102",
    claimNumber: "CLM-11029",
    authorisationNumber: "AUTH-3301",
    approvedSessions: 8,
    usedSessions: 8,
    expiryDate: todayOffset(12),
    invoiceStatus: "submitted",
    status: "expired-soon",
    liabilityAgreed: true,
    warning: "Claim expiry approaching",
    practitionerId: "george",
  },
  {
    id: "ins-004",
    clientName: "Paul S.",
    clientInitials: "PS",
    insurer: "Vitality",
    policyNumber: "VT-44102",
    claimNumber: "CLM-88201",
    authorisationNumber: "AUTH-9921",
    approvedSessions: 5,
    usedSessions: 3,
    expiryDate: todayOffset(90),
    invoiceStatus: "submitted",
    status: "invoice-pending",
    liabilityAgreed: true,
    practitionerId: "george",
  },
  {
    id: "ins-005",
    clientName: "Karen D.",
    clientInitials: "KD",
    insurer: "Aviva",
    policyNumber: "AV-77201",
    claimNumber: "CLM-55012",
    authorisationNumber: "AUTH-4410",
    approvedSessions: 6,
    usedSessions: 6,
    expiryDate: todayOffset(-5),
    invoiceStatus: "paid",
    status: "complete",
    liabilityAgreed: true,
    practitionerId: "george",
  },
];

// ─── Invoices ────────────────────────────────────────────────────────────────

export const invoices: Invoice[] = [
  {
    id: "inv-001",
    ref: "TE-2026-0142",
    clientOrPayer: "Aviva — Sarah M.",
    payerType: "insurance",
    amount: 55,
    sessionDates: [todayOffset(0)],
    status: "draft-needed",
    missingInfo: ["Session number confirmation"],
    insurer: "Aviva",
    claimNumber: "CLM-22901",
  },
  {
    id: "inv-002",
    ref: "TE-2026-0141",
    clientOrPayer: "Vitality — John R.",
    payerType: "insurance",
    amount: 75,
    sessionDates: [todayOffset(0)],
    status: "ready-to-send",
    insurer: "Vitality",
    claimNumber: "CLM-33842",
  },
  {
    id: "inv-003",
    ref: "TE-2026-0138",
    clientOrPayer: "SSE — pitch-side cover",
    payerType: "external",
    amount: 280,
    sessionDates: [todayOffset(2)],
    status: "submitted",
  },
  {
    id: "inv-004",
    ref: "TE-2026-0135",
    clientOrPayer: "James T.",
    payerType: "private",
    amount: 75,
    sessionDates: [todayOffset(-3)],
    status: "overdue",
    missingInfo: ["Payment link not opened"],
  },
  {
    id: "inv-005",
    ref: "TE-2026-0130",
    clientOrPayer: "Aviva — Helen C.",
    payerType: "insurance",
    amount: 110,
    sessionDates: [todayOffset(-7), todayOffset(-14)],
    status: "queried",
    missingInfo: ["Treatment code query from insurer"],
    insurer: "Aviva",
  },
  {
    id: "inv-006",
    ref: "TE-2026-0128",
    clientOrPayer: "Emma L.",
    payerType: "private",
    amount: 50,
    sessionDates: [todayOffset(0)],
    status: "paid",
  },
];

// ─── Payments ────────────────────────────────────────────────────────────────

export const paymentRecords: PaymentRecord[] = [
  { id: "pay-001", clientName: "Anna K.", appointmentDate: todayOffset(0), amount: 50, status: "unpaid", action: "Send payment link" },
  { id: "pay-002", clientName: "David P.", appointmentDate: todayOffset(0), amount: 40, status: "unpaid", action: "Confirm telehealth payment" },
  { id: "pay-003", clientName: "Mark H.", appointmentDate: todayOffset(1), amount: 55, status: "cash-approval-required", action: "Review cash agreement" },
  { id: "pay-004", clientName: "Emma L.", appointmentDate: todayOffset(0), amount: 50, status: "paid-online", method: "Stripe" },
  { id: "pay-005", clientName: "James T.", appointmentDate: todayOffset(0), amount: 37.5, status: "deposit-paid", method: "Stripe deposit" },
];

export const paymentRules: PaymentRule[] = [
  { id: "pr-001", appointmentType: "Initial physio assessment", rule: "Full payment or deposit online" },
  { id: "pr-002", appointmentType: "Follow-up treatment", rule: "Optional online / pay in clinic" },
  { id: "pr-003", appointmentType: "Sports massage", rule: "Deposit recommended" },
  { id: "pr-004", appointmentType: "Telehealth review", rule: "Full payment before appointment" },
  { id: "pr-005", appointmentType: "Insurance initial assessment", rule: "No online payment — claim details required" },
  { id: "pr-006", appointmentType: "Insurance follow-up", rule: "No online payment — session tracking required" },
  { id: "pr-007", appointmentType: "Cash by agreement", rule: "Approval warning", warning: "Flag for admin review" },
];

export const paymentActionQueue: PaymentActionQueueItem[] = [
  { id: "paq-001", description: "Unpaid private appointments", count: 2, modulePath: "/admin/payments" },
  { id: "paq-002", description: "Cash requests need approval", count: 1, modulePath: "/admin/payments" },
  { id: "paq-003", description: "Telehealth payments not confirmed", count: 1, modulePath: "/admin/payments" },
  { id: "paq-004", description: "Invoice payment links ready to send", count: 3, modulePath: "/admin/invoices" },
];

// ─── Finance summaries ───────────────────────────────────────────────────────

export const financeSummary = {
  revenueThisWeek: 1940,
  paidThisWeek: 1180,
  outstandingInvoices: 760,
  insurancePending: 620,
  cashToCollect: 110,
  expensesThisMonth: 840,
  estimatedNet: 1180,
  uninvoicedSessions: 4,
  plainEnglish:
    "The clinic is projected to finish the week £1,180 ahead, but £760 is still waiting on invoices or payment links.",
  revenueByWorkstream: [
    { label: "Private", amount: 820, percent: 42 },
    { label: "Insurance", amount: 620, percent: 32 },
    { label: "Telehealth", amount: 120, percent: 6 },
    { label: "External work", amount: 380, percent: 20 },
  ],
  revenueByLocation: [
    { label: "Dundee", amount: 1120, percent: 58 },
    { label: "Aviemore", amount: 320, percent: 16 },
    { label: "Telehealth", amount: 120, percent: 6 },
    { label: "External", amount: 380, percent: 20 },
  ],
  revenueByPractitioner: [
    { label: "George", amount: 1340, percent: 69 },
    { label: "Jamie Lee", amount: 600, percent: 31 },
  ],
  paymentMethodBreakdown: [
    { label: "Online (Stripe)", amount: 680, percent: 58 },
    { label: "Card in clinic", amount: 220, percent: 19 },
    { label: "Cash", amount: 110, percent: 9 },
    { label: "Insurance invoice", amount: 620, percent: 53 },
    { label: "External invoice", amount: 280, percent: 24 },
  ],
  outstandingByAge: [
    { label: "0–7 days", amount: 420, percent: 55 },
    { label: "8–14 days", amount: 190, percent: 25 },
    { label: "15+ days", amount: 150, percent: 20 },
  ],
};

export const dashboardToday = {
  appointmentsToday: 7,
  practitionersActive: 2,
  estimatedRevenue: 520,
  insuranceClients: 2,
  externalWorkBlocks: 1,
  stockWarnings: 1,
};

export const dashboardWeek = {
  estimatedIncome: 1940,
  outstandingInvoices: 760,
  calendarGaps: 5,
  followUpsDue: 3,
  insuranceNearLimit: 2,
};

// ─── Expenses ────────────────────────────────────────────────────────────────

export const expenses: Expense[] = [
  { id: "exp-001", supplier: "Kanzen Karate (room hire)", amount: 350, category: "Rent", date: todayOffset(-5), paymentStatus: "paid" },
  { id: "exp-002", supplier: "Cliniko", amount: 45, category: "Software", date: todayOffset(-3), paymentStatus: "paid" },
  { id: "exp-003", supplier: "Balens Insurance", amount: 120, category: "Insurance", date: todayOffset(-10), paymentStatus: "paid" },
  { id: "exp-004", supplier: "Physio Supplies Co", amount: 86, category: "Stock/consumables", date: todayOffset(-2), paymentStatus: "pending" },
  { id: "exp-005", supplier: "Fuel — Aviemore trip", amount: 42, category: "Mileage", date: todayOffset(-7), paymentStatus: "paid" },
  { id: "exp-006", supplier: "CPD — manual therapy course", amount: 195, category: "Training/CPD", date: todayOffset(-14), paymentStatus: "paid" },
];

export const expenseCategories = [
  "Rent", "Software", "Insurance", "Stock/consumables",
  "Mileage", "Equipment", "Training/CPD", "Other",
];

// ─── External work ───────────────────────────────────────────────────────────

export const externalWorkBlocks: ExternalWorkBlock[] = [
  {
    id: "ext-001",
    workstream: "SSE — pitch-side cover",
    date: todayOffset(2),
    startTime: "14:00",
    endTime: "17:00",
    location: "Dundee United FC training ground",
    practitionerId: "george",
    estimatedFee: 280,
    mileage: 24,
    invoiceStatus: "ready-to-send",
    stockNeeded: ["K-tape", "Rigid tape", "First aid kit"],
    notes: "Business commitment only — patient details in external system.",
  },
  {
    id: "ext-002",
    workstream: "Health Partners — workplace assessment",
    date: todayOffset(5),
    startTime: "09:00",
    endTime: "12:00",
    location: "Inverness office park",
    practitionerId: "george",
    estimatedFee: 320,
    mileage: 68,
    invoiceStatus: "draft-needed",
    stockNeeded: ["Assessment forms"],
    notes: "Ergonomic assessments — no patient records stored here.",
  },
  {
    id: "ext-003",
    workstream: "SFA — match day physio",
    date: todayOffset(8),
    startTime: "11:00",
    endTime: "16:00",
    location: "Tannadice Park",
    practitionerId: "george",
    estimatedFee: 400,
    mileage: 12,
    invoiceStatus: "draft-needed",
    stockNeeded: ["K-tape", "Rigid tape", "Acupuncture needles"],
    notes: "Scottish FA commitment — invoiced separately.",
  },
];

// ─── Stock ─────────────────────────────────────────────────────────────────────

export const stockItems: StockItem[] = [
  { id: "stk-001", name: "K-tape", currentLevel: 4, unit: "rolls", reorderThreshold: 6, estimatedWeeklyUsage: 3, linkedAppointmentTypes: ["Follow-up", "Sports massage", "External work"], status: "low" },
  { id: "stk-002", name: "Rigid tape", currentLevel: 8, unit: "rolls", reorderThreshold: 4, estimatedWeeklyUsage: 2, linkedAppointmentTypes: ["Follow-up", "Sports massage"], status: "ok" },
  { id: "stk-003", name: "Acupuncture needles", currentLevel: 120, unit: "units", reorderThreshold: 50, estimatedWeeklyUsage: 30, linkedAppointmentTypes: ["Acupuncture"], status: "ok" },
  { id: "stk-004", name: "Couch roll", currentLevel: 6, unit: "rolls", reorderThreshold: 4, estimatedWeeklyUsage: 3, linkedAppointmentTypes: ["Sports massage", "Initial assessment"], status: "reorder-soon" },
  { id: "stk-005", name: "Massage lotion", currentLevel: 3, unit: "bottles", reorderThreshold: 2, estimatedWeeklyUsage: 1, linkedAppointmentTypes: ["Sports massage"], status: "ok" },
  { id: "stk-006", name: "Cleaning supplies", currentLevel: 5, unit: "units", reorderThreshold: 3, estimatedWeeklyUsage: 2, linkedAppointmentTypes: ["All appointments"], status: "ok" },
  { id: "stk-007", name: "Exercise bands", currentLevel: 12, unit: "units", reorderThreshold: 5, estimatedWeeklyUsage: 1, linkedAppointmentTypes: ["Rehab sessions"], status: "ok" },
  { id: "stk-008", name: "Injection consumables", currentLevel: 10, unit: "kits", reorderThreshold: 5, estimatedWeeklyUsage: 1, linkedAppointmentTypes: ["Injection consultation"], status: "ok" },
];

export const stockUsageRules: StockUsageRule[] = [
  { id: "sur-001", appointmentType: "Taping appointment", itemsUsed: ["K-tape or Rigid tape"] },
  { id: "sur-002", appointmentType: "Acupuncture", itemsUsed: ["Acupuncture needles"] },
  { id: "sur-003", appointmentType: "Sports massage", itemsUsed: ["Couch roll", "Massage lotion"] },
  { id: "sur-004", appointmentType: "External / SFA work", itemsUsed: ["K-tape", "Rigid tape", "Mileage"], notes: "Kit list checked before departure" },
  { id: "sur-005", appointmentType: "Injection appointment", itemsUsed: ["Injection consumables"], notes: "Clinical consumables placeholder" },
];

// ─── Follow-ups ──────────────────────────────────────────────────────────────

export const followUpTasks: FollowUpTask[] = [
  {
    id: "fu-001",
    type: "48-hour injury check-in",
    dueDate: todayOffset(0),
    clientName: "James T.",
    trigger: "Initial physio assessment yesterday",
    suggestedMessage: "Hi James, just checking in on your knee after yesterday's assessment. How are you feeling with the exercises?",
    status: "pending",
  },
  {
    id: "fu-002",
    type: "Rebook prompt",
    dueDate: todayOffset(1),
    clientName: "Emma L.",
    trigger: "Sports massage — 4 weeks since last visit",
    suggestedMessage: "Hi Emma, it's been about 4 weeks since your last sports massage. Would you like to book another session?",
    status: "pending",
  },
  {
    id: "fu-003",
    type: "Insurance session reminder",
    dueDate: todayOffset(0),
    clientName: "Sarah M.",
    trigger: "1 session remaining on Aviva authorisation",
    suggestedMessage: "Hi Sarah, you have one remaining authorised session. Shall we book your final follow-up?",
    status: "pending",
  },
  {
    id: "fu-004",
    type: "Telehealth follow-up",
    dueDate: todayOffset(2),
    clientName: "David P.",
    trigger: "Telehealth review booked — payment pending",
    suggestedMessage: "Hi David, please complete payment before your telehealth appointment so we can send joining details.",
    status: "pending",
  },
  {
    id: "fu-005",
    type: "Review request",
    dueDate: todayOffset(3),
    clientName: "Lisa F.",
    trigger: "Completed treatment course",
    suggestedMessage: "Hi Lisa, we hope you're feeling better. If you have a moment, we'd appreciate a quick review of your experience.",
    status: "pending",
  },
  {
    id: "fu-006",
    type: "Post-injection safety check",
    dueDate: todayOffset(5),
    clientName: "Helen C.",
    trigger: "Steroid injection 48h follow-up (placeholder)",
    suggestedMessage: "Hi Helen, checking in after your injection. Any increased pain, redness or concerns?",
    status: "pending",
  },
];

// ─── Waitlist ────────────────────────────────────────────────────────────────

export const waitlistEntries: WaitlistEntry[] = [
  {
    id: "wl-001",
    clientName: "Chris N.",
    desiredLocation: "dundee",
    desiredPractitionerId: "george",
    appointmentType: "Initial physio assessment",
    availabilityWindow: "Weekday afternoons",
    contactPreference: "SMS",
    matchedGap: `${todayOffset(3)} 14:00 Dundee`,
    matchScore: 92,
  },
  {
    id: "wl-002",
    clientName: "Fiona G.",
    desiredLocation: "aviemore",
    desiredPractitionerId: "jamie-lee",
    appointmentType: "Sports massage",
    availabilityWindow: "Friday mornings",
    contactPreference: "Email",
    matchedGap: `${todayOffset(4)} 11:00 Aviemore`,
    matchScore: 78,
  },
  {
    id: "wl-003",
    clientName: "Stuart M.",
    desiredLocation: "dundee",
    desiredPractitionerId: "george",
    appointmentType: "Follow-up treatment",
    availabilityWindow: "Any weekday",
    contactPreference: "Phone",
    matchScore: 45,
  },
];

// ─── Dashboard actions ─────────────────────────────────────────────────────────

export const dashboardActions: DashboardAction[] = [
  {
    id: "da-001",
    title: "Draft Aviva invoice for Sarah M.",
    description: "Final authorised session today — invoice draft needed after note completion.",
    priority: "high",
    modulePath: "/admin/invoices",
    actionLabel: "Draft",
  },
  {
    id: "da-002",
    title: "Offer Thursday 14:00 gap to waitlist",
    description: "George has a 1-hour gap matched to Chris N. (92% match).",
    priority: "medium",
    modulePath: "/admin/waitlist",
    actionLabel: "Offer slot",
  },
  {
    id: "da-003",
    title: "Check Vitality authorisation for John R.",
    description: "Authorisation number missing before invoice can be submitted.",
    priority: "high",
    modulePath: "/admin/insurance",
    actionLabel: "Review",
  },
  {
    id: "da-004",
    title: "Review telehealth payment status",
    description: "David P. telehealth at 16:30 — payment not yet confirmed.",
    priority: "high",
    modulePath: "/admin/payments",
    actionLabel: "Review",
  },
  {
    id: "da-005",
    title: "Reorder K-tape before Friday clinic",
    description: "4 rolls remaining — below reorder threshold of 6.",
    priority: "medium",
    modulePath: "/admin/stock",
    actionLabel: "Open",
  },
  {
    id: "da-006",
    title: "Save draft note for 10:30 knee assessment",
    description: "James T. initial assessment — note not yet started.",
    priority: "medium",
    modulePath: "/admin/notes",
    actionLabel: "Open",
  },
  {
    id: "da-007",
    title: "Review cash payment request",
    description: "Mark H. tomorrow — cash by agreement needs admin approval.",
    priority: "high",
    modulePath: "/admin/payments",
    actionLabel: "Review",
  },
];

// ─── Cliniko health check ────────────────────────────────────────────────────

export const clinikoHealthCheck: ClinikoHealthCheckItem[] = [
  { id: "ch-001", section: "Booking", title: "Location-specific online booking links", status: "demo", impact: "high", action: "Configure" },
  { id: "ch-002", section: "Booking", title: "Practitioner-specific booking links", status: "demo", impact: "medium", action: "Configure" },
  { id: "ch-003", section: "Booking", title: "Appointment-type-specific links", status: "recommended", impact: "high", action: "Configure" },
  { id: "ch-004", section: "Booking", title: "Telehealth booking enabled", status: "recommended", impact: "medium", action: "Add to plan" },
  { id: "ch-005", section: "Booking", title: "No wrong-location booking risk", status: "demo", impact: "high", action: "Learn more" },
  { id: "ch-006", section: "Payments", title: "Stripe connected", status: "demo", impact: "high", action: "Configure" },
  { id: "ch-007", section: "Payments", title: "Appointment payment rules configured", status: "recommended", impact: "high", action: "Configure" },
  { id: "ch-008", section: "Payments", title: "Deposits enabled where useful", status: "recommended", impact: "medium", action: "Configure" },
  { id: "ch-009", section: "Payments", title: "Invoice payment links enabled", status: "demo", impact: "high", action: "Configure" },
  { id: "ch-010", section: "Payments", title: "Payment types configured", status: "demo", impact: "medium", action: "Configure" },
  { id: "ch-011", section: "Insurance", title: "Custom patient fields for insurer details", status: "demo", impact: "high", action: "Configure" },
  { id: "ch-012", section: "Insurance", title: "Claim number captured", status: "demo", impact: "high", action: "Configure" },
  { id: "ch-013", section: "Insurance", title: "Authorisation number captured", status: "recommended", impact: "high", action: "Configure" },
  { id: "ch-014", section: "Insurance", title: "Approved sessions captured", status: "demo", impact: "high", action: "Configure" },
  { id: "ch-015", section: "Insurance", title: "Third-party invoice details configured", status: "recommended", impact: "medium", action: "Configure" },
  { id: "ch-016", section: "Insurance", title: "Liability wording included", status: "demo", impact: "medium", action: "Learn more" },
  { id: "ch-017", section: "Forms/notes", title: "Patient forms digitised", status: "recommended", impact: "medium", action: "Configure" },
  { id: "ch-018", section: "Forms/notes", title: "Forms auto-sent before appointment", status: "recommended", impact: "high", action: "Add to plan" },
  { id: "ch-019", section: "Forms/notes", title: "Treatment note templates configured", status: "demo", impact: "high", action: "Configure" },
  { id: "ch-020", section: "Forms/notes", title: "Dictation workflow available", status: "demo", impact: "medium", action: "Learn more" },
  { id: "ch-021", section: "Forms/notes", title: "Draft notes saved to Cliniko", status: "demo", impact: "high", action: "Configure" },
  { id: "ch-022", section: "Operations", title: "Follow-up messages configured", status: "future", impact: "medium", action: "Add to plan" },
  { id: "ch-023", section: "Operations", title: "Reminder templates reviewed", status: "recommended", impact: "medium", action: "Configure" },
  { id: "ch-024", section: "Operations", title: "Products/stock configured", status: "future", impact: "low", action: "Add to plan" },
  { id: "ch-025", section: "Operations", title: "Xero integration ready", status: "future", impact: "high", action: "Add to plan" },
  { id: "ch-026", section: "Operations", title: "Outstanding invoice report used", status: "recommended", impact: "high", action: "Learn more" },
  { id: "ch-027", section: "Operations", title: "Daily payment report used", status: "recommended", impact: "medium", action: "Learn more" },
];

// ─── Healthcode ──────────────────────────────────────────────────────────────

export const healthcodeFutureItems: HealthcodeFutureItem[] = [
  { id: "hc-001", title: "Insurer claim validation", description: "Validate claim details against insurer rules before submission." },
  { id: "hc-002", title: "Electronic invoice submission", description: "Submit invoices electronically rather than manual email/post." },
  { id: "hc-003", title: "Claim status tracking", description: "Track submitted claims through to payment or query." },
  { id: "hc-004", title: "Rejection handling", description: "Manage rejections with clear next steps and resubmission workflow." },
  { id: "hc-005", title: "Payment reconciliation", description: "Match insurer payments back to invoices in the finance dashboard." },
];

export const healthcodeRequirements = [
  "Confirm George's Healthcode workflow",
  "API / developer access",
  "Insurer support confirmation",
  "Data processing review",
  "Test environment setup",
];

// ─── Notes ───────────────────────────────────────────────────────────────────

export const noteTemplates: NoteTemplate[] = [
  { id: "nt-001", name: "Initial physio assessment", sections: ["Subjective", "Objective", "Assessment", "Treatment provided", "Advice given", "Plan", "Follow-up"] },
  { id: "nt-002", name: "Follow-up treatment", sections: ["Subjective", "Objective", "Assessment", "Treatment provided", "Advice given", "Plan", "Follow-up"] },
  { id: "nt-003", name: "Sports massage", sections: ["Subjective", "Treatment provided", "Advice given", "Plan", "Follow-up"] },
  { id: "nt-004", name: "Insurance review", sections: ["Subjective", "Objective", "Assessment", "Treatment provided", "Insurance/session notes", "Plan"] },
  { id: "nt-005", name: "Telehealth review", sections: ["Subjective", "Assessment", "Advice given", "Plan", "Follow-up"] },
  { id: "nt-006", name: "Acupuncture", sections: ["Subjective", "Objective", "Treatment provided", "Advice given", "Plan", "Follow-up"] },
];

export const noteAppointments: NoteAppointment[] = bookings
  .filter((b) => b.noteStatus !== "complete")
  .map((b) => ({
    id: b.id,
    date: b.date,
    time: b.time,
    clientName: b.clientName,
    appointmentType: getAppointmentType(b.appointmentTypeId).name,
    practitionerId: b.practitionerId,
    noteStatus: b.noteStatus,
  }));

// ─── Banking checklist ───────────────────────────────────────────────────────

export const bankingChecklist = [
  { id: "bc-001", label: "Payment types configured", done: true },
  { id: "bc-002", label: "Stripe connected in Cliniko", done: true },
  { id: "bc-003", label: "Invoice payment links enabled", done: true },
  { id: "bc-004", label: "Xero integration ready", done: false },
  { id: "bc-005", label: "Cash takings tracked", done: true },
  { id: "bc-006", label: "Expenses uploaded", done: false },
  { id: "bc-007", label: "Outstanding invoices reviewed weekly", done: true },
];

export const bankingTotals = {
  cash: 110,
  card: 220,
  online: 680,
  notes: "Manual reconciliation placeholder — connect Xero for live bank feeds.",
};

// ─── Label helpers ─────────────────────────────────────────────────────────────

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  "paid-online": "Paid online",
  "deposit-paid": "Deposit paid",
  unpaid: "Unpaid",
  "pay-in-clinic": "Pay in clinic",
  "cash-agreed": "Cash agreed",
  "cash-approval-required": "Cash approval required",
  "insurance-invoice": "Insurance invoice",
  "external-invoice": "External invoice",
};

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  "draft-needed": "Draft needed",
  "ready-to-send": "Ready to send",
  submitted: "Submitted",
  paid: "Paid",
  overdue: "Overdue",
  queried: "Queried",
};

export const insuranceStatusLabels: Record<InsuranceStatus, string> = {
  "authorisation-missing": "Authorisation missing",
  active: "Active",
  "one-session-remaining": "1 session remaining",
  "expired-soon": "Expired soon",
  "invoice-pending": "Invoice pending",
  complete: "Complete",
};

export const sourceLabels: Record<BookingSource, string> = {
  "cliniko-private": "Cliniko private",
  "cliniko-insurance": "Cliniko insurance",
  telehealth: "Telehealth",
  "external-work": "External work",
  "admin-block": "Admin block",
  "stock-task": "Stock task",
};

export const sourceBadgeColors: Record<BookingSource, string> = {
  "cliniko-private": "bg-blue-100 text-blue-800",
  "cliniko-insurance": "bg-purple-100 text-purple-800",
  telehealth: "bg-cyan-100 text-cyan-800",
  "external-work": "bg-amber-100 text-amber-800",
  "admin-block": "bg-slate-100 text-slate-600",
  "stock-task": "bg-orange-100 text-orange-800",
};
