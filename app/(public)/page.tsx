import Image from "next/image";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { LocationCard } from "@/components/LocationCard";
import { Section } from "@/components/Section";
import { ServiceCard } from "@/components/ServiceCard";
import { TestimonialCard } from "@/components/TestimonialCard";
import {
  business,
  clinics,
  services,
  testimonials,
} from "@/lib/tigers-eye-content";

const highlightServices = services.filter(
  (s) => !s.isProposed && s.id !== "steroid-injection"
).slice(0, 4);

export default function HomePage() {
  return (
    <>
      <section className="border-b border-cream-dark bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green">
              Dundee &amp; Aviemore
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-navy sm:text-4xl lg:text-5xl">
              Expert physiotherapy and massage for lasting recovery
            </h1>
            <p className="mt-5 text-lg text-slate leading-relaxed">
              {business.description}
            </p>
            <p className="mt-4 text-base text-slate">{business.positioning}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/book" variant="primary">
                Book an appointment
              </Button>
              <Button href="/services" variant="outline">
                View services
              </Button>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <Image
              src={business.logoPath}
              alt={`${business.shortName} logo`}
              width={320}
              height={320}
              className="h-48 w-48 object-contain sm:h-64 sm:w-64"
              priority
            />
          </div>
        </div>
      </section>

      <Section
        title="Our clinics"
        subtitle="Two locations across Scotland — choose the clinic that suits you."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {clinics.map((clinic) => (
            <LocationCard key={clinic.id} clinic={clinic} />
          ))}
        </div>
      </Section>

      <Section
        title="Services"
        subtitle="Evidence-based treatment tailored to your goals."
        className="bg-white"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {highlightServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button href="/services" variant="secondary">
            See all services
          </Button>
        </div>
      </Section>

      <Section title="Insurance &amp; telehealth">
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-cream-dark bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-navy">Insurance patients</h3>
            <p className="mt-3 text-base text-slate">
              Aviva, Vitality and other insurers may cover physiotherapy. We capture
              claim details for admin follow-up before treatment.
            </p>
            <div className="mt-5">
              <Button href="/insurance" variant="primary">
                Insurance guidance
              </Button>
            </div>
          </article>
          <article className="rounded-xl border border-cream-dark bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-navy">Telehealth reviews</h3>
            <p className="mt-3 text-base text-slate">
              Proposed virtual appointments for follow-ups, rehab check-ins and
              triage when hands-on treatment is not required.
            </p>
            <div className="mt-5">
              <Button href="/telehealth" variant="primary">
                About telehealth
              </Button>
            </div>
          </article>
        </div>
      </Section>

      <Section title="What patients say" className="bg-white">
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </Section>

      <Section>
        <Callout title="Ready to get started?" variant="success">
          <p className="text-base">
            Book online at Dundee or Aviemore, or contact us with any questions.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button href="/book" variant="primary">
              Book now
            </Button>
            <Button href="/contact" variant="outline">
              Contact us
            </Button>
          </div>
        </Callout>
      </Section>
    </>
  );
}
