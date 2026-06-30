import type { WorkflowActionKind } from "@/lib/admin-workflow";

const chipStyles: Record<WorkflowActionKind, string> = {
  note: "bg-amber-100 text-amber-900",
  payment: "bg-blue-100 text-blue-900",
  invoice: "bg-purple-100 text-purple-900",
  insurance: "bg-rose-100 text-rose-900",
  followup: "bg-orange-100 text-orange-900",
  stock: "bg-teal-100 text-teal-900",
  price: "bg-red-100 text-red-900",
  none: "bg-cream-dark text-slate",
};

export function ActionChip({
  label,
  kind = "note",
  inferred,
}: {
  label: string;
  kind?: WorkflowActionKind;
  inferred?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${chipStyles[kind]}`}
    >
      {label}
      {inferred ? <span className="ml-1 opacity-70">· inferred</span> : null}
    </span>
  );
}
