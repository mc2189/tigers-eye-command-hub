"use client";

import {
  DemoFeedbackToast,
  runDemoAction,
  useDemoFeedback,
} from "@/components/admin/DemoActionFeedback";

interface InsuranceCaseActionsProps {
  actions: string[];
}

export function InsuranceCaseActions({ actions }: InsuranceCaseActionsProps) {
  const { message, show } = useDemoFeedback();

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => void runDemoAction(label, show)}
            className="min-h-10 rounded-lg border border-cream-dark px-3 py-2 text-xs font-medium text-green hover:bg-cream"
          >
            {label}
          </button>
        ))}
      </div>
      <DemoFeedbackToast message={message} />
    </>
  );
}
