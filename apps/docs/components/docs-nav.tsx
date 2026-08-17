"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CATALOG_ITEMS } from "@/lib/catalog";
import { localeHref } from "@/lib/i18n/paths";
import { messagesFor } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/types";
import { MARKETING_GROUPS, MARKETING_ITEMS } from "@/lib/marketing-catalog";

function NavList({
  items,
  pathname,
  locale,
}: {
  items: { name: string; title: string }[];
  pathname: string;
  locale: Locale;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const href = localeHref(locale, `/components/${item.name}`);
        const isActive = pathname === href;
        return (
          <li key={item.name}>
            <Link
              href={href}
              className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {item.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function DocsNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const t = messagesFor(locale);
  const groupLabel: Record<"Primitives" | "Components" | "Blocks", string> = {
    Primitives: t.groupPrimitives,
    Components: t.groupComponents,
    Blocks: t.groupBlocks,
  };

  return (
    <nav className="space-y-6">
      {(["Primitives", "Components", "Blocks"] as const).map((group) => (
        <div key={group}>
          <p className="text-muted-foreground mb-1 px-2 text-xs font-semibold uppercase tracking-wider">
            {groupLabel[group]}
          </p>
          <NavList
            items={CATALOG_ITEMS.filter((i) => i.group === group)}
            pathname={pathname}
            locale={locale}
          />
        </div>
      ))}
      {MARKETING_GROUPS.map((group) => {
        const items = MARKETING_ITEMS.filter((i) => i.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <p className="text-muted-foreground mb-1 px-2 text-xs font-semibold uppercase tracking-wider">
              {t.marketingPrefix} · {group}
            </p>
            <NavList items={items} pathname={pathname} locale={locale} />
          </div>
        );
      })}
    </nav>
  );
}
