import { readFile } from "node:fs/promises";
import { isLocalStorage, localPathFor } from "@/lib/storage";

// Serves photos saved by the local development storage. Disabled once Supabase is configured.
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (!isLocalStorage() || process.env.VERCEL) return new Response("Not found", { status: 404 });
  const key = (await params).key.join("/");
  if (!/^products\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/.test(key)) return new Response("Not found", { status: 404 });
  try {
    const bytes = await readFile(localPathFor(key));
    return new Response(new Uint8Array(bytes), {
      headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
