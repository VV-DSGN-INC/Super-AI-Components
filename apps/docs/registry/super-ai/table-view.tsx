"use client";

import { cn } from "@/lib/utils";
import type { TableViewProps, ViewItem } from "@/registry/super-ai/data-views-shared";

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

/* The table is a `role="grid"`, not a static table, because its rows are the
   clickable surface. A grid keeps the tabular structure a screen reader needs
   while making the rows a legal focus target and `aria-selected` a legitimate
   state on them — neither of which is true of a plain <table>. `role="button"`
   on a <tr> would buy the focus target by destroying the row semantics. */
export function TableView<T extends ViewItem>({
  items,
  columns,
  selectedId,
  onItemClick,
  className,
}: TableViewProps<T>) {
  // A read-only table must not advertise a tab stop that does nothing.
  const interactive = Boolean(onItemClick);

  return (
    <div
      data-slot="table-view"
      className={cn("bg-background h-full overflow-auto rounded-lg border", className)}
    >
      <table role="grid" className="w-full border-collapse text-sm">
        <thead className="bg-muted/60 sticky top-0 z-10">
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                className={cn(
                  "text-muted-foreground border-b px-4 py-2 text-xs font-medium",
                  ALIGN[col.align ?? "left"],
                  col.width,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              tabIndex={interactive ? 0 : undefined}
              onClick={interactive ? () => onItemClick?.(item) : undefined}
              onKeyDown={
                interactive
                  ? (event) => {
                      // Only the row's own key events activate it; a control
                      // inside a cell keeps Enter/Space for itself.
                      if (event.target !== event.currentTarget) return;
                      if (event.key === "Enter" || event.key === " ") {
                        // Without this, Space scrolls the page under the user.
                        event.preventDefault();
                        onItemClick?.(item);
                      }
                    }
                  : undefined
              }
              aria-selected={selectedId === item.id}
              className={cn(
                "border-b transition-colors",
                interactive &&
                  "hover:bg-muted/50 focus-visible:outline-ring cursor-pointer focus-visible:-outline-offset-2 focus-visible:outline-2",
                selectedId === item.id && "bg-accent",
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.id}
                  role="gridcell"
                  className={cn("px-4 py-2.5", ALIGN[col.align ?? "left"], col.width)}
                >
                  {col.cell(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
