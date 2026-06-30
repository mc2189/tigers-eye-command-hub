import { WorkflowPageHeader } from "@/components/admin/WorkflowPageHeader";
import { DataHandlingPanel } from "@/components/admin/DataHandlingPanel";
import { NotesAssistant } from "@/components/admin/NotesAssistant";
import { NotesWorkflowQueue } from "@/components/admin/NotesWorkflowQueue";
import { SafeNotesPanel } from "@/components/admin/SafeNotesPanel";
import { DemoWeekReferenceStrip } from "@/components/admin/DemoWeekReferenceStrip";
import { WhatThisShows } from "@/components/admin/WhatThisShows";

export default function NotesPage() {
  return (
    <>
      <WorkflowPageHeader
        title="Notes"
        purpose="Prepare treatment-note drafts safely. Cliniko remains the clinical record."
      />
      <WhatThisShows>
        Treatment note tasks from appointments — prepared for Cliniko, not saved until the
        practitioner confirms in Cliniko.
      </WhatThisShows>
      <p className="sr-only mb-4 text-sm">
        Notes can only be saved for DEMO-linked patients and appointments in this test account.
        Cliniko remains the clinical record. No audio stored.
      </p>
      <NotesWorkflowQueue />
      <div className="mb-6 space-y-6">
        <SafeNotesPanel />
        <DataHandlingPanel compact />
      </div>
      <div id="notes-assistant">
        <NotesAssistant />
      </div>
      <DemoWeekReferenceStrip variant="notes" />
    </>
  );
}
