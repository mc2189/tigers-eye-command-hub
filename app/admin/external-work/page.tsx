import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CalloutBox } from "@/components/admin/AdminUI";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  externalWorkBlocks,
  getPractitioner,
  invoiceStatusLabels,
} from "@/lib/demo-data";

export default function ExternalWorkPage() {
  return (
    <>
      <AdminPageHeader
        title="External work"
        subtitle="SSE, Health Partners, SFA and other business commitments — no patient details stored."
      />

      <CalloutBox variant="warning" title="Business commitments only">
        External work is tracked as business commitments only. Patient details remain
        in the relevant external system.
      </CalloutBox>

      <div className="mt-6 space-y-4">
        {externalWorkBlocks.map((block) => (
          <article
            key={block.id}
            className="rounded-xl border border-cream-dark bg-white p-4 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-navy">{block.workstream}</h2>
                <p className="text-sm text-slate">
                  {block.date} · {block.startTime}–{block.endTime}
                </p>
              </div>
              <StatusBadge
                label={invoiceStatusLabels[block.invoiceStatus]}
                variant="neutral"
              />
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div>
                <dt className="text-slate">Location</dt>
                <dd className="font-medium">{block.location}</dd>
              </div>
              <div>
                <dt className="text-slate">Practitioner</dt>
                <dd className="font-medium">{getPractitioner(block.practitionerId).name}</dd>
              </div>
              <div>
                <dt className="text-slate">Est. fee</dt>
                <dd className="font-medium">£{block.estimatedFee}</dd>
              </div>
              <div>
                <dt className="text-slate">Mileage</dt>
                <dd className="font-medium">{block.mileage} miles</dd>
              </div>
            </dl>

            <div className="mt-3">
              <p className="text-sm text-slate">Kit needed: {block.stockNeeded.join(", ")}</p>
              <p className="mt-1 text-sm italic text-slate">{block.notes}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <ExtAction label="Add calendar block" />
              <ExtAction label="Draft invoice reminder" />
              <ExtAction label="Add mileage" />
              <ExtAction label="Mark submitted" />
              <ExtAction label="Mark paid" />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function ExtAction({ label }: { label: string }) {
  return (
    <button type="button" className="min-h-9 rounded-lg border border-cream-dark px-3 py-1.5 text-xs font-medium text-green hover:bg-cream">
      {label}
    </button>
  );
}
