import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import {
  DEMO_STAFF_COOKIE,
  isStaffAuthConfigured,
  SESSION_TTL_MS,
} from "@/lib/demo-auth-edge";

export { DEMO_STAFF_COOKIE, isStaffAuthConfigured, SESSION_TTL_MS };

export function verifyStaffPassword(password: string): boolean {
  const expected = process.env.DEMO_STAFF_PASSWORD?.trim();
  if (!expected) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function signPayload(payload: string): string {
  const secret = process.env.DEMO_SESSION_SECRET?.trim();
  if (!secret) throw new Error("DEMO_SESSION_SECRET not configured");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createStaffSessionToken(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `staff:${expiresAt}`;
  return `${payload}.${signPayload(payload)}`;
}

export function verifyStaffSessionToken(token: string | undefined | null): boolean {
  if (!token || !isStaffAuthConfigured()) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = signPayload(payload);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }

  const expiresAt = Number(payload.split(":")[1]);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return payload.startsWith("staff:");
}

export function getStaffSessionFromRequest(request: NextRequest): string | null {
  return request.cookies.get(DEMO_STAFF_COOKIE)?.value ?? null;
}

export function isStaffAuthenticated(request: NextRequest): boolean {
  if (!isStaffAuthConfigured()) return false;
  return verifyStaffSessionToken(getStaffSessionFromRequest(request));
}

export function staffCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}
