import Link from "next/link";

import { DocsNav } from "@/components/docs-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { localeHref } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/types";

export function DocsLayout({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:block w-56 shrink-0 border-r">
        <div className="sticky top-0 h-screen overflow-y-auto p-4">
          <Link href={localeHref(locale, "/")} className="mb-2 block text-sm font-semibold">
            Super-AI-Components
          </Link>
          <div className="mb-6">
            <LanguageSwitcher locale={locale} path="/" />
          </div>
          <DocsNav locale={locale} />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
