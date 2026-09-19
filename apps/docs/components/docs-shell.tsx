import Link from "next/link";

import { DocsNav } from "@/components/docs-nav";

/** The docs chrome: the sidebar rail plus the main column. Shared by the
 *  component routes and the system pages, so the two cannot drift apart. */
export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:block w-56 shrink-0 border-r">
        <div className="sticky top-0 h-screen overflow-y-auto p-4">
          <Link href="/" className="mb-6 block text-sm font-semibold">
            Super-AI-Components
          </Link>
          <DocsNav />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
