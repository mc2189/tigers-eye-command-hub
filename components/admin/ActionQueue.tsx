import type { WorkflowAppointmentView } from "@/lib/admin-workflow";
import { AppointmentWorkflowCard } from "./AppointmentWorkflowCard";
import { PlainEmptyState } from "./PlainEmptyState";

interface ActionQueueProps {
  title?: string;
  appointments: WorkflowAppointmentView[];
  emptyTitle?: string;
  emptyDescription?: string;
  compact?: boolean;
}

export function ActionQueue({
  title = "Today's command list",
  appointments,
  emptyTitle = "No live Cliniko appointments found.",
  emptyDescription = "Create a DEMO appointment in Cliniko, then refresh the live feed.",
  compact,
}: ActionQueueProps) {
  return (
    <section className="space-y-4" aria-labelledby="action-queue-heading">
      <h2 id="action-queue-heading" className="text-lg font-bold text-navy">
        {title}
      </h2>
      {appointments.length === 0 ? (
        <PlainEmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="space-y-3">
          {appointments.map((appointment) => (
            <li key={appointment.id}>
              <AppointmentWorkflowCard appointment={appointment} compact={compact} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
