import Link from "next/link";

import { messagesFor } from "@/lib/i18n/messages";
import { localeHref } from "@/lib/i18n/paths";
import { LOCALES, type Locale } from "@/lib/i18n/types";

/**
 * Server-rendered links, no client JavaScript: both targets are static pages and
 * the counterpart href is derivable from the locale and the current path.
 *
 * `lang` on each label is load-bearing — without it a screen reader announces
 * "Русский" through an English voice, which is exactly the reader this control
 * exists for. `hrefLang` tells the browser and crawlers the same thing.
 *
 * No `bg-muted` on the active chip: the inactive labels are
 * `text-muted-foreground`, and that pairing is the 4.34:1 failure in
 * a11y-baseline.md.
 */
export function LanguageSwitcher({ locale, path }: { locale: Locale; path: string }) {
  const t = messagesFor(locale);
  const label: Record<Locale, string> = { en: t.switchToEnglish, ru: t.switchToRussian };

  return (
    <div role="group" aria-label={t.languageLabel} className="flex items-center gap-1 text-xs">
      {LOCALES.map((l) => {
        const isCurrent = l === locale;
        return (
          <Link
            key={l}
            href={localeHref(l, path)}
            lang={l}
            hrefLang={l}
            aria-current={isCurrent ? "true" : undefined}
            className={
              isCurrent
                ? "text-foreground rounded px-1.5 py-0.5 font-medium"
                : "text-muted-foreground hover:text-foreground rounded px-1.5 py-0.5"
            }
          >
            {label[l]}
          </Link>
        );
      })}
    </div>
  );
}
