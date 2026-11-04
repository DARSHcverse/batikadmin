import "server-only";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export const BUCKET = "product-images";

type Storage = {
  /** Saves the bytes at `key` and returns the public URL the store will load. */
  put(key: string, bytes: Buffer, contentType: string): Promise<string>;
  remove(keys: string[]): Promise<void>;
};

/** Production: a public Supabase Storage bucket, served from Supabase's CDN. */
function supabaseStorage(url: string, serviceKey: string): Storage {
  const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let bucketReady: Promise<void> | null = null;

  const ensureBucket = () =>
    (bucketReady ??= (async () => {
      const { error } = await client.storage.getBucket(BUCKET);
      if (!error) return;
      const created = await client.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: "10MB",
        allowedMimeTypes: ["image/webp"],
      });
      if (created.error && !/already exists/i.test(created.error.message)) {
        bucketReady = null;
        throw new Error(`Could not create the photo bucket: ${created.error.message}`);
      }
    })());

  return {
    async put(key, bytes, contentType) {
      await ensureBucket();
      const { error } = await client.storage
        .from(BUCKET)
        .upload(key, bytes, { contentType, cacheControl: "31536000", upsert: false });
      if (error) throw new Error(`Photo upload failed: ${error.message}`);
      return client.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
    },
    async remove(keys) {
      if (keys.length === 0) return;
      const { error } = await client.storage.from(BUCKET).remove(keys);
      if (error) throw new Error(`Could not delete photos: ${error.message}`);
    },
  };
}

/** Local development only: files go in .local-uploads/ and are served by app/uploads/[...key]. */
export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".local-uploads");

export function localPathFor(key: string) {
  const full = path.resolve(LOCAL_UPLOAD_DIR, key);
  if (!full.startsWith(LOCAL_UPLOAD_DIR + path.sep)) throw new Error("Invalid photo path");
  return full;
}

const localStorage: Storage = {
  async put(key, bytes) {
    const full = localPathFor(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, bytes);
    return `${env.publicUrl()}/uploads/${key}`;
  },
  async remove(keys) {
    await Promise.all(keys.map((k) => rm(localPathFor(k), { force: true })));
  },
};

export function isLocalStorage() {
  return !(env.supabaseUrl() && env.supabaseServiceKey());
}

export function storage(): Storage {
  const url = env.supabaseUrl();
  const key = env.supabaseServiceKey();
  if (url && key) return supabaseStorage(url, key);
  if (process.env.VERCEL) {
    throw new Error("Photo storage is not set up. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.");
  }
  return localStorage;
}
