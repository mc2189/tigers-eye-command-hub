import type { InsuranceCase } from "@/lib/insurance-session-workflow";

interface InsuranceSessionProgressProps {
  insuranceCase: InsuranceCase;
}

export function InsuranceSessionProgress({ insuranceCase }: InsuranceSessionProgressProps) {
  const { approvedSessions, sessionsUsed, sessionsRemaining } = insuranceCase;

  return (
    <div className="rounded-lg bg-cream/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate">Session progress</p>
      {approvedSessions !== undefined ? (
        <>
          <p className="mt-2 text-base font-semibold text-navy">
            Sessions used: {sessionsUsed} of {approvedSessions}
          </p>
          <p className="mt-1 text-sm text-slate">
            Sessions remaining: {sessionsRemaining ?? 0}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream-dark">
            <div
              className="h-full rounded-full bg-green transition-all"
              style={{
                width: `${Math.min(100, (sessionsUsed / Math.max(approvedSessions, 1)) * 100)}%`,
              }}
            />
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate">Approved sessions not captured yet</p>
      )}
    </div>
  );
}
