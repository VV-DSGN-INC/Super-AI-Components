"use client";

import { FileIcon, FolderIcon, LayoutGrid, List, MoreHorizontal, Search } from "lucide-react";
import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { FilterBar } from "@/registry/super-ai/filter-bar";
import { PreviewTile } from "@/registry/super-ai/preview-tile";
import { SectionHeader } from "@/registry/super-ai/section-header";

/**
 * Asset Library — the saved-work surface: header actions, search, chips,
 * list/grid, folders.
 *
 * Spec: docs/design-system/component-specs.md#j1-asset-library
 * States: file · folder · mixed · empty · selection-mode
 *
 * Three sentences from the spec drive the whole API:
 *
 * 1. **"Folders and files share one table. A separate folder pane forces
 *    thinking about storage."** There is exactly one `items` array, one
 *    `<tbody>`, and one set of columns. A folder is a row whose `kind` is
 *    `"folder"` — it fills the same Type / Size / Modified columns as a file
 *    ("Folder", "12 items", the same timestamp), which is what makes the claim
 *    structural rather than cosmetic. Folders are hoisted above files in a
 *    stable sort, because that is the only ordering rule the merged table
 *    needs; nothing else about them is special-cased. The same is true in grid
 *    view: one grid, both kinds.
 * 2. **"Row actions live in an overflow menu — the row is a target, not a
 *    toolbar."** Each row exposes exactly one action control, a menu trigger,
 *    and the caller supplies its items through `rowActions`. The trigger is
 *    revealed on hover *and* on focus-within (`opacity-0`, never
 *    `display:none`), so it stays keyboard reachable.
 * 3. **"Selection mode swaps hover for checkboxes and reveals a bulk bar, as
 *    F2 does."** `selectionMode` adds a leading checkbox cell, suppresses the
 *    overflow trigger entirely, and renders the bulk bar. Like F2
 *    `generation-grid`, the two affordances are never live at once — and like
 *    F2, selection is fully controlled: hold `selectedIds` and update it from
 *    `onSelectionChange`, so the component never keeps a second copy that can
 *    drift.
 *
 * **The nested-interactive decision.** A row is a plain `<tr>`: it is not
 * clickable and carries no `onClick`. Opening an item is the *name*, which is
 * a link (`href`) or a button (`onOpen`); the checkbox and the overflow
 * trigger are siblings in their own cells. The alternative — a clickable row
 * with controls inside it — fails axe's `nested-interactive` the moment either
 * control appears, which for this component is always. See
 * docs/design-system/a11y-baseline.md.
 *
 * **This component does not filter.** It owns the search field and the chips
 * row; you own the list. `search` / `onSearchChange` are a controlled input and
 * `filters` is a slot for A5 `filter-chip`s — the items you hand it are the
 * items it renders, so server-side and client-side filtering look identical
 * from here.
 */

type AssetLibraryView = "list" | "grid";
type AssetKind = "file" | "folder";

interface AssetLibraryItem {
  id: string;
  name: string;
  /** Defaults to `"file"`. A folder is a row in the same table, never a pane. */
  kind?: AssetKind;
  /** "Image", "Video", "Scene". Folders always read "Folder". */
  type?: string;
  /** "2.4 MB". A folder shows `itemCount` in this column instead. */
  size?: string;
  /** Folders only. Renders as "12 items" in the size column. */
  itemCount?: number;
  /** "2 days ago". Missing metadata renders an em-dash, never a zero. */
  modified?: string;
  /** Grid media, and the list row's leading glyph when supplied. */
  thumbnail?: React.ReactNode;
  /** Opening by navigation. Wins over `onOpen` — the name becomes a link. */
  href?: string;
}

interface AssetLibraryProps extends Omit<React.ComponentProps<"div">, "onSelect" | "title"> {
  /** A12 `section-header`'s title. */
  title?: React.ReactNode;
  /**
   * "Upload", "New folder". Passed to A12's `action` slot — see the note in the
   * docs module: A12 describes that slot as navigation, and this is the one
   * surface where it legitimately carries acting buttons.
   */
  headerActions?: React.ReactNode;
  items: AssetLibraryItem[];
  /** Controlled search text. The component renders the field; you do the filtering. */
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** A5 `filter-chip`s. Rendered inside an A5 `filter-bar` beside the view switch. */
  filters?: React.ReactNode;
  view?: AssetLibraryView;
  defaultView?: AssetLibraryView;
  onViewChange?: (view: AssetLibraryView) => void;
  /** Swaps hover affordances for checkboxes and reveals the bulk bar. */
  selectionMode?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** The bulk bar's buttons. Only rendered in selection mode. */
  bulkActions?: React.ReactNode;
  /** Makes the name a button. Ignored for an item that has an `href`. */
  onOpen?: (item: AssetLibraryItem) => void;
  /** `DropdownMenuItem`s for one row's overflow menu. No return value, no trigger. */
  rowActions?: (item: AssetLibraryItem) => React.ReactNode;
  /** Replaces the default L1 `empty-state`. Give it a CTA using this surface's verb. */
  empty?: React.ReactNode;
}

/** Folders first, then files, both in the order given. A stable partition. */
function foldersFirst(items: AssetLibraryItem[]): AssetLibraryItem[] {
  return [
    ...items.filter((item) => item.kind === "folder"),
    ...items.filter((item) => item.kind !== "folder"),
  ];
}

const isFolder = (item: AssetLibraryItem) => item.kind === "folder";

/** "Folder" is a word, not a colour — the kind survives without the glyph. */
const typeLabel = (item: AssetLibraryItem) => (isFolder(item) ? "Folder" : (item.type ?? "File"));

/** A folder counts its contents where a file states its size. Missing → em-dash. */
const sizeLabel = (item: AssetLibraryItem) => {
  if (isFolder(item)) {
    return item.itemCount === undefined ? "—" : `${item.itemCount} item${item.itemCount === 1 ? "" : "s"}`;
  }
  return item.size ?? "—";
};

function KindGlyph({ item }: { item: AssetLibraryItem }) {
  return (
    <span aria-hidden className="text-foreground flex size-4 shrink-0 items-center justify-center">
      {isFolder(item) ? <FolderIcon className="size-4" /> : <FileIcon className="size-4" />}
    </span>
  );
}

/**
 * The one interactive thing in a row that is about the item itself. A link when
 * the item navigates, a button when it opens in place, plain text otherwise —
 * so a read-only library never puts empty affordances in the tab order.
 */
function AssetName({
  item,
  onOpen,
  showGlyph = true,
}: {
  item: AssetLibraryItem;
  onOpen?: (item: AssetLibraryItem) => void;
  showGlyph?: boolean;
}) {
  const inner = (
    <>
      {showGlyph ? <KindGlyph item={item} /> : null}
      <span className="truncate">{item.name}</span>
    </>
  );

  const shared =
    "text-foreground focus-visible:ring-ring flex min-w-0 items-center gap-2 rounded-sm text-left font-medium focus-visible:ring-2 focus-visible:outline-none";

  if (item.href) {
    return (
      <a data-slot="asset-library-name" href={item.href} className={cn(shared, "hover:underline")}>
        {inner}
      </a>
    );
  }
  if (onOpen) {
    return (
      <button
        data-slot="asset-library-name"
        type="button"
        onClick={() => onOpen(item)}
        className={cn(shared, "hover:underline")}
      >
        {inner}
      </button>
    );
  }
  return (
    <span data-slot="asset-library-name" className={cn(shared, "font-normal")}>
      {inner}
    </span>
  );
}

/**
 * The row's only action control. Hover- *and* focus-revealed: `opacity-0` keeps
 * it out of the way without taking it out of the tab order, which
 * `display:none` would.
 */
function RowOverflow({
  item,
  rowActions,
}: {
  item: AssetLibraryItem;
  rowActions: (item: AssetLibraryItem) => React.ReactNode;
}) {
  const actions = rowActions(item);
  if (!actions) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="asset-library-row-actions"
        render={
          <button
            type="button"
            aria-label={`Actions for ${item.name}`}
            className="text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-md opacity-0 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none data-popup-open:opacity-100"
          />
        }
      >
        <MoreHorizontal aria-hidden className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{actions}</DropdownMenuContent>
    </DropdownMenu>
  );
}

function AssetLibrary({
  title = "Library",
  headerActions,
  items,
  search,
  onSearchChange,
  searchPlaceholder = "Search assets",
  filters,
  view: viewProp,
  defaultView = "list",
  onViewChange,
  selectionMode = false,
  selectedIds,
  onSelectionChange,
  bulkActions,
  onOpen,
  rowActions,
  empty,
  className,
  ...props
}: AssetLibraryProps) {
  const searchId = React.useId();

  const [internalSearch, setInternalSearch] = React.useState("");
  const searchValue = search ?? internalSearch;
  const handleSearch = (value: string) => {
    if (search === undefined) setInternalSearch(value);
    onSearchChange?.(value);
  };

  const [internalView, setInternalView] = React.useState<AssetLibraryView>(defaultView);
  const view = viewProp ?? internalView;
  const handleView = (next: AssetLibraryView) => {
    if (viewProp === undefined) setInternalView(next);
    onViewChange?.(next);
  };

  const ordered = React.useMemo(() => foldersFirst(items), [items]);
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

  const allSelected = ordered.length > 0 && ordered.every((item) => selected.has(item.id));
  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : ordered.map((item) => item.id));
  };

  const isEmpty = ordered.length === 0;

  const emptyNode = empty ?? (
    <EmptyState
      size="panel"
      title="Nothing here yet"
      description="Files and folders you create or upload will appear in this list."
    />
  );

  return (
    <div
      data-slot="asset-library"
      data-view={view}
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    >
      {/* A12. No data-slot override — the header keeps `section-header`, so the
          docs anatomy can point at the component that actually renders it. */}
      <SectionHeader title={title} count={items.length} action={headerActions} />

      <div data-slot="asset-library-search" className="relative">
        <label htmlFor={searchId} className="sr-only">
          {searchPlaceholder}
        </label>
        <Search aria-hidden className="text-foreground/60 pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          id={searchId}
          type="search"
          value={searchValue}
          placeholder={searchPlaceholder}
          onChange={(event) => handleSearch(event.target.value)}
          className="pl-8"
        />
      </div>

      {/* A5. The chips and the view switch share one row: both are "how the
          list is shown", and neither is a header action. */}
      <FilterBar>
        {filters}
        <ToggleGroup
          data-slot="asset-library-view-toggle"
          size="sm"
          variant="outline"
          spacing={0}
          className="ml-auto"
          value={[view] as string[]}
          onValueChange={(next) => {
            const [value] = next as AssetLibraryView[];
            // Base UI's toggle group unsets on re-press; a view is never unset.
            if (value) handleView(value);
          }}
          aria-label="View"
          // The wrapper renders role="group", which does not support
          // aria-orientation — suppressed as compare-viewer.tsx does. It also
          // does not forward `orientation` to the primitive, which is harmless
          // here: this switch is horizontal, the primitive's default.
          aria-orientation={undefined}
        >
          <ToggleGroupItem value="list" data-slot="asset-library-view-list">
            <List aria-hidden className="size-4" />
            <span className="sr-only">List view</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" data-slot="asset-library-view-grid">
            <LayoutGrid aria-hidden className="size-4" />
            <span className="sr-only">Grid view</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </FilterBar>

      {/* "Reveals a bulk bar" — it exists only in selection mode, which is the
          same mode in which rows suppress their overflow trigger. */}
      {selectionMode ? (
        <div
          data-slot="asset-library-bulk-actions"
          role="toolbar"
          aria-label={`Bulk actions, ${selected.size} selected`}
          className="bg-card text-foreground flex flex-wrap items-center gap-2 rounded-lg border p-2"
        >
          <Checkbox
            checked={allSelected}
            indeterminate={selected.size > 0 && !allSelected}
            onCheckedChange={toggleAll}
            aria-label="Select all"
          />
          <span data-slot="asset-library-selection-count" className="text-xs">
            {selected.size} selected
          </span>
          {bulkActions}
        </div>
      ) : null}

      {isEmpty ? (
        // The header, the search field and the chips stay put: clearing the
        // filter that emptied the list has to remain reachable.
        <div data-slot="asset-library-empty">{emptyNode}</div>
      ) : view === "grid" ? (
        <ul
          data-slot="asset-library-grid"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
        >
          {ordered.map((item) => (
            <AssetTile
              key={item.id}
              item={item}
              onOpen={onOpen}
              rowActions={rowActions}
              selectionMode={selectionMode}
              selected={selected.has(item.id)}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </ul>
      ) : (
        <Table data-slot="asset-library-table">
          <TableHeader>
            <TableRow>
              {selectionMode ? (
                <TableHead className="w-8">
                  <span className="sr-only">Select</span>
                </TableHead>
              ) : null}
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* One body. Folders are the first rows of it, not a second table. */}
            {ordered.map((item) => (
              <TableRow
                key={item.id}
                data-slot="asset-library-row"
                data-asset-id={item.id}
                data-kind={item.kind ?? "file"}
                data-state={selected.has(item.id) ? "selected" : undefined}
                className="group/row"
              >
                {selectionMode ? (
                  <TableCell data-slot="asset-library-select">
                    <Checkbox
                      checked={selected.has(item.id)}
                      onCheckedChange={() => toggle(item.id)}
                      aria-label={`Select ${item.name}`}
                    />
                  </TableCell>
                ) : null}

                <TableCell className="max-w-64">
                  <AssetName item={item} onOpen={onOpen} />
                </TableCell>

                {/* A folder fills the same columns a file does. This is the
                    "one table" claim in its load-bearing form. */}
                <TableCell data-slot="asset-library-type" className="text-foreground/80 text-xs">
                  {typeLabel(item)}
                </TableCell>
                <TableCell data-slot="asset-library-size" className="text-foreground/80 text-xs">
                  {sizeLabel(item)}
                </TableCell>
                <TableCell data-slot="asset-library-modified" className="text-foreground/80 text-xs">
                  {item.modified ?? "—"}
                </TableCell>

                <TableCell className="text-right">
                  {/* Selection mode owns the row; the overflow menu stands down
                      rather than competing with the checkbox. */}
                  {!selectionMode && rowActions ? (
                    <RowOverflow item={item} rowActions={rowActions} />
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

/**
 * Grid view's unit. Same item model, same controls, same sibling relationship
 * between them — only the frame changes, so switching view never changes what
 * you can do to an asset.
 */
function AssetTile({
  item,
  onOpen,
  rowActions,
  selectionMode,
  selected,
  onToggle,
}: {
  item: AssetLibraryItem;
  onOpen?: (item: AssetLibraryItem) => void;
  rowActions?: (item: AssetLibraryItem) => React.ReactNode;
  selectionMode: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <li
      data-slot="asset-library-tile"
      data-asset-id={item.id}
      data-kind={item.kind ?? "file"}
      className="group/row flex min-w-0 flex-col gap-2"
    >
      {/* A8. Decorative here — it takes no `onSelect`, so it stays a div and
          the tile has exactly the same interactive children as a table row. */}
      <PreviewTile aspect="square" selected={selected} labelPlacement="none">
        {item.thumbnail ?? (
          <div className="text-foreground flex h-full w-full items-center justify-center">
            {isFolder(item) ? (
              <FolderIcon aria-hidden className="size-6" />
            ) : (
              <FileIcon aria-hidden className="size-6" />
            )}
          </div>
        )}
      </PreviewTile>

      <div className="flex min-w-0 items-center gap-2">
        {selectionMode ? (
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            aria-label={`Select ${item.name}`}
          />
        ) : null}
        <span className="min-w-0 flex-1 text-sm">
          <AssetName item={item} onOpen={onOpen} showGlyph={false} />
        </span>
        {!selectionMode && rowActions ? <RowOverflow item={item} rowActions={rowActions} /> : null}
      </div>

      <span data-slot="asset-library-tile-meta" className="text-foreground/80 truncate text-xs">
        {typeLabel(item)} · {sizeLabel(item)}
      </span>
    </li>
  );
}

export { AssetLibrary };
export type { AssetKind, AssetLibraryItem, AssetLibraryProps, AssetLibraryView };
