"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  isDemoWeekPreviewActive,
  setDemoWeekPreviewActive,
} from "@/lib/demo-week-preview";

interface DemoWeekPreviewToggleProps {
  compact?: boolean;
}

export function DemoWeekPreviewToggle({ compact = false }: DemoWeekPreviewToggleProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isDemoWeekPreviewActive());
    const handler = () => setActive(isDemoWeekPreviewActive());
    window.addEventListener("demo-week-preview-changed", handler);
    return () => window.removeEventListener("demo-week-preview-changed", handler);
  }, []);

  function toggle() {
    const next = !active;
    setDemoWeekPreviewActive(next);
    setActive(next);
    window.location.reload();
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="text-sm font-medium text-green hover:underline"
      >
        {active ? "Exit demo week preview" : "Preview demo clinic week"}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-navy">
        {active ? "Demo week preview active" : "Preview demo clinic week"}
      </p>
      <p className="mt-1 text-sm text-slate">
        {active
          ? "Showing fake DEMO clinic week data — not live Cliniko appointments."
          : "Load a realistic fake clinic week to see how Command Hub works with a full diary."}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90"
        >
          {active ? "Exit preview" : "Preview demo clinic week"}
        </button>
        <Link
          href="/admin/cliniko/test-lab"
          className="rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-navy hover:bg-cream"
        >
          Seed in Cliniko test lab
        </Link>
      </div>
    </div>
  );
}

export function DemoWeekPreviewBanner() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isDemoWeekPreviewActive());
    const handler = () => setActive(isDemoWeekPreviewActive());
    window.addEventListener("demo-week-preview-changed", handler);
    return () => window.removeEventListener("demo-week-preview-changed", handler);
  }, []);

  if (!active) return null;

  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <strong>Demo week preview</strong> — fake DEMO data only. Not live Cliniko appointments.
    </div>
  );
}
