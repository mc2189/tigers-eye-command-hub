import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { business, clinics, contactForm } from "@/lib/tigers-eye-content";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${business.shortName} — Dundee and Aviemore clinics.`,
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contact us"
        subtitle={contactForm.description}
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-navy">Get in touch</h2>
            <p className="mt-4 text-base text-slate">
              Email{" "}
              <a
                href={`mailto:${business.email}`}
                className="font-semibold text-green hover:underline"
              >
                {business.email}
              </a>
            </p>

            <div className="mt-8 space-y-6">
              {clinics.map((clinic) => (
                <div key={clinic.id}>
                  <h3 className="font-semibold text-navy">{clinic.name}</h3>
                  <address className="mt-1 not-italic text-base text-slate">
                    {clinic.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-cream-dark bg-white p-5 sm:p-8">
            <h2 className="text-xl font-bold text-navy">{contactForm.title}</h2>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
