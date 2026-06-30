import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { DataHandlingPanel } from "@/components/admin/DataHandlingPanel";
import { NotesAssistant } from "@/components/admin/NotesAssistant";
import { SafeNotesPanel } from "@/components/admin/SafeNotesPanel";

export default function NotesPage() {
  return (
    <>
      <WorkflowPageHeader
        title="Notes"
        purpose="Prepare treatment-note drafts safely. Cliniko remains the clinical record."
      />
      <div className="mb-6 space-y-6">
        <SafeNotesPanel />
        <DataHandlingPanel compact />
      </div>
      <NotesAssistant />
    </>
  );
}
