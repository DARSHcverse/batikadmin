"use client";

import { useTransition } from "react";
import { deleteProduct, duplicateProduct, setProductStatus } from "@/app/(admin)/products/actions";
import type { Status } from "@/lib/catalogue";

export function ProductActions({ id, name, status }: { id: string; name: string; status: Status }) {
  const [pending, start] = useTransition();
  return (
    <section className="card p-5">
      <h2 className="font-display text-2xl text-brand">More actions</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary" disabled={pending} onClick={() => start(() => duplicateProduct(id))}>
          Duplicate
        </button>
        {status === "archived" ? (
          <button type="button" className="btn btn-secondary" disabled={pending} onClick={() => start(() => setProductStatus(id, "draft"))}>
            Restore as draft
          </button>
        ) : (
          <button type="button" className="btn btn-secondary" disabled={pending} onClick={() => start(() => setProductStatus(id, "archived"))}>
            Archive
          </button>
        )}
        <button
          type="button"
          className="btn btn-danger"
          disabled={pending}
          onClick={() => {
            if (window.confirm(`Delete “${name}” and all its photos for good? Archive it instead if you might sell it again.`)) {
              start(() => deleteProduct(id));
            }
          }}
        >
          Delete
        </button>
      </div>
      <p className="mt-3 text-sm text-ink/60">
        Duplicate copies everything except photos, as a new draft with stock at 0. Archive hides it from the shop but keeps it here.
      </p>
    </section>
  );
}
