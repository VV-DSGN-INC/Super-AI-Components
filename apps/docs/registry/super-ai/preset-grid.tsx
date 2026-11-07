"use client";

import * as React from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";

import { RadioGroup } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { PreviewTile } from "@/registry/super-ai/preview-tile";
import { SectionHeader } from "@/registry/super-ai/section-header";

/**
 * Preset Grid — Visual preset chooser with labelled thumbnails
 *
 * Spec: docs/design-system/component-specs.md#e4-preset-grid
 * States: style · palette · filter · environment · see-more · user-presets
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

/** Who owns a preset: the viewer, their team, or the product itself. */
type PresetGridSource = "personal" | "team" | "system";

const SOURCE_LABEL: Record<PresetGridSource, string> = {
  personal: "Personal",
  team: "Team",
  system: "System",
};

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
  /**
   * Where the preset comes from. Any `personal` or `team` item moves into a
   * "Your styles" section above the rest. When set, the source is shown as
   * text on the tile and is part of its accessible name ("Anime, Personal").
   */
  source?: PresetGridSource;
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
  /**
   * Adds a "Save current" tile at the start of the "Your styles" section.
   * It is a plain button, not a radio: pressing it never changes the selection.
   */
  onSaveCurrent?: () => void;
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
  // `text-start`, not `text-left`: a `<button>` centres its text by
  // default, so something has to override it for the overlay label, and
  // the logical form compiles to the same declaration in LTR while
  // mirroring under `dir="rtl"`. Sanctioned swap class — CONTINUE.md §8,
  // "Logical properties"; A9 entity-row carries the same note.
  const tileClassName =
    "focus-visible:ring-ring rounded-lg text-start focus-visible:ring-2 focus-visible:outline-none";
  // `onSelect` intentionally not forwarded to preview-tile: its own
  // interactive Frame would add a second, nested aria-pressed button.
  // `selected` alone is enough to draw the ring — that class is
  // unconditional on preview-tile's Frame, independent of `onSelect`.
  const sourceLabel = item.source ? SOURCE_LABEL[item.source] : undefined;
  // Source is text, never colour: a small pill in the badge slot. The
  // accessible name is set outright, "Label, Source", so the two chunks never
  // fuse ("PersonalAnime") the way adjacent inline spans would.
  const badge =
    sourceLabel || item.badge ? (
      <span className="flex items-center gap-1">
        {sourceLabel ? (
          <span
            data-slot="preset-grid-source"
            className="bg-background text-foreground rounded-sm px-1 text-[10px] leading-4 font-medium"
          >
            {sourceLabel}
          </span>
        ) : null}
        {item.badge}
      </span>
    ) : undefined;
  const ariaLabel = sourceLabel ? `${item.label}, ${sourceLabel}` : undefined;
  const body = (
    <PreviewTile
      aspect="square"
      state={item.state}
      selected={selected}
      label={item.label}
      labelPlacement="overlay"
      badge={badge}
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
  );
  if (!multiple) {
    // Single-select is a Base UI radio inside the grid's RadioGroup, which
    // supplies the ARIA radio pattern: one tab stop, arrows move focus and
    // selection together. Rendered as a native button, like A4 choice-chips.
    return (
      <RadioPrimitive.Root
        value={item.id}
        nativeButton
        render={<button type="button" />}
        aria-label={ariaLabel}
        data-slot="preset-grid-tile"
        data-state={selected ? "on" : "off"}
        className={tileClassName}
      >
        {body}
      </RadioPrimitive.Root>
    );
  }
  // Multi-select stays one tab stop per tile: the APG checkbox-group pattern
  // keeps every checkbox in the tab order, and Space toggles it.
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected ? "true" : "false"}
      aria-label={ariaLabel}
      data-slot="preset-grid-tile"
      data-state={selected ? "on" : "off"}
      onClick={onSelect}
      className={tileClassName}
    >
      {body}
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
      // Same sanctioned swap as the tile above.
      className="focus-visible:ring-ring rounded-lg text-start focus-visible:ring-2 focus-visible:outline-none"
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

function PresetGridSaveCurrent({ onSave }: { onSave: () => void }) {
  // A button, not a radio: it lives in the same grid as the radios but is not
  // part of the radio set, so the group's arrow keys skip it and it is its own
  // tab stop.
  return (
    <button
      type="button"
      data-slot="preset-grid-save-current"
      onClick={onSave}
      className="focus-visible:ring-ring rounded-lg text-start focus-visible:ring-2 focus-visible:outline-none"
    >
      <PreviewTile aspect="square" labelPlacement="none">
        <div className="text-foreground flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center text-xs font-medium">
          <Plus className="size-4" aria-hidden />
          <span>Save current</span>
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
  onSaveCurrent,
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
  // "Your styles": personal and team presets lift into their own section. The
  // see-more cap applies to the system presets only.
  const userItems = items.filter((item) => item.source === "personal" || item.source === "team");
  const systemItems = userItems.length > 0 ? items.filter((item) => !userItems.includes(item)) : items;
  const hasUserSection = userItems.length > 0 || typeof onSaveCurrent === "function";
  const hasOverflow = typeof visibleCount === "number" && visibleCount < systemItems.length;
  const visibleItems = expanded || !hasOverflow ? systemItems : systemItems.slice(0, visibleCount);
  const hiddenCount = systemItems.length - visibleItems.length;

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

  const renderTile = (item: PresetGridItem) => (
    <PresetGridTile
      key={item.id}
      item={item}
      content={content}
      multiple={multiple}
      selected={selected.has(item.id)}
      onSelect={() => handleSelect(item.id)}
    />
  );

  const cells = (
    <>
      {visibleItems.map(renderTile)}
      {hiddenCount > 0 ? (
        <PresetGridSeeMore
          hiddenCount={hiddenCount}
          label={seeMoreLabel}
          onSelect={() => setExpanded(true)}
        />
      ) : null}
    </>
  );
  const gridLayout = "grid grid-cols-3 gap-3 sm:grid-cols-4";
  const gridClassName = cn(hasUserSection ? "flex flex-col gap-4" : gridLayout, className);

  // With a "Your styles" section the root stays the one radiogroup (one
  // selection across both sections) and holds two plain sections.
  const body = hasUserSection ? (
    <>
      <div data-slot="preset-grid-section" data-section="user">
        <SectionHeader size="sm" title="Your styles" count={userItems.length} />
        <div className={gridLayout}>
          {typeof onSaveCurrent === "function" ? <PresetGridSaveCurrent onSave={onSaveCurrent} /> : null}
          {userItems.map(renderTile)}
        </div>
      </div>
      {systemItems.length > 0 ? (
        <div data-slot="preset-grid-section" data-section="system">
          <SectionHeader size="sm" title="Presets" />
          <div className={gridLayout}>{cells}</div>
        </div>
      ) : null}
    </>
  ) : (
    cells
  );

  if (multiple) {
    return (
      <div role="group" data-slot="preset-grid" data-content={content} className={gridClassName} {...props}>
        {body}
      </div>
    );
  }
  return (
    // The vendored group renders `role="radiogroup"`; see-more is a plain
    // button inside it, so it stays its own tab stop after the radios.
    <RadioGroup
      data-slot="preset-grid"
      data-content={content}
      value={[...selected][0] ?? null}
      onValueChange={(next: unknown) => handleSelect(next as string)}
      className={gridClassName}
      {...(props as Omit<
        React.ComponentProps<typeof RadioGroup>,
        "value" | "defaultValue" | "onValueChange"
      >)}
    >
      {body}
    </RadioGroup>
  );
}

export { PresetGrid };
export type { PresetGridContent, PresetGridItem, PresetGridProps, PresetGridSource };
