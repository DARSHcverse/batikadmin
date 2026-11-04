import type { Metadata } from "next";
import Link from "next/link";
import { dashboardStats } from "@/lib/products";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const [stats, settings] = await Promise.all([dashboardStats(), getSettings()]);
  const tiles = [
    { label: "In the shop", value: stats.active, href: "/products?status=active" },
    { label: "Drafts", value: stats.draft, href: "/products?status=draft" },
    { label: "Archived", value: stats.archived, href: "/products?status=archived" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-brand">Dashboard</h1>
          <p className="mt-1 text-ink/70">Your catalogue at a glance.</p>
        </div>
        <Link href="/products/new" className="btn btn-primary">
          + Add product
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card p-4 transition-colors hover:border-gold-shadow sm:p-5">
            <p className="text-sm text-ink/70">{t.label}</p>
            <p className="mt-1 font-display text-4xl text-brand">{t.value}</p>
          </Link>
        ))}
      </div>

      <Link
        href="/settings"
        className="card mt-4 flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:border-gold-shadow"
      >
        <span>
          <span className="block font-medium">
            {settings.orderingEnabled ? "Online ordering is on" : "Catalogue mode: customers order on WhatsApp"}
          </span>
          <span className="text-sm text-ink/60">
            {settings.whatsappNumber ? `WhatsApp +${settings.whatsappNumber}` : "Add your WhatsApp number in Settings"}
          </span>
        </span>
        <span className="shrink-0 text-sm font-medium text-brand">Settings →</span>
      </Link>

      {stats.noPhotos > 0 && (
        <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
          {stats.noPhotos} product{stats.noPhotos === 1 ? " is" : "s are"} live without photos, so the shop shows
          placeholder art for {stats.noPhotos === 1 ? "it" : "them"}.{" "}
          <Link href="/products?status=active" className="font-medium underline underline-offset-4">
            Add photos
          </Link>
        </p>
      )}

      <section className="card mt-8 overflow-hidden">
        <h2 className="border-b border-line px-5 py-4 font-display text-2xl text-brand">Low on stock</h2>
        {stats.lowStock.length === 0 ? (
          <p className="px-5 py-6 text-ink/70">Nothing is running low. Every live size has 3 or more in stock.</p>
        ) : (
          <ul className="divide-y divide-line">
            {stats.lowStock.map((r) => (
              <li key={`${r.id}-${r.label}`}>
                <Link href={`/products/${r.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-canvas">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{r.name}</span>
                    <span className="text-sm text-ink/60">
                      {r.code} · size {r.label}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-sm font-medium ${
                      r.stock === 0 ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn"
                    }`}
                  >
                    {r.stock === 0 ? "Sold out" : `${r.stock} left`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
