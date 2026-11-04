import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl text-brand">Settings</h1>
      <p className="mt-1 text-ink/70">How the shop works for customers.</p>
      <div className="mt-6">
        <SettingsForm
          ordering={s.orderingEnabled}
          showPrices={s.showPrices}
          whatsapp={s.whatsappNumber ? `+${s.whatsappNumber}` : ""}
        />
      </div>
    </div>
  );
}
