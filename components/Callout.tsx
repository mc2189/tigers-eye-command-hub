import type { ReactNode } from "react";

type CalloutVariant = "info" | "warning" | "success";

interface CalloutProps {
  title?: string;
  children: ReactNode;
  variant?: CalloutVariant;
}

const styles: Record<CalloutVariant, string> = {
  info: "border-green/30 bg-green-muted/40 text-navy",
  warning: "border-amber-400/50 bg-amber-50 text-navy",
  success: "border-green/40 bg-green-muted/60 text-navy",
};

export function Callout({ title, children, variant = "info" }: CalloutProps) {
  return (
    <aside
      className={`rounded-xl border-l-4 p-4 sm:p-5 ${styles[variant]}`}
      role="note"
    >
      {title && (
        <p className="mb-2 text-base font-semibold text-navy">{title}</p>
      )}
      <div className="text-base leading-relaxed">{children}</div>
    </aside>
  );
}
