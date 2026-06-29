import type { Metadata } from "next";
import { PublicHubNote } from "@/components/PublicHubNote";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { business, telehealthContent } from "@/lib/tigers-eye-content";

export const metadata: Metadata = {
  title: "Telehealth",
  description: `Telehealth review appointments at ${business.shortName} — proposed demo service.`,
};

export default function TelehealthPage() {
  return (
    <>
      <PageHero
        title={telehealthContent.title}
        subtitle={telehealthContent.intro}
      >
        <span className="inline-block rounded-full bg-green-muted px-3 py-1 text-sm font-semibold text-green">
          Proposed service
        </span>
      </PageHero>

      <Section title="Who is it suitable for?">
        <ul className="grid max-w-2xl gap-3">
          {telehealthContent.suitableFor.map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-lg border border-cream-dark bg-white px-4 py-3 text-base text-navy"
            >
              <span className="text-green" aria-hidden>
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="When in-person care is needed" className="bg-white">
        <ul className="max-w-2xl space-y-2">
          {telehealthContent.notSuitableFor.map((item) => (
            <li key={item} className="flex gap-2 text-base text-slate">
              <span aria-hidden>✕</span>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="How it works">
        <div className="grid gap-6 md:grid-cols-2">
          <Callout title="Payment" variant="info">
            <p>{telehealthContent.paymentNote}</p>
          </Callout>
          <Callout title="Command Hub workflow" variant="success">
            <p>{telehealthContent.workflowNote}</p>
          </Callout>
        </div>
        <div className="mt-8">
          <Button href="/book" variant="primary">
            {telehealthContent.bookingCta}
          </Button>
          <PublicHubNote>
            Telehealth appointments can be shown separately in the calendar and flagged for
            online payment before the video appointment.
          </PublicHubNote>
        </div>
      </Section>
    </>
  );
}
