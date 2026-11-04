"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", match: (p: string) => p === "/" },
  { href: "/products", label: "Products", match: (p: string) => p === "/products" || /^\/products\/[0-9a-f-]{36}/.test(p) },
  { href: "/products/new", label: "Add product", match: (p: string) => p === "/products/new" },
  { href: "/settings", label: "Settings", match: (p: string) => p === "/settings" },
];

export function NavLinks({ storeUrl }: { storeUrl: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="overflow-x-auto px-2 pb-2 lg:px-3 lg:pb-0">
      <ul className="flex gap-1 lg:flex-col">
        {links.map((l) => {
          const active = l.match(pathname);
          return (
            <li key={l.href} className="shrink-0">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-lg px-3 py-2 text-[15px] transition-colors ${
                  active ? "bg-white/12 font-medium text-gold-light" : "text-white/85 hover:bg-white/8 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
        {storeUrl && (
          <li className="shrink-0">
            <a
              href={storeUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg px-3 py-2 text-[15px] text-white/85 hover:bg-white/8 hover:text-white"
            >
              View shop ↗
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}
