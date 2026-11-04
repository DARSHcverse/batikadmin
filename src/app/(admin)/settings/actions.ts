"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { normaliseWhatsApp } from "@/lib/settings";
import { refreshStore } from "@/lib/store-sync";

export type SettingsState = { ok: boolean; message?: string; error?: string; savedAt?: number };

export async function saveSettings(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  await requireAdmin();
  const whatsapp = normaliseWhatsApp(String(form.get("whatsapp") ?? ""));
  if (whatsapp === null) {
    return { ok: false, error: "That doesn't look like a phone number. Use a UK mobile like 07700 900123." };
  }
  const ordering = form.get("ordering") === "on";
  const showPrices = form.get("showPrices") === "on";
  await db()`
    update shop_settings
    set ordering_enabled = ${ordering}, show_prices = ${showPrices}, whatsapp_number = ${whatsapp}
    where id`;
  revalidatePath("/", "layout");
  const synced = await refreshStore();
  return {
    ok: true,
    savedAt: Date.now(),
    message: synced ? "Saved. The shop is updated." : "Saved. The shop will switch within 5 minutes.",
  };
}
