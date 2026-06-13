"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CATALOG_ITEMS } from "@/lib/catalog";
import { PATTERN_PAGES } from "@/lib/patterns";

const GROUPS = ["Primitives", "Components", "Agent Kit"] as const;

export function DocsNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      {GROUPS.map((group) => {
        const items = CATALOG_ITEMS.filter((i) => i.group === group);
        return (
          <div key={group}>
            <p className="text-muted-foreground mb-1 px-2 text-xs font-semibold uppercase tracking-wider">
              {group}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const href = `/components/${item.name}`;
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
          </div>
        );
      })}
      {/* Patterns section — static pages, not catalog items */}
      <div data-slot="docs-nav-group">
        <p className="text-muted-foreground mb-1 px-2 text-xs font-semibold uppercase tracking-wider">Patterns</p>
        <ul className="space-y-0.5">
          {PATTERN_PAGES.map((p) => {
            const href = `/patterns/${p.slug}`;
            const isActive = pathname === href;
            return (
              <li key={p.slug}>
                <Link
                  href={href}
                  className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {p.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
