import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidSessionToken, SESSION_COOKIE } from "@/lib/session";

/**
 * Every admin page and server action calls this. proxy.ts also blocks signed-out visitors,
 * but server actions must check for themselves (see Next.js data security guide).
 */
export async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!isValidSessionToken(token, process.env.ADMIN_PASSWORD)) redirect("/login");
}
