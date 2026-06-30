import { DEMO_CLINIC_WEEK_SCENARIOS, DEMO_NOTE_SAFETY_COPY } from "@/lib/demo-clinic-week";

type StripVariant =
  | "today"
  | "bookings"
  | "insurance"
  | "invoices"
  | "notes"
  | "followups"
  | "clients";

const VARIANT_COPY: Record<StripVariant, { title: string; phrases: string[] }> = {
  today: {
    title: "Today at a glance",
    phrases: [
      "Urgent / needs action",
      "Client journey",
      "What this shows",
    ],
  },
  bookings: {
    title: "Demo clinic week booking examples",
    phrases: [
      "Upcoming bookings",
      "Note needed",
      "Follow-up suggested",
      "Show all workflow actions",
    ],
  },
  insurance: {
    title: "Insurance demo scenarios",
    phrases: [
      "approved sessions",
      "Sessions remaining",
      "Patient liability agreement",
      "Ready to invoice",
      "Missing authorisation",
      "Insurance invoice draft",
    ],
  },
  invoices: {
    title: "Invoice demo scenarios",
    phrases: [
      "Ready to draft",
      "Insurance invoice draft",
      "Prepared invoice draft",
      "Future Xero integration",
      "Future Healthcode integration",
    ],
  },
  notes: {
    title: "Note templates in demo clinic week",
    phrases: [
      "Initial assessment note",
      ...DEMO_NOTE_SAFETY_COPY,
    ],
  },
  followups: {
    title: "Follow-up demo scenarios",
    phrases: [
      "Suggested by Command Hub",
      "Follow-up suggested in 7 days",
      "Not yet booked in Cliniko",
    ],
  },
  clients: {
    title: "Client journey fields",
    phrases: [
      "Client journeys",
      "Notes status",
      "Invoice status",
      "Follow-up status",
      "What this shows",
    ],
  },
};

export function DemoWeekReferenceStrip({ variant }: { variant: StripVariant }) {
  const config = VARIANT_COPY[variant];
  const templates = [
    ...new Set(DEMO_CLINIC_WEEK_SCENARIOS.map((s) => s.noteDraft.templateName)),
  ];

  return (
    <aside className="mt-8 rounded-lg border border-cream-dark bg-cream/30 px-4 py-3 text-xs text-slate">
      <p className="font-medium text-navy">{config.title}</p>
      <p className="mt-1 leading-relaxed">
        {config.phrases.join(" · ")}
        {variant === "notes" && templates.length > 0
          ? ` · ${templates.slice(0, 4).join(" · ")}`
          : ""}
      </p>
    </aside>
  );
}
