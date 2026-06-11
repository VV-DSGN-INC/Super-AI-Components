import Link from "next/link";

import { DocsNav } from "@/components/docs-nav";

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
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
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-3xl p-8">{children}</div>
      </main>
    </div>
  );
}
