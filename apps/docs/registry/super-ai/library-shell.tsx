"use client";

import { Images } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import { AssetDetail, type AssetDetailParam, type AssetDetailProps, type PromptSpan } from "@/registry/super-ai/asset-detail";
import { AssetLibrary } from "@/registry/super-ai/asset-library";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { FilterChip } from "@/registry/super-ai/filter-bar";
import {
  FilterPanel,
  type FilterPanelSection,
  type FilterPanelViewGroup,
  type FilterSelection,
  type SavedSearch,
} from "@/registry/super-ai/filter-panel";
import { GenerationGrid, type GenerationGridDensity } from "@/registry/super-ai/generation-grid";
import { PreviewTile, type PreviewTileState } from "@/registry/super-ai/preview-tile";

/**
 * Library Shell — personal archive
 *
 * Spec: docs/design-system/block-specs.md#o7-library-shell
 * Regions: facet-rail · header · dense-grid
 *
 * Three regions, not four: the spec's `Regions:` line reads "facet rail ·
 * header + search · dense grid", and the search lives *inside* the header
 * because J1 `asset-library` already owns a header and a search field as one
 * unit. Every region is filled by an already-shipped component; the shell owns
 * arrangement and the two pieces of view state that arrangement implies —
 * which thumbnail size the grid is at, and which asset is open in the lightbox.
 *
 * Three sentences from the spec drive the whole design:
 *
 * 1. **"Dense by default. This is an archive you scan, not a gallery you
 *    browse — thumbnail size is a user preference, not a brand decision."**
 *    F2's density starts at `compact` (eight-up, F2's own "in a library"
 *    setting) and is exposed as a real control in the rail, through J2's
 *    `viewOptions` — the slot J2 documents as "how results are displayed, not
 *    a filter". Density is therefore chosen by the person scanning, never
 *    baked in here.
 * 2. **"Facet counts are what make the rail usable at scale. Without them
 *    every filter click is a gamble."** J2 requires a count on every facet and
 *    folds it into the checkbox's accessible name, so the shell gets that for
 *    free by composing J2 whole instead of rendering its own checkboxes.
 * 3. **"Clicking any tile opens F3, which is where the provenance contract
 *    pays off."** Every cell is an A8 `preview-tile`, and its own frame button
 *    is the thing that opens F3 — no second affordance, no overlay hit target.
 *
 * The rail and the header stay wired to each other: every selected facet is
 * mirrored into the header as an A5 `filter-chip` whose remove control clears
 * that facet in the rail. An archive where the applied filters are only
 * visible in a rail you have scrolled past is how a short result list becomes
 * a mystery.
 */

/**
 * J1 has no header-only mode, and O7 needs exactly its header: title, header
 * actions, search field and the A5 chip row. Its body is F2's job here — a
 * date-sectioned grid whose column count is a user preference, which J1's
 * fixed five-up grid and metadata table are not — so J1 is handed no items and
 * three of its own affordances are suppressed at the call site:
 *
 * - `section-header-count` would read "0" beside the title while the grid
 *   below it holds hundreds. In this shell the counts that matter are the
 *   rail's facet counts, per the spec.
 * - `asset-library-view-toggle` switches J1's own list/grid body, and there is
 *   no J1 body here for it to switch.
 * - `asset-library-empty` is the empty div left behind by `items={[]}`; it
 *   contributes only a flex gap.
 *
 * A call-site descendant variant rather than a fork, same idiom as
 * `model-picker`'s `ENTITY_ROW_SELECTED_DESCRIPTION_FIX`. **Delete all three
 * the moment J1 grows a header-only mode** (an exported `AssetLibraryHeader`,
 * or a `body={false}` prop) — that is the recommended source fix.
 */
const LIBRARY_HEADER_ONLY = [
  "[&_[data-slot=section-header-count]]:hidden",
  "[&_[data-slot=asset-library-view-toggle]]:hidden",
  "[&_[data-slot=asset-library-empty]]:hidden",
].join(" ");

/**
 * The rail's thumbnail-size control, in J2's own `viewOptions` shape. Its ids
 * are F2's density values verbatim so nothing has to translate between them,
 * and it is prepended to any groups the caller supplies rather than replacing
 * them — sort and layout are the caller's business, size is the shell's.
 */
const DENSITY_GROUP_ID = "thumbnail-size";

const DENSITY_OPTIONS: { value: GenerationGridDensity; label: string }[] = [
  { value: "compact", label: "Small" },
  { value: "default", label: "Medium" },
  { value: "comfortable", label: "Large" },
];

interface LibraryAsset {
  id: string;
  /** Names the tile, and is the accessible name of the control that opens it. */
  name: string;
  /** Grid media. Mark it `aria-hidden` unless the alt text adds something. */
  thumbnail?: React.ReactNode;
  /** Full-size media for F3. Falls back to `thumbnail`. */
  media?: React.ReactNode;
  /** A8's own state — loading, locked or failed tiles keep their place in the grid. */
  state?: PreviewTileState;
  /** A8's badge slot — a type mark, a duration, a favourite. */
  badge?: React.ReactNode;
  /** The prompt that produced it. F3 treats it as editable material, not a caption. */
  prompt?: string;
  /** Character ranges within `prompt` that can be lifted straight into a remix. */
  highlightedSpans?: PromptSpan[];
  /** Provenance, in A10's shape. Seed and sampler are what make a result reproducible. */
  params?: AssetDetailParam[];
  cost?: AssetDetailProps["cost"];
}

interface LibraryGroup {
  id: string;
  /** A3 `date-section` renders it. Relative buckets read best — "Today", "Last week". */
  label: string;
  items: LibraryAsset[];
}

interface LibraryShellProps extends Omit<React.ComponentProps<"div">, "onSelect" | "title"> {
  /** J1's header title. */
  title?: React.ReactNode;
  /** "Upload", "New collection" — J1's header action slot. */
  headerActions?: React.ReactNode;
  /** Controlled search text. The shell renders the field; you do the filtering. */
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  /** J2 facet sections. Every facet carries a count; that is J2's contract, not a suggestion. */
  facets?: FilterPanelSection[];
  filtersTitle?: React.ReactNode;
  /** sectionId → selected facet values. Controlled; mirrored into the header as A5 chips. */
  selectedFacets?: FilterSelection;
  defaultSelectedFacets?: FilterSelection;
  onSelectedFacetsChange?: (selected: FilterSelection) => void;
  /** The power archive. A saved search replaces the filter set; a facet narrows it. */
  savedSearches?: SavedSearch[];
  activeSavedSearchId?: string | null;
  onSavedSearchSelect?: (id: string) => void;
  /** Extra J2 view-option groups — sort, layout. Appended after the thumbnail-size group. */
  viewOptions?: FilterPanelViewGroup[];
  onViewOptionChange?: (groupId: string, value: string) => void;

  /** Ungrouped assets. Ignored when `groups` is supplied. */
  assets?: LibraryAsset[];
  /** Date-bucketed assets — one A3 `date-section` per group. */
  groups?: LibraryGroup[];
  /** Thumbnail size. Defaults to `compact`: dense is the archive's resting state. */
  density?: GenerationGridDensity;
  defaultDensity?: GenerationGridDensity;
  onDensityChange?: (density: GenerationGridDensity) => void;
  /** Swaps every tile from "open this" to "select this" and reveals F2's bulk bar. */
  selectMode?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: React.ReactNode;
  /** Replaces the default L1 tile. Give it a CTA using this surface's own verb. */
  empty?: React.ReactNode;

  /** Which asset is open in F3. Controlled; pass `null` for closed. */
  openAssetId?: string | null;
  defaultOpenAssetId?: string | null;
  onOpenAssetChange?: (id: string | null) => void;
  onCopyPrompt?: (asset: LibraryAsset) => void;
  onRemix?: (asset: LibraryAsset, payload: { prompt?: string; span?: string }) => void;
  onEditAsset?: (asset: LibraryAsset) => void;
  onSpanSelect?: (asset: LibraryAsset, text: string, span: PromptSpan) => void;
  /** F3's "More like this" rail — usually a strip of A8 tiles. */
  moreLikeThis?: React.ReactNode;
}

/**
 * One cell. A8 verbatim: its frame is the button, so "clicking any tile opens
 * F3" needs no overlay target and no second control competing with it.
 *
 * The label is placed `overlay` rather than `below` on purpose. A8 renders a
 * `below` label as a *sibling* of the frame button, which leaves the button
 * with nothing but the thumbnail to take a name from — a nameless control
 * whenever the thumbnail is decorative, which in an archive it usually is.
 * Overlay puts the name inside the button where it belongs.
 */
function LibraryShellTile({
  asset,
  selected,
  selectMode,
  onToggle,
  onOpen,
}: {
  asset: LibraryAsset;
  selected: boolean;
  selectMode: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <PreviewTile
      data-asset-id={asset.id}
      aspect="square"
      state={asset.state}
      label={asset.name}
      labelPlacement="overlay"
      badge={asset.badge}
      selected={selected}
      // Select mode replaces the open action rather than layering a checkbox
      // over it — F2's rule that the two are never live at once, applied to
      // the tile itself.
      onSelect={selectMode ? onToggle : onOpen}
    >
      {asset.thumbnail}
    </PreviewTile>
  );
}

function LibraryShell({
  title = "Library",
  headerActions,
  search,
  onSearchChange,
  searchPlaceholder = "Search the library",

  facets = [],
  filtersTitle = "Filters",
  selectedFacets: selectedFacetsProp,
  defaultSelectedFacets,
  onSelectedFacetsChange,
  savedSearches,
  activeSavedSearchId,
  onSavedSearchSelect,
  viewOptions,
  onViewOptionChange,

  assets,
  groups,
  density: densityProp,
  defaultDensity = "compact",
  onDensityChange,
  selectMode = false,
  selectedIds,
  onSelectionChange,
  bulkActions,
  empty,

  openAssetId: openAssetIdProp,
  defaultOpenAssetId = null,
  onOpenAssetChange,
  onCopyPrompt,
  onRemix,
  onEditAsset,
  onSpanSelect,
  moreLikeThis,

  className,
  ...props
}: LibraryShellProps) {
  const [internalSelectedFacets, setInternalSelectedFacets] = React.useState<FilterSelection>(
    defaultSelectedFacets ?? {},
  );
  const selectedFacets = selectedFacetsProp ?? internalSelectedFacets;

  const commitFacets = (next: FilterSelection) => {
    if (selectedFacetsProp === undefined) setInternalSelectedFacets(next);
    onSelectedFacetsChange?.(next);
  };

  const [internalDensity, setInternalDensity] = React.useState<GenerationGridDensity>(defaultDensity);
  const density = densityProp ?? internalDensity;

  const [internalOpenAssetId, setInternalOpenAssetId] = React.useState<string | null>(defaultOpenAssetId);
  const openAssetId = openAssetIdProp !== undefined ? openAssetIdProp : internalOpenAssetId;

  const setOpenAssetId = (id: string | null) => {
    if (openAssetIdProp === undefined) setInternalOpenAssetId(id);
    onOpenAssetChange?.(id);
  };

  const allAssets = React.useMemo(
    () => (groups && groups.length > 0 ? groups.flatMap((group) => group.items) : (assets ?? [])),
    [assets, groups],
  );
  const openAsset = allAssets.find((asset) => asset.id === openAssetId) ?? null;

  // Every selected facet, flattened with the label J2 shows for it, so the
  // header's chips and the rail's checkboxes can never disagree about wording.
  const appliedFacets = React.useMemo(
    () =>
      facets.flatMap((section) =>
        (selectedFacets[section.id] ?? []).map((value) => ({
          sectionId: section.id,
          value,
          label: section.facets.find((facet) => facet.value === value)?.label ?? value,
        })),
      ),
    [facets, selectedFacets],
  );

  const deselectFacet = (sectionId: string, value: string) => {
    const remaining = (selectedFacets[sectionId] ?? []).filter((entry) => entry !== value);
    const next = { ...selectedFacets };
    if (remaining.length > 0) next[sectionId] = remaining;
    else delete next[sectionId];
    commitFacets(next);
  };

  const railViewOptions: FilterPanelViewGroup[] = [
    {
      id: DENSITY_GROUP_ID,
      label: "Thumbnail size",
      options: DENSITY_OPTIONS,
      value: density,
    },
    ...(viewOptions ?? []),
  ];

  const narrowed = appliedFacets.length > 0 || Boolean(search) || Boolean(activeSavedSearchId);
  const emptyTile = empty ?? (
    <EmptyState
      size="in-grid"
      icon={<Images />}
      title={narrowed ? "No matches" : "Nothing saved yet"}
      description={
        narrowed
          ? "Clear a filter in the rail to widen the search."
          : "Everything you generate or upload is archived here."
      }
    />
  );

  return (
    <div
      data-slot="library-shell"
      className={cn(
        "bg-background text-foreground flex h-full min-h-0 w-full flex-col overflow-hidden md:flex-row",
        className,
      )}
      {...props}
    >
      {/* The rail scrolls, so it carries its own tab stop and name (axe
          `scrollable-region-focusable`). Below `md` it becomes a short band
          above the header rather than disappearing: a region that vanishes at
          a breakpoint cannot teach that it exists. */}
      <aside
        data-region="facet-rail"
        tabIndex={0}
        aria-label="Filters"
        className="max-h-56 w-full shrink-0 overflow-y-auto border-b p-4 md:h-full md:max-h-none md:w-64 md:border-r md:border-b-0"
      >
        <FilterPanel
          title={filtersTitle}
          sections={facets}
          selected={selectedFacets}
          onSelectedChange={commitFacets}
          savedSearches={savedSearches}
          activeSavedSearchId={activeSavedSearchId}
          onSavedSearchSelect={onSavedSearchSelect}
          viewOptions={railViewOptions}
          onViewOptionChange={(groupId, value) => {
            if (groupId === DENSITY_GROUP_ID) {
              const next = value as GenerationGridDensity;
              if (densityProp === undefined) setInternalDensity(next);
              onDensityChange?.(next);
              return;
            }
            onViewOptionChange?.(groupId, value);
          }}
        />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* "header + search" is one region because J1 ships them as one unit.
            The applied-facet chips land in J1's own A5 filter-bar row. */}
        <div data-region="header" className="shrink-0 border-b px-4 py-2">
          <AssetLibrary
            title={title}
            headerActions={headerActions}
            items={[]}
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
            filters={
              appliedFacets.length > 0
                ? appliedFacets.map((facet) => (
                    <FilterChip
                      key={`${facet.sectionId}:${facet.value}`}
                      active
                      onClick={() => deselectFacet(facet.sectionId, facet.value)}
                      onRemove={() => deselectFacet(facet.sectionId, facet.value)}
                    >
                      {facet.label}
                    </FilterChip>
                  ))
                : undefined
            }
            // `false`, not `undefined`: J1 falls back to its own L1 for a
            // nullish `empty`, and this shell's empty state belongs in the
            // grid, not in the header.
            empty={false}
            className={LIBRARY_HEADER_ONLY}
          />
        </div>

        {/* The grid scrolls, so it too is focusable and named. */}
        <section
          data-region="dense-grid"
          tabIndex={0}
          aria-label="Assets"
          className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
        >
          <GenerationGrid<LibraryAsset>
            items={groups && groups.length > 0 ? undefined : (assets ?? [])}
            groups={groups?.map((group) => ({ id: group.id, label: group.label, items: group.items }))}
            getItemId={(asset) => asset.id}
            density={density}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onSelectionChange={onSelectionChange}
            bulkActions={bulkActions}
            empty={emptyTile}
            renderItem={(asset, ctx) => (
              <LibraryShellTile
                asset={asset}
                selected={ctx.selected}
                selectMode={ctx.selectMode}
                onToggle={ctx.toggleSelected}
                onOpen={() => setOpenAssetId(asset.id)}
              />
            )}
          />
        </section>
      </div>

      {/* Mounted at shell level, outside every region: F3 is a lightbox over
          the archive, not a fourth pane in it. */}
      <AssetDetail
        open={openAsset !== null}
        onOpenChange={(next) => {
          if (!next) setOpenAssetId(null);
        }}
        media={openAsset?.media ?? openAsset?.thumbnail ?? null}
        prompt={openAsset?.prompt}
        highlightedSpans={openAsset?.highlightedSpans}
        onSpanSelect={
          onSpanSelect && openAsset ? (text, span) => onSpanSelect(openAsset, text, span) : undefined
        }
        params={openAsset?.params}
        cost={openAsset?.cost}
        onCopyPrompt={onCopyPrompt && openAsset ? () => onCopyPrompt(openAsset) : undefined}
        onRemix={onRemix && openAsset ? (payload) => onRemix(openAsset, payload) : undefined}
        onEdit={onEditAsset && openAsset ? () => onEditAsset(openAsset) : undefined}
        moreLikeThis={moreLikeThis}
      />
    </div>
  );
}

export { LibraryShell };
export type { LibraryAsset, LibraryGroup, LibraryShellProps };
