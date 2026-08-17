import Link from "next/link";

import { CATALOG_ITEMS } from "@/lib/catalog";
import { messagesFor } from "@/lib/i18n/messages";
import { localeHref } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/types";
import { LanguageSwitcher } from "@/components/language-switcher";

export function Home({ locale }: { locale: Locale }) {
  const t = messagesFor(locale);
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-10">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">Super-AI-Components</h1>
        <LanguageSwitcher locale={locale} path="/" />
      </div>
      <p className="text-muted-foreground">{t.tagline}</p>
      <ul className="grid grid-cols-2 gap-2">
        {CATALOG_ITEMS.map((item) => (
          <li key={item.name}>
            <Link
              className="hover:bg-accent block rounded-md border px-3 py-2 text-sm"
              href={localeHref(locale, `/components/${item.name}`)}
            >
              <span className="font-medium">{item.title}</span>
              <span className="text-muted-foreground mt-0.5 block text-xs">{item.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
