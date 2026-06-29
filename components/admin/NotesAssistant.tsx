"use client";

import { useState } from "react";
import {
  noteTemplates,
  noteAppointments,
  getPractitioner,
  type NoteAppointment,
} from "@/lib/demo-data";
import { structureNote } from "@/lib/structure-note";
import { CalloutBox } from "./AdminUI";
import { StatusBadge } from "./StatusBadge";

export function NotesAssistant() {
  const [selected, setSelected] = useState<NoteAppointment | null>(
    noteAppointments[0] ?? null
  );
  const [templateId, setTemplateId] = useState(noteTemplates[0].id);
  const [transcript, setTranscript] = useState("");
  const [structured, setStructured] = useState<Record<string, string> | null>(null);
  const [saved, setSaved] = useState(false);
  const [dictating, setDictating] = useState(false);

  const template = noteTemplates.find((t) => t.id === templateId)!;

  function handleStructure() {
    if (!transcript.trim()) return;
    setStructured(structureNote(transcript, template.sections));
    setSaved(false);
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

  function handleSave() {
    setSaved(true);
    setTranscript("");
    setStructured(null);
  }

  function handleDiscard() {
    setTranscript("");
    setStructured(null);
    setSaved(false);
  }

  return (
    <div>
      <CalloutBox variant="warning" title="Demo safety">
        Notes are temporary in this demo. Audio and transcripts are not stored.
        Draft notes should be saved to Cliniko only after practitioner review.
      </CalloutBox>

      {saved && (
        <div className="mt-4">
          <CalloutBox variant="success" title="Draft saved to Cliniko (demo)">
          <ul className="list-disc space-y-1 pl-4">
            <li>Draft note saved to Cliniko sandbox</li>
            <li>Follow-up task created</li>
            <li>Insurance session updated if relevant</li>
            <li>Invoice task prepared</li>
            <li>Local transcript purged</li>
          </ul>
          </CalloutBox>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-cream-dark bg-white p-4">
          <h3 className="font-semibold text-navy">Appointments needing notes</h3>
          <ul className="mt-3 space-y-2">
            {noteAppointments.map((appt) => (
              <li key={appt.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(appt);
                    setStructured(null);
                    setSaved(false);
                  }}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                    selected?.id === appt.id
                      ? "border-green bg-green-muted/30"
                      : "border-cream-dark hover:border-green/50"
                  }`}
                >
                  <span className="font-medium text-navy">{appt.clientName}</span>
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
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <div className="rounded-xl border border-cream-dark bg-white p-4 sm:p-6">
              <h3 className="font-semibold text-navy">
                {selected.clientName} — {selected.appointmentType}
              </h3>

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
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light"
                    >
                      Save draft to Cliniko sandbox
                    </button>
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
