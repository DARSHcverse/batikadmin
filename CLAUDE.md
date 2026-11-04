@AGENTS.md

# Studio Batik Admin

The private back office for the Studio Batik shop. Business, brand and market context is in
`../batikuk/CLAUDE.md` — read that too. This file covers the admin app.

## What it is

- A **separate Next.js app** (Darshan wanted it apart from the shop, not at `/admin`), deployed to its own
  free `*.vercel.app` address (e.g. `studio-batik-admin.vercel.app`) for Darshan and his partner.
- Both apps share one **Supabase** database: this app writes products, stock, photos and settings;
  the shop (`../batikuk`) only reads.
- Sign-in: one shared **secret key** (`ADMIN_PASSWORD`, 12+ chars). Signed HMAC session cookie (7 days),
  checked in `src/proxy.ts` **and** in every page and server action (`requireAdmin()`), because Next 16
  proxy alone doesn't cover server actions. Wrong keys are delayed ~0.9 s. Hidden from search engines.
  Separate per-person logins and an activity log are possible later.

## Features

- Dashboard: product counts by status, low-stock sizes (≤ 2), live products without photos, current shop mode.
- Products: list with search (name/code) and filters (status, category); table on desktop, cards on phones.
- Add/edit: name, code (blank = auto: category letter + 2-digit year + number, e.g. D2604; D dresses,
  S sarees, R sarongs, T tops, K kids, A accessories, F fabric), web address (auto from name, unique),
  status (draft/active/archived), category, occasions, price in £ (stored as pence), fibre content
  (required by UK law), summary, details (one per line), care, "New in", sizes with stock (presets).
- Photos: up to 12 per product; shrunk in the browser to ≤ 3.5 MB JPEG (Vercel's request limit is 4.5 MB),
  then `sharp` makes a ≤ 2000 px WebP, auto-rotates and **strips EXIF/GPS**; reorder, set main, alt text, delete.
- Duplicate (copies everything except photos, stock 0, draft), archive/restore, delete (also deletes photo files).
- **Settings**: **Online ordering** switch (off = catalogue mode, the current business stage: customers order on
  WhatsApp with the product code; on = bag/stock UI in the shop; payments aren't built yet), **Show prices**,
  **WhatsApp number** (UK numbers like 07700 900123 are normalised to 447700900123).
- Every save calls the shop's `POST /api/revalidate` so changes show at once (shop also refreshes every 5 min).

## Structure

- `db/migrations/*.sql` (applied by `npm run db:migrate`, tracked in `_migrations`); `db/seed.sql` = the 12
  sample products (`npm run db:seed`, safe to re-run). RLS is enabled with no policies on all tables, so
  Supabase's public REST API can't touch them; both apps connect server-side with the connection string.
- `src/lib/`: `db.ts` (postgres client, `prepare: false` for Supabase's transaction pooler), `products.ts`
  (queries, next code, unique slugs), `validation.ts` (zod), `settings.ts`, `storage.ts` (Supabase Storage
  bucket `product-images`, created on first upload; local `.local-uploads/` fallback for dev only),
  `store-sync.ts`, `session.ts` / `auth.ts`, `catalogue.ts` (fixed lists mirrored in the shop).
- `src/app/(admin)/…` pages and server actions; `src/app/login`; `src/app/uploads/[...key]` serves local dev photos.

Commands: `npm run dev` (http://localhost:3001), `npm run build`, `npm run lint`, `npx tsc --noEmit`,
`npm run db:migrate`, `npm run db:seed`. Env: see `.env.example` and README (DATABASE_URL, ADMIN_PASSWORD,
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STORE_URL, REVALIDATE_SECRET, optional ADMIN_PUBLIC_URL).

## Lessons from this build

- React 19 resets `<form action={…}>` fields after every action, even on validation errors. Forms here submit
  via `onSubmit` + `startTransition(() => action(formData))` so nothing typed is lost.
- Don't `key` the edit form on `updatedAt` (it remounts and loses the "Saved" message); the status select is
  controlled and follows the server value so Archive/Restore can't be undone by the next save.
- Shared `.field` / `.btn` / `.card` styles are in `@layer components` so utilities (e.g. `pl-7`) still apply.
- Proxy matcher must exclude `brand/` and other public files, or the login page's logo is redirected.

## Verified (Nov 2026, against local Postgres 16 and both apps running)

Sign-in, forged cookie and wrong key rejection; create/edit/validation; auto codes; code clash message;
14.7 MB phone photo upload with GPS removed; reorder; alt text; sold-out sizes; archive/restore; duplicate;
delete with file clean-up; settings toggles switching the shop instantly; phone widths 320–430 px.
**Not yet verified**: real Supabase Storage uploads and the live Vercel deploys (no Supabase/Docker in the
build environment). Upload a couple of photos after the first deploy to confirm.

## To do

- Create the Supabase project (London region), run `001_products.sql` and `002_shop_settings.sql`
  (and `seed.sql` if wanted), deploy this app to Vercel with the env vars, set the same `DATABASE_URL` and
  `REVALIDATE_SECRET` in the shop's Vercel project.
- Orders/customers once Stripe checkout exists in the shop. Optional: read-only database role for the shop.
