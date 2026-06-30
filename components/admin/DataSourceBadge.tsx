import type { DataSource } from "@/lib/cliniko-mappers";

export type BadgeSource =
  | DataSource
  | "inferred"
  | "future"
  | "dry-run"
  | "safety-gated"
  | "live";

interface DataSourceBadgeProps {
  source: BadgeSource;
  className?: string;
}

const labels: Record<BadgeSource, string> = {
  cliniko: "Cliniko test account",
  "cliniko-test": "Cliniko test account",
  demo: "Demo data",
  inferred: "Inferred",
  future: "Future integration",
  "dry-run": "Dry run",
  "safety-gated": "Safety gated",
  live: "Live demo",
};

const styles: Record<BadgeSource, string> = {
  cliniko: "bg-blue-100 text-blue-800",
  "cliniko-test": "bg-blue-100 text-blue-900",
  demo: "bg-amber-100 text-amber-800",
  inferred: "bg-purple-100 text-purple-800",
  future: "bg-slate-100 text-slate-700",
  "dry-run": "bg-cyan-100 text-cyan-800",
  "safety-gated": "bg-red-100 text-red-800",
  live: "bg-green-muted text-green",
};

export function DataSourceBadge({ source, className = "" }: DataSourceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${styles[source]} ${className}`}
    >
      {labels[source]}
    </span>
  );
}
