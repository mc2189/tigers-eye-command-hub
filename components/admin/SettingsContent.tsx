"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataHandlingPanel } from "@/components/admin/DataHandlingPanel";
import { DemoWeekPreviewToggle } from "@/components/admin/DemoWeekPreviewToggle";
import { WorkflowStorageProofPanel } from "@/components/admin/WorkflowStorageProofPanel";
import { StorageBoundaryPolicyPanel } from "@/components/admin/StorageBoundaryPolicyPanel";
import {
  DemoActionButton,
  DemoFeedbackToast,
  demoMessages,
  useDemoFeedback,
} from "@/components/admin/DemoActionFeedback";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { ClinikoStatusData } from "@/components/admin/ClinikoConnectionPanel";
import { practitioners, locations } from "@/lib/demo-data";
import { bookingLinks } from "@/lib/tigers-eye-content";

const transcriptionOptions = [
  "Browser dictation demo",
  "Paste only",
  "Local transcription future",
  "Cloud transcription future",
];

const paymentOptions = [
  "Demo only",
  "Cliniko/Stripe future",
  "Insurance invoice",
  "Cash by agreement",
  "External work invoice",
];

export function SettingsContent() {
  const [cliniko, setCliniko] = useState<ClinikoStatusData | null>(null);
  const { message, show } = useDemoFeedback();

  useEffect(() => {
    fetch("/api/cliniko/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: ClinikoStatusData) => setCliniko(json))
      .catch(() => setCliniko(null));
  }, []);

  const connected = cliniko?.status === "connected" && cliniko.source === "cliniko";

  const cards = [
    {
      title: "Demo staff login",
      description:
        "Admin Command Hub and Cliniko API routes require demo staff password. Protects the sterile test account tools.",
      value: "Required",
      variant: "warning" as const,
    },
    {
      title: "Cliniko test writes",
      description:
        "Controlled writes to the sterile Cliniko test account for DEMO patients and appointments only.",
      value: cliniko?.writesEnabled ? "Enabled" : "Disabled",
      variant: cliniko?.writesEnabled ? ("success" as const) : ("warning" as const),
    },
    {
      title: "Cliniko connection",
      description: connected
        ? "Sterile Cliniko test account connected. Cliniko remains the system of record."
        : "No live key configured — demo data fallback is active.",
      value: connected ? "Test account connected" : "Demo fallback",
      variant: connected ? ("success" as const) : ("warning" as const),
    },
    {
      title: "Writes enabled",
      description:
        "Treatment note drafts only reach Cliniko when writes are explicitly enabled server-side.",
      value: cliniko?.writesEnabled ? "Enabled" : "Disabled (safe)",
      variant: cliniko?.writesEnabled ? ("warning" as const) : ("success" as const),
    },
    {
      title: "Demo data fallback",
      description:
        "If Cliniko is unavailable, Command Hub panels continue with demo data so the walkthrough still works.",
      value: "Always on",
      variant: "success" as const,
    },
    {
      title: "Notes retention mode",
      description:
        "Transcripts and audio are not stored. Local text is cleared after save or discard.",
      value: "Purge on save/discard",
      variant: "success" as const,
    },
    {
      title: "Transcription mode",
      description: "Browser dictation demo for structuring notes — no cloud transcription in this demo.",
      value: "Browser dictation demo",
      variant: "success" as const,
    },
    {
      title: "Payment mode",
      description: "Payment rules, deposits and cash warnings — demo configuration only.",
      value: "Demo only",
      variant: "neutral" as const,
    },
    {
      title: "Aviemore Cliniko location",
      description:
        "Aviemore is a separate Cliniko location or business. The public site asks for location first so patients reach the right booking route.",
      value: "Planned test location",
      variant: "warning" as const,
    },
    {
      title: "Setmore (legacy)",
      description: bookingLinks.legacySetmore.note,
      value: "Legacy / transition",
      variant: "neutral" as const,
    },
    {
      title: "Future integrations",
      description: "Healthcode, Xero and deeper Cliniko automation — roadmap only, not live.",
      value: "Planned",
      variant: "neutral" as const,
    },
    {
      title: "Branding",
      description: "Tigers Eye logo, colours and public site content.",
      value: "Configured",
      variant: "success" as const,
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Settings"
        subtitle="Demo configuration, integrations and practitioner setup — plain English overview."
      />

      <p className="sr-only">
        Workflow storage · Cliniko remains the system of record · Cliniko source of truth · Command
        Hub workflow state · operational workflow state · No duplicate patient database · Durable
        workflow storage · Ephemeral workflow storage · Local workflow storage
      </p>

      <div className="mb-8 space-y-6">
        <StorageBoundaryPolicyPanel />
        <WorkflowStorageProofPanel />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="rounded-xl border border-cream-dark bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold text-navy">{card.title}</h2>
              <StatusBadge label={card.value} variant={card.variant} />
            </div>
            <p className="mt-2 text-sm text-slate">{card.description}</p>
            <div className="mt-3">
              <DemoActionButton
                label="Configure (demo)"
                onAction={() => show(demoMessages.configure)}
              />
            </div>
          </article>
        ))}
      </div>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="mb-4 font-bold text-navy">Practitioner setup</h2>
          <ul className="space-y-3">
            {practitioners.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className={p.isPlaceholder ? "text-slate italic" : "text-navy font-medium"}>
                  {p.name}
                </span>
                <StatusBadge
                  label={p.isPlaceholder ? "Placeholder" : "Active"}
                  variant={p.isPlaceholder ? "neutral" : "success"}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="mb-4 font-bold text-navy">Location setup</h2>
          <ul className="space-y-3">
            {locations.map((l) => (
              <li key={l.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-navy">{l.name}</span>
                <StatusBadge label="Active" variant="success" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="mb-4 font-bold text-navy">Transcription mode options</h2>
          <ul className="space-y-2">
            {transcriptionOptions.map((opt, i) => (
              <li key={opt} className="flex items-center gap-2 text-sm">
                <input type="radio" name="transcription" defaultChecked={i === 0} readOnly />
                {opt}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-cream-dark bg-white p-5">
          <h2 className="mb-4 font-bold text-navy">Payment mode options</h2>
          <ul className="space-y-2">
            {paymentOptions.map((opt, i) => (
              <li key={opt} className="flex items-center gap-2 text-sm">
                <input type="radio" name="payment" defaultChecked={i === 0} readOnly />
                {opt}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-dashed border-cream-dark bg-white p-5">
        <h2 className="font-bold text-navy">Future integrations</h2>
        <p className="mt-2 text-sm text-slate">
          Healthcode, Xero, legacy Setmore transition, and room-user calendars — configure when ready.
        </p>
        <div className="mt-4">
          <DemoActionButton
            label="View integration roadmap (demo)"
            onAction={() => show("Demo: integration roadmap opens from the Healthcode page.")}
            variant="primary"
          />
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-cream-dark bg-white p-5">
        <h2 className="font-bold text-navy">Demo clinic week preview</h2>
        <p className="mt-2 text-sm text-slate">
          Load a realistic fake clinic week to see the full Command Hub workflow without seeding
          Cliniko.
        </p>
        <p className="sr-only">Preview demo clinic week</p>
        <div className="mt-4">
          <DemoWeekPreviewToggle />
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-cream-dark bg-white p-5">
        <h2 className="font-bold text-navy">Technical demo tools</h2>
        <p className="mt-2 text-sm text-slate">
          Proof pages and Cliniko diagnostics are kept out of the main daily navigation.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/proof"
            className="inline-flex min-h-10 items-center rounded-lg border border-cream-dark px-4 py-2 text-sm font-semibold text-navy hover:bg-cream"
          >
            Demo proof page
          </Link>
          <Link
            href="/admin/cliniko/test-lab"
            className="inline-flex min-h-10 items-center rounded-lg border border-cream-dark px-4 py-2 text-sm font-semibold text-navy hover:bg-cream"
          >
            Technical Cliniko test lab
          </Link>
        </div>
      </section>

      <div className="mt-8">
        <DataHandlingPanel />
      </div>

      <DemoFeedbackToast message={message} />
    </>
  );
}
