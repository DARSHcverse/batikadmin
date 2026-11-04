import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="bg-satin h-1.5 rounded-t-2xl" />
        <div className="card rounded-t-none p-7">
          <div className="flex items-center gap-3">
            <Image src="/brand/studio-batik-badge.webp" alt="" width={48} height={48} priority />
            <div>
              <p className="font-display text-2xl leading-none text-brand">Studio Batik</p>
              <p className="mt-1 text-sm text-ink/60">Shop admin</p>
            </div>
          </div>
          <LoginForm next={next ?? "/"} />
        </div>
      </div>
    </main>
  );
}
