import type { ReactNode } from "react";

interface ClinikoLoadStateProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  children?: ReactNode;
}

export function ClinikoLoadState({
  loading,
  error,
  empty,
  emptyMessage = "No live Cliniko appointments found. Create a DEMO appointment in Cliniko, then refresh the live feed.",
  children,
}: ClinikoLoadStateProps) {
  if (loading) {
    return (
      <p className="rounded-lg border border-cream-dark bg-white px-4 py-6 text-center text-sm text-slate">
        Loading live Cliniko appointments…
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  if (empty) {
    return (
      <p className="rounded-lg border border-dashed border-cream-dark bg-white px-4 py-6 text-center text-sm text-slate">
        {emptyMessage}
      </p>
    );
  }

  return <>{children}</>;
}
