"use client";

import Link from "next/link";

interface ClinikoDataQualityBannerProps {
  visible: boolean;
}

export function ClinikoDataQualityBanner({ visible }: ClinikoDataQualityBannerProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      Some Cliniko details were not returned for these appointments.{" "}
      <Link href="/admin/cliniko/test-lab" className="font-semibold text-green hover:underline">
        Open the technical test lab
      </Link>{" "}
      to inspect the live feed.
    </div>
  );
}
