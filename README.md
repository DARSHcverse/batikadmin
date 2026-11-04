# Studio Batik Admin

The private back office for the Studio Batik shop. Add and edit products, set prices and stock per size,
and upload photos. Changes appear in the shop straight away.

It is a separate Next.js app from the shop (`../studio-batik`). Both use the same Supabase database:
this app writes to it, the shop only reads from it.

| | |
|---|---|
| Sign in | One shared secret key (`ADMIN_PASSWORD`) |
| Products | Name, code, price, fibre, description, details, care, category, occasions, New in label, status |
| Stock | Per size, with quick-fill presets (UK 8–20, S–XL, One size, kids' ages, metres) |
| Photos | Up to 12 per product. Phone photos are shrunk in the browser, saved as WebP, and their location data is removed |
| Status | Active (in the shop), Draft (hidden), Archived (hidden, kept for records) |
| Settings | **Online ordering** switch (off = catalogue mode: customers order on WhatsApp with the product code), show prices, WhatsApp number |
| Other | Search and filters, duplicate, delete, low-stock list on the dashboard |

## One-time setup

### 1. Supabase (database and photo storage)

1. Create a project at [supabase.com](https://supabase.com). Choose the **London (eu-west-2)** region.
2. In **SQL Editor**, paste and run `db/migrations/001_products.sql`, then `db/migrations/002_shop_settings.sql`,
   then `db/seed.sql` if you want the 12 sample products. (Or run `npm run db:migrate` and `npm run db:seed` once `.env.local` is set.)
3. Collect these values:
   - **Project Settings → Database → Connection string → Transaction pooler** (port 6543), with your database
     password filled in. This is `DATABASE_URL`.
   - **Project Settings → API**: the Project URL (`SUPABASE_URL`) and the `service_role` key
     (`SUPABASE_SERVICE_ROLE_KEY`). Keep the service_role key secret. It belongs in this admin app only,
     never in the shop.

The photo bucket (`product-images`, public) is created automatically on the first upload.

### 2. Run it on your Mac

```bash
cd ~/Downloads/studio-batik-admin
cp .env.example .env.local      # then fill in the values
npm install
npm run dev                     # http://localhost:3001
```

Run the shop at the same time in another terminal (`cd ../studio-batik && npm run dev`, http://localhost:3000)
and set `STORE_URL=http://localhost:3000` here so saves refresh it.

Without the two Supabase storage settings, photos are kept in `.local-uploads/` on your Mac for testing.

### 3. Put it online on Vercel (free `.vercel.app` address)

1. Push this folder to its own GitHub repository (separate from the shop).
2. In Vercel: **Add New → Project**, import that repository. Name it, for example, `studio-batik-admin`.
   The address will then be `https://studio-batik-admin.vercel.app`.
3. Before the first deploy, add these under **Settings → Environment Variables**:
   `DATABASE_URL`, `ADMIN_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STORE_URL`, `REVALIDATE_SECRET`.
4. Deploy, then sign in with the secret key and open **Settings** to add your WhatsApp number.

In the **shop's** Vercel project, add `DATABASE_URL` (the same connection string) and `REVALIDATE_SECRET`
(the same value as here), then redeploy the shop.

## Settings

| Name | What it is |
|---|---|
| `DATABASE_URL` | Supabase transaction pooler connection string |
| `ADMIN_PASSWORD` | The secret key for signing in. 12+ characters; use a long passphrase. Changing it signs everyone out |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Photo storage |
| `STORE_URL` | The shop's address, e.g. `https://studiobatik.co.uk` |
| `REVALIDATE_SECRET` | Any long random string, identical in both apps. Generate one with `openssl rand -hex 32` |

## Security notes

- Every page and every save checks the sign-in cookie on the server. Signed-out visitors only ever see the sign-in page.
- The admin is hidden from search engines (`robots.txt` and `noindex`).
- Database tables have row level security switched on with no public policies, so Supabase's public API can't
  read or change them. Both apps connect with the database connection string on the server only.
- Wrong secret keys are slowed down, but the length of the key is the real protection. Use something like
  `four random words and a number`, not a short password.
- Everyone shares one key. When staff change, change `ADMIN_PASSWORD` in Vercel and redeploy.

## Changing categories or occasions

They are fixed lists checked by the database. To add one, change `src/lib/catalogue.ts` here,
`src/lib/catalogue.ts` in the shop, and add a migration that updates the check constraint in `products`.

## Not built yet

- Orders, customers and payments: these come with Stripe Checkout in the shop.
- Separate logins per person, and an activity log of who changed what.
