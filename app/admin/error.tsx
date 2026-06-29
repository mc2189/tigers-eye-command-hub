"use client";

import Link from "next/link";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-cream-dark bg-white p-8 text-center">
      <h1 className="text-xl font-bold text-navy">Something went wrong in the Command Hub demo.</h1>
      <p className="mt-3 text-sm text-slate">
        Cliniko data has not been changed. Try refreshing, or return to the dashboard.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/admin"
          className="min-h-10 rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-light"
        >
          Return to dashboard
        </Link>
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-green hover:bg-cream"
        >
          Refresh page
        </button>
      </div>
    </div>
  );
}
