"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PreviewTile, type PreviewTileAspect } from "@/registry/super-ai/preview-tile";
import { SectionHeader } from "@/registry/super-ai/section-header";

/**
 * Tool Panel — The content panel beside the canvas
 *
 * Spec: docs/design-system/component-specs.md#i1-tool-panel
 * States: search · curated-sections · docked-prompt · tabs
 *
 * I1 is "almost entirely composition, which is why it is cheap to build and
 * to vary": the arrangement is search field → curated sections → grid →
 * docked prompt, and every part of it already exists. Section headings are
 * A12 `section-header` (title · count · "View all" action · collapse, on one
 * baseline so a stack of them reads as one rhythm); every grid cell is A8
 * `preview-tile`. This component adds no chrome of its own beyond the frame,
 * the pinned regions and the tab switch.
 *
 * Two things here are load-bearing rather than decorative:
 *
 * 1. **The docked prompt is pinned, outside the scroll region.** It is what
 *    makes this a modality panel rather than an asset browser — the panel is
 *    somewhere you *make* things, not only browse them. It is a sibling of
 *    the scrolling body, never a child of it, so no amount of scrolling can
 *    move it off screen.
 *
 * 2. **Section content is never a ReactNode.** Passing nodes would force the
 *    caller to construct every section's element tree before the panel
 *    decides what to show, and I1's section lists are effectively infinite
 *    (Canva's element library, CapCut's effects). So a section carries either
 *    `items` (plain data, rendered as an A8 grid) or `render` (a callback the
 *    panel invokes only when that section is actually visible — open, and in
 *    the active tab). A collapsed section and an inactive tab both cost
 *    nothing.
 */

type ToolPanelColumns = 2 | 3 | 4;

const COLUMN_CLASS: Record<ToolPanelColumns, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

interface ToolPanelItem {
  id: string;
  /**
   * The tile's accessible name and its overlay caption. Never optional: a
   * thumbnail alone tells a screen-reader user nothing about what inserting
   * this element would do.
   */
  label: string;
  /** Thumbnail content — an `<img>`, a swatch, a preview canvas. */
  thumbnail?: React.ReactNode;
  badge?: React.ReactNode;
  /**
   * Skeleton state for a thumbnail that hasn't arrived. A loading tile is
   * never selectable, and says "loading" in its accessible name rather than
   * relying on the shimmer alone.
   */
  state?: "loading";
  /** Fires when the tile is picked. Omit for a decorative/preview-only tile. */
  onSelect?: () => void;
  /**
   * Only pass this when the tile is a *toggle* (a picker whose choice
   * persists). Its presence switches the tile to `aria-pressed` semantics, so
   * the selection ring is never the only signal. Leave it undefined for
   * insert-style tiles, which act and do not stay on.
   */
  selected?: boolean;
}

interface ToolPanelSection {
  id: string;
  title: React.ReactNode;
  /** Item count shown beside the title by A12. */
  count?: number;
  /** A12's action slot — "View all" is a link, never a button. */
  action?: React.ReactNode;
  collapsible?: boolean;
  /** Only meaningful with `collapsible`. Defaults to open. */
  defaultOpen?: boolean;
  /** Rendered as an A8 `preview-tile` grid. Takes precedence over `render`. */
  items?: ToolPanelItem[];
  /**
   * Escape hatch for content the panel doesn't own (a filter row, a list, a
   * third-party embed). Called only while the section is visible — see the
   * component docblock on lazy rendering.
   */
  render?: () => React.ReactNode;
  /** Which tab this section belongs to. A section with no `tab` shows in every tab. */
  tab?: string;
}

interface ToolPanelTab {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface ToolPanelProps extends Omit<React.ComponentProps<"div">, "onChange" | "defaultValue" | "title"> {
  sections: ToolPanelSection[];
  /** Accessible name for the panel's scrolling body. */
  label?: string;

  /** Turns on the pinned search field at the top of the panel. */
  searchable?: boolean;
  searchValue?: string;
  defaultSearchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;

  /** Category switch above the sections. Omit for a single-list panel. */
  tabs?: ToolPanelTab[];
  activeTab?: string;
  defaultTab?: string;
  onTabChange?: (value: string) => void;
  tabsLabel?: string;

  /**
   * The docked prompt box — typically D1 `media-prompt-bar` or a textarea and
   * a run button. Pinned below the sections and outside their scroll region.
   */
  prompt?: React.ReactNode;

  /** Shown in place of the sections when there are none to show (e.g. no search results). */
  empty?: React.ReactNode;

  /** Aspect ratio for every tile the panel renders from `items`. */
  aspect?: PreviewTileAspect;
  columns?: ToolPanelColumns;

  onSectionOpenChange?: (id: string, open: boolean) => void;
}

function ToolPanelTile({ item, aspect }: { item: ToolPanelItem; aspect: PreviewTileAspect }) {
  const loading = item.state === "loading";

  // A8 draws its own interactive frame when handed `onSelect`, with
  // `aria-pressed` toggle semantics. Most tool-panel tiles *act* (insert an
  // element) rather than toggle, so the tile is composed non-interactively —
  // its frame stays an inert `<div>` that still carries the ring, badge and
  // label — and this component supplies exactly one real button around it.
  // One interactive element per tile, never a button inside a button.
  const tile = (
    <PreviewTile
      aspect={aspect}
      state={loading ? "loading" : "default"}
      selected={item.selected}
      labelPlacement="overlay"
      label={
        loading ? (
          <>
            {item.label}
            <span className="sr-only"> — loading</span>
          </>
        ) : (
          item.label
        )
      }
      badge={item.badge}
    >
      {item.thumbnail}
    </PreviewTile>
  );

  if (loading || !item.onSelect) {
    return (
      <div data-slot="tool-panel-item" data-state={loading ? "loading" : undefined}>
        {tile}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-slot="tool-panel-item"
      onClick={item.onSelect}
      // Only a toggle tile gets aria-pressed; an insert tile is a plain
      // action and must not claim a persistent on/off state it doesn't have.
      {...(item.selected === undefined ? {} : { "aria-pressed": item.selected })}
      className="focus-visible:ring-ring rounded-lg text-left focus-visible:ring-2 focus-visible:outline-none"
    >
      {tile}
    </button>
  );
}

function ToolPanelSectionView({
  section,
  aspect,
  columns,
  open,
  onOpenChange,
}: {
  section: ToolPanelSection;
  aspect: PreviewTileAspect;
  columns: ToolPanelColumns;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const headingId = React.useId();
  const collapsible = section.collapsible ?? false;
  const visible = !collapsible || open;

  return (
    // A plain div with role="group", not a <section>: a named <section> is a
    // `region` landmark, and a panel of eight of them turns the landmark map
    // into noise.
    <div
      data-slot="tool-panel-section"
      data-section={section.id}
      data-state={visible ? "open" : "closed"}
      role="group"
      aria-labelledby={headingId}
      className="flex flex-col gap-2"
    >
      {/* A12 keeps its own `section-header` data-slot — overriding it from
          here would erase the very thing that makes the composition visible. */}
      <SectionHeader
        id={headingId}
        title={section.title}
        count={section.count}
        action={section.action}
        collapsible={collapsible}
        open={collapsible ? open : undefined}
        onOpenChange={onOpenChange}
      />
      {visible ? (
        <div data-slot="tool-panel-section-content">
          {section.items ? (
            <div data-slot="tool-panel-grid" className={cn("grid gap-2", COLUMN_CLASS[columns])}>
              {section.items.map((item) => (
                <ToolPanelTile key={item.id} item={item} aspect={aspect} />
              ))}
            </div>
          ) : (
            // Invoked here, inside the `visible` branch, and nowhere else —
            // this is the whole lazy-render contract.
            section.render?.()
          )}
        </div>
      ) : null}
    </div>
  );
}

function ToolPanel({
  sections,
  label = "Tools",
  searchable = false,
  searchValue,
  defaultSearchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  searchLabel = "Search tools",
  tabs,
  activeTab,
  defaultTab,
  onTabChange,
  tabsLabel = "Categories",
  prompt,
  empty,
  aspect = "square",
  columns = 3,
  onSectionOpenChange,
  className,
  ...props
}: ToolPanelProps) {
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({});
  const [internalTab, setInternalTab] = React.useState<string | undefined>(defaultTab ?? tabs?.[0]?.value);
  const currentTab = activeTab ?? internalTab;

  const isOpen = (section: ToolPanelSection) => openMap[section.id] ?? section.defaultOpen ?? true;

  const handleOpenChange = (section: ToolPanelSection, next: boolean) => {
    setOpenMap((prev) => ({ ...prev, [section.id]: next }));
    onSectionOpenChange?.(section.id, next);
  };

  const renderSections = (list: ToolPanelSection[]) =>
    list.length === 0 ? (
      <div data-slot="tool-panel-empty">{empty}</div>
    ) : (
      list.map((section) => (
        <ToolPanelSectionView
          key={section.id}
          section={section}
          aspect={aspect}
          columns={columns}
          open={isOpen(section)}
          onOpenChange={(next) => handleOpenChange(section, next)}
        />
      ))
    );

  const header =
    searchable || tabs ? (
      <div data-slot="tool-panel-header" className="flex shrink-0 flex-col gap-2 border-b p-3">
        {searchable ? (
          <div data-slot="tool-panel-search" className="relative">
            <Search
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            />
            {/* No data-slot here: Input already sets its own, and passing one
                would replace it. Reach for this by role instead. */}
            <Input
              type="search"
              aria-label={searchLabel}
              placeholder={searchPlaceholder}
              value={searchValue}
              defaultValue={defaultSearchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              className="pl-8"
            />
          </div>
        ) : null}
        {tabs ? (
          <TabsList variant="line" data-slot="tool-panel-tabs" aria-label={tabsLabel} className="w-full justify-start">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.icon ? (
                  <span aria-hidden="true" className="flex size-4 items-center justify-center [&_svg]:size-full">
                    {tab.icon}
                  </span>
                ) : null}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        ) : null}
      </div>
    ) : null;

  const body = (
    // axe `scrollable-region-focusable`: the element that actually scrolls has
    // to be reachable by keyboard, so it takes a tabindex and a name of its
    // own rather than relying on the tiles inside it.
    <div
      data-slot="tool-panel-sections"
      role="group"
      aria-label={label}
      tabIndex={0}
      className="focus-visible:ring-ring flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3 focus-visible:ring-2 focus-visible:outline-none"
    >
      {tabs
        ? tabs.map((tab) => (
            // Base UI unmounts an inactive panel, so a tab you have not
            // opened never renders its sections at all.
            <TabsContent
              key={tab.value}
              value={tab.value}
              data-slot="tool-panel-tab-panel"
              className="flex flex-col gap-4"
            >
              {renderSections(sections.filter((section) => section.tab === undefined || section.tab === tab.value))}
            </TabsContent>
          ))
        : renderSections(sections)}
    </div>
  );

  return (
    <div
      data-slot="tool-panel"
      data-docked-prompt={prompt ? "true" : undefined}
      className={cn("bg-background flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border", className)}
      {...props}
    >
      {tabs ? (
        <Tabs
          value={currentTab}
          onValueChange={(next) => {
            if (typeof next !== "string") return;
            if (activeTab === undefined) setInternalTab(next);
            onTabChange?.(next);
          }}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          {header}
          {body}
        </Tabs>
      ) : (
        <>
          {header}
          {body}
        </>
      )}

      {/* The distinction the spec turns on: the prompt is a sibling of the
          scrolling body, so it cannot scroll away. A tool panel you can only
          browse is an asset browser. */}
      {prompt ? (
        <div data-slot="tool-panel-prompt" className="bg-background shrink-0 border-t p-3">
          {prompt}
        </div>
      ) : null}
    </div>
  );
}

export { ToolPanel };
export type { ToolPanelColumns, ToolPanelItem, ToolPanelProps, ToolPanelSection, ToolPanelTab };
