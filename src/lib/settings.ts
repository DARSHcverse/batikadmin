import "server-only";
import { db } from "@/lib/db";

export type ShopSettings = { orderingEnabled: boolean; showPrices: boolean; whatsappNumber: string; updatedAt: Date | null };

export async function getSettings(): Promise<ShopSettings> {
  const [row] = await db()<{ orderingEnabled: boolean; showPrices: boolean; whatsappNumber: string; updatedAt: Date }[]>`
    select ordering_enabled as "orderingEnabled", show_prices as "showPrices",
           whatsapp_number as "whatsappNumber", updated_at as "updatedAt"
    from shop_settings where id`;
  return row ?? { orderingEnabled: false, showPrices: true, whatsappNumber: "", updatedAt: null };
}

/**
 * Turns what people type ("07700 900123", "+44 7700 900123", "447700900123") into the
 * digits-with-country-code form WhatsApp links need. UK numbers starting 0 get 44.
 * Returns null if it can't be a phone number.
 */
export function normaliseWhatsApp(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed === "") return "";
  let digits = trimmed.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `44${digits.slice(1)}`;
  return /^[0-9]{10,15}$/.test(digits) ? digits : null;
}
