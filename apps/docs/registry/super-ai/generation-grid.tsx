"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { DateSection } from "@/registry/super-ai/date-section";

/**
 * Generation Grid — the batch gallery of results.
 *
 * Spec: docs/design-system/component-specs.md#f2-generation-grid
 * States: date-sections · density · select-mode · empty
 *
 * Three rules from the spec drive the whole API:
 *
 * 1. "Density is a prop, not a fork: eight-up in a library, four-up in a
 *    generation panel." One component, three column counts.
 * 2. "Select mode replaces hover actions with checkboxes and a bulk bar. Both
 *    cannot be live at once." The grid owns the mode and hands it to each item.
 * 3. "Empty is an in-grid tile, not a page takeover." The grid keeps its
 *    columns and puts the empty state in the first cell.
 *
 * The grid renders items through `renderItem` rather than importing F1
 * `result-card` directly. That is deliberate: it keeps a sibling L3 component
 * out of this one's import graph (wave-4 spec §1.4) and lets a caller put
 * anything in the cells — a result card, a document row, a template tile —
 * without the grid growing a variant per content type.
 */

type GenerationGridDensity = "compact" | "default" | "comfortable";

/**
 * Eight-up · six-up · four-up at the widest breakpoint, stepping down on
 * narrow viewports. Only the column count varies — never the cell's contents,
 * which is what stops density from becoming a fork.
 */
const DENSITY_COLUMNS: Record<GenerationGridDensity, string> = {
  compact: "grid-cols-3 sm:grid-cols-4 lg:grid-cols-8",
  default: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  comfortable: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

interface GenerationGroup<T> {
  id: string;
  /** A3 renders it. Relative buckets ("Today", "Yesterday") read best first. */
  label: string;
  items: T[];
}

interface GenerationItemContext {
  selected: boolean;
  selectMode: boolean;
  /**
   * Toggles this item in the grid's selection and fires `onSelectionChange`.
   *
   * Not in the wave-4 spec's `ctx`, which lists only `selected` and
   * `selectMode`. Added because without it the grid can report a selection it
   * has no way to change: `onSelectionChange` would never fire, since the
   * checkbox that toggles an item lives in the caller's `renderItem` output.
   * Wiring it here is what keeps `selectedIds` a single source of truth
   * instead of asking every caller to maintain a parallel copy.
   */
  toggleSelected: () => void;
}

interface GenerationGridProps<T> extends Omit<React.ComponentProps<"div">, "children"> {
  /** Ungrouped. Ignored when `groups` is supplied. */
  items?: T[];
  /** Grouped — renders one A3 `date-section` per group. */
  groups?: GenerationGroup<T>[];
  getItemId: (item: T) => string;
  renderItem: (item: T, ctx: GenerationItemContext) => React.ReactNode;
  density?: GenerationGridDensity;
  selectMode?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** The bulk bar. Only rendered in select mode. */
  bulkActions?: React.ReactNode;
  /** An in-grid tile, never a page takeover. */
  empty?: React.ReactNode;
}

function GenerationGrid<T>({
  items,
  groups,
  getItemId,
  renderItem,
  density = "default",
  selectMode = false,
  selectedIds,
  onSelectionChange,
  bulkActions,
  empty,
  className,
  ...props
}: GenerationGridProps<T>) {
  const selected = React.useMemo(() => new Set(selectedIds ?? []), [selectedIds]);

  const toggle = React.useCallback(
    (id: string) => {
      if (!onSelectionChange) return;
      const next = new Set(selectedIds ?? []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelectionChange([...next]);
    },
    [onSelectionChange, selectedIds],
  );

  const cell = (item: T) => {
    const id = getItemId(item);
    return (
      <div data-slot="generation-grid-item" role="listitem" key={id}>
        {renderItem(item, {
          selected: selected.has(id),
          selectMode,
          toggleSelected: () => toggle(id),
        })}
      </div>
    );
  };

  // One class list, computed once, used by every grid in the component —
  // grouped or not. Nothing about an item's own state can reach it, which is
  // what guarantees the grid does not reflow when a result resolves.
  const gridClass = cn("grid gap-4", DENSITY_COLUMNS[density]);

  const grouped = groups && groups.length > 0;
  const flat = items ?? [];
  const isEmpty = grouped ? groups.every((g) => g.items.length === 0) : flat.length === 0;

  return (
    <div data-slot="generation-grid" className={cn("flex flex-col gap-4", className)} {...props}>
      {/* "Both cannot be live at once" — the bulk bar exists only in select
          mode, which is the same mode in which items suppress hover actions. */}
      {selectMode && bulkActions ? (
        <div
          data-slot="generation-grid-bulk-actions"
          role="toolbar"
          aria-label={`Bulk actions, ${selected.size} selected`}
          className="bg-card text-foreground flex items-center gap-2 rounded-lg border p-2"
        >
          <span data-slot="generation-grid-selection-count" className="text-xs">
            {selected.size} selected
          </span>
          {bulkActions}
        </div>
      ) : null}

      {isEmpty ? (
        // The grid keeps its columns; the empty state occupies the first cell
        // rather than replacing the surface.
        <div data-slot="generation-grid-grid" role="list" className={gridClass}>
          <div data-slot="generation-grid-empty" role="listitem">
            {empty}
          </div>
        </div>
      ) : grouped ? (
        groups.map((group) => (
          // No data-slot override here: DateSection spreads `...props` after
          // its own attributes, so passing one would replace `date-section`
          // and hide the fact that A3 is what renders a group.
          <DateSection key={group.id} label={group.label} className="space-y-2">
            <div data-slot="generation-grid-grid" role="list" className={gridClass}>
              {group.items.map(cell)}
            </div>
          </DateSection>
        ))
      ) : (
        <div data-slot="generation-grid-grid" role="list" className={gridClass}>
          {flat.map(cell)}
        </div>
      )}
    </div>
  );
}

export { GenerationGrid };
export type { GenerationGridDensity, GenerationGridProps, GenerationGroup, GenerationItemContext };
