"use client";

import { useState, useCallback } from "react";

export function useDemoFeedback() {
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  }, []);

  return { message, show };
}

export function DemoFeedbackToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-green/30 bg-navy px-4 py-3 text-center text-sm font-medium text-white shadow-lg lg:bottom-6"
    >
      {message}
    </div>
  );
}

interface DemoActionButtonProps {
  label: string;
  onAction: () => void;
  variant?: "primary" | "outline";
}

export function DemoActionButton({
  label,
  onAction,
  variant = "outline",
}: DemoActionButtonProps) {
  const classes =
    variant === "primary"
      ? "bg-green text-white hover:bg-green-light border-transparent"
      : "border-cream-dark text-green hover:bg-cream bg-white";

  return (
    <button
      type="button"
      onClick={onAction}
      className={`min-h-9 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${classes}`}
    >
      {label}
    </button>
  );
}

export const demoMessages = {
  draftInvoice: "Demo: invoice draft panel would open here.",
  openCliniko:
    "Demo: would open this booking in Cliniko. Cliniko remains the system of record.",
  markDone: "Marked done (demo — local state only).",
  markSubmitted: "Marked submitted (demo only).",
  copyInvoice: "Invoice text copied to clipboard (demo template).",
  configure: "Demo: configuration saved locally for this session.",
  createNote: "Demo: would open the notes assistant for this booking.",
  followUp: "Demo: follow-up message draft prepared.",
  addSession: "Demo: session count updated locally.",
  markAuth: "Demo: authorisation marked as received.",
  sendReminder: "Demo: reminder draft prepared.",
};

const demoMessageMap: Record<string, string> = {
  "Draft invoice": demoMessages.draftInvoice,
  "Open in Cliniko": demoMessages.openCliniko,
  Cliniko: demoMessages.openCliniko,
  "Open Cliniko booking": demoMessages.openCliniko,
  "Mark done": demoMessages.markDone,
  "Copy invoice text": demoMessages.copyInvoice,
  "Copy message": demoMessages.copyInvoice,
  Note: demoMessages.createNote,
  "Create note": demoMessages.createNote,
  Invoice: demoMessages.draftInvoice,
  "Follow-up": demoMessages.followUp,
  "Add session": demoMessages.addSession,
  "Mark auth received": demoMessages.markAuth,
  "Send reminder draft": demoMessages.sendReminder,
  "Draft invoice reminder": demoMessages.draftInvoice,
};

export function getDemoMessage(label: string): string {
  return demoMessageMap[label] ?? `Demo: ${label} (preview only).`;
}

export async function runDemoAction(
  label: string,
  show: (msg: string) => void
): Promise<void> {
  if (label === "Copy invoice text" || label === "Copy message") {
    const text =
      "Demo invoice — Tigers Eye Physiotherapy\nSession fee: £65\nPlease contact the clinic for payment.";
    try {
      await navigator.clipboard.writeText(text);
      show(demoMessages.copyInvoice);
    } catch {
      show("Could not copy — demo text shown in toast.");
    }
    return;
  }
  show(getDemoMessage(label));
}
