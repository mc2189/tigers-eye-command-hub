"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "./StatusBadge";

export interface ClinikoStatusData {
  ok: boolean;
  source: "cliniko" | "demo";
  status: "not_configured" | "connected" | "error";
  shard: string | null;
  baseUrl: string | null;
  userAgentConfigured: boolean;
  writesEnabled: boolean;
  authenticatedUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  };
  counts?: {
    businesses: number;
    practitioners: number;
    appointmentTypes: number;
    bookings: number;
  };
  error?: string;
  warning?: string;
}

function statusLabel(status: ClinikoStatusData["status"], source: ClinikoStatusData["source"]) {
  if (status === "connected" && source === "cliniko") {
    return "Connected to Cliniko sandbox";
  }
  if (status === "not_configured") {
    return "Demo mode: no Cliniko key configured";
  }
  return "Cliniko authentication failed";
}

function statusVariant(status: ClinikoStatusData["status"], source: ClinikoStatusData["source"]) {
  if (status === "connected" && source === "cliniko") return "success" as const;
  if (status === "not_configured") return "warning" as const;
  return "danger" as const;
}

export function ClinikoConnectionPanel() {
  const [data, setData] = useState<ClinikoStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cliniko/status", { cache: "no-store" });
      const json = (await res.json()) as ClinikoStatusData;
      setData(json);
    } catch {
      setData({
        ok: false,
        source: "demo",
        status: "error",
        shard: null,
        baseUrl: null,
        userAgentConfigured: false,
        writesEnabled: false,
        error: "Cliniko could not be reached. Demo data is still available.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-xl border border-cream-dark bg-white p-5">
        <p className="text-sm text-slate">Loading Cliniko sandbox data…</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <section className="rounded-xl border border-cream-dark bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy">Cliniko connection</h2>
          <p className="mt-1 text-sm text-slate">
            Cliniko remains the system of record. Command Hub is the viewing layer.
          </p>
        </div>
        <StatusBadge
          label={statusLabel(data.status, data.source)}
          variant={statusVariant(data.status, data.source)}
        />
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <dt className="text-slate">Shard</dt>
          <dd className="font-medium text-navy">{data.shard ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate">Base URL</dt>
          <dd className="font-medium text-navy break-all">{data.baseUrl ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate">Writes enabled</dt>
          <dd className="font-medium text-navy">{data.writesEnabled ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-slate">Data source</dt>
          <dd className="font-medium text-navy">
            {data.source === "cliniko" ? "Cliniko sandbox" : "Using demo data"}
          </dd>
        </div>
      </dl>

      {data.authenticatedUser && (
        <div className="mt-4 rounded-lg bg-cream p-3 text-sm">
          <p className="font-medium text-navy">Authenticated sandbox user</p>
          <p className="text-slate">
            {[data.authenticatedUser.firstName, data.authenticatedUser.lastName]
              .filter(Boolean)
              .join(" ") || "Sandbox user"}
            {data.authenticatedUser.role ? ` · ${data.authenticatedUser.role}` : ""}
            {data.authenticatedUser.email ? ` · ${data.authenticatedUser.email}` : ""}
          </p>
        </div>
      )}

      {data.counts && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["businesses", "Businesses"],
              ["practitioners", "Practitioners"],
              ["appointmentTypes", "Appointment types"],
              ["bookings", "Bookings"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="rounded-lg border border-cream-dark p-3 text-center">
              <p className="text-2xl font-bold text-navy">{data.counts![key]}</p>
              <p className="text-xs text-slate">{label}</p>
            </div>
          ))}
        </div>
      )}

      {data.warning && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {data.warning.includes("mismatch") || data.warning.includes("suffix")
            ? "Shard mismatch likely — check key suffix and CLINIKO_SHARD."
            : data.warning}
        </p>
      )}

      {data.error && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Cliniko could not be reached. Demo data is still available.
          {data.error !== "Cliniko could not be reached. Demo data is still available." && (
            <span className="mt-1 block text-amber-800">{data.error}</span>
          )}
        </p>
      )}

      <button
        type="button"
        onClick={() => void load()}
        className="mt-4 min-h-10 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-green hover:bg-cream"
      >
        Refresh connection
      </button>
    </section>
  );
}

export function useClinikoStatus() {
  const [data, setData] = useState<ClinikoStatusData | null>(null);

  useEffect(() => {
    fetch("/api/cliniko/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: ClinikoStatusData) => setData(json))
      .catch(() => setData(null));
  }, []);

  return data;
}
