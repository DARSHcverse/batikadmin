import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/product-form";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Add product" };

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/products" className="text-sm text-ink/60 hover:text-ink">
        ← Products
      </Link>
      <h1 className="mt-2 font-display text-4xl text-brand">Add product</h1>
      <p className="mt-1 text-ink/70">Save it first, then add photos on the next screen.</p>
      <div className="mt-6">
        <ProductForm
          storeUrl={env.storeUrl()}
          values={{
            name: "",
            code: "",
            slug: "",
            status: "draft",
            category: "",
            occasions: [],
            price: "",
            fibre: "100% cotton",
            summary: "",
            details: "",
            care: "",
            isNew: true,
            sizes: [{ label: "One size", stock: 0 }],
          }}
        />
      </div>
    </div>
  );
}
