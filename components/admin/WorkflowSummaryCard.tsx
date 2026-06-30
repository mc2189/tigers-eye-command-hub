import Link from "next/link";

interface WorkflowSummaryCardProps {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  status?: "default" | "attention" | "ready";
}

const statusStyles = {
  default: "border-cream-dark bg-white",
  attention: "border-amber-200 bg-amber-50/40",
  ready: "border-green/30 bg-green-muted/30",
};

export function WorkflowSummaryCard({
  label,
  value,
  hint,
  href,
  status = "default",
}: WorkflowSummaryCardProps) {
  const inner = (
    <div className={`rounded-xl border p-5 transition-shadow hover:shadow-sm ${statusStyles[status]}`}>
      <p className="text-sm font-medium text-slate">{label}</p>
      <p className="mt-2 text-3xl font-bold text-navy">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate">{hint}</p> : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-green">
        {inner}
      </Link>
    );
  }

  return inner;
}
