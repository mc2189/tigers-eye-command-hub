export function SafeNotesPanel() {
  const checklist = [
    "No audio stored",
    "No transcript stored",
    "No local clinical-note database",
    "Draft only unless reviewed",
    "Cliniko remains the record",
    "Writes disabled unless explicitly enabled",
  ];

  return (
    <aside className="rounded-xl border border-green/30 bg-green-muted/20 p-5 sm:p-6">
      <h2 className="text-base font-bold text-navy">Safe notes workflow</h2>
      <p className="mt-3 text-sm text-slate leading-relaxed">
        Cliniko remains the clinical record. The Command Hub only helps capture and
        structure a draft. Audio and transcripts are not stored. The practitioner
        reviews the note before anything is sent to Cliniko. Local text is cleared
        after save or discard.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {checklist.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-navy">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green text-xs font-bold text-white">
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}
