import { DocsNav } from "@/components/docs-nav";

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar. `top-14`, not `top-0`: the site header is a 3.5rem sticky bar
          at z-50, so a column stuck to the viewport top sits behind it and
          hangs the same distance below the fold. */}
      <aside className="hidden md:block w-56 shrink-0 border-r">
        <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
          <DocsNav />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
