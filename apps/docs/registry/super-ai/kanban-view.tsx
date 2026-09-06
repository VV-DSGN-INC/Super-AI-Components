"use client";

import { cn } from "@/lib/utils";
import { KanbanColumn } from "@/registry/super-ai/kanban-column";
import type { KanbanViewProps, ViewItem } from "@/registry/super-ai/data-views-shared";

export function KanbanView<T extends ViewItem>({ items, groups, renderCard, className }: KanbanViewProps<T>) {
  return (
    /* A `<section>` with a tab stop, not a bare `<div>`: the board scrolls
       sideways as soon as the columns outrun the viewport, and a scroll
       container that cannot take focus is unreachable by keyboard — axe
       `scrollable-region-focusable`, whose real consequence is that a keyboard
       user sees the first two columns of a board and cannot reach the rest.
       The element is a `<section>` because a bare `<div>` is `role="generic"`,
       where ARIA prohibits `aria-label`, so the tab stop would arrive
       anonymous; `shortcuts-sheet` is the precedent, corrected in review for
       exactly that reason, and the name is the region's contents rather than
       the view's title. Found by DataViews' `Mobile` story — the defect is
       invisible at desktop width, because nothing overflows there. */
    <section
      data-slot="kanban-view"
      tabIndex={0}
      aria-label="Board columns"
      className={cn(
        "focus-visible:ring-ring flex h-full w-full gap-3 overflow-x-auto focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      {groups.map((group) => {
        const matched = items.filter(group.match);
        return (
          <KanbanColumn
            key={group.id}
            title={group.label}
            count={matched.length}
            tone={group.tone}
            className="flex-1"
          >
            {matched.map((item) => (
              <div key={item.id}>{renderCard(item)}</div>
            ))}
          </KanbanColumn>
        );
      })}
    </section>
  );
}
