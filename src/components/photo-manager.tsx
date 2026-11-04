"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  deleteProductImage,
  reorderProductImages,
  updateImageAlt,
  uploadProductImage,
} from "@/app/(admin)/products/actions";

type Photo = { id: string; url: string; alt: string; width: number; height: number };
type Job = { name: string; status: "waiting" | "uploading" | "done" | "error"; error?: string };

const MAX_EDGE = 2400;
const MAX_BYTES = 3.5 * 1024 * 1024; // stays under Vercel's 4.5 MB request limit

/**
 * Phone photos are often 5–12 MB. Shrinking them in the browser first keeps uploads fast
 * and within Vercel's limit; the server then makes the final WebP and strips location data.
 */
async function prepare(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This browser can't open that photo type. Save it as JPEG and try again.");
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.9, 0.82, 0.72, 0.6]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (blob && blob.size <= MAX_BYTES) return blob;
  }
  throw new Error("That photo is too detailed to upload. Try a smaller version.");
}

export function PhotoManager({ productId, productName, photos }: { productId: string; productName: string; photos: Photo[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const [dragging, setDragging] = useState(false);

  async function upload(files: File[]) {
    const isPhoto = (f: File) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name);
    const list = files.filter(isPhoto);
    const skipped: Job[] = files
      .filter((f) => !isPhoto(f))
      .map((f) => ({ name: f.name, status: "error", error: "Not a photo, so it was skipped." }));
    if (list.length === 0) {
      setJobs(skipped);
      return;
    }
    setBusy(true);
    setJobs([...list.map((f): Job => ({ name: f.name, status: "waiting" })), ...skipped]);
    for (const [i, file] of list.entries()) {
      setJobs((js) => js.map((j, k) => (k === i ? { ...j, status: "uploading" } : j)));
      try {
        const blob = await prepare(file);
        const fd = new FormData();
        fd.append("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        fd.append("alt", productName);
        const res = await uploadProductImage(productId, fd);
        if (!res.ok) throw new Error(res.error);
        setJobs((js) => js.map((j, k) => (k === i ? { ...j, status: "done" } : j)));
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        setJobs((js) => js.map((j, k) => (k === i ? { ...j, status: "error", error: msg } : j)));
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  function move(index: number, to: number) {
    const ids = photos.map((p) => p.id);
    const [item] = ids.splice(index, 1);
    ids.splice(to, 0, item);
    startTransition(async () => {
      await reorderProductImages(productId, ids);
      router.refresh();
    });
  }

  function remove(photo: Photo, index: number) {
    if (!window.confirm(`Delete photo ${index + 1}? This can't be undone.`)) return;
    startTransition(async () => {
      await deleteProductImage(photo.id);
      router.refresh();
    });
  }

  const failed = jobs.filter((j) => j.status === "error");
  const done = jobs.filter((j) => j.status === "done").length;

  return (
    <section className="card p-5" aria-busy={busy || pending}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl text-brand">Photos</h2>
        <p className="text-sm text-ink/60">The first photo is the main one in the shop. Up to 12.</p>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) upload(Array.from(e.dataTransfer.files));
        }}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors ${
          dragging ? "border-brand bg-silk" : "border-[#d6cfbf] hover:border-gold-shadow hover:bg-silk/60"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <span className="font-medium text-brand">{busy ? "Uploading…" : "Add photos"}</span>
        <span className="mt-1 text-sm text-ink/60">Tap to choose or take photos, or drag them here. JPEG, PNG or WebP.</span>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          disabled={busy}
          className="sr-only"
          onChange={(e) => upload(Array.from(e.target.files ?? []))}
        />
      </label>

      {jobs.length > 0 && (
        <div role="status" aria-live="polite" className="mt-3 text-sm">
          {busy ? (
            <p className="text-ink/70">
              Uploading {Math.min(done + failed.length + 1, jobs.length)} of {jobs.length}…
            </p>
          ) : (
            done > 0 && <p className="text-ok">{done} photo{done === 1 ? "" : "s"} added.</p>
          )}
          {failed.map((j) => (
            <p key={j.name} className="text-danger">
              {j.name}: {j.error}
            </p>
          ))}
        </div>
      )}

      {photos.length === 0 ? (
        <p className="mt-4 text-sm text-ink/70">
          No photos yet. Until you add some, the shop shows a batik pattern in their place.
        </p>
      ) : (
        <ol className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((p, i) => (
            <li key={p.id} className="overflow-hidden rounded-xl border border-line bg-white">
              <div className="relative aspect-[4/5] bg-silk">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.alt} className="h-full w-full object-cover" loading="lazy" />
                {i === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-gold-light">
                    Main photo
                  </span>
                )}
              </div>
              <div className="space-y-2 p-2.5">
                <label className="block">
                  <span className="sr-only">Description of photo {i + 1} for screen readers</span>
                  <input
                    defaultValue={p.alt}
                    maxLength={200}
                    placeholder="Describe the photo"
                    className="field !py-1.5 text-sm"
                    onBlur={(e) => {
                      const v = e.target.value;
                      if (v !== p.alt) startTransition(() => updateImageAlt(p.id, v));
                    }}
                  />
                </label>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex gap-1">
                    <IconButton label={`Move photo ${i + 1} earlier`} disabled={i === 0 || pending} onClick={() => move(i, i - 1)}>
                      ←
                    </IconButton>
                    <IconButton
                      label={`Move photo ${i + 1} later`}
                      disabled={i === photos.length - 1 || pending}
                      onClick={() => move(i, i + 1)}
                    >
                      →
                    </IconButton>
                  </div>
                  {i > 0 && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => move(i, 0)}
                      className="rounded-full px-2 py-1 text-xs font-medium text-brand underline-offset-4 hover:underline"
                    >
                      Make main
                    </button>
                  )}
                  <IconButton label={`Delete photo ${i + 1}`} danger disabled={pending} onClick={() => remove(p, i)}>
                    🗑
                  </IconButton>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function IconButton({
  label,
  children,
  danger,
  ...rest
}: { label: string; danger?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 place-items-center rounded-full border border-line text-base disabled:opacity-30 ${
        danger ? "hover:border-danger hover:bg-danger-soft" : "hover:border-brand"
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}
