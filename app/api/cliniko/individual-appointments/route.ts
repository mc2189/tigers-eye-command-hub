import { NextRequest, NextResponse } from "next/server";
import { getIndividualAppointments } from "@/lib/cliniko";

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
  const includeArchived = searchParams.get("includeArchived") === "true";

  const result = await getIndividualAppointments({
    from,
    to,
    page,
    perPage,
    includeArchived,
  });

  return NextResponse.json({
    ok: result.ok,
    source: result.source,
    status: result.status,
    appointments: result.data?.appointments ?? [],
    totalEntries: result.data?.totalEntries,
    error: result.error,
    warning: result.warning,
  });
}
