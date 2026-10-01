import Link from "next/link";

import { DocsNav } from "@/components/docs-nav";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";

/** The docs chrome: the sidebar rail plus the main column. Shared by the
 *  component routes and the system pages, so the two cannot drift apart. */
export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar, md and up */}
      <aside className="hidden w-56 shrink-0 border-e md:block">
        <div className="sticky top-0 h-screen overflow-y-auto p-4">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="whitespace-nowrap text-sm font-semibold">
              Super-AI-Components
            </Link>
            <ThemeToggle className="-me-2" />
          </div>
          <DocsNav />
        </div>
      </aside>

      {/* Drawer trigger, below md */}
      <MobileNav />

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
