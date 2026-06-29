import type { Metadata } from "next";
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
        subtitle="Choose your location, appointment type, then continue to the right booking system."
      />
      <Section>
        <BookingGateway />
      </Section>
    </>
  );
}
