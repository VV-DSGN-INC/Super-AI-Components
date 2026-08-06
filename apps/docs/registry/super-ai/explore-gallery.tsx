"use client";

import { Tabs } from "@base-ui/react/tabs";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";
import { MediaPromptBar } from "@/registry/super-ai/media-prompt-bar";

/**
 * Explore Gallery — Masonry community feed
 *
 * Spec: docs/design-system/component-specs.md#j3-explore-gallery
 * States: sort-tabs · type-pills · infinite-scroll · docked-prompt
 *
 * Four decisions from the spec do the work here, and each one is the thing a
 * refactor will quietly undo:
 *
 * 1. **This component owns its own tile — it does not compose A8
 *    `preview-tile`.** That is deliberate and it is the one place in this
 *    registry where *not* reaching for the load-bearing primitive is correct.
 *    A8 exists to fix the frame (one aspect ratio, one height, so grids line
 *    up); masonry exists because heights vary. The two requirements are
 *    mutually exclusive, so J3 renders `explore-gallery-item-media` itself
 *    with a per-item `aspect-ratio`. Do not "fix" this by swapping in A8 —
 *    you would flatten the feed into C4 `recent-grid`, which already exists.
 *
 * 2. **Sort tabs and type pills are different axes and stay separate.** Two
 *    props (`sorts`/`types`), two controls, two accessible groups, two
 *    `data-slot`s. Sorting reorders everything; a type pill removes things.
 *    Merging them into one filter row makes "Hot" and "Videos" look mutually
 *    exclusive when they compose.
 *
 * 3. **The docked prompt is part of this component, not a sibling the host
 *    arranges above it.** It sits directly over the feed "so inspiration
 *    converts without a navigation step" — a tile's Remix action seeds the
 *    bar in place, and nothing navigates. Composed from D1
 *    `media-prompt-bar`, so an explore feed and a generation surface share
 *    one omnibox rather than growing two.
 *
 * 4. **Infinite scroll ships a real button.** Scroll-triggered loading with
 *    no control is unreachable by keyboard and silent to screen readers, so
 *    `explore-gallery-load-more` is a focusable button and
 *    `explore-gallery-status` is a live region that says how much of the feed
 *    is on screen. A host may add scroll-triggered prefetch on top; it may
 *    not remove the button.
 */

type ExploreGalleryLayout = "masonry" | "rows";

interface ExploreGalleryItem {
  id: string;
  /** The only required field. Shown in the tile footer and used to name the open control. */
  title: string;
  /** Whatever the feed shows: an <img>, a video poster, a canvas, a colour. Stretched to fill the media box. */
  media?: React.ReactNode;
  /**
   * CSS `aspect-ratio` for the media box, e.g. "3 / 4". Variable ratios are
   * the entire point of the layout — a feed where every item passes the same
   * ratio is a grid wearing a masonry class name.
   */
  aspectRatio?: React.CSSProperties["aspectRatio"];
  /** Matches one of `types[].value`. Reflected as `data-type` and rendered as a badge. */
  type?: string;
  /** Visible badge text. Falls back to `type`. */
  typeLabel?: string;
  author?: string;
  /** Avatar/initials node rendered beside the author name. */
  authorAvatar?: React.ReactNode;
  /** e.g. "1.2k" — a like or remix count. Rendered as text, never as a bare icon. */
  metric?: string;
  /** The prompt behind this item. Its presence is what enables the tile's Remix action. */
  prompt?: string;
  onOpen?: () => void;
  /** Extra tile actions. Revealed on hover/focus alongside Remix — always mounted, never `display:none`. */
  actions?: React.ReactNode;
}

interface ExploreGallerySortOption {
  value: string;
  label: string;
}

interface ExploreGalleryTypeOption {
  value: string;
  label: string;
  /** Optional facet count, rendered beside the label. */
  count?: number;
}

interface ExploreGalleryProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  items?: ExploreGalleryItem[];

  /** Axis one: ordering. Reorders the whole feed; never removes anything from it. */
  sorts?: ExploreGallerySortOption[];
  sort?: string;
  defaultSort?: string;
  onSortChange?: (value: string) => void;
  /** Accessible name for the sort tablist. */
  sortLabel?: string;

  /** Axis two: filtering. Narrows what the feed contains; never reorders it. */
  types?: ExploreGalleryTypeOption[];
  type?: string;
  defaultType?: string;
  onTypeChange?: (value: string) => void;
  /** Accessible name for the type pill group. */
  typeLabel?: string;

  /**
   * "masonry" packs tiles into CSS columns (the community-feed look).
   * "rows" keeps variable tile heights but lays them out left-to-right, so
   * position matches rank — use it when the sort is the point. See the docs
   * pitfall on column flow.
   */
  layout?: ExploreGalleryLayout;
  /** Accessible name for the scrollable feed region (used when no sort tabs are present). */
  feedLabel?: string;

  /** Infinite scroll: whether another page exists. Drives the Load more button. */
  hasMore?: boolean;
  loading?: boolean;
  onLoadMore?: () => void;
  loadMoreLabel?: string;
  loadingLabel?: string;
  /** Total matching the current sort + type, if known. Announced alongside the loaded count. */
  totalCount?: number;
  /** Overrides the derived "N of M shown" announcement wholesale, for translation. */
  statusLabel?: string;

  /** The docked prompt above the feed. On by default — it is part of this component. */
  dockedPrompt?: boolean;
  promptValue?: string;
  onPromptValueChange?: (value: string) => void;
  onPromptSubmit?: (value: string) => void;
  promptPlaceholder?: string;
  promptLabel?: string;
  promptSubmitLabel?: string;
  /** Fires when a tile's Remix action seeds the docked prompt. */
  onRemix?: (item: ExploreGalleryItem) => void;
  remixLabel?: string;
  /** Verb prefixed to each tile's title to name its open control, e.g. "Open Neon city". */
  openLabel?: string;
}

function ExploreGalleryTile({
  item,
  layout,
  remixLabel,
  promptId,
  onRemix,
  openLabel,
}: {
  item: ExploreGalleryItem;
  layout: ExploreGalleryLayout;
  remixLabel: string;
  promptId?: string;
  onRemix: (item: ExploreGalleryItem) => void;
  openLabel: string;
}) {
  const badgeLabel = item.typeLabel ?? item.type;
  return (
    <li
      data-slot="explore-gallery-item"
      data-type={item.type}
      className={cn(
        "group/explore-item bg-card text-card-foreground relative overflow-hidden rounded-xl border",
        // break-inside-avoid keeps a tile from being sliced across a column
        // boundary, which would otherwise split a focusable control in two.
        layout === "masonry" && "mb-4 break-inside-avoid",
      )}
    >
      <button
        type="button"
        data-slot="explore-gallery-item-open"
        aria-label={`${openLabel} ${item.title}`}
        onClick={item.onOpen}
        className="focus-visible:ring-ring block w-full focus-visible:ring-2 focus-visible:outline-none"
      >
        <span
          data-slot="explore-gallery-item-media"
          // The variable height lives here, per item. This is what A8
          // preview-tile deliberately cannot do — see the file header.
          style={{ aspectRatio: item.aspectRatio ?? "1 / 1" }}
          className="bg-muted block w-full overflow-hidden [&>*]:block [&>*]:size-full [&>*]:object-cover"
        >
          {item.media}
        </span>
      </button>

      {badgeLabel ? (
        <Badge
          data-slot="explore-gallery-item-type"
          variant="secondary"
          className="pointer-events-none absolute top-2 left-2"
        >
          {badgeLabel}
        </Badge>
      ) : null}

      {item.prompt || item.actions ? (
        <div
          data-slot="explore-gallery-item-actions"
          // opacity-0, never `hidden`: the controls stay mounted and in the
          // tab order, and group-focus-within brings them back into view the
          // moment anything inside the tile takes focus.
          className="absolute top-2 right-2 flex items-center gap-1 opacity-0 transition-opacity group-focus-within/explore-item:opacity-100 group-hover/explore-item:opacity-100 pointer-coarse:opacity-100"
        >
          {item.prompt ? (
            <Button
              type="button"
              size="xs"
              variant="secondary"
              data-slot="explore-gallery-item-remix"
              aria-label={`${remixLabel}: ${item.title}`}
              aria-controls={promptId}
              onClick={() => onRemix(item)}
            >
              {remixLabel}
            </Button>
          ) : null}
          {item.actions}
        </div>
      ) : null}

      <div data-slot="explore-gallery-item-meta" className="flex items-center gap-2 p-2">
        {item.authorAvatar ? (
          <span data-slot="explore-gallery-item-avatar" className="shrink-0">
            {item.authorAvatar}
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span data-slot="explore-gallery-item-title" className="block truncate text-sm font-medium">
            {item.title}
          </span>
          {item.author ? (
            // text-foreground/70, not text-muted-foreground: the tile sits on
            // bg-card but the media box above it is bg-muted, and this
            // registry keeps shipping the 4.34:1 muted-on-muted pairing.
            <span data-slot="explore-gallery-item-author" className="text-foreground/70 block truncate text-xs">
              {item.author}
            </span>
          ) : null}
        </span>
        {item.metric ? (
          <span
            data-slot="explore-gallery-item-metric"
            className="text-foreground/70 shrink-0 text-xs tabular-nums"
          >
            {item.metric}
          </span>
        ) : null}
      </div>
    </li>
  );
}

function ExploreGallery({
  items = [],

  sorts = [],
  sort: sortProp,
  defaultSort,
  onSortChange,
  sortLabel = "Sort",

  types = [],
  type: typeProp,
  defaultType,
  onTypeChange,
  typeLabel = "Type",

  layout = "masonry",
  feedLabel = "Community feed",

  hasMore = false,
  loading = false,
  onLoadMore,
  loadMoreLabel = "Load more",
  loadingLabel = "Loading more…",
  totalCount,
  statusLabel,

  dockedPrompt = true,
  promptValue,
  onPromptValueChange,
  onPromptSubmit,
  promptPlaceholder = "Describe something you want to make…",
  promptLabel = "Prompt",
  promptSubmitLabel = "Create",
  onRemix,
  remixLabel = "Remix",
  openLabel = "Open",

  className,
  ...props
}: ExploreGalleryProps) {
  const promptId = React.useId();

  const [internalSort, setInternalSort] = React.useState(defaultSort ?? sorts[0]?.value);
  const activeSort = sortProp ?? internalSort;

  const [internalType, setInternalType] = React.useState(defaultType);
  const activeType = typeProp ?? internalType;

  const [internalPrompt, setInternalPrompt] = React.useState("");
  const currentPrompt = promptValue ?? internalPrompt;

  const handleSortChange = React.useCallback(
    (next: unknown) => {
      const value = String(next);
      setInternalSort(value);
      onSortChange?.(value);
    },
    [onSortChange],
  );

  const handleTypeChange = React.useCallback(
    (next: string) => {
      setInternalType(next);
      onTypeChange?.(next);
    },
    [onTypeChange],
  );

  const handlePromptChange = React.useCallback(
    (next: string) => {
      setInternalPrompt(next);
      onPromptValueChange?.(next);
    },
    [onPromptValueChange],
  );

  const handleRemix = React.useCallback(
    (item: ExploreGalleryItem) => {
      if (item.prompt !== undefined) {
        setInternalPrompt(item.prompt);
        onPromptValueChange?.(item.prompt);
      }
      onRemix?.(item);
    },
    [onPromptValueChange, onRemix],
  );

  // Derived, not stored: the count text changes as soon as a new page lands,
  // which is what makes the live region announce without an effect.
  const statusText =
    statusLabel ??
    (loading
      ? loadingLabel
      : totalCount === undefined
        ? `${items.length} shown`
        : `${items.length} of ${totalCount} shown`);

  const feedBody = (
    <>
      <ul
        data-slot="explore-gallery-masonry"
        data-layout={layout}
        // role="list" is explicit because list-none strips list semantics in
        // some browsers, and the count is how a screen-reader user knows how
        // much feed they are in.
        role="list"
        className={cn(
          "list-none",
          layout === "masonry"
            ? "columns-1 gap-4 sm:columns-2 lg:columns-3"
            : "grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {items.map((item) => (
          <ExploreGalleryTile
            key={item.id}
            item={item}
            layout={layout}
            remixLabel={remixLabel}
            promptId={dockedPrompt ? promptId : undefined}
            onRemix={handleRemix}
            openLabel={openLabel}
          />
        ))}
      </ul>

      <div data-slot="explore-gallery-more" className="flex flex-col items-center gap-2 py-4">
        <p data-slot="explore-gallery-status" role="status" aria-live="polite" className="text-foreground/70 text-xs">
          {statusText}
        </p>
        {hasMore ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-slot="explore-gallery-load-more"
            onClick={onLoadMore}
            disabled={loading}
            aria-busy={loading || undefined}
          >
            {loading ? loadingLabel : loadMoreLabel}
          </Button>
        ) : null}
      </div>
    </>
  );

  const typePills =
    types.length > 0 ? (
      // A separate control with its own accessible name, deliberately not
      // folded into the tablist above it. A4 choice-chips already ships the
      // ring-selected pill group and its radiogroup semantics.
      <div data-slot="explore-gallery-types">
        <ChoiceChips aria-label={typeLabel} value={activeType} onValueChange={handleTypeChange}>
          {types.map((option) => (
            <ChoiceChip key={option.value} value={option.value}>
              {option.label}
              {option.count === undefined ? null : (
                <span className="text-foreground/70 ml-1.5 text-xs tabular-nums">{option.count}</span>
              )}
            </ChoiceChip>
          ))}
        </ChoiceChips>
      </div>
    ) : null;

  return (
    <div
      data-slot="explore-gallery"
      data-layout={layout}
      data-sort={activeSort}
      data-type={activeType}
      className={cn("flex w-full min-w-0 flex-col gap-4", className)}
      {...props}
    >
      {dockedPrompt ? (
        // Above the feed, inside this component — the spec's "inspiration
        // converts without a navigation step". D1 media-prompt-bar's "docked"
        // presentation is bottom-anchored (rounded-t, no bottom border);
        // here it caps a feed instead of the viewport, so the frame is closed
        // again rather than the presentation being swapped for "floating",
        // which would also drop the settings strip a host may want.
        <div id={promptId} data-slot="explore-gallery-prompt" className="shrink-0">
          <MediaPromptBar
            presentation="docked"
            className="rounded-2xl border-b"
            label={promptLabel}
            placeholder={promptPlaceholder}
            submitLabel={promptSubmitLabel}
            value={currentPrompt}
            onValueChange={handlePromptChange}
            onSubmit={onPromptSubmit}
          />
        </div>
      ) : null}

      {sorts.length > 0 ? (
        <Tabs.Root
          value={activeSort}
          onValueChange={handleSortChange}
          data-slot="explore-gallery-sort-root"
          className="flex min-h-0 flex-1 flex-col gap-3"
        >
          <div data-slot="explore-gallery-controls" className="flex flex-col gap-2">
            <Tabs.List
              data-slot="explore-gallery-sorts"
              aria-label={sortLabel}
              className="bg-muted inline-flex h-8 w-fit items-center gap-1 rounded-lg p-[3px]"
            >
              {sorts.map((option) => (
                <Tabs.Tab
                  key={option.value}
                  value={option.value}
                  data-slot="explore-gallery-sort"
                  // text-foreground/70 clears 4.5:1 on bg-muted; the vendored
                  // tabs wrapper's text-foreground/60 does not (4.04:1).
                  className="text-foreground/70 hover:text-foreground focus-visible:ring-ring data-active:bg-background data-active:text-foreground inline-flex h-full items-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none data-active:shadow-sm"
                >
                  {option.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
            {typePills}
          </div>
          {/* Base UI's Panel is role="tabpanel" with tabIndex=0, which is what
              keeps this scrollable region keyboard-reachable (axe
              scrollable-region-focusable) without inventing a second tab stop. */}
          <Tabs.Panel
            value={activeSort}
            data-slot="explore-gallery-feed"
            className="min-h-0 flex-1 overflow-y-auto outline-none"
          >
            {feedBody}
          </Tabs.Panel>
        </Tabs.Root>
      ) : (
        <>
          {typePills ? (
            <div data-slot="explore-gallery-controls" className="flex flex-col gap-2">
              {typePills}
            </div>
          ) : null}
          <div
            data-slot="explore-gallery-feed"
            role="region"
            aria-label={feedLabel}
            tabIndex={0}
            className="min-h-0 flex-1 overflow-y-auto outline-none"
          >
            {feedBody}
          </div>
        </>
      )}
    </div>
  );
}

export { ExploreGallery };
export type {
  ExploreGalleryItem,
  ExploreGalleryLayout,
  ExploreGalleryProps,
  ExploreGallerySortOption,
  ExploreGalleryTypeOption,
};
