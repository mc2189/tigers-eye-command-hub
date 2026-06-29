import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { LocationCard } from "@/components/LocationCard";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { business, clinics } from "@/lib/tigers-eye-content";

export const metadata: Metadata = {
  title: "Locations",
  description: `Clinic locations in Dundee and Aviemore — ${business.shortName}.`,
};

export default function LocationsPage() {
  return (
    <>
      <PageHero
        title="Our locations"
        subtitle="Two clinics across Scotland. Check the booking system for current availability."
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          {clinics.map((clinic) => (
            <LocationCard key={clinic.id} clinic={clinic} />
          ))}
        </div>
        <p className="mt-8 max-w-2xl text-base text-slate">
          Appointment times vary by location and practitioner. Dundee appointments
          are managed through Cliniko; Aviemore through Setmore. Use the booking
          gateway if you are unsure which route to take.
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
