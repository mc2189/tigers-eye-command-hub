import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { NotesAssistant } from "@/components/admin/NotesAssistant";

export default function NotesPage() {
  return (
    <>
      <AdminPageHeader
        title="Clinical notes assistant"
        subtitle="Dictation demo, transcript structuring and Cliniko sandbox save workflow."
      />
      <NotesAssistant />
    </>
  );
}
