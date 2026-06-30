import type { WorkflowAppointmentView } from "@/lib/admin-workflow";
import { ActionChip } from "./ActionChip";
import { DataSourcePill } from "./DataSourcePill";

interface AppointmentWorkflowCardProps {
  appointment: WorkflowAppointmentView;
  compact?: boolean;
}

export function AppointmentWorkflowCard({ appointment, compact }: AppointmentWorkflowCardProps) {
  return (
    <article className="rounded-xl border border-cream-dark bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate">
            {appointment.time}
            {appointment.endTime ? ` – ${appointment.endTime}` : ""}
            {appointment.date && !compact ? ` · ${appointment.date}` : ""}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-navy">{appointment.patient}</h3>
        </div>
        <DataSourcePill kind={appointment.sourcePill} label={appointment.sourceLabel} />
      </div>

      <dl className={`mt-4 grid gap-3 text-sm ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        <div>
          <dt className="text-slate">Appointment type</dt>
          <dd className="font-medium text-navy">{appointment.appointmentType}</dd>
        </div>
        <div>
          <dt className="text-slate">Practitioner</dt>
          <dd className="font-medium text-navy">{appointment.practitioner}</dd>
        </div>
        <div>
          <dt className="text-slate">Location</dt>
          <dd className="font-medium text-navy">{appointment.location}</dd>
        </div>
        <div>
          <dt className="text-slate">Source</dt>
          <dd className="font-medium text-navy">{appointment.sourceLabel}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate">Actions needed</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {appointment.actions.map((action) => (
            <ActionChip
              key={`${appointment.id}-${action.label}`}
              label={action.label}
              kind={action.kind}
              inferred={action.inferred}
            />
          ))}
        </div>
      </div>

      {appointment.confidenceNotes.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-slate">
          {appointment.confidenceNotes.map((note) => (
            <li key={note}>· {note}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
