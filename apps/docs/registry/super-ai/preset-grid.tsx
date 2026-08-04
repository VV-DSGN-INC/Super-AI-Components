"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { PreviewTile } from "@/registry/super-ai/preview-tile";

/**
 * Preset Grid — Visual preset chooser with labelled thumbnails
 *
 * Spec: docs/design-system/component-specs.md#e4-preset-grid
 * States: style · palette · filter · environment · see-more
 *
 * Built on A8 `preview-tile`: every cell is a preview-tile — fixed aspect,
 * overlay label, badge slot, loading/failed content — this component only
 * adds selection semantics, the palette swatch content type, and the
 * in-grid see-more affordance around it. Style, palette, filter and
 * environment are the same grid with a different `items` array (E4); there
 * is deliberately no separate component per content type.
 *
 * `preview-tile`'s own interactive Frame renders `aria-pressed` when given
 * `onSelect` — toggle-button semantics, the wrong ARIA for a set of
 * mutually-exclusive (or independently checkable) options. So every tile
 * here renders preview-tile *without* `onSelect` — its Frame becomes an
 * inert `<div>` that still carries the selection ring, badge and label —
 * and wraps it in one real `role="radio"`/`role="checkbox"` `<button>` of
 * its own. One interactive element per tile, never a button nested inside
 * a button.
 */

type PresetGridContent = "style" | "palette" | "filter" | "environment";

interface PresetGridItem {
  id: string;
  /**
   * Always rendered as the overlay label. For `palette` content this is the
   * *only* carrier of the swatch's meaning ("Sunset orange") — a colour
   * conveys nothing on its own to a screen reader or a colourblind user, so
   * this is never optional the way `thumbnail` is.
   */
  label: string;
  /** style / filter / environment content. Ignored when `content="palette"`. */
  thumbnail?: React.ReactNode;
  /** `palette` content only: the CSS colour rendered as the swatch fill. */
  color?: string;
  badge?: React.ReactNode;
  state?: "loading" | "failed";
}

interface PresetGridProps extends Omit<React.ComponentProps<"div">, "onSelect" | "defaultValue" | "value"> {
  items: PresetGridItem[];
  content?: PresetGridContent;
  /**
   * Independent checkbox selection instead of one-of-many. Switches the
   * group role (`group` vs `radiogroup`) and every tile's role (`checkbox`
   * vs `radio`) together — never just the visual.
   */
  multiple?: boolean;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  /** Presets beyond this count collapse behind the see-more tile. Omit to show every item. */
  visibleCount?: number;
  seeMoreLabel?: React.ReactNode;
}

function toSelection(value: string | string[] | undefined): Set<string> {
  if (value == null) return new Set();
  return new Set(Array.isArray(value) ? value : [value]);
}

function PresetGridTile({
  item,
  content,
  multiple,
  selected,
  onSelect,
}: {
  item: PresetGridItem;
  content: PresetGridContent;
  multiple: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role={multiple ? "checkbox" : "radio"}
      aria-checked={selected ? "true" : "false"}
      data-slot="preset-grid-tile"
      data-state={selected ? "on" : "off"}
      onClick={onSelect}
      className="focus-visible:ring-ring rounded-lg text-left focus-visible:ring-2 focus-visible:outline-none"
    >
      {/* `onSelect` intentionally not forwarded to preview-tile: its own
          interactive Frame would add a second, nested aria-pressed button.
          `selected` alone is enough to draw the ring — that class is
          unconditional on preview-tile's Frame, independent of `onSelect`. */}
      <PreviewTile
        aspect="square"
        state={item.state}
        selected={selected}
        label={item.label}
        labelPlacement="overlay"
        badge={item.badge}
      >
        {content === "palette" ? (
          <span
            aria-hidden
            data-slot="preset-grid-swatch"
            className="block h-full w-full"
            style={{ backgroundColor: item.color }}
          />
        ) : (
          item.thumbnail
        )}
      </PreviewTile>
    </button>
  );
}

function PresetGridSeeMore({
  hiddenCount,
  label,
  onSelect,
}: {
  hiddenCount: number;
  label: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      data-slot="preset-grid-see-more"
      onClick={onSelect}
      className="focus-visible:ring-ring rounded-lg text-left focus-visible:ring-2 focus-visible:outline-none"
    >
      <PreviewTile aspect="square" labelPlacement="none">
        <div className="text-foreground flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center text-xs font-medium">
          <ChevronDown className="size-4" aria-hidden />
          <span>{label}</span>
          <span className="sr-only">{` — ${hiddenCount} more`}</span>
        </div>
      </PreviewTile>
    </button>
  );
}

function PresetGrid({
  items,
  content = "style",
  multiple = false,
  value: valueProp,
  defaultValue,
  onValueChange,
  visibleCount,
  seeMoreLabel = "See more",
  className,
  ...props
}: PresetGridProps) {
  const [internalValue, setInternalValue] = React.useState<string | string[] | undefined>(defaultValue);
  const value = valueProp ?? internalValue;
  const selected = React.useMemo(() => toSelection(value), [value]);

  // E4: "the grid never reflows when expanded" — already-visible tiles keep
  // the same key and position before and after expanding, so React reuses
  // their DOM nodes rather than unmounting and recreating them. Expanding
  // only ever appends more grid cells after them.
  const [expanded, setExpanded] = React.useState(false);
  const hasOverflow = typeof visibleCount === "number" && visibleCount < items.length;
  const visibleItems = expanded || !hasOverflow ? items : items.slice(0, visibleCount);
  const hiddenCount = items.length - visibleItems.length;

  const handleSelect = (id: string) => {
    let next: string | string[];
    if (multiple) {
      next = selected.has(id) ? [...selected].filter((v) => v !== id) : [...selected, id];
    } else {
      next = id;
    }
    if (valueProp === undefined) setInternalValue(next);
    onValueChange?.(next);
  };

  return (
    <div
      // TODO: roving tabIndex per the ARIA radiogroup / APG checkbox-group
      // pattern (v1 ships Tab-per-tile) — the same accepted gap as A4
      // choice-chips.
      role={multiple ? "group" : "radiogroup"}
      data-slot="preset-grid"
      data-content={content}
      className={cn("grid grid-cols-3 gap-3 sm:grid-cols-4", className)}
      {...props}
    >
      {visibleItems.map((item) => (
        <PresetGridTile
          key={item.id}
          item={item}
          content={content}
          multiple={multiple}
          selected={selected.has(item.id)}
          onSelect={() => handleSelect(item.id)}
        />
      ))}
      {hiddenCount > 0 ? (
        <PresetGridSeeMore hiddenCount={hiddenCount} label={seeMoreLabel} onSelect={() => setExpanded(true)} />
      ) : null}
    </div>
  );
}

export { PresetGrid };
export type { PresetGridContent, PresetGridItem, PresetGridProps };
