import type { ClinikoHealthCheckItem } from "@/lib/demo-data";
import { clinikoHealthCheck } from "@/lib/demo-data";
import { DataSourceBadge } from "./DataSourceBadge";

type SummarySection = {
  id: string;
  label: string;
  items: ClinikoHealthCheckItem[];
};

function buildSections(): SummarySection[] {
  const followUpIds = new Set(["ch-022", "ch-023"]);
  const financeIds = new Set(["ch-024", "ch-025", "ch-026", "ch-027"]);

  return [
    {
      id: "booking",
      label: "Booking setup",
      items: clinikoHealthCheck.filter((i) => i.section === "Booking"),
    },
    {
      id: "payments",
      label: "Payment setup",
      items: clinikoHealthCheck.filter((i) => i.section === "Payments"),
    },
    {
      id: "insurance",
      label: "Insurance setup",
      items: clinikoHealthCheck.filter((i) => i.section === "Insurance"),
    },
    {
      id: "forms",
      label: "Forms and notes",
      items: clinikoHealthCheck.filter((i) => i.section === "Forms/notes"),
    },
    {
      id: "followups",
      label: "Follow-ups",
      items: clinikoHealthCheck.filter((i) => followUpIds.has(i.id)),
    },
    {
      id: "finance",
      label: "Finance/reporting",
      items: clinikoHealthCheck.filter((i) => financeIds.has(i.id)),
    },
  ];
}

export function ClinikoHealthSummary() {
  const sections = buildSections();

  return (
    <section className="mb-6 rounded-xl border border-cream-dark bg-white p-5">
      <h2 className="text-lg font-bold text-navy">What Cliniko already supports</h2>
      <p className="mt-2 max-w-3xl text-sm text-slate">
        This page shows what Cliniko already supports and how Command Hub can help
        George use those features more fully. Cliniko remains the source of truth.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const configured = section.items.filter((i) => i.status === "recommended").length;
          const demo = section.items.filter((i) => i.status === "demo").length;
          const future = section.items.filter((i) => i.status === "future").length;
          const highImpact = section.items.filter((i) => i.impact === "high").length;

          return (
            <article
              key={section.id}
              className="rounded-lg border border-cream-dark p-4"
            >
              <h3 className="font-semibold text-navy">{section.label}</h3>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate">Configured</dt>
                  <dd className="font-medium">{configured}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate">Demo</dt>
                  <dd className="font-medium">{demo}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate">Future</dt>
                  <dd className="font-medium">{future}</dd>
                </div>
                <div className="flex justify-between border-t border-cream-dark pt-2">
                  <dt className="text-slate">High impact</dt>
                  <dd className="font-medium text-green">{highImpact}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <DataSourceBadge source="cliniko" />
        <DataSourceBadge source="demo" />
        <DataSourceBadge source="future" />
      </div>
    </section>
  );
}
