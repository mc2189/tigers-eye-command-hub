import Link from "next/link";
import type { ReactNode } from "react";

interface MiniPanelProps {
  title: string;
  href?: string;
  children: ReactNode;
}

export function MiniPanel({ title, href, children }: MiniPanelProps) {
  return (
    <div className="rounded-xl border border-cream-dark bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-navy">{title}</h3>
        {href && (
          <Link href={href} className="text-xs font-medium text-green hover:underline">
            View all
          </Link>
        )}
      </div>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}
