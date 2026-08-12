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
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <Link href="/" className="font-mono text-sm font-semibold">
          super-ai
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://super-ai-components.vercel.app/storybook"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Storybook
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
