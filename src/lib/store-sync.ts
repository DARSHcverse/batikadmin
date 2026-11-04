import "server-only";
import { env } from "@/lib/env";

/**
 * Tells the shop to drop its cached catalogue so changes show at once.
 * If this fails the shop still refreshes on its own within 5 minutes, so it never blocks a save.
 */
export async function refreshStore(): Promise<boolean> {
  const url = env.storeUrl();
  const secret = env.revalidateSecret();
  if (!url || !secret) return false;
  try {
    const res = await fetch(`${url}/api/revalidate`, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) console.warn(`Store refresh returned ${res.status}`);
    return res.ok;
  } catch (err) {
    console.warn("Store refresh failed:", err instanceof Error ? err.message : err);
    return false;
  }
}
