import type { AppointmentWorkflowBundle } from "@/lib/admin-workflow";
import { ActionChip } from "./ActionChip";
import { DataSourcePill } from "./DataSourcePill";

interface WorkflowBundleCardProps {
  bundle: AppointmentWorkflowBundle;
  showDetails?: boolean;
}

export function WorkflowBundleCard({ bundle, showDetails = true }: WorkflowBundleCardProps) {
  const sourcePill =
    bundle.source === "demo" ? "demo" : bundle.source === "inferred" ? "inferred" : "cliniko-test";

  return (
    <article className="rounded-xl border border-cream-dark bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate">
            {bundle.time}
            {bundle.endTime ? ` – ${bundle.endTime}` : ""}
            {bundle.date ? ` · ${bundle.date}` : ""}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-navy">{bundle.patientLabel}</h3>
        </div>
        <DataSourcePill
          kind={sourcePill}
          label={
            bundle.source === "demo"
              ? "Demo example"
              : bundle.source === "inferred"
                ? "Inferred workflow"
                : "Cliniko test account"
          }
        />
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-slate">Appointment type</dt>
          <dd className="font-medium text-navy">{bundle.appointmentType}</dd>
        </div>
        <div>
          <dt className="text-slate">Practitioner</dt>
          <dd className="font-medium text-navy">{bundle.practitioner}</dd>
        </div>
        <div>
          <dt className="text-slate">Location</dt>
          <dd className="font-medium text-navy">{bundle.location}</dd>
        </div>
        <div>
          <dt className="text-slate">Source</dt>
          <dd className="font-medium text-navy">
            {bundle.source === "demo" ? "Demo example" : "Cliniko test account"}
          </dd>
        </div>
      </dl>

      {bundle.primaryAction && (
        <div className="mt-4 rounded-lg border border-green/20 bg-green-muted/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">Primary action</p>
          <p className="mt-1 font-semibold text-navy">{bundle.primaryAction.label}</p>
          {showDetails && bundle.primaryAction.whyItMatters && (
            <p className="mt-2 text-sm text-slate">{bundle.primaryAction.whyItMatters}</p>
          )}
          {showDetails && bundle.primaryAction.suggestedNextStep && (
            <p className="mt-2 text-sm text-navy">
              <span className="font-medium">Suggested next step: </span>
              {bundle.primaryAction.suggestedNextStep}
            </p>
          )}
        </div>
      )}

      {bundle.secondaryActions.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">Secondary actions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {bundle.secondaryActions.map((action) => (
              <ActionChip
                key={`${bundle.appointmentId}-${action.label}`}
                label={action.label}
                kind={action.type}
                inferred={action.source === "inferred"}
              />
            ))}
          </div>
        </div>
      )}

      {showDetails && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">All workflow actions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {bundle.actions
              .filter((a) => a.status !== "future-integration")
              .map((action) => (
                <ActionChip
                  key={`${bundle.appointmentId}-all-${action.label}`}
                  label={action.label}
                  kind={action.type}
                  inferred={action.source === "inferred"}
                />
              ))}
          </div>
        </div>
      )}
    </article>
  );
}
