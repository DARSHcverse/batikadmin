import type { Metadata } from "next";
import Link from "next/link";
import { ProductThumb } from "@/components/product-thumb";
import { StatusBadge } from "@/components/status-badge";
import { CATEGORIES, categoryLabel, STATUSES } from "@/lib/catalogue";
import { formatPence } from "@/lib/format";
import { listProducts } from "@/lib/products";

export const metadata: Metadata = { title: "Products" };

type Search = Promise<{ q?: string; status?: string; category?: string; deleted?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const status = STATUSES.some((s) => s.slug === sp.status) ? sp.status : undefined;
  const category = CATEGORIES.some((c) => c.slug === sp.category) ? sp.category : undefined;
  const q = sp.q?.slice(0, 80);
  const products = await listProducts({ q, status, category });
  const filtered = Boolean(q || status || category);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl text-brand">Products</h1>
        <Link href="/products/new" className="btn btn-primary">
          + Add product
        </Link>
      </div>

      {sp.deleted && (
        <p role="status" className="mt-4 rounded-xl bg-ok-soft px-4 py-3 text-sm text-ok">
          Product deleted.
        </p>
      )}

      <form className="mt-6 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <label className="sr-only" htmlFor="q">
          Search by name or code
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Search by name or code" className="field" />
        <label className="sr-only" htmlFor="status">
          Status
        </label>
        <select id="status" name="status" defaultValue={status ?? ""} className="field sm:w-40">
          <option value="">Active & drafts</option>
          {STATUSES.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="category">
          Category
        </label>
        <select id="category" name="category" defaultValue={category ?? ""} className="field sm:w-52">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
        <button className="btn btn-secondary">Filter</button>
      </form>

      <p className="mt-4 text-sm text-ink/60">
        {products.length} product{products.length === 1 ? "" : "s"}
        {filtered && (
          <>
            {" · "}
            <Link href="/products" className="underline underline-offset-4">
              Clear filters
            </Link>
          </>
        )}
      </p>

      {products.length === 0 ? (
        <div className="card mt-4 px-6 py-12 text-center">
          <p className="font-display text-2xl text-brand">{filtered ? "No matches" : "No products yet"}</p>
          <p className="mt-2 text-ink/70">
            {filtered ? "Try a different search or filter." : "Add your first piece and it will appear in the shop."}
          </p>
          {!filtered && (
            <Link href="/products/new" className="btn btn-primary mt-5">
              + Add product
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Phones: cards */}
          <ul className="mt-3 space-y-2 md:hidden">
            {products.map((p) => (
              <li key={p.id}>
                <Link href={`/products/${p.id}`} className="card flex items-center gap-3 p-3">
                  <ProductThumb url={p.thumbUrl} name={p.name} size={64} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="mt-0.5 block text-sm text-ink/60">
                      {p.code} · {formatPence(p.pricePence)}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-sm">
                      <StatusBadge status={p.status} />
                      <Stock total={p.totalStock} />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Larger screens: table */}
          <div className="card mt-3 hidden overflow-hidden md:block">
            <table className="w-full text-left text-[15px]">
              <thead className="border-b border-line bg-canvas text-sm text-ink/70">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-canvas">
                    <td className="px-4 py-2.5">
                      <Link href={`/products/${p.id}`} className="flex items-center gap-3">
                        <ProductThumb url={p.thumbUrl} name={p.name} size={48} />
                        <span className="min-w-0">
                          <span className="block font-medium hover:underline">{p.name}</span>
                          <span className="text-sm text-ink/60">{p.code}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-2.5 text-ink/80">{categoryLabel(p.category)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatPence(p.pricePence)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Stock total={p.totalStock} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Stock({ total }: { total: number }) {
  return total === 0 ? (
    <span className="font-medium text-danger">Sold out</span>
  ) : (
    <span className="tabular-nums text-ink/80">{total} in stock</span>
  );
}
