import { NextResponse } from "next/server";
import { DEMO_STAFF_COOKIE, staffCookieOptions } from "@/lib/demo-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_STAFF_COOKIE, "", { ...staffCookieOptions(), maxAge: 0 });
  return response;
}
