import { NextRequest, NextResponse } from "next/server";
import { getIndividualAppointments } from "@/lib/cliniko";
import { enrichIndividualAppointmentsForWorkflow } from "@/lib/cliniko-workflow-enrichment";

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

  const rawAppointments = result.data?.appointments ?? [];
  const enriched =
    result.ok && result.source === "cliniko"
      ? await enrichIndividualAppointmentsForWorkflow(rawAppointments)
      : {
          appointments: rawAppointments.map((a) => ({
            id: a.id,
            startsAt: a.startsAt,
            endsAt: a.endsAt ?? a.startsAt,
            patientId: a.patientId,
            patientName: a.patientName,
            patientLabel: a.patientLabel ?? a.patientName,
            appointmentTypeId: a.appointmentTypeId,
            appointmentTypeName: a.appointmentTypeName,
            practitionerId: a.practitionerId,
            practitionerName: a.practitionerName,
            businessId: a.businessId,
            businessName: a.businessName,
            noteStatus: a.noteStatus,
            invoiceStatus: a.invoiceStatus,
            telehealthUrl: a.telehealthUrl,
            cancelledAt: a.cancelledAt,
            archivedAt: a.archivedAt,
            source: a.source,
          })),
          hasDisplayQualityIssues: false,
        };

  return NextResponse.json({
    ok: result.ok,
    source: result.source,
    status: result.status,
    appointments: enriched.appointments,
    totalEntries: result.data?.totalEntries,
    hasDisplayQualityIssues: enriched.hasDisplayQualityIssues,
    error: result.error,
    warning: result.warning,
  });
}
