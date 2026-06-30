"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useCommandHubAppointments } from "@/components/admin/CommandHubAppointmentsProvider";
import { DataSourcePill } from "@/components/admin/DataSourcePill";
import { PlainEmptyState } from "@/components/admin/PlainEmptyState";
import { WorkflowHelpPanel } from "@/components/admin/WorkflowHelpPanel";
import type { ClinikoStatusData } from "@/components/admin/ClinikoConnectionPanel";

export function ClinikoIntegrationOverview() {
  const [status, setStatus] = useState<ClinikoStatusData | null>(null);
  const [businesses, setBusinesses] = useState<string[]>([]);
  const [practitioners, setPractitioners] = useState<string[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<string[]>([]);
  const { mapped, isLive, lastChecked, loading } = useCommandHubAppointments();

  const load = useCallback(async () => {
    try {
      const [statusRes, bizRes, pracRes, typesRes] = await Promise.all([
        fetch("/api/cliniko/status", { cache: "no-store" }),
        fetch("/api/cliniko/businesses", { cache: "no-store" }),
        fetch("/api/cliniko/practitioners", { cache: "no-store" }),
        fetch("/api/cliniko/appointment-types", { cache: "no-store" }),
      ]);
      const statusJson = (await statusRes.json()) as ClinikoStatusData;
      const bizJson = (await bizRes.json()) as { businesses?: { name: string }[] };
      const pracJson = (await pracRes.json()) as { practitioners?: { name: string }[] };
      const typesJson = (await typesRes.json()) as { appointmentTypes?: { name: string }[] };

      setStatus(statusJson);
      setBusinesses((bizJson.businesses ?? []).map((b) => b.name).filter(Boolean));
      setPractitioners((pracJson.practitioners ?? []).map((p) => p.name).filter(Boolean));
      setAppointmentTypes((typesJson.appointmentTypes ?? []).map((t) => t.name).filter(Boolean));
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const connected = status?.status === "connected" && status.source === "cliniko";

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-green/30 bg-green-muted/20 p-5 sm:p-6">
        <p className="text-base leading-relaxed text-navy">
          Cliniko remains the diary and clinical record. Command Hub reads Cliniko and
          turns appointments into daily actions.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <WorkflowHelpPanel
          title="Cliniko connection"
          items={[
            connected ? "Connected" : "Missing setup",
            connected ? "Cliniko test account" : "Demo examples only",
            status?.shard ? `Region ${status.shard.toUpperCase()}` : "Region unknown",
            lastChecked ? `Live feed checked ${lastChecked}` : "Live feed not checked yet",
          ]}
        />

        <section className="rounded-xl border border-cream-dark bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-navy">Live appointment feed</h2>
            <DataSourcePill kind={isLive ? "cliniko-test" : "demo"} />
          </div>
          <p className="mt-2 text-sm text-slate">
            {isLive
              ? `${mapped.length} appointment(s) loaded for your daily workflow.`
              : "No live appointments found yet."}
          </p>
          {!isLive && !loading && (
            <div className="mt-4">
              <PlainEmptyState
                title="No live Cliniko appointments found."
                description="Create a DEMO appointment in Cliniko, then open Today or Bookings and refresh the live feed."
              />
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <ListPanel title="Businesses / locations" items={businesses} empty="No locations returned yet." />
        <ListPanel title="Practitioners" items={practitioners} empty="No practitioners returned yet." />
        <ListPanel title="Appointment types" items={appointmentTypes} empty="No appointment types returned yet." />
      </div>

      <WorkflowHelpPanel
        title="What Command Hub uses Cliniko for"
        items={[
          "Today's appointment list and actions needed",
          "Calendar and booking review",
          "Treatment-note draft preparation",
          "Invoice and payment workflow prompts",
          "Insurance and stock estimates around appointments",
        ]}
      />

      <div className="rounded-xl border border-cream-dark bg-cream/40 p-5">
        <p className="font-semibold text-navy">Technical proof tools</p>
        <p className="mt-2 text-sm text-slate">
          DEMO record creation, discovery probes and diagnostics are kept separate from daily
          clinic workflow.
        </p>
        <Link
          href="/admin/cliniko/test-lab"
          className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
        >
          Open technical test lab
        </Link>
      </div>
    </div>
  );
}

function ListPanel({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <section className="rounded-xl border border-cream-dark bg-white p-5">
      <h2 className="font-semibold text-navy">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-navy">
          {items.slice(0, 8).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
