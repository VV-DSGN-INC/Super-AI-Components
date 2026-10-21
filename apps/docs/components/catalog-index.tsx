"use client";

import Link from "next/link";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { describePattern, type CatalogFamily } from "@/lib/catalog";
import { SHAPE_OF_AI_CATEGORY_TITLES, type ShapeOfAiCategory } from "@/lib/manifest-types";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const CATEGORIES = Object.keys(SHAPE_OF_AI_CATEGORY_TITLES) as ShapeOfAiCategory[];

/** Family sections with a text filter and a Shape of AI category filter.
 *  Families stay the primary axis (D27): the category filter narrows items
 *  inside their family sections instead of regrouping. Text filtering is by
 *  name, title, description and pattern, so "caveat" finds `disclaimer-note`; a family with no match disappears rather than showing an empty
 *  heading. The count line is live so a screen reader hears the narrowing. */
export function CatalogIndex({ families }: { families: CatalogFamily[] }) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<ShapeOfAiCategory | null>(null);
  const q = query.trim().toLowerCase();
  const total = families.reduce((n, f) => n + f.items.length, 0);
  const visible = families
    .map((f) => ({
      ...f,
      items: f.items.filter((i) => {
        const patterns = i.patterns ?? [];
        if (category && !patterns.some((p) => p.startsWith(`${category}/`))) return false;
        if (!q) return true;
        const labels = patterns.map((p) => describePattern(p).label).join(" ");
        return `${i.name} ${i.title} ${i.description} ${labels}`.toLowerCase().includes(q);
      }),
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
          placeholder="Name, title, description or pattern"
        />
        <div
          role="group"
          aria-label="Shape of AI category"
          className="flex flex-wrap items-center gap-1.5 pt-2"
        >
          <span className="text-muted-foreground text-xs">Shape of AI</span>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(category === c ? null : c)}
              className="hover:bg-accent aria-pressed:bg-primary aria-pressed:text-primary-foreground focus-visible:ring-ring rounded-md border px-2 py-0.5 text-xs focus-visible:outline-none focus-visible:ring-2"
            >
              {SHAPE_OF_AI_CATEGORY_TITLES[c]}
            </button>
          ))}
        </div>
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
                    {category && item.patterns ? (
                      <span className="mt-1 block text-xs">
                        {item.patterns
                          .filter((p) => p.startsWith(`${category}/`))
                          .map((p) => describePattern(p).label)
                          .join(" · ")}
                      </span>
                    ) : null}
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
