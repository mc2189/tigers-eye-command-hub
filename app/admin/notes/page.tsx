import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataHandlingPanel } from "@/components/admin/DataHandlingPanel";
import { NotesAssistant } from "@/components/admin/NotesAssistant";
import { SafeNotesPanel } from "@/components/admin/SafeNotesPanel";

export default function NotesPage() {
  return (
    <>
      <AdminPageHeader
        title="Clinical notes assistant"
        subtitle="Dictate or paste rough notes, structure them, review, then save a draft to Cliniko — nothing stored locally."
      />
      <div className="mb-6 space-y-6">
        <SafeNotesPanel />
        <DataHandlingPanel compact />
      </div>
      <NotesAssistant />
    </>
  );
}
