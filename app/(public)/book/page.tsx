import type { Metadata } from "next";
import { PublicHubNote } from "@/components/PublicHubNote";
import { BookingGateway } from "@/components/BookingGateway";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { business } from "@/lib/tigers-eye-content";

export const metadata: Metadata = {
  title: "Book",
  description: `Book an appointment at ${business.shortName} — Dundee or Aviemore.`,
};

export default function BookPage() {
  return (
    <>
      <PageHero
        title="Book an appointment"
        subtitle="Choose your location first, then your appointment type — both clinics book through Cliniko."
      />
      <Section>
        <BookingGateway />
        <PublicHubNote>
          In the live setup, these choices can feed Cliniko booking links, payment rules,
          insurance checks and admin follow-up tasks.
        </PublicHubNote>
      </Section>
    </>
  );
}
