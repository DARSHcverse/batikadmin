import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoManager } from "@/components/photo-manager";
import { ProductActions } from "@/components/product-actions";
import { ProductForm } from "@/components/product-form";
import { StatusBadge } from "@/components/status-badge";
import { env } from "@/lib/env";
import { formatWhen, penceToInput } from "@/lib/format";
import { getProduct } from "@/lib/products";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; duplicated?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).id);
  return { title: p?.name ?? "Product" };
}

export default async function EditProductPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const p = await getProduct(id);
  if (!p) notFound();
  const storeUrl = env.storeUrl();

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/products" className="text-sm text-ink/60 hover:text-ink">
        ← Products
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="font-display text-4xl text-brand">{p.name}</h1>
        <StatusBadge status={p.status} />
      </div>
      <p className="mt-1 text-sm text-ink/60">
        {p.code} · last saved {formatWhen(p.updatedAt)}
        {p.status === "active" && storeUrl && (
          <>
            {" · "}
            <a href={`${storeUrl}/product/${p.slug}`} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              View in shop ↗
            </a>
          </>
        )}
      </p>

      {(sp.created || sp.duplicated) && (
        <p role="status" className="mt-4 rounded-xl bg-ok-soft px-4 py-3 text-sm text-ok">
          {sp.created
            ? "Product saved. Now add photos below."
            : "Copy created as a draft. Change the name and stock, add photos, then set it to Active."}
        </p>
      )}

      <div className="mt-6 space-y-5">
        <PhotoManager
          productId={p.id}
          productName={p.name}
          photos={p.images.map(({ id, url, alt, width, height }) => ({ id, url, alt, width, height }))}
        />
        <ProductForm
          storeUrl={storeUrl}
          values={{
            id: p.id,
            name: p.name,
            code: p.code,
            slug: p.slug,
            status: p.status,
            category: p.category,
            occasions: p.occasions,
            price: penceToInput(p.pricePence),
            fibre: p.fibre,
            summary: p.summary,
            details: p.details.join("\n"),
            care: p.care,
            isNew: p.isNew,
            sizes: p.sizes,
          }}
        />
        <ProductActions id={p.id} name={p.name} status={p.status} />
      </div>
    </div>
  );
}
