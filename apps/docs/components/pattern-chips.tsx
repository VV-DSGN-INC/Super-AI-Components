import { describePattern } from "@/lib/catalog";
import type { ShapeOfAiPattern } from "@/lib/manifest-types";

/** The Shape of AI patterns an item carries, as quiet chips. Secondary to the
 *  family label: it renders nothing for an item the audit does not map. */
export function PatternChips({ patterns }: { patterns: ShapeOfAiPattern[] }) {
  if (patterns.length === 0) return null;
  return (
    <div data-slot="pattern-chips" className="space-y-1">
      <p className="text-muted-foreground text-xs font-medium">Shape of AI patterns</p>
      <ul className="flex flex-wrap gap-1.5">
        {patterns.map((p) => {
          const { categoryTitle, label } = describePattern(p);
          return (
            <li key={p} className="rounded-md border px-2 py-0.5 text-xs">
              <span className="text-muted-foreground">{categoryTitle} · </span>
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
