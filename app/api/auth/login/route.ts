import { NextRequest, NextResponse } from "next/server";
import {
  createStaffSessionToken,
  DEMO_STAFF_COOKIE,
  isStaffAuthConfigured,
  staffCookieOptions,
  verifyStaffPassword,
} from "@/lib/demo-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isStaffAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Demo staff login is not configured. Set DEMO_STAFF_PASSWORD and DEMO_SESSION_SECRET.",
      },
      { status: 503 }
    );
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  if (!body.password || !verifyStaffPassword(body.password)) {
    return NextResponse.json(
      { ok: false, error: "Incorrect demo staff password." },
      { status: 401 }
    );
  }

  const token = createStaffSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_STAFF_COOKIE, token, staffCookieOptions());
  return response;
}
