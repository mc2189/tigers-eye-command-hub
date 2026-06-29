import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEMO_STAFF_COOKIE,
  isStaffAuthConfigured,
  verifyStaffSessionTokenEdge,
} from "@/lib/demo-auth-edge";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];
const PUBLIC_API_PATHS = ["/api/auth/login"];

function isProtectedAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isProtectedClinikoApi(pathname: string): boolean {
  return pathname.startsWith("/api/cliniko/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsAuth =
    isProtectedAdminPath(pathname) || isProtectedClinikoApi(pathname);

  if (!needsAuth) {
    return NextResponse.next();
  }

  if (PUBLIC_ADMIN_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  if (PUBLIC_API_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  if (!isStaffAuthConfigured()) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Demo staff login is not configured. Set DEMO_STAFF_PASSWORD and DEMO_SESSION_SECRET.",
        },
        { status: 503 }
      );
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("error", "not_configured");
    return NextResponse.redirect(loginUrl);
  }

  const token = request.cookies.get(DEMO_STAFF_COOKIE)?.value;
  const authenticated = await verifyStaffSessionTokenEdge(token);

  if (authenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: "Demo staff authentication required." },
      { status: 401 }
    );
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/cliniko/:path*"],
};
