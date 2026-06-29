export function DataHandlingPanel({ compact }: { compact?: boolean }) {
  const items = [
    "Cliniko is the system of record for bookings and clinical notes",
    "API key is server-side only — never exposed to the browser",
    "No patient-note database in this app",
    "Demo data fallback when Cliniko is unavailable",
    "Transcripts are purged after save or discard",
    "Writes to Cliniko are safety-gated and disabled by default",
  ];

  return (
    <aside
      className={`rounded-xl border border-cream-dark bg-cream/50 ${
        compact ? "p-4" : "p-5 sm:p-6"
      }`}
    >
      <h2 className="text-base font-bold text-navy">Data handling and privacy</h2>
      <p className="mt-2 text-sm text-slate">
        This demo is designed for sandbox use only. No real clinical content is stored.
      </p>
      <ul className="mt-4 space-y-2 text-sm text-navy">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="shrink-0 text-green" aria-hidden>
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}
