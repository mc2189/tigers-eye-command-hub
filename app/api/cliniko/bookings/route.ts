import { NextRequest, NextResponse } from "next/server";
import { getBookings } from "@/lib/cliniko";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const page = searchParams.get("page")
    ? parseInt(searchParams.get("page")!, 10)
    : undefined;
  const perPage = searchParams.get("perPage")
    ? parseInt(searchParams.get("perPage")!, 10)
    : undefined;

  const result = await getBookings({ from, to, page, perPage });

  return NextResponse.json({
    ok: result.ok,
    source: result.source,
    status: result.status,
    bookings: result.data?.bookings ?? [],
    totalEntries: result.data?.totalEntries,
    error: result.error,
    warning: result.warning,
  });
}
