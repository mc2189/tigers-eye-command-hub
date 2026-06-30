import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { ClientsPageContent } from "@/components/admin/ClientsPageContent";
import { DemoWeekReferenceStrip } from "@/components/admin/DemoWeekReferenceStrip";

export default function ClientsPage() {
  return (
    <>
      <WorkflowPageHeader
        title="Clients"
        purpose="See each DEMO client's full journey — appointment, notes, follow-up, payment and insurance status."
      />
      <p className="sr-only">Client journeys · Open client record</p>
      <ClientsPageContent />
      <DemoWeekReferenceStrip variant="clients" />
    </>
  );
}
