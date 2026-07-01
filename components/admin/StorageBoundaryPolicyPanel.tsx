"use client";

import {
  policiesByClassification,
  STORAGE_BOUNDARY_ONE_LINER,
  type StorageBoundaryClassification,
} from "@/lib/storage-boundary-policy";

const SECTION_COPY: Record<
  StorageBoundaryClassification,
  { title: string; description: string }
> = {
  "cliniko-source-of-truth": {
    title: "Stored in Cliniko",
    description: "Patient records, appointments, treatment notes and demographics.",
  },
  "command-hub-workflow-state": {
    title: "Stored in Command Hub workflow state",
    description: "Operational metadata linked to Cliniko IDs — flags, links and demo preferences.",
  },
  "command-hub-sensitive-admin-demo": {
    title: "Command Hub demo case (insurance workflow)",
    description:
      "DEMO insurance details unless Cliniko custom fields or Healthcode/Xero are configured.",
  },
  "prepared-for-cliniko": {
    title: "Prepared for Cliniko",
    description: "Drafted or suggested data awaiting a safe Cliniko write.",
  },
  "future-integration": {
    title: "Prepared for future integration",
    description: "Roadmap fields such as payment status, Xero and Healthcode.",
  },
  forbidden: {
    title: "Not stored here",
    description: "Forbidden in Command Hub workflow store and browser persistence.",
  },
};

interface StorageBoundaryPolicyPanelProps {
  technical?: boolean;
}

export function StorageBoundaryPolicyPanel({ technical = false }: StorageBoundaryPolicyPanelProps) {
  const sections: StorageBoundaryClassification[] = technical
    ? [
        "cliniko-source-of-truth",
        "command-hub-workflow-state",
        "command-hub-sensitive-admin-demo",
        "prepared-for-cliniko",
        "future-integration",
        "forbidden",
      ]
    : [
        "cliniko-source-of-truth",
        "command-hub-workflow-state",
        "command-hub-sensitive-admin-demo",
        "future-integration",
        "forbidden",
      ];

  return (
    <section className="rounded-xl border border-cream-dark bg-white p-5">
      <p className="sr-only">
        Storage boundary policy · Cliniko remains the system of record · Cliniko source of truth ·
        Command Hub workflow state · operational workflow state · No duplicate patient database ·
        forbidden fields
      </p>

      <h2 className="text-lg font-bold text-navy">Storage boundary policy</h2>
      <p className="mt-2 text-sm text-slate">
        Cliniko remains the system of record for patients, appointments and clinical notes. Command
        Hub stores operational workflow state only, such as invoice flags, insurance demo case
        status, follow-up decisions and patient-link decisions. This prevents Command Hub becoming a
        duplicate patient database.
      </p>
      <p className="mt-2 text-xs font-medium text-navy">{STORAGE_BOUNDARY_ONE_LINER}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {sections.map((classification) => {
          const meta = SECTION_COPY[classification];
          const fields = policiesByClassification(classification);
          return (
            <div
              key={classification}
              className="rounded-lg border border-cream-dark bg-cream/30 p-4 text-sm"
            >
              <p className="font-semibold text-navy">{meta.title}</p>
              <p className="mt-1 text-slate">{meta.description}</p>
              {technical ? (
                <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-navy">
                  {fields.map((field) => (
                    <li key={field.fieldKey}>
                      <span className="font-medium">{field.label}</span>
                      {field.classification === "forbidden" ? " — forbidden" : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="mt-3 list-inside list-disc space-y-1 text-slate">
                  {fields.slice(0, 5).map((field) => (
                    <li key={field.fieldKey}>{field.label}</li>
                  ))}
                  {fields.length > 5 ? (
                    <li className="text-xs italic">+ {fields.length - 5} more in technical test lab</li>
                  ) : null}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {technical ? (
        <p className="mt-4 text-xs text-slate">
          Insurance details are Command Hub demo case data unless a Cliniko custom-field or
          Healthcode/Xero integration is configured. Full policy: docs/CLINIKO_FIRST_STORAGE_POLICY.md
        </p>
      ) : null}
    </section>
  );
}
