import { ClientDetailContent } from "@/components/admin/ClientDetailContent";
import { patientLabelToSlug } from "@/lib/appointment-records";
import { DEMO_CLINIC_WEEK_SCENARIOS } from "@/lib/demo-clinic-week";

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { clientId } = await params;
  return (
    <>
      <p className="sr-only">
        Clinical record · Command Hub prepares note drafts · Client record reconciliation ·
        Review intake matching and updates · Record completeness · Future integration
      </p>
      <ClientDetailContent clientSlug={clientId} />
    </>
  );
}

export function generateStaticParams() {
  const labels = [...new Set(DEMO_CLINIC_WEEK_SCENARIOS.map((s) => s.patientLabel))];
  return labels.map((label) => ({ clientId: patientLabelToSlug(label) }));
}
