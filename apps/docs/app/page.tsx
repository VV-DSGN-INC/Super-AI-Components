import Link from "next/link";

import { ComponentTile } from "@/components/showcase/component-tile";
import { HeroApp } from "@/components/showcase/hero-app";
import { SectionTabs } from "@/components/showcase/section-tabs";
import { SHOWCASE_BLOCKS, SHOWCASE_PRIMITIVES, SHOWCASE_SECTIONS } from "@/lib/showcase";

export default function Showcase() {
  // 116, not 91: the seven sections cover the component layer only, and the
  // headline count is every shipped item. Do not quote this as "the catalog",
  // which is frozen at 114 — the difference is family P, counted separately
  // by decision D18.
  const shippedCount =
    SHOWCASE_SECTIONS.reduce((n, s) => n + s.items.length, 0) +
    SHOWCASE_PRIMITIVES.length +
    SHOWCASE_BLOCKS.length;

  return (
    <main className="mx-auto max-w-6xl space-y-16 px-6 py-12">
      <header className="max-w-2xl space-y-4">
        <h1 data-slot="page-title" className="text-4xl font-semibold tracking-tight">
          The other half of an AI app.
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          AI Elements gives you the conversation. This gives you the application: {shippedCount}{" "}
          components across shells, composers, generation, results, knowledge, trust and billing, on
          the shadcn base-nova theme. Installed with the shadcn CLI, not npm.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/components"
            className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium"
          >
            Browse components
          </Link>
          <Link href="/foundations" className="rounded-md border px-3 py-2 text-sm font-medium">
            Foundations
          </Link>
        </div>
      </header>

      <HeroApp />

      <SectionTabs sections={SHOWCASE_SECTIONS} />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Primitives</h2>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            The atoms everything above composes from. See{" "}
            <Link href="/foundations" className="underline underline-offset-4">
              Foundations
            </Link>{" "}
            for the tokens they read.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SHOWCASE_PRIMITIVES.map((item) => (
            <ComponentTile key={item.name} item={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
