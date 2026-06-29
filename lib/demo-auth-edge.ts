const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export const DEMO_STAFF_COOKIE = "demo_staff_session";

export function isStaffAuthConfigured(): boolean {
  return Boolean(
    process.env.DEMO_STAFF_PASSWORD?.trim() &&
      process.env.DEMO_SESSION_SECRET?.trim()
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function signPayloadEdge(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return bufferToHex(signature);
}

export async function verifyStaffSessionTokenEdge(
  token: string | null | undefined
): Promise<boolean> {
  if (!token || !isStaffAuthConfigured()) return false;

  const secret = process.env.DEMO_SESSION_SECRET?.trim();
  if (!secret) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !payload.startsWith("staff:")) return false;

  const expected = await signPayloadEdge(payload, secret);
  if (signature !== expected) return false;

  const expiresAt = Number(payload.split(":")[1]);
  return Number.isFinite(expiresAt) && Date.now() <= expiresAt;
}

export { SESSION_TTL_MS };
