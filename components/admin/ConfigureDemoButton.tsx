"use client";

import {
  DemoActionButton,
  DemoFeedbackToast,
  demoMessages,
  useDemoFeedback,
} from "./DemoActionFeedback";

export function ConfigureDemoButton({ label }: { label: string }) {
  const { message, show } = useDemoFeedback();

  return (
    <>
      <DemoActionButton label={label} onAction={() => show(demoMessages.configure)} />
      <DemoFeedbackToast message={message} />
    </>
  );
}
