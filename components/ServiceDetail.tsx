import type { Service } from "@/lib/tigers-eye-content";
import { Accordion, AccordionItem } from "./Accordion";
import { Callout } from "./Callout";

interface ServiceDetailProps {
  service: Service;
}

function CheckList({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy">
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-base text-slate">
            <span className="mt-1 shrink-0 text-green" aria-hidden>
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServiceDetail({ service }: ServiceDetailProps) {
  const hasAccordion =
    service.conditions ||
    service.includes ||
    service.benefits ||
    service.risks ||
    service.whoItsFor;

  return (
    <article
      id={service.slug}
      className="scroll-mt-24 rounded-xl border border-cream-dark bg-white p-5 sm:p-8"
    >
      <div className="flex flex-wrap items-start gap-2">
        <h2 className="text-2xl font-bold text-navy">{service.title}</h2>
        {service.isProposed && (
          <span className="rounded-full bg-green-muted px-2.5 py-0.5 text-xs font-semibold text-green">
            Proposed
          </span>
        )}
      </div>
      <p className="mt-1 text-base font-medium text-green">{service.tagline}</p>
      <p className="mt-4 text-base text-slate leading-relaxed">
        {service.summary}
      </p>

      {service.fee && (
        <div className="mt-5">
          <Callout variant="warning" title="Fees">
            <p>{service.fee}</p>
          </Callout>
        </div>
      )}

      {service.importantNotes && (
        <div className="mt-5 space-y-3">
          {service.importantNotes.map((note) => (
            <Callout key={note} variant="warning" title="Important">
              <p>{note}</p>
            </Callout>
          ))}
        </div>
      )}

      {service.assessmentRequired && (
        <div className="mt-5">
          <Callout variant="info" title="Assessment required first">
            <p>
              Injections cannot be booked without a prior clinical assessment.
              Online booking is for the initial consultation only.
            </p>
          </Callout>
        </div>
      )}

      {!hasAccordion && service.importantNotes?.length === 0 && null}

      {hasAccordion && (
        <Accordion className="mt-6">
          {service.whoItsFor && (
            <AccordionItem title="Who is this for?">
              <ul className="space-y-2">
                {service.whoItsFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </AccordionItem>
          )}
          {service.conditions && (
            <AccordionItem title="Common conditions we help with">
              <ul className="space-y-2">
                {service.conditions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </AccordionItem>
          )}
          {service.includes && (
            <AccordionItem title="What is included" defaultOpen>
              <ul className="space-y-2">
                {service.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </AccordionItem>
          )}
          {service.benefits && (
            <AccordionItem title="Potential benefits">
              <ul className="space-y-2">
                {service.benefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </AccordionItem>
          )}
          {service.risks && (
            <AccordionItem title="Risks and considerations">
              <ul className="space-y-2">
                {service.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-slate">
                Your clinician will discuss individual risks and suitability at
                consultation. Results vary between patients.
              </p>
            </AccordionItem>
          )}
          {service.nextSteps && (
            <AccordionItem title="What happens next">
              <ol className="list-decimal space-y-2 pl-5">
                {service.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </AccordionItem>
          )}
        </Accordion>
      )}

      {!hasAccordion && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {service.whoItsFor && (
            <CheckList items={service.whoItsFor} title="Who is this for?" />
          )}
          {service.includes && (
            <CheckList items={service.includes} title="What is included" />
          )}
        </div>
      )}
    </article>
  );
}
