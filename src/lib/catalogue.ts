// Fixed lists shared with the store (studio-batik/src/lib/catalogue.ts).
// The database checks these values too, so change both apps and add a migration together.

export const CATEGORIES = [
  { slug: "dresses", label: "Dresses & frocks", codePrefix: "D" },
  { slug: "sarees", label: "Sarees", codePrefix: "S" },
  { slug: "sarongs", label: "Sarongs & lungis", codePrefix: "R" },
  { slug: "tops", label: "Tops & kurthas", codePrefix: "T" },
  { slug: "kids", label: "Kids", codePrefix: "K" },
  { slug: "accessories", label: "Scarves & accessories", codePrefix: "A" },
  { slug: "fabric", label: "Fabric by the metre", codePrefix: "F" },
] as const;

export type Category = (typeof CATEGORIES)[number]["slug"];

export const OCCASIONS = [
  { slug: "avurudu", label: "Avurudu" },
  { slug: "deepavali", label: "Deepavali" },
  { slug: "eid", label: "Eid" },
  { slug: "gifts", label: "Gifts" },
  { slug: "summer", label: "Summer" },
  { slug: "temple", label: "Temple & functions" },
] as const;

export type Occasion = (typeof OCCASIONS)[number]["slug"];

export const STATUSES = [
  { slug: "active", label: "Active", hint: "Shown in the shop" },
  { slug: "draft", label: "Draft", hint: "Hidden while you work on it" },
  { slug: "archived", label: "Archived", hint: "Hidden, kept for records" },
] as const;

export type Status = (typeof STATUSES)[number]["slug"];

export const SIZE_PRESETS = {
  "UK 8–20": ["8", "10", "12", "14", "16", "18", "20"],
  "S–XL": ["S", "M", "L", "XL"],
  "One size": ["One size"],
  "Kids ages": ["2–3 y", "4–5 y", "6–7 y", "8–9 y"],
  Metres: ["1 m", "2 m", "3 m", "5 m"],
} as const;

export const LOW_STOCK = 2;

export function categoryLabel(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
