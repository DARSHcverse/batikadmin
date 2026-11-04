-- Shop-wide switches managed on the admin Settings page. Exactly one row.
create table if not exists shop_settings (
  id               boolean primary key default true check (id),
  -- Off = catalogue mode: products and codes only, customers order on WhatsApp.
  -- On  = the bag, stock badges and (once Stripe is added) checkout appear in the shop.
  ordering_enabled boolean not null default false,
  show_prices      boolean not null default true,
  -- Digits only with country code, e.g. 447700900123. Empty = use the number in the shop's site.ts.
  whatsapp_number  text not null default '' check (whatsapp_number ~ '^([0-9]{10,15})?$'),
  updated_at       timestamptz not null default now()
);

insert into shop_settings (id) values (true) on conflict (id) do nothing;

drop trigger if exists shop_settings_set_updated_at on shop_settings;
create trigger shop_settings_set_updated_at before update on shop_settings
  for each row execute function set_updated_at();

alter table shop_settings enable row level security;
