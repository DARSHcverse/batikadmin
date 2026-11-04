import type { Metadata, Viewport } from "next";
import { Figtree, Gloock } from "next/font/google";
import "./globals.css";

const gloock = Gloock({ subsets: ["latin"], weight: "400", variable: "--font-gloock", display: "swap" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Studio Batik Admin", template: "%s | Studio Batik Admin" },
  // Private tool: keep it out of search engines.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0f1f44" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${gloock.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
