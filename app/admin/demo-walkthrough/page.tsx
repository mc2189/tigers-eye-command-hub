"use client";

import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataSourceBadge } from "@/components/admin/DataSourceBadge";
import {
  walkthroughSteps,
  walkthroughStatusLabels,
  type WalkthroughStatus,
} from "@/lib/demo-walkthrough";

const statusToBadge: Record<WalkthroughStatus, "live" | "cliniko" | "future"> = {
  live: "live",
  cliniko: "cliniko",
  future: "future",
};

export default function DemoWalkthroughPage() {
  return (
    <>
      <AdminPageHeader
        title="Demo walkthrough"
        subtitle="A guided route for showing George how the public website, Cliniko and Command Hub connect."
      />

      <p className="mb-8 max-w-3xl text-base text-slate">
        Follow these steps in order. Each section opens a live page. Cliniko remains
        the system of record — the Command Hub adds workflow context around it.
      </p>

      <ol className="space-y-6">
        {walkthroughSteps.map((step, index) => (
          <li
            key={step.id}
            className="rounded-xl border border-cream-dark bg-white p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-green">
                  Step {index + 1} of {walkthroughSteps.length}
                </p>
                <h2 className="mt-1 text-xl font-bold text-navy">{step.title}</h2>
              </div>
              <DataSourceBadge source={statusToBadge[step.status]} />
            </div>

            <p className="mt-3 text-base text-slate leading-relaxed">
              {step.explanation}
            </p>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-navy">Why this helps</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate">
                {step.whyItHelps.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-green">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={step.href}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-light"
                target={step.href.startsWith("/admin") ? undefined : "_blank"}
              >
                Open page
              </Link>
              <span className="flex min-h-11 items-center text-xs text-slate">
                {walkthroughStatusLabels[step.status]}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
