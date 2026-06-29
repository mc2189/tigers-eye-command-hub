import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { LocationCard } from "@/components/LocationCard";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { business, bookingStrategy, clinics } from "@/lib/tigers-eye-content";

export const metadata: Metadata = {
  title: "Locations",
  description: `Clinic locations in Dundee and Aviemore — ${business.shortName}.`,
};

export default function LocationsPage() {
  return (
    <>
      <PageHero
        title="Our locations"
        subtitle="Two clinics across Scotland — both on Cliniko, with location chosen first when you book."
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          {clinics.map((clinic) => (
            <LocationCard key={clinic.id} clinic={clinic} />
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-base text-slate">
          {bookingStrategy.solution} Appointment times vary by location and
          practitioner. Use the booking gateway if you are unsure which route to take.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-slate">
          {bookingStrategy.legacyNote}
        </p>
        <div className="mt-6">
          <Button href="/book" variant="primary">
            Open booking gateway
          </Button>
        </div>
      </Section>
    </>
  );
}
