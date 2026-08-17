import { Geist, Geist_Mono } from "next/font/google";

import type { Locale } from "@/lib/i18n/types";

// "cyrillic" is load-bearing: without it every Russian page silently falls back
// to a system font. Verified against next/font's metadata — Geist and Geist Mono
// both ship ["cyrillic","latin","latin-ext"], so the two locales share a typeface.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "cyrillic"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "cyrillic"] });

const htmlClassName = `${geistSans.variable} ${geistMono.variable} h-full antialiased`;
const bodyClassName = "min-h-full flex flex-col";

/**
 * The one place the `<html>`/`<body>` pair is rendered, shared by both root
 * layouts. A skip link, theme provider, or any other lang-sensitive attribute
 * added later belongs here — splitting it per-locale is how a fix to English
 * silently regresses Russian only, which is exactly the failure class the
 * a11y baseline is written against.
 */
export function RootShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <html lang={locale} className={htmlClassName}>
      <body className={bodyClassName}>{children}</body>
    </html>
  );
}
