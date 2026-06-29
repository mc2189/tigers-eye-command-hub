import type { Metadata } from "next";
import { Accordion, AccordionItem } from "@/components/Accordion";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import {
  business,
  insuranceLiabilityNotice,
  insuranceProviders,
} from "@/lib/tigers-eye-content";

export const metadata: Metadata = {
  title: "Insurance",
  description: `Insurance guidance for physiotherapy at ${business.shortName}.`,
};

const allRequiredDetails = [
  ...new Set(insuranceProviders.flatMap((p) => p.requiredDetails)),
];

export default function InsurancePage() {
  return (
    <>
      <PageHero
        title="Insurance patients"
        subtitle="Guidance for Aviva, Vitality and other insurers. Have your details ready before booking."
      >
        <Button href="/book" variant="primary">
          Insurance booking flow
        </Button>
      </PageHero>

      <Section title="Provider guidance">
        <div className="grid gap-6 lg:grid-cols-3">
          {insuranceProviders.map((provider) => (
            <article
              key={provider.id}
              className="flex flex-col rounded-xl border border-cream-dark bg-white p-5 shadow-sm sm:p-6"
            >
              <h2 className="text-xl font-bold text-navy">{provider.name}</h2>
              <p className="mt-3 flex-1 text-base text-slate">
                {provider.summary}
              </p>
              <Accordion className="mt-4">
                <AccordionItem title="Eligibility">
                  <p>{provider.eligibility}</p>
                </AccordionItem>
                <AccordionItem title="Paperwork support">
                  <p>{provider.paperworkSupport}</p>
                </AccordionItem>
                <AccordionItem title="What you need to do">
                  <p>{provider.clientAction}</p>
                </AccordionItem>
                <AccordionItem title="Required details">
                  <ul className="space-y-2">
                    {provider.requiredDetails.map((d) => (
                      <li key={d} className="flex gap-2">
                        <span className="text-green" aria-hidden>
                          ✓
                        </span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </AccordionItem>
              </Accordion>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Required details checklist" className="bg-white">
        <div className="max-w-2xl rounded-xl border border-cream-dark bg-cream p-6">
          <p className="mb-4 text-base text-slate">
            Please have the following ready. Details are captured for admin
            follow-up in the Command Hub before treatment is confirmed.
          </p>
          <ul className="space-y-2">
            {allRequiredDetails.map((item) => (
              <li key={item} className="flex gap-2 text-base text-navy">
                <span className="text-green" aria-hidden>
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section>
        <Callout title="Liability notice" variant="warning">
          <p>{insuranceLiabilityNotice}</p>
        </Callout>
        <div className="mt-8">
          <Button href="/book" variant="primary">
            Start insurance booking
          </Button>
        </div>
      </Section>
    </>
  );
}
