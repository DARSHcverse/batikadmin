-- Studio Batik catalogue: products, sizes with stock, and photos.
-- The admin app writes these tables; the store only reads active products.

create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique
              check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  code        text not null unique
              check (code ~ '^[A-Z0-9][A-Z0-9-]{1,19}$'),
  name        text not null check (char_length(name) between 2 and 120),
  category    text not null
              check (category in ('dresses','sarees','sarongs','tops','kids','accessories','fabric')),
  occasions   text[] not null default '{}'
              check (occasions <@ array['avurudu','deepavali','eid','gifts','summer','temple']),
  price_pence integer not null check (price_pence between 0 and 10000000),
  fibre       text not null check (char_length(fibre) between 2 and 120),
  summary     text not null default '' check (char_length(summary) <= 600),
  details     text[] not null default '{}',
  care        text not null default '' check (char_length(care) <= 1000),
  is_new      boolean not null default false,
  status      text not null default 'draft' check (status in ('draft','active','archived')),
  -- Colours for the generated placeholder art shown when a product has no photos yet
  palette     text[] check (palette is null or cardinality(palette) = 3),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_status_created_idx on products (status, created_at desc);
create index if not exists products_category_idx on products (category);

create table if not exists product_sizes (
  product_id uuid not null references products(id) on delete cascade,
  label      text not null check (char_length(label) between 1 and 20),
  stock      integer not null default 0 check (stock between 0 and 100000),
  position   integer not null default 0,
  primary key (product_id, label)
);

create table if not exists product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  storage_path text not null unique,
  url          text not null,
  alt          text not null default '' check (char_length(alt) <= 200),
  width        integer not null check (width > 0),
  height       integer not null check (height > 0),
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists product_images_product_idx on product_images (product_id, position);

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at before update on products
  for each row execute function set_updated_at();

-- Both apps connect with the database connection string (server side only), which bypasses
-- row level security. Turning RLS on with no policies blocks Supabase's public REST API from
-- these tables, so the anon key can never read or change the catalogue.
alter table products enable row level security;
alter table product_sizes enable row level security;
alter table product_images enable row level security;
