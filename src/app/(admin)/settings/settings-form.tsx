"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { saveSettings, type SettingsState } from "./actions";

export function SettingsForm(props: { ordering: boolean; showPrices: boolean; whatsapp: string }) {
  const [state, action, pending] = useActionState(saveSettings, { ok: false } as SettingsState);
  const [ordering, setOrdering] = useState(props.ordering);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!state.savedAt) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowSaved(true);
    const t = setTimeout(() => setShowSaved(false), 6000);
    return () => clearTimeout(t);
  }, [state.savedAt]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-5"
    >
      <section className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-brand" id="ordering-label">
              Online ordering
            </h2>
            <p className="mt-1 text-[15px] text-ink/70" id="ordering-desc">
              {ordering
                ? "On: customers see the bag, sizes in stock and sold-out labels."
                : "Off: the shop is a catalogue. Customers see products and their codes, and order by WhatsApp."}
            </p>
          </div>
          <label className="relative mt-1 inline-flex shrink-0 cursor-pointer items-center">
            <input
              type="checkbox"
              name="ordering"
              role="switch"
              checked={ordering}
              onChange={(e) => setOrdering(e.target.checked)}
              aria-labelledby="ordering-label"
              aria-describedby="ordering-desc"
              className="peer sr-only"
            />
            <span className="h-8 w-14 rounded-full bg-[#c9c4b8] transition-colors peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand" />
            <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform peer-checked:translate-x-6 peer-checked:bg-gold-light" />
          </label>
        </div>
        {ordering && (
          <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
            Payments aren&rsquo;t connected yet. With this on, customers can fill a bag but can&rsquo;t pay until Stripe
            checkout is added. Keep it off until then.
          </p>
        )}
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-display text-2xl text-brand">Catalogue</h2>
        <label className="flex cursor-pointer items-start gap-3 text-[15px]">
          <input type="checkbox" name="showPrices" defaultChecked={props.showPrices} className="mt-0.5 h-5 w-5 accent-[#0f1f44]" />
          <span>
            Show prices in the shop
            <span className="block text-sm text-ink/60">
              Turn off if prices change with customisation and you&rsquo;d rather quote on WhatsApp.
            </span>
          </span>
        </label>
        <div>
          <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-medium">
            WhatsApp number for enquiries
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            defaultValue={props.whatsapp}
            inputMode="tel"
            autoComplete="tel"
            placeholder="07700 900123"
            className="field max-w-xs"
            aria-invalid={state.error ? true : undefined}
            aria-describedby="whatsapp-hint"
          />
          <p id="whatsapp-hint" className="mt-1.5 text-sm text-ink/60">
            Every “Order on WhatsApp” button in the shop opens a chat with this number, with the product code already typed.
          </p>
          {state.error && (
            <p role="alert" className="mt-1.5 text-sm text-danger">
              {state.error}
            </p>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
        <p role="status" aria-live="polite" className="text-sm text-ok">
          {showSaved && state.ok ? state.message : ""}
        </p>
      </div>
    </form>
  );
}
