"use client";

import { Compass } from "lucide-react";
import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AssetDetail, type AssetDetailProps } from "@/registry/super-ai/asset-detail";
import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";
import { EmptyState } from "@/registry/super-ai/empty-state";
import {
  ExploreGallery,
  type ExploreGalleryItem,
  type ExploreGalleryProps,
} from "@/registry/super-ai/explore-gallery";
import { MediaPromptBar, type MediaPromptBarProps } from "@/registry/super-ai/media-prompt-bar";
import { ModalityRail, type ModalityRailItemData } from "@/registry/super-ai/modality-rail";
import { PreviewTile } from "@/registry/super-ai/preview-tile";
import { TemplateDetail, type TemplateDetailProps } from "@/registry/super-ai/template-detail";

/**
 * Explore Shell — community gallery
 *
 * Spec: docs/design-system/block-specs.md#o8-explore-shell
 * Regions: rail · docked-prompt-bar · sort-tabs · masonry-feed
 *
 * Three sentences from the spec drive the arrangement, and each one is the
 * thing a refactor will quietly undo:
 *
 * 1. **"Masonry, not a grid. Community feeds are browsed for surprise, and
 *    equal-height rows suppress exactly that."** J3 `explore-gallery` ships
 *    both layouts; this shell pins `layout="masonry"` and does not forward an
 *    override, because the uniform-grid archetype already exists as O7
 *    `library-shell` ("dense by default… an archive you scan, not a gallery
 *    you browse"). A shell that can be either is neither.
 * 2. **"The prompt bar sits above the feed so inspiration converts into a
 *    generation without a navigation step."** D1 is the first thing under the
 *    rail, above the sort strip, and a tile's Remix action seeds it in place —
 *    nothing navigates, and `onRemix` is the only path between the two.
 * 3. **"Sort tabs and type pills are different axes and must stay as separate
 *    controls."** One region, two controls, two accessible groups: a real
 *    tablist for ordering, A4 `choice-chips` for filtering. Sorting reorders
 *    everything; a type pill removes things. Folded into one row they read as
 *    mutually exclusive when they compose.
 *
 * **Why the shell drives J3's two axes and its prompt bar rather than letting
 * J3 own them.** J3 renders the docked prompt, the sort tabs, the type pills
 * and the feed inside a single root, and exposes no slot on any of them. This
 * shell declares them as three separately addressable regions, and a
 * `data-region` cannot be added to an element you do not render. So J3 is
 * mounted feed-only (`dockedPrompt={false}`, `sorts={[]}`, `types={[]}`) and
 * the shell hosts D1 and the two control groups in their own regions — the
 * same components J3 itself composes, in the same order, with the axes handed
 * back to J3 through `sort`/`type` so its root keeps reflecting them. See the
 * docs pitfalls for the recommended source fix.
 */

/**
 * Base UI's `Tabs.Panel` is `tabIndex={0}` whenever it is open, which is right
 * when the panel is the scroll container — it is what keeps J3's own feed
 * keyboard-reachable (axe `scrollable-region-focusable`). Here the panel is
 * only the region wrapper: J3 keeps its own named, focusable, scrolling feed
 * inside it, so leaving the default would put two tab stops in front of the
 * same content. Suppressed rather than restyled, and asserted in the tests so
 * a Base UI merge-order change cannot silently reinstate it.
 */
const FEED_PANEL_TAB_STOP = -1;

interface ExploreShellSortOption {
  value: string;
  label: string;
}

interface ExploreShellTypeOption {
  value: string;
  label: string;
  /** Facet count, rendered beside the label. Without it every pill is a gamble. */
  count?: number;
}

/**
 * A feed tile, plus what opens when it is clicked.
 *
 * `asset` and `template` are the spec's two detail surfaces — F3 for a
 * generated result, J6 for a template that can be configured and used. Give an
 * item one of them and the shell owns the open state; give it neither and the
 * tile is inert beyond its own `onOpen`. If both are set, F3 wins.
 */
interface ExploreShellItem extends ExploreGalleryItem {
  /** F3 `asset-detail`, opened by this tile. `open` is the shell's. */
  asset?: Omit<AssetDetailProps, "open" | "onOpenChange">;
  /** J6 `template-detail`, opened by this tile. `open` is the shell's. */
  template?: Omit<TemplateDetailProps, "open" | "defaultOpen" | "onOpenChange">;
}

interface ExploreShellProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  /** B4 `modality-rail` destinations — Explore, Create, Organize. */
  rail?: ModalityRailItemData[];
  /** B4's bottom-pinned group: settings, help. Never merged into `rail`. */
  railPinned?: ModalityRailItemData[];
  activeRailId?: string;
  onRailSelect?: (id: string) => void;

  /**
   * D1 `media-prompt-bar`, docked above the feed. The shell owns `value`,
   * `onValueChange` and `onSubmit` because Remix seeds the field from a tile —
   * use `promptValue`/`onPromptValueChange`/`onPromptSubmit` for those.
   */
  prompt?: Omit<MediaPromptBarProps, "presentation" | "value" | "onValueChange" | "onSubmit">;
  promptValue?: string;
  onPromptValueChange?: (value: string) => void;
  onPromptSubmit?: (value: string) => void;

  /** Axis one: ordering. Reorders the whole feed; never removes anything from it. */
  sorts?: ExploreShellSortOption[];
  sort?: string;
  defaultSort?: string;
  onSortChange?: (value: string) => void;
  sortLabel?: string;

  /** Axis two: filtering. Narrows what the feed contains; never reorders it. */
  types?: ExploreShellTypeOption[];
  type?: string;
  defaultType?: string;
  onTypeChange?: (value: string) => void;
  typeLabel?: string;
  /** Shown in the control region when a feed offers neither axis. */
  scopeLabel?: React.ReactNode;

  /** The feed, already sorted and filtered. Variable aspect ratios are the point. */
  items?: ExploreShellItem[];
  /**
   * The rest of J3 — `hasMore`, `loading`, `onLoadMore`, `totalCount`,
   * `feedLabel`, `openLabel`, `remixLabel`. The layout and both axes are the
   * shell's and are deliberately not forwardable.
   */
  gallery?: Omit<
    ExploreGalleryProps,
    | "items"
    | "layout"
    | "dockedPrompt"
    | "sorts"
    | "sort"
    | "defaultSort"
    | "onSortChange"
    | "types"
    | "type"
    | "defaultType"
    | "onTypeChange"
    | "onRemix"
  >;
  /** Replaces the default L1 shown when the feed has nothing in it. */
  empty?: React.ReactNode;

  /** Fires when a tile's Remix action seeds the docked prompt bar. */
  onRemix?: (item: ExploreShellItem) => void;

  /** Which tile's detail surface is open. Omit and the shell keeps its own. */
  openItemId?: string | null;
  onOpenItemChange?: (id: string | null) => void;
  /**
   * How many A8 tiles F3's "more like this" gets when the caller supplies no
   * `moreLikeThis` of its own. Derived from the feed, matched on `type`.
   */
  moreLikeThisCount?: number;
}

/**
 * F3's `moreLikeThis` slot, filled from the feed the shell already has.
 *
 * Each thumbnail is one real `<button>` wrapping an inert A8 `preview-tile`,
 * never A8's own `onSelect` — that renders `aria-pressed`, which is toggle
 * semantics and wrong for "open this instead". Same idiom as J6's preview
 * strip.
 */
function ExploreShellMoreLikeThis({
  items,
  openLabel,
  onOpen,
}: {
  items: ExploreShellItem[];
  openLabel: string;
  onOpen: (id: string) => void;
}) {
  return (
    <div data-slot="explore-shell-more" className="grid grid-cols-4 gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          data-slot="explore-shell-more-item"
          data-item-id={item.id}
          aria-label={`${openLabel} ${item.title}`}
          onClick={() => onOpen(item.id)}
          className="focus-visible:ring-ring rounded-lg focus-visible:ring-2 focus-visible:outline-none"
        >
          <PreviewTile aspect="square">{item.media}</PreviewTile>
        </button>
      ))}
    </div>
  );
}

function ExploreShell({
  rail = [],
  railPinned,
  activeRailId,
  onRailSelect,

  prompt,
  promptValue,
  onPromptValueChange,
  onPromptSubmit,

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
  scopeLabel = "Showing everything",

  items = [],
  gallery,
  empty,
  onRemix,

  openItemId,
  onOpenItemChange,
  moreLikeThisCount = 4,

  className,
  ...props
}: ExploreShellProps) {
  const [internalSort, setInternalSort] = React.useState(defaultSort ?? sorts[0]?.value);
  const activeSort = sortProp ?? internalSort;

  const [internalType, setInternalType] = React.useState(defaultType);
  const activeType = typeProp ?? internalType;

  const [internalPrompt, setInternalPrompt] = React.useState("");
  const currentPrompt = promptValue ?? internalPrompt;

  const [internalOpenId, setInternalOpenId] = React.useState<string | null>(null);
  const openId = openItemId === undefined ? internalOpenId : openItemId;
  const openItem = items.find((item) => item.id === openId);

  const openLabel = gallery?.openLabel ?? "Open";

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

  const setOpenItem = React.useCallback(
    (id: string | null) => {
      if (openItemId === undefined) setInternalOpenId(id);
      onOpenItemChange?.(id);
    },
    [onOpenItemChange, openItemId],
  );

  /**
   * The spec's "inspiration converts into a generation without a navigation
   * step", wired by hand: J3's own Remix seeds *its* docked prompt, and this
   * shell turned that off to host D1 in its own region, so the seeding has to
   * be re-established here or the affordance quietly does nothing.
   */
  const handleRemix = React.useCallback(
    (item: ExploreGalleryItem) => {
      if (item.prompt !== undefined) handlePromptChange(item.prompt);
      const own = items.find((entry) => entry.id === item.id);
      if (own) onRemix?.(own);
    },
    [handlePromptChange, items, onRemix],
  );

  // J3 owns the tile; the shell only adds "and this is what opening it does".
  const galleryItems = React.useMemo<ExploreGalleryItem[]>(
    () =>
      items.map((item) => ({
        ...item,
        onOpen: () => {
          if (item.asset || item.template) setOpenItem(item.id);
          item.onOpen?.();
        },
      })),
    [items, setOpenItem],
  );

  const derivedMoreLikeThis = React.useMemo(() => {
    if (!openItem?.asset) return null;
    const related = items
      .filter((item) => item.id !== openItem.id && (openItem.type === undefined || item.type === openItem.type))
      .slice(0, moreLikeThisCount);
    if (related.length === 0) return null;
    return <ExploreShellMoreLikeThis items={related} openLabel={openLabel} onOpen={setOpenItem} />;
  }, [items, moreLikeThisCount, openItem, openLabel, setOpenItem]);

  const typePills =
    types.length > 0 ? (
      // A4 verbatim: it already ships the ring-selected pill and the
      // radiogroup semantics, and the counts are what make the axis usable at
      // scale — without them every pill click is a gamble.
      <ChoiceChips
        data-slot="explore-shell-types"
        aria-label={typeLabel}
        value={activeType}
        onValueChange={handleTypeChange}
      >
        {types.map((option) => (
          <ChoiceChip key={option.value} value={option.value}>
            {option.label}
            {option.count === undefined ? null : (
              <span className="text-foreground/70 ml-1.5 text-xs tabular-nums">{option.count}</span>
            )}
          </ChoiceChip>
        ))}
      </ChoiceChips>
    ) : null;

  const controls = (
    <div
      data-region="sort-tabs"
      data-slot="explore-shell-controls"
      className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2"
    >
      {sorts.length > 0 ? (
        // variant="line" rather than the default segmented pill: the default
        // paints the list bg-muted, and the trigger's resting colour on that
        // surface is under 4.5:1. The line variant keeps the strip on the page
        // background, where the same colour clears it.
        <TabsList variant="line" aria-label={sortLabel} data-slot="explore-shell-sorts">
          {sorts.map((option) => (
            <TabsTrigger key={option.value} value={option.value} data-sort={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      ) : null}
      {typePills}
      {sorts.length === 0 && types.length === 0 ? (
        // The region is mounted even when a feed offers no axes at all, and an
        // empty control strip teaches nothing. One line saying what the feed
        // currently contains is the smallest honest thing to put there.
        <p data-slot="explore-shell-scope" className="text-foreground/70 text-sm">
          {scopeLabel}
        </p>
      ) : null}
    </div>
  );

  const feed =
    items.length > 0 ? (
      <ExploreGallery
        items={galleryItems}
        // Masonry, not a grid — see the file header. Not forwardable.
        layout="masonry"
        // Feed only: the prompt bar and both axes are regions of this shell.
        dockedPrompt={false}
        sorts={[]}
        types={[]}
        sort={activeSort}
        type={activeType}
        onRemix={handleRemix}
        {...gallery}
        // cn last after the spread, or a caller's gallery.className is swallowed.
        className={cn("h-full min-h-0", gallery?.className)}
      />
    ) : (
      (empty ?? (
        <EmptyState
          size="page"
          icon={<Compass />}
          title="Nothing to explore yet"
          description="Published work from the community collects here. Describe an idea in the bar above to make the first one."
        />
      ))
    );

  return (
    <div
      data-slot="explore-shell"
      data-sort={activeSort}
      data-type={activeType}
      className={cn(
        "bg-background text-foreground flex h-full min-h-0 w-full overflow-hidden",
        className,
      )}
      {...props}
    >
      {/* B4 verbatim. Unlike B1 it is a plain flex child with no fixed
          positioning, so the shell needs no containment to stay embeddable. */}
      <ModalityRail
        data-region="rail"
        items={rail}
        pinned={railPinned}
        activeId={activeRailId}
        onSelect={onRailSelect}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Above the feed, not below it: a bar pinned to the bottom is a
            composer for the page you are on. This one is the way off it. */}
        <div data-region="docked-prompt-bar" className="shrink-0 border-b px-4 py-3">
          <div className="mx-auto w-full max-w-5xl">
            <MediaPromptBar
              presentation="docked"
              label="Prompt"
              placeholder="Describe something you want to make…"
              submitLabel="Create"
              {...prompt}
              value={currentPrompt}
              onValueChange={handlePromptChange}
              onSubmit={onPromptSubmit}
              // D1's docked presentation is bottom-anchored — rounded top, no
              // bottom border — because it normally caps a viewport. Here it
              // caps a feed, so the frame is closed again rather than swapping
              // to "floating", which would also drop the settings strip.
              className={cn("rounded-2xl border-b", prompt?.className)}
            />
          </div>
        </div>

        {sorts.length > 0 ? (
          <Tabs
            value={activeSort}
            onValueChange={handleSortChange}
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 pt-3 pb-4"
          >
            {controls}
            <TabsContent
              value={activeSort}
              data-region="masonry-feed"
              tabIndex={FEED_PANEL_TAB_STOP}
              className="min-h-0 flex-1 overflow-hidden"
            >
              {feed}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 pt-3 pb-4">
            {controls}
            <div data-region="masonry-feed" className="min-h-0 flex-1 overflow-hidden">
              {feed}
            </div>
          </div>
        )}
      </div>

      {/* F3 and J6 are dialogs, so they belong to the shell rather than to a
          region — a detail that owns a region would be a second page. */}
      {openItem?.asset ? (
        <AssetDetail
          {...openItem.asset}
          moreLikeThis={openItem.asset.moreLikeThis ?? derivedMoreLikeThis}
          open
          onOpenChange={(next) => {
            if (!next) setOpenItem(null);
          }}
        />
      ) : openItem?.template ? (
        <TemplateDetail
          {...openItem.template}
          open
          onOpenChange={(next) => {
            if (!next) setOpenItem(null);
          }}
        />
      ) : null}
    </div>
  );
}

export { ExploreShell };
export type {
  ExploreShellItem,
  ExploreShellProps,
  ExploreShellSortOption,
  ExploreShellTypeOption,
};
