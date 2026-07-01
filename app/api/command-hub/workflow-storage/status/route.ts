import { NextResponse } from "next/server";
import { probeWorkflowStorage } from "@/lib/workflow-storage/resolve-workflow-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const probe = await probeWorkflowStorage();
  return NextResponse.json({ ok: true, ...probe });
}
