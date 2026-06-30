import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { DataHandlingPanel } from "@/components/admin/DataHandlingPanel";
import { NotesAssistant } from "@/components/admin/NotesAssistant";
import { NotesWorkflowQueue } from "@/components/admin/NotesWorkflowQueue";
import { SafeNotesPanel } from "@/components/admin/SafeNotesPanel";

export default function NotesPage() {
  return (
    <>
      <WorkflowPageHeader
        title="Notes"
        purpose="Prepare treatment-note drafts safely. Cliniko remains the clinical record."
      />
      <NotesWorkflowQueue />
      <div className="mb-6 space-y-6">
        <SafeNotesPanel />
        <DataHandlingPanel compact />
      </div>
      <div id="notes-assistant">
        <NotesAssistant />
      </div>
    </>
  );
}
