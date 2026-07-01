import { NextRequest, NextResponse } from "next/server";
import {
  patchCommandHubWorkflowStore,
  readCommandHubWorkflowStore,
} from "@/lib/command-hub-workflow-store";
import type { WorkflowStatePatch } from "@/lib/command-hub-workflow-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const store = await readCommandHubWorkflowStore();
  return NextResponse.json({ ok: true, store });
}

export async function PATCH(request: NextRequest) {
  let body: WorkflowStatePatch;
  try {
    body = (await request.json()) as WorkflowStatePatch;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  try {
    const store = await patchCommandHubWorkflowStore(body);
    return NextResponse.json({ ok: true, store });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Workflow state update failed.";
    const blocked = message.includes("Blocked for safety");
    return NextResponse.json(
      { ok: false, message },
      { status: blocked ? 403 : 500 }
    );
  }
}
