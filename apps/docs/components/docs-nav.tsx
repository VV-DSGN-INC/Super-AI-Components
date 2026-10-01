"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CATALOG_ITEMS } from "@/lib/catalog";
import { MARKETING_GROUPS, MARKETING_ITEMS } from "@/lib/marketing-catalog";

const GROUPS = ["Primitives", "Components", "Blocks"] as const;

const SYSTEM_LINKS = [
  { href: "/harness", title: "Harness" },
  { href: "/architecture", title: "Architecture" },
];

const toNavItem = (item: { name: string; title: string }) => ({
  href: `/components/${item.name}`,
  title: item.title,
});

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: { href: string; title: string }[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
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

export function DocsNav({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-1 px-2 text-xs font-semibold uppercase tracking-wider">
          System
        </p>
        <NavList items={SYSTEM_LINKS} pathname={pathname} onNavigate={onNavigate} />
      </div>
      {GROUPS.map((group) => (
        <div key={group}>
          <p className="text-muted-foreground mb-1 px-2 text-xs font-semibold uppercase tracking-wider">
            {group}
          </p>
          <NavList
            items={CATALOG_ITEMS.filter((i) => i.group === group).map(toNavItem)}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        </div>
      ))}
      {MARKETING_GROUPS.map((group) => {
        const items = MARKETING_ITEMS.filter((i) => i.group === group);
        if (items.length === 0) return null;
        return (
          <div key={group}>
            <p className="text-muted-foreground mb-1 px-2 text-xs font-semibold uppercase tracking-wider">
              Marketing · {group}
            </p>
            <NavList items={items.map(toNavItem)} pathname={pathname} onNavigate={onNavigate} />
          </div>
        );
      })}
    </nav>
  );
}
