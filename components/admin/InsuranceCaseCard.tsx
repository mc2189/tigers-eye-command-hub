import type { InsuranceCase } from "@/lib/insurance-session-workflow";
import { InsuranceMissingDetailsChecklist } from "./InsuranceMissingDetailsChecklist";
import { InsuranceSessionProgress } from "./InsuranceSessionProgress";
import { DataSourcePill } from "./DataSourcePill";

const SOURCE_LABELS: Record<InsuranceCase["source"], { kind: "cliniko-test" | "demo" | "inferred"; label: string }> = {
  "cliniko-test": { kind: "cliniko-test", label: "Cliniko test account" },
  "demo-case": { kind: "demo", label: "Demo case detail" },
  inferred: { kind: "inferred", label: "Inferred workflow" },
};

interface InsuranceCaseCardProps {
  insuranceCase: InsuranceCase;
}

export function InsuranceCaseCard({ insuranceCase }: InsuranceCaseCardProps) {
  const source = SOURCE_LABELS[insuranceCase.source];

  return (
    <article className="rounded-xl border border-cream-dark bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-navy">{insuranceCase.patientLabel}</h3>
          <p className="mt-1 text-sm text-slate">{insuranceCase.insurer}</p>
        </div>
        <DataSourcePill kind={source.kind} label={source.label} />
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-slate">Claim number</dt>
          <dd className="font-medium text-navy">{insuranceCase.claimNumber ?? "Not captured yet"}</dd>
        </div>
        <div>
          <dt className="text-slate">Authorisation number</dt>
          <dd className="font-medium text-navy">
            {insuranceCase.authorisationNumber ?? "Not captured yet"}
          </dd>
        </div>
        <div>
          <dt className="text-slate">Liability agreement</dt>
          <dd className="font-medium text-navy">
            {insuranceCase.liabilityAccepted ? "Accepted" : "Not captured yet"}
          </dd>
        </div>
        <div>
          <dt className="text-slate">Invoice status</dt>
          <dd className="font-medium text-navy">{insuranceCase.invoiceStatus.replace(/-/g, " ")}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <InsuranceSessionProgress insuranceCase={insuranceCase} />
      </div>

      <div className="mt-4 rounded-lg border border-green/20 bg-green-muted/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate">Next action</p>
        <p className="mt-1 text-sm text-navy">{insuranceCase.nextAction}</p>
      </div>

      <div className="mt-4">
        <InsuranceMissingDetailsChecklist insuranceCase={insuranceCase} />
      </div>

      {insuranceCase.sessions.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">Session history</p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-cream-dark text-slate">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Appointment type</th>
                  <th className="py-2 pr-3 font-medium">Practitioner</th>
                  <th className="py-2 font-medium">Invoice status</th>
                </tr>
              </thead>
              <tbody>
                {insuranceCase.sessions.map((session) => (
                  <tr key={session.appointmentId} className="border-b border-cream-dark/60 last:border-0">
                    <td className="py-2 pr-3 text-navy">
                      {session.date ?? "—"} {session.time ?? ""}
                    </td>
                    <td className="py-2 pr-3 text-navy">{session.appointmentType}</td>
                    <td className="py-2 pr-3 text-navy">{session.practitioner}</td>
                    <td className="py-2 text-navy">{session.invoiceStatus.replace(/-/g, " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </article>
  );
}
