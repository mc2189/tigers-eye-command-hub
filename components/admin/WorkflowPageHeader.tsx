import type { ReactNode } from "react";

interface WorkflowPageHeaderProps {
  title: string;
  purpose: string;
  children?: ReactNode;
}

export function WorkflowPageHeader({ title, purpose, children }: WorkflowPageHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">{title}</h1>
          <p className="mt-2 text-base leading-relaxed text-slate">{purpose}</p>
        </div>
        {children ? <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div> : null}
      </div>
    </header>
  );
}
