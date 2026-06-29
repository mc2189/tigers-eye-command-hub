import type { Service } from "@/lib/tigers-eye-content";
import { Button } from "./Button";

interface ServiceCardProps {
  service: Service;
  showBookButton?: boolean;
}

export function ServiceCard({ service, showBookButton = true }: ServiceCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-cream-dark bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start gap-2">
        <h3 className="text-xl font-bold text-navy">{service.title}</h3>
        {service.isProposed && (
          <span className="rounded-full bg-green-muted px-2.5 py-0.5 text-xs font-semibold text-green">
            Proposed
          </span>
        )}
        {service.assessmentRequired && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            Assessment required
          </span>
        )}
      </div>
      <p className="mt-1 text-sm font-medium text-green">{service.tagline}</p>
      <p className="mt-3 flex-1 text-base text-slate">{service.summary}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {showBookButton && (
          <Button href="/book" variant="primary">
            Book this service
          </Button>
        )}
        {service.slug === "telehealth" && (
          <Button href="/telehealth" variant="outline">
            Learn more
          </Button>
        )}
        {service.slug === "steroid-injection" && (
          <Button href="/services#steroid-injection" variant="outline">
            Full details
          </Button>
        )}
      </div>
    </article>
  );
}
