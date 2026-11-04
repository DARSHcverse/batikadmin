import { z } from "zod";
import { CATEGORIES, OCCASIONS, STATUSES } from "@/lib/catalogue";

const trimmed = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`);

export const productInput = z.object({
  name: z.string().trim().min(2, "Give the product a name").max(120, "Keep the name under 120 characters"),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || /^[A-Z0-9][A-Z0-9-]{1,19}$/.test(v), "Use 2–20 letters, numbers or dashes, e.g. D2604"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => v === "" || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), "Use lowercase letters, numbers and single dashes")
    .refine((v) => v.length <= 80, "Keep this under 80 characters"),
  status: z.enum(STATUSES.map((s) => s.slug) as [string, ...string[]]),
  category: z.enum(CATEGORIES.map((c) => c.slug) as [string, ...string[]], { error: "Choose a category" }),
  occasions: z.array(z.enum(OCCASIONS.map((o) => o.slug) as [string, ...string[]])),
  price: z
    .string()
    .trim()
    .regex(/^\d{1,6}(\.\d{1,2})?$/, "Enter a price in pounds, e.g. 49 or 49.50")
    .transform((v) => Math.round(Number(v) * 100)),
  fibre: z.string().trim().min(2, "Fibre content is required by law, e.g. 100% cotton").max(120),
  summary: trimmed(600),
  details: z
    .string()
    .max(4000)
    .transform((v) =>
      v
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 20),
    ),
  care: trimmed(1000),
  isNew: z.boolean(),
  sizes: z
    .array(
      z.object({
        label: z.string().trim().min(1, "Every size needs a name").max(20, "Size names must be under 20 characters"),
        stock: z.coerce.number().int("Stock must be a whole number").min(0, "Stock can't be negative").max(100000),
      }),
    )
    .min(1, "Add at least one size (use “One size” if there is only one)")
    .max(30)
    .refine((s) => new Set(s.map((x) => x.label.toLowerCase())).size === s.length, "Each size name must be different"),
});

export type ProductInput = z.output<typeof productInput>;

/** Reads the product form into the shape `productInput` expects. */
export function readProductForm(form: FormData) {
  let sizes: unknown = [];
  try {
    sizes = JSON.parse(String(form.get("sizes") ?? "[]"));
  } catch {
    sizes = null;
  }
  return {
    name: String(form.get("name") ?? ""),
    code: String(form.get("code") ?? ""),
    slug: String(form.get("slug") ?? ""),
    status: String(form.get("status") ?? "draft"),
    category: String(form.get("category") ?? ""),
    occasions: form.getAll("occasions").map(String),
    price: String(form.get("price") ?? ""),
    fibre: String(form.get("fibre") ?? ""),
    summary: String(form.get("summary") ?? ""),
    details: String(form.get("details") ?? ""),
    care: String(form.get("care") ?? ""),
    isNew: form.get("isNew") === "on",
    sizes,
  };
}
