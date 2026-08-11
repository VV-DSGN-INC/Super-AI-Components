"use client";

import { ListChecks, Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/registry/super-ai/app-sidebar";
import { AssetLibrary, type AssetLibraryItem } from "@/registry/super-ai/asset-library";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { Feedback, type FeedbackProps } from "@/registry/super-ai/feedback";
import { AddFilterChip, FilterBar, FilterChip, FiltersButton } from "@/registry/super-ai/filter-bar";
import { RecordList, type RecordListItem, type RecordListProps } from "@/registry/super-ai/record-list";

/**
 * Records Shell — project / scenario list
 *
 * Spec: docs/design-system/block-specs.md#o10-records-shell
 * Regions: sidebar · header · filter-sort · record-rows
 *
 * The list page for objects that **run**. It owns arrangement and nothing else:
 * B1 holds the rail, J1 holds the folders, J5 holds the rows, A5 holds the
 * filters, L1 stands in for an empty list and N1 rates it. Three sentences from
 * the spec drive every decision here:
 *
 * 1. "These records execute, so the enable toggle is the primary control and
 *    belongs in the row, not behind an overflow menu." That is J5's own
 *    guarantee, and the reason the shell composes J5 instead of laying out its
 *    own rows: the moment a shell renders its own row markup, the toggle
 *    becomes a design choice again. The shell forwards `onEnabledChange`
 *    straight through and never intercepts it.
 * 2. "Run status in the subtitle (last run, draft, failing) is what makes the
 *    list operational rather than decorative." Also J5's, also forwarded
 *    untouched — `runState` renders as an icon *and* words inside the subtitle,
 *    never as its own column and never as colour alone.
 * 3. "Distinct from O7 because the objects are runnable rather than stored —
 *    the same list layout would mislead." So this shell deliberately has no
 *    grid view, no thumbnails and no bulk-selection mode: everything that makes
 *    a stored-asset browser pleasant makes a list of live automations
 *    ambiguous. The one J1 surface it does use is folder mode, and its view
 *    switch is suppressed for exactly that reason.
 *
 * ## Where the folders live
 *
 * The spec names J1 in folder mode without saying which region holds it. It
 * goes in `record-rows`, above J5, because J1's own spec is emphatic that
 * "folders and files share one table — a separate folder pane forces thinking
 * about storage". Hoisting folders into the sidebar would rebuild exactly the
 * pane J1 exists to avoid, and J1's five-column table has no legible rendering
 * at rail width anyway. The sidebar stays what B1 is for: product navigation.
 */

/**
 * `contain: layout` makes this element the containing block for its fixed
 * descendants. The vendored `Sidebar`'s desktop container is `fixed inset-y-0
 * h-svh`, which is right only when the shell owns the viewport — in a docs
 * preview or a Storybook canvas it would pin itself to the browser's left edge.
 * Same fix, same reason, as `chat-shell`.
 */
const EMBEDDABLE_SHELL = "[contain:layout]";

/**
 * J1 renders a list/grid switch and offers no way to turn it off — `view` can be
 * pinned, but the control still renders and still invites a press that now does
 * nothing. A grid of folder tiles stacked on top of a table of runnable records
 * is not this shell (spec: "the same list layout would mislead"), so the switch
 * is suppressed rather than left as dead UI. `display:none` takes it out of the
 * tab order and the accessibility tree, which is the point: this is a
 * suppression, not a visual hide.
 *
 * Delete this the moment J1 grows a `viewSwitch={false}` opt-out.
 */
const FOLDERS_NO_VIEW_SWITCH = "[&_[data-slot=asset-library-view-toggle]]:hidden";

/** The sort control's stand-in when the caller has no opinion about ordering. */
const DEFAULT_SORT_OPTIONS: RecordsShellSortOption[] = [
  { value: "recent", label: "Last run" },
  { value: "name", label: "Name" },
  { value: "created", label: "Date created" },
];

interface RecordsShellFolder {
  id: string;
  name: string;
  /** How many records the folder holds. Rendered by J1 as "12 items". */
  count?: number;
  /** Makes the folder name a link. Otherwise `onOpenFolder` makes it a button. */
  href?: string;
  /** "2 days ago". */
  modified?: string;
}

interface RecordsShellFilter {
  id: string;
  label: string;
  active?: boolean;
  onToggle?: (id: string) => void;
  /** Renders A5's sibling remove button. Applied filters should be removable. */
  onRemove?: (id: string) => void;
}

interface RecordsShellSortOption {
  value: string;
  label: string;
}

interface RecordsShellProps extends Omit<React.ComponentProps<"div">, "title" | "onSelect"> {
  /** B2 workspace switcher, or anything else that belongs above the rail's nav. */
  switcher?: React.ReactNode;
  /**
   * B1's nav slot — B3 `sidebar-nav`, or whatever your product area needs.
   * Empty renders L1 in the sidebar rather than a blank rail.
   */
  nav?: React.ReactNode;
  /** Replaces the default L1 shown when `nav` is empty. */
  navEmpty?: React.ReactNode;
  /** Starts the sidebar collapsed — the shell's half of B1's width contract. */
  defaultSidebarOpen?: boolean;

  /** The list's name. Rendered as the page heading in the header region. */
  title?: string;
  /** Overrides the count beside the title. Defaults to `records.length`. */
  count?: number;
  /**
   * The create action, which the spec puts in the header ("header + create").
   * Supplying `onCreate` renders the button; `createAction` replaces it whole
   * when creation is a menu rather than a single verb.
   */
  createLabel?: string;
  onCreate?: () => void;
  createAction?: React.ReactNode;
  /** Extra header controls, placed before the create action. */
  headerActions?: React.ReactNode;

  /** A5 chips. Applied filters, in the order you want them read. */
  filters?: RecordsShellFilter[];
  /** Renders A5's dashed add-filter chip. Omit and no chip appears. */
  addFilterLabel?: string;
  onAddFilter?: () => void;
  /** A5's filters button — the escape hatch into a full filter panel. */
  filtersLabel?: string;
  onOpenFilters?: () => void;
  sortOptions?: RecordsShellSortOption[];
  sort?: string;
  defaultSort?: string;
  onSortChange?: (value: string) => void;
  sortLabel?: string;

  /** J1 folder rows, above the records. Empty renders J1's own empty affordance. */
  folders?: RecordsShellFolder[];
  foldersLabel?: React.ReactNode;
  onOpenFolder?: (id: string) => void;
  /** Replaces the default L1 shown when there are no folders. */
  foldersEmpty?: React.ReactNode;
  /**
   * The page's search box — J1 owns the field, you own the filtering. It sits
   * above both lists because it searches both: hand it folders and records that
   * already match, exactly as J1 documents.
   */
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  /** J5 rows. Empty renders L1 in the record-rows region. */
  records?: RecordListItem[];
  /** The primary control of the whole shell. Forwarded to J5's in-row toggle. */
  onEnabledChange?: (id: string, enabled: boolean) => void;
  onOpenRecord?: (id: string) => void;
  recordsLabel?: string;
  /** The rest of J5 — `maxApps`, `className`, anything the shell does not own. */
  recordList?: Omit<RecordListProps, "records" | "onEnabledChange" | "onOpen" | "label">;
  /** Replaces the default L1 shown when there are no records. */
  empty?: React.ReactNode;

  /**
   * N1, rating the list itself. The spec names N1 without saying what it rates,
   * and J5 renders one `<table>` with no per-row slot, so per-record feedback is
   * not reachable without forking it. List-level it is — see the docs pitfalls.
   */
  feedback?: FeedbackProps;
  feedbackCaption?: React.ReactNode;
}

function RecordsShell({
  switcher,
  nav,
  navEmpty,
  defaultSidebarOpen = true,

  title = "Scenarios",
  count,
  createLabel = "Create",
  onCreate,
  createAction,
  headerActions,

  filters = [],
  addFilterLabel,
  onAddFilter,
  filtersLabel = "Filters",
  onOpenFilters,
  sortOptions = DEFAULT_SORT_OPTIONS,
  sort: sortProp,
  defaultSort,
  onSortChange,
  sortLabel = "Sort by",

  folders = [],
  foldersLabel = "Folders",
  onOpenFolder,
  foldersEmpty,
  search,
  onSearchChange,
  searchPlaceholder = "Search records and folders",

  records = [],
  onEnabledChange,
  onOpenRecord,
  recordsLabel = "Records",
  recordList,
  empty,

  feedback,
  feedbackCaption = "Is this list telling you what you need?",

  className,
  ...props
}: RecordsShellProps) {
  const headingId = React.useId();

  // Optional-controlled, the same split J1 uses for `view`: a shell that forced
  // every consumer to hold a sort key would be unusable in a static demo.
  const [internalSort, setInternalSort] = React.useState(
    defaultSort ?? sortOptions[0]?.value ?? "",
  );
  const sort = sortProp ?? internalSort;
  const handleSort = (next: string) => {
    if (sortProp === undefined) setInternalSort(next);
    onSortChange?.(next);
  };
  const currentSort = sortOptions.find((option) => option.value === sort);

  // J1's item model, in folder mode: every row is `kind: "folder"`, so J1's
  // folders-first partition is a no-op and its Type column reads "Folder" for
  // all of them. This is the whole of the mapping — no shadow list.
  const folderItems: AssetLibraryItem[] = folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    kind: "folder",
    itemCount: folder.count,
    modified: folder.modified,
    href: folder.href,
  }));

  return (
    <SidebarProvider
      // Overriding a vendored ui/ primitive's slot is house idiom — nothing
      // keys on `sidebar-wrapper`, and the block needs one addressable root.
      data-slot="records-shell"
      defaultOpen={defaultSidebarOpen}
      className={cn(
        "bg-background text-foreground h-full min-h-0 w-full overflow-hidden",
        EMBEDDABLE_SHELL,
        className,
      )}
      {...props}
    >
      {/* display:contents — the region marker has to be addressable without
          inserting a box between the flex row and B1's own gap/container
          pair, which is what positions the sidebar. */}
      <div data-region="sidebar" className="contents">
        <AppSidebar
          switcher={switcher}
          nav={
            nav ??
            navEmpty ?? (
              <EmptyState
                size="panel"
                title="Nothing pinned"
                description="Pinned folders and saved views appear here."
              />
            )
          }
        />
      </div>

      <SidebarInset className="min-w-0 overflow-hidden">
        {/* "header + create". The create action is the region's reason to
            exist, so it sits here rather than floating over the rows. */}
        <header
          data-region="header"
          className="bg-background flex h-14 shrink-0 items-center gap-2 border-b px-2"
        >
          <SidebarTrigger />
          {/* min-w-0 so the heading truncates at drawer width instead of
              pushing the create action off the end of the bar. */}
          <h1 id={headingId} className="min-w-0 truncate text-base font-semibold">
            {title}
          </h1>
          <span
            data-slot="records-shell-count"
            className="text-foreground/70 shrink-0 text-sm tabular-nums"
          >
            {count ?? records.length}
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {headerActions}
            {createAction ??
              (onCreate ? (
                <Button size="sm" onClick={onCreate}>
                  <Plus aria-hidden />
                  {createLabel}
                </Button>
              ) : null)}
          </div>
        </header>

        {/* "filter + sort". A5 owns the chips and the filters button; the sort
            is the vendored Select, because A5 has no sort affordance and a
            fourth chip that opens a menu would read as another filter. */}
        <div
          data-region="filter-sort"
          className="bg-background flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2"
        >
          {/* role="group" so the name is allowed to land: `aria-label` on a
              bare div is a prohibited attribute and axe flags it. */}
          <FilterBar role="group" aria-label="Filter records">
            {filters.map((filter) => (
              <FilterChip
                key={filter.id}
                active={filter.active}
                onClick={() => filter.onToggle?.(filter.id)}
                onRemove={filter.onRemove ? () => filter.onRemove?.(filter.id) : undefined}
              >
                {filter.label}
              </FilterChip>
            ))}
            {onAddFilter ? (
              <AddFilterChip onClick={onAddFilter}>{addFilterLabel ?? "filter"}</AddFilterChip>
            ) : null}
            <FiltersButton onClick={onOpenFilters}>{filtersLabel}</FiltersButton>
          </FilterBar>

          <div data-slot="records-shell-sort" className="ml-auto flex items-center gap-2">
            <Select value={sort} onValueChange={(next) => handleSort(String(next))}>
              {/* The trigger carries the visible-name job: a bare chevron would
                  leave "sorted by what?" answerable only by opening it. */}
              <SelectTrigger size="sm" aria-label={sortLabel} data-slot="records-shell-sort-trigger">
                {/* Trap: SelectValue renders the raw `value` unless it is given
                    children, so the option's label has to be resolved here. */}
                <SelectValue placeholder={sortLabel}>{currentSort?.label ?? sortLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* "record rows". Folders and records share this region and this scroll
            container — one surface, folders first, which is J1's own ordering
            rule applied one level up. */}
        <section
          data-region="record-rows"
          // A `section` with a name is a landmark, which is what lets the
          // scroll container carry `tabIndex` without tripping axe's
          // `scrollable-region-focusable`, and what makes `aria-labelledby`
          // legal here where it would be prohibited on a bare div.
          aria-labelledby={headingId}
          tabIndex={0}
          className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3 py-4"
        >
          {/* J1 in folder mode. Its search field is the page's search: it sits
              above both lists because it filters both, and J1 does no filtering
              of its own — you hand it what already matched. */}
          <AssetLibrary
            title={foldersLabel}
            items={folderItems}
            view="list"
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
            onOpen={(item) => onOpenFolder?.(item.id)}
            empty={
              foldersEmpty ?? (
                <EmptyState
                  size="panel"
                  title="No folders yet"
                  description="Group records into folders once the list outgrows one screen."
                />
              )
            }
            className={FOLDERS_NO_VIEW_SWITCH}
          />

          {records.length > 0 ? (
            <RecordList
              records={records}
              label={recordsLabel}
              // The primary control, straight through. The shell never wraps,
              // debounces or confirms it — one keystroke from the list is the
              // behaviour the spec is asking for.
              onEnabledChange={onEnabledChange}
              onOpen={onOpenRecord}
              {...recordList}
              // cn last: a bare className after the spread would silently
              // swallow a caller's `recordList.className`.
              className={cn(recordList?.className)}
            />
          ) : (
            (empty ?? (
              <EmptyState
                size="page"
                title="No records yet"
                description="Records are the things this workspace runs. Create one and it will show its last run here."
                icon={<ListChecks />}
                action={
                  onCreate ? (
                    <Button size="sm" onClick={onCreate}>
                      <Plus aria-hidden />
                      {createLabel}
                    </Button>
                  ) : undefined
                }
              />
            ))
          )}

          {feedback ? (
            <div
              data-slot="records-shell-feedback"
              className="flex flex-wrap items-center gap-3 border-t pt-4"
            >
              <span className="text-sm">{feedbackCaption}</span>
              <Feedback {...feedback} className={cn("flex-row items-center", feedback.className)} />
            </div>
          ) : null}
        </section>
      </SidebarInset>
    </SidebarProvider>
  );
}

export { RecordsShell };
export type {
  RecordsShellFilter,
  RecordsShellFolder,
  RecordsShellProps,
  RecordsShellSortOption,
};
