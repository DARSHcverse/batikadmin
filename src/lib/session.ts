// Signs and checks the admin session cookie. Kept free of Next.js imports so proxy.ts can use it.
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "sb_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function signingKey(password: string) {
  // Derived from the secret key, so changing ADMIN_PASSWORD signs everyone out.
  return createHmac("sha256", "studio-batik-admin/session/v1").update(password).digest();
}

function sign(password: string, payload: string) {
  return createHmac("sha256", signingKey(password)).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function createSessionToken(password: string, now = Date.now()) {
  const payload = `v1.${now + SESSION_MAX_AGE * 1000}`;
  return `${payload}.${sign(password, payload)}`;
}

export function isValidSessionToken(token: string | undefined, password: string | undefined, now = Date.now()) {
  if (!token || !password || password.length < 12) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const expires = Number(parts[1]);
  if (!Number.isFinite(expires) || expires < now) return false;
  return safeEqual(parts[2], sign(password, `${parts[0]}.${parts[1]}`));
}

/** Constant-time comparison of a typed secret key against the configured one. */
export function passwordMatches(input: string, password: string) {
  const digest = (v: string) => createHmac("sha256", "studio-batik-admin/compare").update(v).digest("base64url");
  return safeEqual(digest(input), digest(password));
}
