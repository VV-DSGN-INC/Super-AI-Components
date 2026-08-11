"use client";

import { cn } from "@/lib/utils";
import { GROUP_TONE_MARK, groupAccessibleName } from "@/registry/super-ai/data-views-shared";
import type { FeedViewProps, ViewItem } from "@/registry/super-ai/data-views-shared";

export function FeedView<T extends ViewItem>({
  items,
  groups,
  renderRow,
  selectedId,
  onItemClick,
  className,
}: FeedViewProps<T>) {
  const sections = groups
    ? groups.map((g) => ({ id: g.id, label: g.label, tone: g.tone, items: items.filter(g.match) }))
    : [{ id: "all", label: null, tone: undefined, items }];

  return (
    <div
      data-slot="feed-view"
      className={cn("bg-background h-full overflow-y-auto rounded-lg border", className)}
    >
      {sections.map((section) => (
        <section key={section.id}>
          {section.label ? (
            // `text-foreground`, not muted: the sticky header sits on a muted
            // surface, and muted-on-muted measures 4.34:1 against a 4.5:1
            // minimum. Tone rides on the mark here exactly as it does on a
            // kanban column header, so the two cannot drift.
            <header
              aria-label={groupAccessibleName(section.label, section.items.length, section.tone)}
              className="bg-muted/60 text-foreground sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-1.5 text-xs font-medium"
            >
              {GROUP_TONE_MARK[section.tone ?? "neutral"]}
              <span>{section.label}</span>
              {/* opacity on the foreground rather than `text-muted-foreground`:
                  this span sits on the same muted surface as its parent, and
                  that pairing is the cross-element case the contract lint
                  explicitly cannot see. */}
              <span className="tabular-nums opacity-70">{section.items.length}</span>
            </header>
          ) : null}
          <ul>
            {section.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onItemClick?.(item)}
                  aria-current={selectedId === item.id ? "true" : undefined}
                  className={cn(
                    "hover:bg-muted/50 focus-visible:ring-ring w-full border-b px-4 py-2.5 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                    selectedId === item.id && "bg-accent",
                  )}
                >
                  {renderRow(item)}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
