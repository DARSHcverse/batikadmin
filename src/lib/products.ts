import "server-only";
import { db } from "@/lib/db";
import type { Category, Occasion, Status } from "@/lib/catalogue";

export type SizeRow = { label: string; stock: number };
export type ImageRow = { id: string; url: string; alt: string; width: number; height: number; position: number };

export type ProductRow = {
  id: string;
  slug: string;
  code: string;
  name: string;
  category: Category;
  occasions: Occasion[];
  pricePence: number;
  fibre: string;
  summary: string;
  details: string[];
  care: string;
  isNew: boolean;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductWithExtras = ProductRow & { sizes: SizeRow[]; images: ImageRow[] };

export type ProductListItem = ProductRow & {
  thumbUrl: string | null;
  totalStock: number;
  sizeCount: number;
  imageCount: number;
};

const productColumns = (sql: ReturnType<typeof db>) => sql`
  p.id, p.slug, p.code, p.name, p.category, p.occasions,
  p.price_pence as "pricePence", p.fibre, p.summary, p.details, p.care,
  p.is_new as "isNew", p.status, p.created_at as "createdAt", p.updated_at as "updatedAt"
`;

export async function listProducts(filters: { q?: string; status?: string; category?: string }) {
  const sql = db();
  const q = filters.q?.trim();
  const like = q ? `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%` : null;
  return sql<ProductListItem[]>`
    select ${productColumns(sql)},
      (select url from product_images i where i.product_id = p.id order by position, created_at limit 1) as "thumbUrl",
      coalesce((select sum(stock)::int from product_sizes s where s.product_id = p.id), 0) as "totalStock",
      (select count(*)::int from product_sizes s where s.product_id = p.id) as "sizeCount",
      (select count(*)::int from product_images i where i.product_id = p.id) as "imageCount"
    from products p
    where true
      ${like ? sql`and (p.name ilike ${like} or p.code ilike ${like})` : sql``}
      ${filters.status ? sql`and p.status = ${filters.status}` : sql`and p.status <> 'archived'`}
      ${filters.category ? sql`and p.category = ${filters.category}` : sql``}
    order by p.updated_at desc
    limit 500
  `;
}

export async function getProduct(id: string): Promise<ProductWithExtras | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const sql = db();
  const [product] = await sql<ProductRow[]>`select ${productColumns(sql)} from products p where p.id = ${id}`;
  if (!product) return null;
  const [sizes, images] = await Promise.all([
    sql<SizeRow[]>`select label, stock from product_sizes where product_id = ${id} order by position, label`,
    sql<ImageRow[]>`
      select id, url, alt, width, height, position from product_images
      where product_id = ${id} order by position, created_at`,
  ]);
  return { ...product, sizes, images };
}

export async function dashboardStats() {
  const sql = db();
  const [counts] = await sql<{ active: number; draft: number; archived: number; noPhotos: number }[]>`
    select
      count(*) filter (where status = 'active')::int as active,
      count(*) filter (where status = 'draft')::int as draft,
      count(*) filter (where status = 'archived')::int as archived,
      count(*) filter (where status = 'active'
        and not exists (select 1 from product_images i where i.product_id = p.id))::int as "noPhotos"
    from products p
  `;
  const lowStock = await sql<{ id: string; name: string; code: string; label: string; stock: number }[]>`
    select p.id, p.name, p.code, s.label, s.stock
    from product_sizes s join products p on p.id = s.product_id
    where p.status = 'active' and s.stock <= 2
    order by s.stock, p.name, s.position
    limit 12
  `;
  return { ...counts, lowStock };
}

/** Next free code for a category, e.g. D2604: category letter, two-digit year, running number. */
export async function nextProductCode(prefix: string) {
  const sql = db();
  const year = String(new Date().getFullYear()).slice(-2);
  const start = `${prefix}${year}`;
  const [row] = await sql<{ max: number | null }[]>`
    select max(substring(code from ${`^${start}([0-9]+)$`})::int) as max
    from products where code like ${`${start}%`}
  `;
  return `${start}${String((row?.max ?? 0) + 1).padStart(2, "0")}`;
}

export function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
}

/** Returns `base`, or `base-2`, `base-3`… if another product already uses it. */
export async function uniqueSlug(base: string, exceptId?: string) {
  const sql = db();
  const taken = new Set(
    (
      await sql<{ slug: string }[]>`
        select slug from products
        where (slug = ${base} or slug like ${`${base}-%`})
          ${exceptId ? sql`and id <> ${exceptId}` : sql``}
      `
    ).map((r) => r.slug),
  );
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
}
