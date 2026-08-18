"use client";

import { FileText, Search } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { AiDocBlock, type AiDocBlockProps } from "@/registry/super-ai/ai-doc-block";
import { AppSidebar } from "@/registry/super-ai/app-sidebar";
import {
  ArtifactGrid,
  type ArtifactGridItem,
  type ArtifactGridSession,
  artifactTypeLabel,
} from "@/registry/super-ai/artifact-grid";
import { DateSection } from "@/registry/super-ai/date-section";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { FilterBar, FilterChip, FiltersButton } from "@/registry/super-ai/filter-bar";

/**
 * Artifact Shell — artifact / document index
 *
 * Spec: docs/design-system/block-specs.md#o9-artifact-shell
 * Regions: sidebar · header (title + filter) · search · artifact-card-grid
 *
 * The index for everything a product has generated. It owns arrangement and
 * nothing else: B1 fills the sidebar, A5 fills the filter row, J4 renders every
 * card, A3 buckets those grids by recency, K1 holds the passage that has not
 * been filed yet, and L1 covers both empty cases. Three sentences from the spec
 * drive the layout, and each is enforced here rather than left to a call site:
 *
 * 1. **"Excerpts, not thumbnails. Artifacts are mostly text and their
 *    auto-generated titles are unreliable — the first lines are what identify
 *    them."** J4 is the only card renderer, and J4 is deliberately not a
 *    `preview-tile` consumer: the excerpt is the card's largest text and the
 *    accessible name of its link. Nothing in this shell adds a media frame, and
 *    the search below matches the excerpt first for the same reason — the field
 *    people recognise an artifact by is the field they will type at.
 * 2. **"Grouped by originating session, so the artifact index and the
 *    conversation history stay linked."** The grid's unit is J4's own
 *    `ArtifactGridSession`, never a flat list of cards. A3 wraps *groups of
 *    sessions* in a date bucket, so recency is the outer axis and the session is
 *    the inner one — which is what keeps a card one heading away from the
 *    conversation that produced it.
 * 3. **"Type badges double as filter facets and must be driven by the same
 *    value in both places."** The facets in the header are derived from the very
 *    same `item.type` values J4 stamps on its badges, and their labels come from
 *    J4's exported `artifactTypeLabel` — so a badge cannot say "Markdown" while
 *    its facet says "MD". J4's own facet row is switched off (`filterable=
 *    {false}`) because the spec puts the filter in the header; two facet rows
 *    driven by two pieces of state is exactly the drift this rule forbids.
 */

/**
 * `contain: layout` makes this element the containing block for its fixed
 * descendants. B1's desktop container is `fixed inset-y-0 h-svh`, correct when a
 * shell owns the viewport and wrong in a docs preview or a Storybook canvas,
 * where it would pin itself to the browser's left edge. Same fix as O2.
 *
 * The unresolved consequence is B1's: it keeps its `h-svh` box and is clipped to
 * the shell's height, so `sidebarPromo` and `sidebarFooter` fall below the clip
 * unless the shell is viewport-tall.
 */
const EMBEDDABLE_SHELL = "[contain:layout]";

/**
 * The other half of `EMBEDDABLE_SHELL`. Containment redirects where the
 * vendored sidebar's `fixed` box is anchored, but its `h-svh` still takes its
 * height from the viewport — so in any shell shorter than the window the
 * sidebar overhangs and everything it bottom-anchors (`sidebarPromo`,
 * `sidebarFooter`) falls below the visible edge. Clipped, not hidden: those
 * controls stayed in the tab order while being invisible.
 *
 * Targets `[data-slot=app-sidebar]`, not the vendored `sidebar-container`
 * default named at `components/ui/sidebar.tsx:230`: B1 renders
 * `<Sidebar data-slot="app-sidebar" ...>`, and `Sidebar` spreads that prop
 * onto the very div that also carries its own `data-slot="sidebar-container"`
 * — the spread lands after the default, so `app-sidebar` is what's actually
 * on the element at runtime. Verified in the browser (rendered `data-slot`
 * inspected directly): the vendored name never appears once B1 is in use.
 *
 * Overriding here rather than in the primitive: `components/ui` is vendored
 * and stays byte-identical to upstream.
 */
const SIDEBAR_FILLS_SHELL = "[&_[data-slot=app-sidebar]]:h-full";

/**
 * A date bucket of sessions. Recency outside, session inside — the spec's
 * grouping rule is about sessions, and A3 is what gives the index the "Today /
 * Last 7 days" spine every artifact library on the board has.
 */
interface ArtifactShellGroup {
  id: string;
  /** "Today", "Last 7 days", "March" — a date bucket, not a session label. */
  label: string;
  /** J4 sessions, in the order they should read within the bucket. */
  sessions: ArtifactGridSession[];
}

interface ArtifactShellProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** B2 workspace switcher, or anything else that belongs above the sidebar nav. */
  switcher?: React.ReactNode;
  /** B3 `sidebar-nav`, B6 `thread-list`, a library tree — whatever navigates the index. */
  nav?: React.ReactNode;
  /** Replaces the default L1 shown when `nav` is empty. */
  navEmpty?: React.ReactNode;
  /**
   * B5 promo or any ambient sidebar CTA.
   *
   * **Clipped out of view unless the shell is viewport-tall** — see
   * `EMBEDDABLE_SHELL` and the pitfalls in the docs page.
   */
  sidebarPromo?: React.ReactNode;
  /** B8 account menu. Same bottom-anchoring clip as `sidebarPromo`. */
  sidebarFooter?: React.ReactNode;
  defaultSidebarOpen?: boolean;

  /** The index's own name. Rendered as the page heading in the header region. */
  title?: React.ReactNode;
  /** Trailing header controls — "New document", a view switch, an overflow menu. */
  headerActions?: React.ReactNode;

  /** Controlled type facet. `null` is "All". */
  activeType?: string | null;
  defaultActiveType?: string | null;
  onActiveTypeChange?: (type: string | null) => void;
  allLabel?: string;
  /** Accessible name of the facet row. */
  filterLabel?: string;
  /** Renders A5's Filters button. Advanced filters are the caller's surface. */
  onOpenFilters?: () => void;
  filtersLabel?: string;

  /** Controlled search text. Pair with `onQueryChange`. */
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** Accessible name of the search field. Visible label is the placeholder. */
  searchLabel?: string;
  searchPlaceholder?: string;
  /**
   * Match `query` against the artifacts this shell was handed. Leave it on for
   * a client-side index; turn it off when the query round-trips to a server and
   * `groups` already arrives filtered, or the local pass will filter the
   * server's results a second time against the excerpt alone.
   */
  localSearch?: boolean;

  /** The index itself: date buckets of J4 sessions. */
  groups?: ArtifactShellGroup[];
  /** Session headers become collapse triggers, per J4. */
  collapsibleSessions?: boolean;
  /** Accessible name of the scrolling grid region. */
  gridLabel?: string;
  /**
   * K1. A passage that has just been generated and has not been filed yet: it
   * sits above the index carrying its own Keep / Edit / Regenerate / Discard
   * verbs, and is deliberately exempt from the filter and the search — it is not
   * in the index until it is kept.
   */
  draft?: AiDocBlockProps;
  draftLabel?: string;
  /** Replaces the default L1 shown when there are no artifacts at all. */
  empty?: React.ReactNode;
  /** Replaces the default L1 shown when the filter or search matches nothing. */
  noResults?: React.ReactNode;
}

function matchesQuery(item: ArtifactGridItem, query: string) {
  if (query === "") return true;
  // Excerpt first, and the title is only one of three fields rather than the
  // primary one: the spec's whole point is that auto-generated titles are
  // unreliable, so a search that only looked at `title` would miss the artifact
  // its own card identifies by its first line.
  return [item.excerpt, item.title ?? "", artifactTypeLabel(item.type)].some((field) =>
    field.toLowerCase().includes(query),
  );
}

function ArtifactShell({
  switcher,
  nav,
  navEmpty,
  sidebarPromo,
  sidebarFooter,
  defaultSidebarOpen = true,

  title = "Artifacts",
  headerActions,

  activeType: activeTypeProp,
  defaultActiveType = null,
  onActiveTypeChange,
  allLabel = "All",
  filterLabel = "Filter artifacts by type",
  onOpenFilters,
  filtersLabel = "Filters",

  query: queryProp,
  defaultQuery = "",
  onQueryChange,
  searchLabel = "Search artifacts",
  searchPlaceholder = "Search by what an artifact says",
  localSearch = true,

  groups = [],
  collapsibleSessions = false,
  gridLabel = "Artifacts",
  draft,
  draftLabel = "Just generated",
  empty,
  noResults,

  className,
  ...props
}: ArtifactShellProps) {
  const searchId = React.useId();
  const draftLabelId = React.useId();

  const [internalType, setInternalType] = React.useState<string | null>(defaultActiveType);
  const typeControlled = activeTypeProp !== undefined;
  const activeType = typeControlled ? activeTypeProp : internalType;
  const setActiveType = (next: string | null) => {
    if (!typeControlled) setInternalType(next);
    onActiveTypeChange?.(next);
  };

  const [internalQuery, setInternalQuery] = React.useState(defaultQuery);
  const queryControlled = queryProp !== undefined;
  const query = queryControlled ? queryProp : internalQuery;
  const setQuery = (next: string) => {
    if (!queryControlled) setInternalQuery(next);
    onQueryChange?.(next);
  };

  const needle = localSearch ? query.trim().toLowerCase() : "";

  let total = 0;
  // Facets count what the *search* left behind, not what the type filter left
  // behind: a facet's number has to answer "how many would I get if I switched
  // to this", which is a question about the other facets, not the active one.
  const facets: { type: string; count: number }[] = [];
  for (const group of groups) {
    for (const session of group.sessions) {
      for (const item of session.items) {
        total += 1;
        if (!matchesQuery(item, needle)) continue;
        const existing = facets.find((facet) => facet.type === item.type);
        if (existing) existing.count += 1;
        else facets.push({ type: item.type, count: 1 });
      }
    }
  }

  let visible = 0;
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      sessions: group.sessions
        .map((session) => ({
          ...session,
          items: session.items.filter(
            (item) =>
              matchesQuery(item, needle) && (activeType === null || item.type === activeType),
          ),
        }))
        .filter((session) => session.items.length > 0),
    }))
    .filter((group) => group.sessions.length > 0);
  for (const group of visibleGroups) {
    for (const session of group.sessions) visible += session.items.length;
  }

  // One facet is not a choice, it is noise — the same rule J4 applies to its own
  // row. The header region stays mounted either way; only the chips go.
  const showFacets = facets.length > 1;

  const resultSummary =
    total === 0
      ? "No artifacts yet"
      : visible === 0
        ? "No artifacts match"
        : visible === total
          ? `${total} ${total === 1 ? "artifact" : "artifacts"}`
          : `${visible} of ${total} artifacts`;

  return (
    <SidebarProvider
      // Overriding a vendored ui/ primitive's slot is house idiom — nothing
      // keys on `sidebar-wrapper`, and the block needs one addressable root.
      data-slot="artifact-shell"
      defaultOpen={defaultSidebarOpen}
      className={cn(
        "bg-background text-foreground h-full min-h-0 w-full overflow-hidden",
        EMBEDDABLE_SHELL,
        SIDEBAR_FILLS_SHELL,
        className,
      )}
      {...props}
    >
      {/* display:contents — the region marker has to be addressable without
          inserting a box between the flex row and B1's own gap/container pair,
          which is what positions the sidebar. */}
      <div data-region="sidebar" className="contents">
        <AppSidebar
          switcher={switcher}
          nav={
            nav ??
            navEmpty ?? (
              <EmptyState
                size="panel"
                title="No collections yet"
                description="Folders and shared spaces you create will be listed here."
              />
            )
          }
          promo={sidebarPromo}
          footer={sidebarFooter}
        />
      </div>

      <SidebarInset className="min-w-0 overflow-hidden">
        {/* "header + filter" is one region in the spec: the facets are how the
            index is scoped, so they belong with its title rather than floating
            above the cards as a second toolbar. */}
        <div
          data-region="header"
          className="bg-background flex shrink-0 flex-col gap-2 border-b px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 data-slot="artifact-shell-title" className="min-w-0 flex-1 truncate text-sm font-semibold">
              {title}
            </h1>
            {headerActions}
          </div>

          {/* A5. No data-slot override — the row keeps `filter-bar`, so the
              docs anatomy can point at the component that actually renders it. */}
          <FilterBar
            role="group"
            aria-label={filterLabel}
            className="gap-1.5"
          >
            {showFacets ? (
              <>
                {/* aria-pressed comes from A5's own chip, so "which facet is
                    active" is programmatic rather than a fill colour. */}
                <FilterChip active={activeType === null} onClick={() => setActiveType(null)}>
                  {allLabel}
                </FilterChip>
                {facets.map(({ type, count }) => (
                  <FilterChip
                    key={type}
                    data-artifact-type={type}
                    active={activeType === type}
                    onClick={() => setActiveType(activeType === type ? null : type)}
                  >
                    {/* artifactTypeLabel, not a display string of this shell's
                        own: the facet and J4's badge read from one function so
                        they cannot drift. */}
                    {artifactTypeLabel(type)}
                    <span className="ml-1 tabular-nums">{count}</span>
                  </FilterChip>
                ))}
              </>
            ) : null}
            {onOpenFilters ? (
              <FiltersButton className="ml-auto" onClick={onOpenFilters}>
                {filtersLabel}
              </FiltersButton>
            ) : null}
          </FilterBar>
        </div>

        {/* Search is its own region, below the header: it searches the whole
            index, including the buckets scrolled off the bottom, so it is not a
            control of the grid it sits above. */}
        <div
          data-region="search"
          className="bg-background flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 py-2"
        >
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            {/* A real label, not a placeholder — the placeholder disappears the
                moment anyone types, taking the field's name with it. */}
            <label htmlFor={searchId} className="sr-only">
              {searchLabel}
            </label>
            <Search
              aria-hidden
              className="text-foreground/60 pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            />
            <Input
              id={searchId}
              type="search"
              value={query}
              placeholder={searchPlaceholder}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-8"
            />
          </div>
          {/* Always mounted, never conditional: a live region has to be in the
              DOM before its text changes for the change to be announced. This is
              what makes "the filter emptied the page" audible rather than a
              silent disappearance. */}
          <p
            data-slot="artifact-shell-result-count"
            role="status"
            className="text-muted-foreground shrink-0 text-xs tabular-nums"
          >
            {resultSummary}
          </p>
        </div>

        {/* The scroll container, so it carries its own tab stop and name — axe's
            scrollable-region-focusable rule, and the only way a keyboard user
            reaches a grid whose cards are all off-screen. */}
        <section
          data-region="artifact-card-grid"
          aria-label={gridLabel}
          tabIndex={0}
          className="focus-visible:ring-ring flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3 py-4 focus-visible:ring-2 focus-visible:outline-none"
        >
          {draft ? (
            // K1 above the index, not inside it: a block still holding its
            // approval verbs is not yet an artifact, and filing it under a date
            // bucket would claim it had been kept.
            <section
              data-slot="artifact-shell-draft"
              aria-labelledby={draftLabelId}
              className="flex flex-col gap-2"
            >
              <h2 id={draftLabelId} className="text-sm font-medium">
                {draftLabel}
              </h2>
              <AiDocBlock {...draft} />
            </section>
          ) : null}

          {total === 0 ? (
            (empty ?? (
              <EmptyState
                size="page"
                title="Nothing has been generated yet"
                description="Documents, code and pages this workspace produces are collected here, newest first."
                icon={<FileText />}
              />
            ))
          ) : visibleGroups.length === 0 ? (
            (noResults ?? (
              <EmptyState
                size="panel"
                // Filtering is what usually empties this view, and a silent
                // disappearance is indistinguishable from a broken filter.
                role="status"
                title="No artifacts match"
                description="Try a different type, or search for a phrase from the artifact itself rather than its title."
                icon={<Search />}
              />
            ))
          ) : (
            visibleGroups.map((group) => (
              // A3. Its own data-slot is left alone; the group id rides on a
              // data attribute instead.
              <DateSection
                key={group.id}
                label={group.label}
                data-group-id={group.id}
                className="space-y-3"
              >
                <ArtifactGrid
                  sessions={group.sessions}
                  // J4's own facet row is off: the spec puts the filter in the
                  // header, and two rows over one index is how a badge and its
                  // facet start disagreeing.
                  filterable={false}
                  collapsibleSessions={collapsibleSessions}
                />
              </DateSection>
            ))
          )}
        </section>
      </SidebarInset>
    </SidebarProvider>
  );
}

export { ArtifactShell };
export type { ArtifactShellGroup, ArtifactShellProps };
