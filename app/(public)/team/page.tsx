import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
import { TeamCard } from "@/components/TeamCard";
import { business, team } from "@/lib/tigers-eye-content";

export const metadata: Metadata = {
  title: "Team",
  description: `Meet the therapists at ${business.shortName}.`,
};

export default function TeamPage() {
  return (
    <>
      <PageHero
        title="Our team"
        subtitle="Qualified therapists with clinical training and practical, hands-on experience."
      >
        <Button href="/book" variant="primary">
          Book with our team
        </Button>
      </PageHero>
      <Section>
        <div className="grid gap-6 lg:grid-cols-3">
          {team.map((member) => (
            <TeamCard key={member.id} member={member} />
          ))}
        </div>
      </Section>
    </>
  );
}
