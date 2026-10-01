"use client";

import Link from "next/link";
import * as React from "react";

import { Input } from "@/components/ui/input";
import type { CatalogFamily } from "@/lib/catalog";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Family sections with a text filter. Filtering is by name, title and
 *  description; a family with no match disappears rather than showing an empty
 *  heading. The count line is live so a screen reader hears the narrowing. */
export function CatalogIndex({ families }: { families: CatalogFamily[] }) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const total = families.reduce((n, f) => n + f.items.length, 0);
  const visible = families
    .map((f) => ({
      ...f,
      items: q
        ? f.items.filter((i) => `${i.name} ${i.title} ${i.description}`.toLowerCase().includes(q))
        : f.items,
    }))
    .filter((f) => f.items.length > 0);
  const shown = visible.reduce((n, f) => n + f.items.length, 0);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <label htmlFor="catalog-filter" className="text-sm font-medium">
          Filter
        </label>
        <Input
          id="catalog-filter"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, title or description"
        />
        <p className="text-muted-foreground text-xs" aria-live="polite">
          {shown} of {total} items
        </p>
      </div>

      {visible.length === 0 ? (
        <p data-slot="catalog-empty" className="text-muted-foreground text-sm">
          Nothing matches. Try a shorter word.
        </p>
      ) : null}

      {visible.map((f) => {
        const id = `family-${slug(`${f.family}-${f.title}`)}`;
        return (
          <section key={id} aria-labelledby={id}>
            <h2 id={id} className="mb-2 text-sm font-semibold">
              {f.family} · {f.title}{" "}
              <span className="text-muted-foreground font-normal tabular-nums">{f.items.length}</span>
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {f.items.map((item) => (
                <li key={item.name}>
                  <Link
                    className="hover:bg-accent block rounded-md border px-3 py-2 text-sm"
                    href={`/components/${item.name}`}
                  >
                    <span className="font-medium">{item.title}</span>
                    <span className="text-muted-foreground mt-0.5 block text-xs">{item.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
