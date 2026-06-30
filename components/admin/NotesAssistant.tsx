"use client";

import { useEffect, useMemo, useState } from "react";
import {
  noteTemplates,
  noteAppointments,
  getPractitioner,
  type NoteAppointment,
} from "@/lib/demo-data";
import { mapClinikoBookingToNoteTask, type MappedNoteTask } from "@/lib/cliniko-mappers";
import { structureNote } from "@/lib/structure-note";
import { useCommandHubAppointments } from "./CommandHubAppointmentsProvider";
import { ClinikoLoadState } from "./ClinikoLoadState";
import { PlainEmptyState } from "./PlainEmptyState";
import { DataSourceBadge } from "./DataSourceBadge";
import { CalloutBox } from "./AdminUI";
import { StatusBadge } from "./StatusBadge";

interface SaveResult {
  ok: boolean;
  mode: "dry_run" | "created";
  message: string;
  noteId?: string;
}

type TaskItem = (NoteAppointment | MappedNoteTask) & {
  dataSource?: "cliniko" | "cliniko-test" | "demo";
};

export function NotesAssistant() {
  const demoTasks: TaskItem[] = noteAppointments.map((a) => ({
    ...a,
    dataSource: "demo" as const,
  }));

  const [writesEnabled, setWritesEnabled] = useState(false);
  const { mapped, loading, source, error, isLive, loadToday, reload } =
    useCommandHubAppointments();

  const clinikoTasks = useMemo(
    () =>
      isLive
        ? mapped.filter((b) => b.isToday).map(mapClinikoBookingToNoteTask)
        : [],
    [isLive, mapped]
  );

  const allTasks: TaskItem[] = isLive ? clinikoTasks : demoTasks;
  const [selected, setSelected] = useState<TaskItem | null>(allTasks[0] ?? null);
  const [templateId, setTemplateId] = useState(noteTemplates[0].id);
  const [transcript, setTranscript] = useState("");
  const [structured, setStructured] = useState<Record<string, string> | null>(null);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [dictating, setDictating] = useState(false);

  useEffect(() => {
    fetch("/api/cliniko/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { writesEnabled?: boolean }) => setWritesEnabled(Boolean(json.writesEnabled)))
      .catch(() => setWritesEnabled(false));
  }, []);

  const firstTaskId = allTasks[0]?.id;

  useEffect(() => {
    setSelected(allTasks[0] ?? null);
  }, [isLive, firstTaskId, allTasks]);

  const template = noteTemplates.find((t) => t.id === templateId)!;
  const selectedCliniko =
    selected && "clinikoId" in selected ? (selected as MappedNoteTask) : null;

  async function handleRefreshToday() {
    await loadToday();
  }

  function handleStructure() {
    if (!transcript.trim()) return;
    setStructured(structureNote(transcript, template.sections));
    setSaveResult(null);
  }

  function handleDictation() {
    setDictating(true);
    setTimeout(() => {
      setTranscript(
        (prev) =>
          prev +
          (prev ? " " : "") +
          "Patient reports improving knee pain. On examination range of motion is better. Assessment shows good progress. Treated with manual therapy and exercises. Advised to continue home programme. Plan to review in two weeks."
      );
      setDictating(false);
    }, 800);
  }

  async function handleSave() {
    if (!structured) return;
    setSaving(true);
    setSaveResult(null);

    const bookingId =
      selectedCliniko?.bookingId ??
      (selected && !("clinikoId" in selected) ? selected.id : undefined);

    try {
      const res = await fetch("/api/cliniko/treatment-note-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          templateName: template.name,
          title: `${template.name} — ${selected?.clientName ?? "patient"}`,
          sections: structured,
        }),
      });
      const json = (await res.json()) as SaveResult;
      setSaveResult(json);
      setTranscript("");
      setStructured(null);
    } catch {
      setSaveResult({
        ok: false,
        mode: "dry_run",
        message: "Could not reach Cliniko draft endpoint.",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setTranscript("");
    setStructured(null);
    setSaveResult(null);
  }

  const saveSuccess = saveResult?.ok;

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {isLive ? (
          <>
            <DataSourceBadge source={source} />
            <span className="text-sm text-slate">{clinikoTasks.length} appointment(s) today</span>
            <button
              type="button"
              onClick={() => void handleRefreshToday()}
              disabled={loading}
              className="min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-semibold text-navy hover:bg-cream disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh today"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => void reload()}
            disabled={loading}
            className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load from Cliniko"}
          </button>
        )}
      </div>

      {loading && (
        <div className="mt-4">
          <ClinikoLoadState loading />
        </div>
      )}

      {error && !loading && (
        <div className="mt-4">
          <ClinikoLoadState error={error} />
        </div>
      )}

      {saveResult && (
        <div className="mt-4">
          <CalloutBox
            variant={saveSuccess ? "success" : "warning"}
            title={
              saveResult.mode === "created"
                ? "Draft note saved to Cliniko"
                : saveSuccess
                  ? "Draft validated (dry run)"
                  : "Could not save draft"
            }
          >
            <p>{saveResult.message}</p>
            {saveSuccess && (
              <ul className="mt-3 list-disc space-y-1 pl-4">
                <li>
                  {saveResult.mode === "created"
                    ? "Draft note saved to Cliniko"
                    : "Draft validated. Cliniko writing is currently disabled for safety."}
                </li>
                <li>Follow-up task created</li>
                <li>Invoice task prepared</li>
                <li>Local transcript purged</li>
              </ul>
            )}
          </CalloutBox>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-cream-dark bg-white p-4">
          <h3 className="font-semibold text-navy">Appointments needing notes</h3>
          {allTasks.length === 0 ? (
            <div className="mt-3">
              <PlainEmptyState
                title="No notes due."
                description="Appointments needing treatment notes will appear here when live Cliniko appointments are loaded."
              />
            </div>
          ) : (
          <ul className="mt-3 space-y-2">
            {allTasks.map((appt) => (
              <li key={appt.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(appt);
                    setStructured(null);
                    setSaveResult(null);
                  }}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                    selected?.id === appt.id
                      ? "border-green bg-green-muted/30"
                      : "border-cream-dark hover:border-green/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-navy">{appt.clientName}</span>
                    {(appt.dataSource === "cliniko" || appt.dataSource === "cliniko-test") && (
                      <DataSourceBadge source="cliniko" />
                    )}
                  </div>
                  <span className="mt-1 block text-slate">
                    {appt.date} {appt.time}
                  </span>
                  <span className="mt-1 block text-xs text-slate">
                    {appt.appointmentType} · {getPractitioner(appt.practitionerId).shortName}
                  </span>
                  <span className="mt-2 inline-block">
                    <StatusBadge
                      label={appt.noteStatus.replace("-", " ")}
                      variant={appt.noteStatus === "draft-needed" ? "warning" : "neutral"}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <div className="rounded-xl border border-cream-dark bg-white p-4 sm:p-6">
              <h3 className="font-semibold text-navy">
                {selected.clientName} — {selected.appointmentType}
              </h3>

              {selectedCliniko && (
                <dl className="mt-3 grid gap-2 rounded-lg bg-cream/50 p-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate">Source</dt>
                    <dd><DataSourceBadge source="cliniko" /></dd>
                  </div>
                  <div>
                    <dt className="text-slate">Booking ID</dt>
                    <dd className="font-mono text-xs">{selectedCliniko.bookingId}</dd>
                  </div>
                  <div>
                    <dt className="text-slate">Practitioner</dt>
                    <dd>
                      {selectedCliniko.practitionerMatched
                        ? selectedCliniko.practitionerName
                        : "Unmatched Cliniko practitioner"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate">Location</dt>
                    <dd>{selectedCliniko.locationLabel}</dd>
                  </div>
                </dl>
              )}

              <div className="mt-4">
                <label htmlFor="template" className="block text-sm font-medium text-navy">
                  Note template
                </label>
                <select
                  id="template"
                  value={templateId}
                  onChange={(e) => {
                    setTemplateId(e.target.value);
                    setStructured(null);
                  }}
                  className="mt-1 w-full min-h-10 rounded-lg border border-cream-dark px-3 text-sm"
                >
                  {noteTemplates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDictation}
                  disabled={dictating}
                  className="min-h-10 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50"
                >
                  {dictating ? "Listening…" : "🎤 Dictation demo"}
                </button>
              </div>

              <div className="mt-4">
                <label htmlFor="transcript" className="block text-sm font-medium text-navy">
                  Paste transcript or rough notes
                </label>
                <textarea
                  id="transcript"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={5}
                  placeholder="Paste or dictate rough notes here…"
                  className="mt-1 w-full rounded-lg border border-cream-dark px-3 py-2 text-sm"
                />
              </div>

              <button
                type="button"
                onClick={handleStructure}
                disabled={!transcript.trim()}
                className="mt-3 min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light disabled:opacity-50"
              >
                Structure note
              </button>

              {structured && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold text-navy">Structured note (review &amp; edit)</h4>
                  {template.sections.map((section) => (
                    <div key={section}>
                      <label className="block text-sm font-medium text-green">{section}</label>
                      <textarea
                        value={structured[section]}
                        onChange={(e) =>
                          setStructured({ ...structured, [section]: e.target.value })
                        }
                        rows={2}
                        className="mt-1 w-full rounded-lg border border-cream-dark px-3 py-2 text-sm"
                      />
                    </div>
                  ))}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={saving}
                      className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save draft to Cliniko test account"}
                    </button>
                    <DataSourceBadge source={writesEnabled ? "cliniko" : "dry-run"} />
                    <DataSourceBadge source="safety-gated" />
                    <button
                      type="button"
                      onClick={handleDiscard}
                      className="min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-slate hover:border-red-300 hover:text-red-700"
                    >
                      Discard and purge
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
