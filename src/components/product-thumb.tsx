/* Small square photo, or the product's first letter when it has no photos yet. */
export function ProductThumb({ url, name, size }: { url: string | null; name: string; size: number }) {
  return url ? (
    // Plain <img>: thumbnails come from Supabase's CDN already sized for the admin.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" width={size} height={size} loading="lazy" className="shrink-0 rounded-lg bg-silk object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className="bg-satin grid shrink-0 place-items-center rounded-lg font-display text-xl text-brand"
      style={{ width: size, height: size }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
