export type WalkthroughStatus = "live" | "cliniko" | "future";

export interface WalkthroughStep {
  id: string;
  title: string;
  explanation: string;
  href: string;
  whyItHelps: string[];
  status: WalkthroughStatus;
}

export const walkthroughSteps: WalkthroughStep[] = [
  {
    id: "public",
    title: "Public website refresh",
    explanation:
      "The new public site is cleaner and easier to navigate. Services, locations, insurance and booking are clearer for patients.",
    href: "/",
    whyItHelps: [
      "Patients find the right service faster",
      "Less confusion between Dundee and Aviemore",
      "Insurance and telehealth are explained plainly",
      "Every page has a clear next action",
    ],
    status: "live",
  },
  {
    id: "booking",
    title: "Location-first booking",
    explanation:
      "Patients choose Dundee or Aviemore first, then the appointment type. Both locations book through Cliniko — wrong-location bookings are reduced without running two systems.",
    href: "/book",
    whyItHelps: [
      "Fewer patients booking the wrong clinic",
      "Dundee and Aviemore both on Cliniko",
      "Insurance and telehealth routes are separated",
      "Setmore retired as locations move to Cliniko",
    ],
    status: "live",
  },
  {
    id: "cliniko",
    title: "Cliniko connection",
    explanation:
      "Cliniko remains the system of record. The Command Hub reads sandbox data and adds workflow context around it.",
    href: "/admin/cliniko",
    whyItHelps: [
      "See live businesses, practitioners and appointment types",
      "Understand what Cliniko already supports",
      "No duplicate patient database",
    ],
    status: "cliniko",
  },
  {
    id: "calendar",
    title: "Calendar command view",
    explanation:
      "See Cliniko bookings alongside external work, admin blocks and stock tasks in one weekly view.",
    href: "/admin/calendar",
    whyItHelps: [
      "One place to see the whole week",
      "Finance and stock overlays on appointments",
      "Gaps visible for waitlist offers",
    ],
    status: "cliniko",
  },
  {
    id: "payments",
    title: "Payments and finance",
    explanation:
      "Payment rules, deposits, outstanding money and cash warnings help you stay on top of income without spreadsheets.",
    href: "/admin/payments",
    whyItHelps: [
      "Clear rules per appointment type",
      "Cash agreements flagged for review",
      "Outstanding invoices visible at a glance",
    ],
    status: "live",
  },
  {
    id: "finance",
    title: "Finance dashboard",
    explanation:
      "Estimated income from Cliniko bookings plus demo finance panels show revenue by workstream, practitioner and location.",
    href: "/admin/finance",
    whyItHelps: [
      "See where money is coming from",
      "Spot missing prices early",
      "Plain-English weekly summary",
    ],
    status: "cliniko",
  },
  {
    id: "insurance",
    title: "Insurance tracker",
    explanation:
      "Track claim details, session counts and liability warnings so insurance work does not rely on memory.",
    href: "/admin/insurance",
    whyItHelps: [
      "Sessions remaining visible before treatment",
      "Authorisation gaps flagged early",
      "Less invoice chasing later",
    ],
    status: "cliniko",
  },
  {
    id: "invoices",
    title: "Invoices",
    explanation:
      "Draft invoice queue and payment follow-up tasks help you stay ahead of unpaid sessions.",
    href: "/admin/invoices",
    whyItHelps: [
      "See what needs drafting or sending",
      "Insurance invoices separated from private",
      "Demo invoice generator for review",
    ],
    status: "live",
  },
  {
    id: "notes",
    title: "Notes assistant",
    explanation:
      "Dictate or paste rough notes, structure them, review, then save a draft to Cliniko — nothing stored locally.",
    href: "/admin/notes",
    whyItHelps: [
      "Faster note writing after appointments",
      "Structured templates reduce missed sections",
      "Safe workflow — Cliniko stays the record",
    ],
    status: "cliniko",
  },
  {
    id: "stock",
    title: "Stock and consumables",
    explanation:
      "Stock estimates from appointment types help you reorder tape, needles and supplies before clinics run short.",
    href: "/admin/stock",
    whyItHelps: [
      "Reorder warnings before Friday clinic",
      "Usage linked to appointment types",
      "External work kit needs visible",
    ],
    status: "cliniko",
  },
  {
    id: "future",
    title: "Future integrations",
    explanation:
      "Healthcode, Xero and deeper Cliniko automation are planned — this shows the roadmap without overpromising.",
    href: "/admin/healthcode",
    whyItHelps: [
      "Clear picture of what comes next",
      "Insurance claim submission pathway",
      "Bank reconciliation and reporting",
    ],
    status: "future",
  },
];

export const walkthroughStatusLabels: Record<WalkthroughStatus, string> = {
  live: "Live demo",
  cliniko: "Cliniko sandbox",
  future: "Future",
};
