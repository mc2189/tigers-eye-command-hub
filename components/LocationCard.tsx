import type { Clinic } from "@/lib/tigers-eye-content";
import { Button } from "./Button";

interface LocationCardProps {
  clinic: Clinic;
}

export function LocationCard({ clinic }: LocationCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-cream-dark bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-xl font-bold text-navy">{clinic.name}</h3>
      <address className="mt-3 not-italic text-base text-slate leading-relaxed">
        {clinic.addressLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </address>
      <p className="mt-3 text-sm text-slate">{clinic.availabilityNote}</p>
      <p className="mt-1 text-sm text-slate">
        Book via <strong>{clinic.bookingSystem}</strong>
        {clinic.bookingStatus === "planned-or-sandbox" && (
          <span className="text-amber-700"> (Aviemore location being configured)</span>
        )}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button href={clinic.bookingUrl} external variant="primary">
          Book at {clinic.shortName}
        </Button>
        <Button href="/book" variant="outline">
          Booking gateway
        </Button>
      </div>
    </article>
  );
}
