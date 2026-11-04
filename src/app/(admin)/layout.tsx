import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { env } from "@/lib/env";
import { NavLinks } from "@/components/nav-links";
import { signOut } from "../login/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const storeUrl = env.storeUrl();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-line bg-brand text-white lg:h-dvh lg:border-b-0">
        <div className="bg-satin h-1" />
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:px-5 lg:py-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/brand/studio-batik-badge.webp" alt="" width={36} height={36} className="rounded-full bg-white" />
            <span className="font-display text-xl leading-none text-gold-light">
              Studio Batik
              <span className="block pt-1 font-sans text-xs text-white/70">Shop admin</span>
            </span>
          </Link>
          <form action={signOut} className="lg:hidden">
            <button className="rounded-full border border-white/25 px-3 py-1.5 text-sm hover:border-gold-light">Sign out</button>
          </form>
        </div>
        <NavLinks storeUrl={storeUrl} />
        <form action={signOut} className="hidden px-5 pt-6 lg:block">
          <button className="text-sm text-white/70 underline-offset-4 hover:text-gold-light hover:underline">Sign out</button>
        </form>
      </aside>
      <main className="min-w-0 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pt-10">{children}</main>
    </div>
  );
}
