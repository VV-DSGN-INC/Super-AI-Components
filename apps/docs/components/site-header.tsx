import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "/", label: "Showcase" },
  { href: "/foundations", label: "Foundations" },
  { href: "/components", label: "Components" },
];

export function SiteHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur">
      {/* Tightened at the small end and the nav allowed to shrink: at a 375px
          viewport the wide spacing pushed the theme toggle past the right edge
          of a sticky bar, where it could not be reached at all. */}
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:gap-6 sm:px-6">
        <Link href="/" className="shrink-0 font-mono text-sm font-semibold">
          super-ai
        </Link>
        <nav className="flex min-w-0 items-center gap-3 overflow-x-auto text-xs sm:gap-4 sm:text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground shrink-0 whitespace-nowrap transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
