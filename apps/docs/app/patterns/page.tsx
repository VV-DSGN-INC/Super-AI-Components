import Link from "next/link";

import { PATTERN_PAGES } from "@/lib/patterns";

export default function PatternsIndexPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-3xl font-bold">Agentic Patterns</h1>
        <p className="mt-2 text-muted-foreground">
          The established agentic design patterns, mapped to the components that give them a user interface.
        </p>
      </header>
      <ul className="flex flex-col gap-3">
        {PATTERN_PAGES.map((p) => (
          <li key={p.slug} className="rounded-lg border p-4 hover:bg-accent">
            <Link href={`/patterns/${p.slug}`} className="flex flex-col gap-1">
              <span className="font-medium">{p.title}</span>
              <span className="text-sm text-muted-foreground">{p.intro}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
