import Link from "next/link";
import { PriorityBadge } from "./StatusBadge";

interface ActionCardProps {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  modulePath: string;
  actionLabel: string;
}

export function ActionCard({
  title,
  description,
  priority,
  modulePath,
  actionLabel,
}: ActionCardProps) {
  return (
    <article className="flex flex-col rounded-xl border border-cream-dark bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <PriorityBadge priority={priority} />
        <span className="text-xs text-slate">{modulePath.replace("/admin/", "")}</span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-navy">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-slate leading-relaxed">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={modulePath}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-light"
        >
          {actionLabel}
        </Link>
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-slate transition-colors hover:border-green hover:text-green"
        >
          Mark done
        </button>
      </div>
    </article>
  );
}
