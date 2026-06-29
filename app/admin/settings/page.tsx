import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { practitioners, locations } from "@/lib/demo-data";

const settingsCards = [
  {
    title: "Demo mode",
    description: "Sandbox Cliniko data only. No real patient data stored.",
    value: "Enabled",
    variant: "warning" as const,
  },
  {
    title: "Cliniko sandbox connection",
    description: "Read-only demo sync — no live API calls.",
    value: "Demo stub",
    variant: "neutral" as const,
  },
  {
    title: "Payment mode",
    description: "Cliniko/Stripe future, insurance invoice, cash by agreement.",
    value: "Demo only",
    variant: "neutral" as const,
  },
  {
    title: "Transcription mode",
    description: "Browser dictation demo, paste only, local/cloud future options.",
    value: "Browser dictation demo",
    variant: "success" as const,
  },
  {
    title: "Data retention mode",
    description: "Transcripts purged after note save. No audio stored.",
    value: "Purge on save",
    variant: "success" as const,
  },
  {
    title: "Branding",
    description: "Tigers Eye logo, colours and public site content.",
    value: "Configured",
    variant: "success" as const,
  },
];

const transcriptionOptions = [
  "Browser dictation demo",
  "Paste only",
  "Local transcription future",
  "Cloud transcription future",
];

const paymentOptions = [
  "Demo only",
  "Cliniko/Stripe future",
  "Insurance invoice",
  "Cash by agreement",
  "External work invoice",
];

export default function SettingsPage() {
  return (
    <>
      <AdminPageHeader
        title="Settings"
        subtitle="Demo configuration, integrations and practitioner setup."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((card) => (
          <article
            key={card.title}
            className="rounded-xl border border-cream-dark bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold text-navy">{card.title}</h2>
              <StatusBadge label={card.value} variant={card.variant} />
            </div>
            <p className="mt-2 text-sm text-slate">{card.description}</p>
            <button type="button" className="mt-3 text-sm font-medium text-green hover:underline">
              Configure
            </button>
          </article>
        ))}
      </div>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="mb-4 font-bold text-navy">Practitioner setup</h2>
          <ul className="space-y-3">
            {practitioners.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className={p.isPlaceholder ? "text-slate italic" : "text-navy font-medium"}>
                  {p.name}
                </span>
                <StatusBadge
                  label={p.isPlaceholder ? "Placeholder" : "Active"}
                  variant={p.isPlaceholder ? "neutral" : "success"}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="mb-4 font-bold text-navy">Location setup</h2>
          <ul className="space-y-3">
            {locations.map((l) => (
              <li key={l.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-navy">{l.name}</span>
                <StatusBadge label="Active" variant="success" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="mb-4 font-bold text-navy">Transcription mode options</h2>
          <ul className="space-y-2">
            {transcriptionOptions.map((opt, i) => (
              <li key={opt} className="flex items-center gap-2 text-sm">
                <input type="radio" name="transcription" defaultChecked={i === 0} readOnly />
                {opt}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="mb-4 font-bold text-navy">Payment mode options</h2>
          <ul className="space-y-2">
            {paymentOptions.map((opt, i) => (
              <li key={opt} className="flex items-center gap-2 text-sm">
                <input type="radio" name="payment" defaultChecked={i === 0} readOnly />
                {opt}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-dashed border-cream-dark bg-white p-5">
        <h2 className="font-bold text-navy">Future integrations</h2>
        <p className="mt-2 text-sm text-slate">
          Healthcode, Xero, Setmore sync, and room-user calendars — configure when ready.
        </p>
        <button type="button" className="mt-4 min-h-10 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">
          View integration roadmap (demo)
        </button>
      </section>
    </>
  );
}
