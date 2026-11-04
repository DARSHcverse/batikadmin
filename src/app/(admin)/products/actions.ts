"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp, { type OutputInfo } from "sharp";
import { requireAdmin } from "@/lib/auth";
import { CATEGORIES } from "@/lib/catalogue";
import { db, uniqueViolation } from "@/lib/db";
import { nextProductCode, slugify, uniqueSlug } from "@/lib/products";
import { storage } from "@/lib/storage";
import { refreshStore } from "@/lib/store-sync";
import { productInput, readProductForm } from "@/lib/validation";

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<string, string>>;
  savedAt?: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function changed(id?: string) {
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/products/${id}`);
  return refreshStore();
}

export async function saveProduct(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const idRaw = String(form.get("id") ?? "");
  const id = idRaw && UUID.test(idRaw) ? idRaw : null;

  const parsed = productInput.safeParse(readProductForm(form));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      errors[key] ??= issue.message;
    }
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }
  const input = parsed.data;
  const sql = db();

  const prefix = CATEGORIES.find((c) => c.slug === input.category)!.codePrefix;
  const code = input.code || (await nextProductCode(prefix));
  const slug = input.slug || (await uniqueSlug(slugify(input.name) || code.toLowerCase(), id ?? undefined));

  let savedId = id;
  try {
    savedId = await sql.begin(async (tx) => {
      const values = {
        slug,
        code,
        name: input.name,
        category: input.category,
        occasions: input.occasions,
        price_pence: input.price,
        fibre: input.fibre,
        summary: input.summary,
        details: input.details,
        care: input.care,
        is_new: input.isNew,
        status: input.status,
      };
      let pid: string;
      if (id) {
        const rows = await tx`update products set ${tx(values)} where id = ${id} returning id`;
        if (rows.length === 0) throw new Error("NOT_FOUND");
        pid = rows[0].id as string;
        await tx`delete from product_sizes where product_id = ${pid}`;
      } else {
        const rows = await tx`insert into products ${tx(values)} returning id`;
        pid = rows[0].id as string;
      }
      const sizeRows = input.sizes.map((s, i) => ({ product_id: pid, label: s.label, stock: s.stock, position: i }));
      await tx`insert into product_sizes ${tx(sizeRows)}`;
      return pid;
    });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return { ok: false, message: "This product no longer exists. It may have been deleted." };
    }
    const constraint = uniqueViolation(err);
    if (constraint?.includes("code")) {
      return { ok: false, message: "Please fix the highlighted fields.", errors: { code: `${code} is already used by another product` } };
    }
    if (constraint?.includes("slug")) {
      return { ok: false, message: "Please fix the highlighted fields.", errors: { slug: "Another product already uses this web address" } };
    }
    console.error("saveProduct failed", err);
    return { ok: false, message: "Could not save. Please try again." };
  }

  const synced = await changed(savedId ?? undefined);
  if (!id) redirect(`/products/${savedId}?created=1`);
  return {
    ok: true,
    savedAt: Date.now(),
    message: synced ? "Saved. The shop is updated." : "Saved. The shop will show the change within 5 minutes.",
  };
}

export async function setProductStatus(id: string, status: "active" | "draft" | "archived") {
  await requireAdmin();
  if (!UUID.test(id) || !["active", "draft", "archived"].includes(status)) return;
  await db()`update products set status = ${status} where id = ${id}`;
  await changed(id);
}

export async function duplicateProduct(id: string) {
  await requireAdmin();
  if (!UUID.test(id)) return;
  const sql = db();
  const [src] = await sql`select * from products where id = ${id}`;
  if (!src) return;
  const prefix = CATEGORIES.find((c) => c.slug === src.category)?.codePrefix ?? "X";
  const name = `Copy of ${src.name}`.slice(0, 120);
  const newId = await sql.begin(async (tx) => {
    const code = await nextProductCode(prefix);
    const slug = await uniqueSlug(slugify(name));
    const [row] = await tx`
      insert into products (slug, code, name, category, occasions, price_pence, fibre, summary, details, care, is_new, status, palette)
      values (${slug}, ${code}, ${name}, ${src.category}, ${src.occasions}, ${src.price_pence}, ${src.fibre},
              ${src.summary}, ${src.details}, ${src.care}, ${src.is_new}, 'draft', ${src.palette})
      returning id`;
    await tx`
      insert into product_sizes (product_id, label, stock, position)
      select ${row.id}, label, 0, position from product_sizes where product_id = ${id}`;
    return row.id as string;
  });
  revalidatePath("/", "layout");
  redirect(`/products/${newId}?duplicated=1`);
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  if (!UUID.test(id)) return;
  const sql = db();
  const images = await sql<{ storage_path: string }[]>`select storage_path from product_images where product_id = ${id}`;
  await sql`delete from products where id = ${id}`;
  try {
    await storage().remove(images.map((i) => i.storage_path));
  } catch (err) {
    // The product is gone either way; a leftover file costs a little storage, nothing more.
    console.warn("Photo clean-up failed", err);
  }
  await changed();
  redirect("/products?deleted=1");
}

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_PHOTOS = 12;

export async function uploadProductImage(productId: string, form: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (!UUID.test(productId)) return { ok: false, error: "Unknown product." };
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No photo received." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "That photo is too large (over 4 MB after compression)." };

  const sql = db();
  const [{ count }] = await sql<{ count: number }[]>`
    select count(*)::int as count from product_images where product_id = ${productId}`;
  if (count >= MAX_PHOTOS) return { ok: false, error: `A product can have up to ${MAX_PHOTOS} photos.` };

  let output: { data: Buffer; info: OutputInfo };
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(input).metadata();
    if (!meta.format || !["jpeg", "png", "webp", "heif", "avif"].includes(meta.format)) {
      return { ok: false, error: "Please upload a JPEG, PNG or WebP photo." };
    }
    // rotate() applies the phone's orientation; metadata (including GPS location) is not copied.
    output = await sharp(input)
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    return { ok: false, error: "That file isn't a photo we can read. Try a JPEG or PNG." };
  }

  const key = `products/${productId}/${randomUUID()}.webp`;
  let url: string;
  try {
    url = await storage().put(key, output.data, "image/webp");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Upload failed." };
  }

  const alt = String(form.get("alt") ?? "").trim().slice(0, 200);
  try {
    const inserted = await sql`
      insert into product_images (product_id, storage_path, url, alt, width, height, position)
      select ${productId}, ${key}, ${url}, ${alt}, ${output.info.width}, ${output.info.height},
             coalesce(max(position) + 1, 0)
      from product_images where product_id = ${productId}
      having exists (select 1 from products where id = ${productId})
      returning id`;
    if (inserted.length === 0) throw new Error("Product not found");
  } catch (err) {
    await storage().remove([key]).catch(() => {});
    console.error("Saving photo record failed", err);
    return { ok: false, error: "The photo uploaded but couldn't be saved. Please try again." };
  }

  await changed(productId);
  return { ok: true };
}

export async function deleteProductImage(imageId: string) {
  await requireAdmin();
  if (!UUID.test(imageId)) return;
  const [row] = await db()<{ product_id: string; storage_path: string }[]>`
    delete from product_images where id = ${imageId} returning product_id, storage_path`;
  if (!row) return;
  await storage().remove([row.storage_path]).catch((err) => console.warn("Photo clean-up failed", err));
  await changed(row.product_id);
}

export async function reorderProductImages(productId: string, orderedIds: string[]) {
  await requireAdmin();
  if (!UUID.test(productId) || !orderedIds.every((i) => UUID.test(i))) return;
  const sql = db();
  await sql.begin(async (tx) => {
    for (const [position, id] of orderedIds.entries()) {
      await tx`update product_images set position = ${position} where id = ${id} and product_id = ${productId}`;
    }
  });
  await changed(productId);
}

export async function updateImageAlt(imageId: string, alt: string) {
  await requireAdmin();
  if (!UUID.test(imageId)) return;
  const [row] = await db()<{ product_id: string }[]>`
    update product_images set alt = ${alt.trim().slice(0, 200)} where id = ${imageId} returning product_id`;
  if (row) await changed(row.product_id);
}
