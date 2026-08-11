"use client";

import { cn } from "@/lib/utils";
import { KanbanColumn } from "@/registry/super-ai/kanban-column";
import type { KanbanViewProps, ViewItem } from "@/registry/super-ai/data-views-shared";

export function KanbanView<T extends ViewItem>({ items, groups, renderCard, className }: KanbanViewProps<T>) {
  return (
    <div data-slot="kanban-view" className={cn("flex h-full w-full gap-3 overflow-x-auto", className)}>
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
    </div>
  );
}
