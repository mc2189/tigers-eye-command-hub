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
  emptyMessage = "No sandbox bookings found yet. Add appointments in Cliniko or continue with demo data.",
  children,
}: ClinikoLoadStateProps) {
  if (loading) {
    return (
      <p className="rounded-lg border border-cream-dark bg-white px-4 py-6 text-center text-sm text-slate">
        Loading Cliniko sandbox data…
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
