import { NextResponse } from "next/server";
import { getBusinesses } from "@/lib/cliniko";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getBusinesses();
  return NextResponse.json({
    ok: result.ok,
    source: result.source,
    status: result.status,
    businesses: result.data ?? [],
    error: result.error,
    warning: result.warning,
  });
}
