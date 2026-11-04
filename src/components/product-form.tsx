"use client";

import { startTransition, useActionState, useEffect, useId, useState } from "react";
import { saveProduct, type FormState } from "@/app/(admin)/products/actions";
import { CATEGORIES, OCCASIONS, SIZE_PRESETS, STATUSES, type Category, type Occasion, type Status } from "@/lib/catalogue";

export type ProductFormValues = {
  id?: string;
  name: string;
  code: string;
  slug: string;
  status: Status;
  category: Category | "";
  occasions: Occasion[];
  price: string;
  fibre: string;
  summary: string;
  details: string;
  care: string;
  isNew: boolean;
  sizes: { label: string; stock: number | "" }[];
};

const initial: FormState = { ok: false };

function slugPreview(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductForm({ values, storeUrl }: { values: ProductFormValues; storeUrl: string }) {
  const [state, action, pending] = useActionState(saveProduct, initial);
  const [name, setName] = useState(values.name);
  const [slug, setSlug] = useState(values.slug);
  const [category, setCategory] = useState<Category | "">(values.category);
  const [sizes, setSizes] = useState(values.sizes.length ? values.sizes : [{ label: "One size", stock: 0 as number | "" }]);
  const [status, setStatus] = useState<Status>(values.status);
  const [showSaved, setShowSaved] = useState(false);

  // Archive / Restore on the same page change the status outside this form; follow them so
  // the next save doesn't put the old status back.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(values.status);
  }, [values.status]);
  const err = state.errors ?? {};

  useEffect(() => {
    if (!state.savedAt) return;
    // Show the "Saved" note for a few seconds after each successful save.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowSaved(true);
    const t = setTimeout(() => setShowSaved(false), 6000);
    return () => clearTimeout(t);
  }, [state.savedAt]);

  const prefix = CATEGORIES.find((c) => c.slug === category)?.codePrefix;
  const yy = String(new Date().getFullYear()).slice(-2);
  const publicSlug = slug || slugPreview(name);

  return (
    <form
      noValidate
      // Submitting by hand (not action={…}) stops React resetting the fields after a save,
      // so nothing typed is lost when the server sends back an error.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="grid gap-5 lg:grid-cols-[1fr_300px] lg:items-start"
    >
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input
        type="hidden"
        name="sizes"
        value={JSON.stringify(sizes.map((s) => ({ label: s.label, stock: s.stock === "" ? 0 : s.stock })))}
      />

      <div className="space-y-5">
        {state.message && !state.ok && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {state.message}
          </p>
        )}

        <section className="card space-y-4 p-5">
          <Field label="Product name" error={err.name} required>
            {(id, describedBy) => (
              <input
                id={id}
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                placeholder="e.g. Kandy wrap midi dress"
                className="field"
                aria-invalid={err.name ? true : undefined}
                aria-describedby={describedBy}
              />
            )}
          </Field>

          <Field label="Short description" hint="One or two sentences shown under the price." error={err.summary}>
            {(id, describedBy) => (
              <textarea
                id={id}
                name="summary"
                defaultValue={values.summary}
                rows={3}
                maxLength={600}
                className="field"
                aria-describedby={describedBy}
              />
            )}
          </Field>

          <Field label="Details" hint="One point per line, e.g. “Tie waist, flutter sleeve”." error={err.details}>
            {(id, describedBy) => (
              <textarea
                id={id}
                name="details"
                defaultValue={values.details}
                rows={4}
                className="field"
                aria-describedby={describedBy}
              />
            )}
          </Field>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="font-display text-2xl text-brand">Price and fabric</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price" hint="In pounds, including VAT if you charge it." error={err.price} required>
              {(id, describedBy) => (
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink/60">£</span>
                  <input
                    id={id}
                    name="price"
                    defaultValue={values.price}
                    inputMode="decimal"
                    placeholder="49.00"
                    className="field pl-7"
                    aria-invalid={err.price ? true : undefined}
                    aria-describedby={describedBy}
                  />
                </div>
              )}
            </Field>
            <Field label="Fibre content" hint="Required by UK law, e.g. 100% cotton." error={err.fibre} required>
              {(id, describedBy) => (
                <input
                  id={id}
                  name="fibre"
                  defaultValue={values.fibre}
                  list="fibre-suggestions"
                  placeholder="100% cotton"
                  className="field"
                  aria-invalid={err.fibre ? true : undefined}
                  aria-describedby={describedBy}
                />
              )}
            </Field>
          </div>
          <datalist id="fibre-suggestions">
            <option value="100% cotton" />
            <option value="100% viscose" />
            <option value="100% silk" />
            <option value="100% linen" />
            <option value="60% viscose, 40% cotton" />
          </datalist>
          <Field label="Care instructions" hint="Optional. Leave blank to use the standard batik care advice." error={err.care}>
            {(id, describedBy) => (
              <textarea id={id} name="care" defaultValue={values.care} rows={2} maxLength={1000} className="field" aria-describedby={describedBy} />
            )}
          </Field>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-2xl text-brand">Sizes and stock</h2>
          <p className="mt-1 text-sm text-ink/70">A size with 0 in stock shows as sold out in the shop.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="self-center text-sm text-ink/70">Quick fill:</span>
            {Object.entries(SIZE_PRESETS).map(([label, list]) => (
              <button
                key={label}
                type="button"
                className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-brand"
                onClick={() => setSizes(list.map((l) => ({ label: l, stock: sizes.find((s) => s.label === l)?.stock ?? 0 })))}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-[1fr_7rem_2.75rem] gap-2 text-sm text-ink/70">
              <span>Size</span>
              <span>In stock</span>
              <span className="sr-only">Remove</span>
            </div>
            {sizes.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_7rem_2.75rem] gap-2">
                <input
                  aria-label={`Size ${i + 1} name`}
                  value={s.label}
                  maxLength={20}
                  onChange={(e) => setSizes(sizes.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                  className="field"
                />
                <input
                  aria-label={`Stock for size ${s.label || i + 1}`}
                  value={s.stock}
                  inputMode="numeric"
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setSizes(sizes.map((x, j) => (j === i ? { ...x, stock: v === "" ? "" : Number(v) } : x)));
                  }}
                  className="field tabular-nums"
                />
                <button
                  type="button"
                  aria-label={`Remove size ${s.label || i + 1}`}
                  disabled={sizes.length === 1}
                  onClick={() => setSizes(sizes.filter((_, j) => j !== i))}
                  className="grid h-11 w-11 place-items-center rounded-full text-xl text-ink/60 hover:bg-danger-soft hover:text-danger disabled:opacity-30"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {err.sizes && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {err.sizes}
            </p>
          )}
          <button
            type="button"
            className="mt-3 text-sm font-medium text-brand underline underline-offset-4"
            onClick={() => setSizes([...sizes, { label: "", stock: 0 }])}
          >
            + Add a size
          </button>
        </section>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-6">
        <section className="card space-y-3 p-5">
          <Field label="Status" error={err.status}>
            {(id) => (
              <select id={id} name="status" value={status} onChange={(e) => setStatus(e.target.value as Status)} className="field">
                {STATUSES.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.label} — {s.hint}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <label className="flex cursor-pointer items-center gap-3 text-[15px]">
            <input type="checkbox" name="isNew" defaultChecked={values.isNew} className="h-5 w-5 accent-[#0f1f44]" />
            Show a “New in” label
          </label>
        </section>

        <section className="card space-y-4 p-5">
          <Field label="Category" error={err.category} required>
            {(id, describedBy) => (
              <select
                id={id}
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="field"
                aria-invalid={err.category ? true : undefined}
                aria-describedby={describedBy}
              >
                <option value="" disabled>
                  Choose…
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Occasions</legend>
            <div className="grid grid-cols-2 gap-2">
              {OCCASIONS.map((o) => (
                <label key={o.slug} className="flex cursor-pointer items-center gap-2 text-[15px]">
                  <input
                    type="checkbox"
                    name="occasions"
                    value={o.slug}
                    defaultChecked={values.occasions.includes(o.slug)}
                    className="h-5 w-5 accent-[#0f1f44]"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>

          <Field
            label="Product code"
            hint={values.id ? "Customers quote this on WhatsApp." : `Leave blank to get the next one${prefix ? `, e.g. ${prefix}${yy}01` : ""}.`}
            error={err.code}
          >
            {(id, describedBy) => (
              <input
                id={id}
                name="code"
                defaultValue={values.code}
                maxLength={20}
                autoCapitalize="characters"
                placeholder={prefix ? `${prefix}${yy}…` : "Auto"}
                className="field uppercase"
                aria-invalid={err.code ? true : undefined}
                aria-describedby={describedBy}
              />
            )}
          </Field>

          <Field
            label="Web address"
            hint={publicSlug ? `${storeUrl ? new URL(storeUrl).host : "shop"}/product/${publicSlug}` : "Made from the name."}
            error={err.slug}
          >
            {(id, describedBy) => (
              <input
                id={id}
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                maxLength={80}
                placeholder={slugPreview(name) || "made-from-the-name"}
                className="field"
                aria-invalid={err.slug ? true : undefined}
                aria-describedby={describedBy}
              />
            )}
          </Field>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
          <div className="mx-auto flex max-w-6xl items-center gap-3 lg:block">
            <button type="submit" className="btn btn-primary w-full" disabled={pending}>
              {pending ? "Saving…" : values.id ? "Save changes" : "Save product"}
            </button>
            <p role="status" aria-live="polite" className="text-sm text-ok lg:mt-2 lg:text-center">
              {showSaved && state.ok ? state.message : ""}
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (id: string, describedBy: string | undefined) => React.ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children(id, describedBy)}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="mt-1.5 break-words text-sm text-ink/60">
          {hint}
        </p>
      )}
    </div>
  );
}
