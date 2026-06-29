import type { ReactNode } from "react";

interface ProgressBarProps {
  label: string;
  amount: number;
  percent: number;
  maxAmount?: number;
}

export function ProgressBar({ label, amount, percent }: ProgressBarProps) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-navy">{label}</span>
        <span className="text-slate">£{amount.toLocaleString()} ({percent}%)</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-cream-dark">
        <div
          className="h-full rounded-full bg-green transition-all"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

interface CalloutBoxProps {
  title?: string;
  children: ReactNode;
  variant?: "info" | "warning" | "success";
}

const calloutStyles = {
  info: "border-green/30 bg-green-muted/30",
  warning: "border-amber-300 bg-amber-50",
  success: "border-green/40 bg-green-muted/50",
};

export function CalloutBox({ title, children, variant = "info" }: CalloutBoxProps) {
  return (
    <aside className={`rounded-xl border-l-4 p-4 sm:p-5 ${calloutStyles[variant]}`}>
      {title && <p className="mb-2 font-semibold text-navy">{title}</p>}
      <div className="text-sm text-slate leading-relaxed">{children}</div>
    </aside>
  );
}
