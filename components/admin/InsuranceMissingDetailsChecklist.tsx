import type { InsuranceCase } from "@/lib/insurance-session-workflow";

const CHECKLIST_FIELDS = [
  "Insurer",
  "Claim number",
  "Authorisation number",
  "Approved sessions",
  "Patient liability agreement",
  "Invoice details",
] as const;

function fieldPresent(insuranceCase: InsuranceCase, field: string): boolean {
  switch (field) {
    case "Insurer":
      return insuranceCase.insurer !== "Unknown";
    case "Claim number":
      return Boolean(insuranceCase.claimNumber?.trim());
    case "Authorisation number":
      return Boolean(insuranceCase.authorisationNumber?.trim());
    case "Approved sessions":
      return insuranceCase.approvedSessions !== undefined;
    case "Patient liability agreement":
      return insuranceCase.liabilityAccepted;
    case "Invoice details":
      return insuranceCase.invoiceStatus !== "not-ready";
    default:
      return false;
  }
}

interface InsuranceMissingDetailsChecklistProps {
  insuranceCase: InsuranceCase;
}

export function InsuranceMissingDetailsChecklist({
  insuranceCase,
}: InsuranceMissingDetailsChecklistProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate">Missing checklist</p>
      <ul className="mt-2 space-y-1 text-sm">
        {CHECKLIST_FIELDS.map((field) => {
          const present = fieldPresent(insuranceCase, field);
          return (
            <li key={field} className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${present ? "bg-green" : "bg-amber-400"}`}
                aria-hidden
              />
              <span className={present ? "text-navy" : "text-slate"}>
                {field}: {present ? "Present" : "Not captured yet"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
