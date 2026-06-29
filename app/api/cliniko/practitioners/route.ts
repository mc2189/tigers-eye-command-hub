import { NextResponse } from "next/server";
import { getPractitioners } from "@/lib/cliniko";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getPractitioners();
  return NextResponse.json({
    ok: result.ok,
    source: result.source,
    status: result.status,
    practitioners: result.data ?? [],
    error: result.error,
    warning: result.warning,
  });
}
