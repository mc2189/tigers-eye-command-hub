import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { ServiceDetail } from "@/components/ServiceDetail";
import { ServiceCard } from "@/components/ServiceCard";
import { Button } from "@/components/Button";
import { business, services } from "@/lib/tigers-eye-content";

export const metadata: Metadata = {
  title: "Services",
  description: `Physiotherapy, sports massage and specialist treatments at ${business.shortName}.`,
};

const categories = [
  { id: "hands-on", label: "Hands-on treatment" },
  { id: "support", label: "Support & taping" },
  { id: "injection", label: "Injection pathway" },
  { id: "virtual", label: "Virtual care" },
] as const;

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title="Our services"
        subtitle="Clear, evidence-based care — from assessment to rehabilitation."
      >
        <Button href="/book" variant="primary">
          Book an appointment
        </Button>
      </PageHero>

      <Section title="Quick overview">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </Section>

      {categories.map((cat) => {
        const filtered = services.filter((s) => s.category === cat.id);
        if (filtered.length === 0) return null;
        return (
          <Section
            key={cat.id}
            id={cat.id}
            title={cat.label}
            className="bg-white"
          >
            <div className="space-y-8">
              {filtered.map((service) => (
                <ServiceDetail key={service.id} service={service} />
              ))}
            </div>
          </Section>
        );
      })}
    </>
  );
}
