"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CATALOG_ITEMS } from "@/lib/catalog";

const GROUPS = ["Primitives", "Components", "Flow Kit"] as const;

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
    </nav>
  );
}
