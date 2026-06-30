import { dataSourcePillLabel, type DataSourcePillKind } from "@/lib/admin-workflow";

const pillStyles: Record<DataSourcePillKind, string> = {
  "cliniko-test": "bg-blue-50 text-blue-800 ring-blue-200",
  demo: "bg-cream-dark text-slate ring-cream-dark",
  inferred: "bg-amber-50 text-amber-900 ring-amber-200",
  future: "bg-slate-100 text-slate ring-slate-200",
};

export function DataSourcePill({ kind, label }: { kind: DataSourcePillKind; label?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${pillStyles[kind]}`}
    >
      {label ?? dataSourcePillLabel(kind)}
    </span>
  );
}
