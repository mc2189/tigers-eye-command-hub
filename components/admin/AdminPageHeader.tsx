import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function AdminPageHeader({ title, subtitle, children }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <h1 className="text-2xl font-bold text-navy sm:text-3xl">{title}</h1>
      {subtitle && (
        <p className="mt-2 max-w-3xl text-base text-slate">{subtitle}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
