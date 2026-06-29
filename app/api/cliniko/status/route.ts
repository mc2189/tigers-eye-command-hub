import { NextResponse } from "next/server";
import { getClinikoStatus } from "@/lib/cliniko";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getClinikoStatus();
  return NextResponse.json(status);
}
