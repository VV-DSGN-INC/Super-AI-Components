"use client";

import { Check } from "lucide-react";
import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";
import { ResetAffordance } from "@/registry/super-ai/reset-affordance";
import { SectionHeader } from "@/registry/super-ai/section-header";

/**
 * Filter Panel — Faceted rail
 *
 * Spec: docs/design-system/component-specs.md#j2-filter-panel
 * States: facet-counts · see-more · collapsed-section · saved-searches · view-options
 *
 * The rail end of the filtering scale ladder: A4 `filter-bar` handles a handful
 * of chips, and past roughly six facets a surface escalates to this. Three spec
 * sentences are load-bearing and are enforced here rather than left to the call
 * site:
 *
 * 1. **"Counts beside each facet are essential. A filter that will return
 *    nothing should say so first."** `count` is a required field on every
 *    facet, not an optional decoration, and it is part of the checkbox's
 *    accessible name — a screen-reader user hears "Portrait 128" before
 *    deciding. A facet whose count is `0` is rendered `disabled`, still shows
 *    its `0`, and carries an sr-only "no matches". The dead end is stated
 *    before the click, and it is stated in text and in a programmatic state,
 *    never by dimming alone.
 *
 * 2. **"Saved searches separate a power archive from a library."** They are
 *    their own block above the facets — a distinct region with its own heading,
 *    not one more checkbox group. A saved search *replaces* the filter set;
 *    a facet *narrows* it, and conflating the two is what turns a library into
 *    a pile.
 *
 * 3. **"Sections collapse and remember state."** The open set is owned here,
 *    with `openSections` / `onOpenSectionsChange` as the controlled escape
 *    hatch so a host can persist it. Nothing survives a reload on its own. A
 *    collapsed section that still has filters applied says "N selected" in its
 *    header, so collapsing never hides the reason a result list is short.
 *
 * On the base: A12 `section-header` supplies each facet group's title, count,
 * badge slot and collapse trigger (`aria-expanded` and all), exactly as
 * `tool-panel` and `property-inspector` use it. Base UI's `Collapsible` is
 * deliberately not layered on top: its `Trigger` would be a second control for
 * the same disclosure, and A12's button already is that control.
 */

interface FilterFacet {
  /** Stable within its section; what `onSelectedChange` reports. */
  value: string;
  label: string;
  /**
   * How many results this facet would leave. Required — the count is the point
   * of the component. `0` renders a disabled facet that still shows its zero.
   */
  count: number;
}

interface FilterPanelSection {
  id: string;
  /** Group heading. Also names the checkbox group and the see-more button. */
  label: string;
  facets: FilterFacet[];
  /**
   * Overflow threshold. With more facets than this, only the first `visibleCount`
   * render and a "Show N more" button reveals the rest. Omit for a short list
   * that should always render whole.
   */
  visibleCount?: number;
  /** Sections open by default; pass `false` for the ones that are usually noise. */
  defaultOpen?: boolean;
}

interface SavedSearch {
  id: string;
  label: string;
  /** Result count for the saved search, shown the same way a facet count is. */
  count?: number;
}

interface FilterPanelViewOption {
  value: string;
  label: string;
}

interface FilterPanelViewGroup {
  id: string;
  /** "Sort", "Layout", "Size" — names the radio group. */
  label: string;
  options: FilterPanelViewOption[];
  /** Controlled value. Omit and pass `defaultValue` for an uncontrolled group. */
  value?: string;
  defaultValue?: string;
}

type FilterSelection = Record<string, string[]>;

interface FilterPanelProps extends Omit<React.ComponentProps<"div">, "onChange" | "title"> {
  /** Panel heading. Pass `null` to drop the header row entirely. */
  title?: React.ReactNode;
  sections?: FilterPanelSection[];

  /** sectionId → selected facet values. Controlled. */
  selected?: FilterSelection;
  defaultSelected?: FilterSelection;
  onSelectedChange?: (selected: FilterSelection) => void;

  /**
   * Which sections are open, by id. The controlled escape hatch for the spec's
   * "sections collapse and remember state" — the panel remembers within its own
   * lifetime, and a host that wants the memory to survive a reload persists
   * this and feeds it back.
   */
  openSections?: string[];
  defaultOpenSections?: string[];
  onOpenSectionsChange?: (openSections: string[]) => void;

  /** The power archive. Rendered as its own block, never as a facet group. */
  savedSearches?: SavedSearch[];
  savedSearchesLabel?: string;
  activeSavedSearchId?: string | null;
  onSavedSearchSelect?: (id: string) => void;

  /** How results are displayed — sort, layout, density. Not a filter. */
  viewOptions?: FilterPanelViewGroup[];
  onViewOptionChange?: (groupId: string, value: string) => void;

  /** Fires after the panel has cleared every facet. */
  onClearAll?: () => void;
  clearLabel?: string;
}

function FilterPanelFacet({
  facet,
  sectionId,
  checked,
  onCheckedChange,
}: {
  facet: FilterFacet;
  sectionId: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = React.useId();
  // "A filter that will return nothing should say so first": the control is
  // genuinely unavailable, and the reason is text, not a shade.
  const empty = facet.count === 0;

  return (
    <label
      htmlFor={id}
      data-slot="filter-panel-facet"
      data-section={sectionId}
      data-value={facet.value}
      data-empty={empty ? "true" : undefined}
      data-state={checked ? "checked" : "unchecked"}
      className={cn(
        "flex items-center gap-2 rounded-md px-1.5 py-1.5 text-sm",
        empty ? "cursor-not-allowed" : "hover:bg-accent hover:text-accent-foreground cursor-pointer",
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={empty}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      {/* Base UI wires the wrapping label to the control, so the whole row
          becomes the checkbox's accessible name — which is why the count is
          heard at the same moment it is seen. Name computation concatenates
          sibling nodes with no separator ("Portrait128"), so the spaces
          between these spans are explicit text nodes, not layout gaps. */}
      <span data-slot="filter-panel-facet-label" className="min-w-0 flex-1 truncate">
        {facet.label}
      </span>{" "}
      <span
        data-slot="filter-panel-facet-count"
        // text-foreground, not muted: this row paints bg-accent on hover, and
        // muted-on-accent measures 4.34:1. See docs/design-system/a11y-baseline.md.
        className="text-foreground shrink-0 text-xs tabular-nums"
      >
        {facet.count}
      </span>
      {/* The dead end, stated in words as well as by `disabled` and the 0. */}
      {empty ? (
        <>
          {" "}
          <span className="sr-only">no matches</span>
        </>
      ) : null}
    </label>
  );
}

function FilterPanelSectionView({
  section,
  selected,
  open,
  onOpenChange,
  onFacetChange,
}: {
  section: FilterPanelSection;
  selected: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFacetChange: (value: string, checked: boolean) => void;
}) {
  const headingId = React.useId();
  // The overflow is local to the section and to this mount: reopening a group
  // should not remember that you once expanded it three screens ago.
  const [expanded, setExpanded] = React.useState(false);

  const limit = section.visibleCount;
  const overflows = limit !== undefined && section.facets.length > limit;
  const shown = overflows && !expanded ? section.facets.slice(0, limit) : section.facets;
  const remaining = overflows ? section.facets.length - (limit as number) : 0;
  const selectedCount = selected.length;

  return (
    // A plain div with role="group", not a <section>: a named <section> is a
    // `region` landmark, and a rail of six of them turns the landmark map into
    // noise. The group is what makes the checkboxes navigable as a set.
    <div
      data-slot="filter-panel-section"
      data-section={section.id}
      data-state={open ? "open" : "closed"}
      role="group"
      aria-labelledby={headingId}
      className="flex flex-col gap-1"
    >
      <SectionHeader
        id={headingId}
        size="sm"
        title={section.label}
        count={section.facets.length}
        collapsible
        open={open}
        onOpenChange={onOpenChange}
        // A12's action slot, carrying inert text rather than a link: a section
        // collapsed over live filters must not look identical to an empty one,
        // and this is the one signal that survives the collapse.
        action={
          selectedCount > 0 ? (
            <span data-slot="filter-panel-section-selected" className="text-foreground text-xs font-medium">
              {selectedCount} selected
            </span>
          ) : undefined
        }
      />
      {open ? (
        <div data-slot="filter-panel-facets" className="flex flex-col">
          {shown.map((facet) => (
            <FilterPanelFacet
              key={facet.value}
              facet={facet}
              sectionId={section.id}
              checked={selected.includes(facet.value)}
              onCheckedChange={(next) => onFacetChange(facet.value, next)}
            />
          ))}
          {overflows ? (
            // A real button, and its name carries the number still hidden —
            // "Show 18 more in Format", never a bare "Show all" repeated six
            // times down the rail.
            <button
              type="button"
              data-slot="filter-panel-see-more"
              data-remaining={remaining}
              data-state={expanded ? "expanded" : "collapsed"}
              onClick={() => setExpanded((prev) => !prev)}
              aria-label={
                expanded ? `Show fewer in ${section.label}` : `Show ${remaining} more in ${section.label}`
              }
              className="text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring mt-0.5 self-start rounded-md px-1.5 py-1 text-sm underline underline-offset-2 focus-visible:ring-2 focus-visible:outline-none"
            >
              {expanded ? "Show fewer" : `Show ${remaining} more`}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FilterPanelViewGroupView({
  group,
  onValueChange,
}: {
  group: FilterPanelViewGroup;
  onValueChange?: (value: string) => void;
}) {
  const labelId = React.useId();

  return (
    <div data-slot="filter-panel-view-option-group" data-group={group.id} className="flex flex-col gap-1.5">
      <span
        id={labelId}
        data-slot="filter-panel-view-option-label"
        className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
      >
        {group.label}
      </span>
      <ChoiceChips
        aria-labelledby={labelId}
        value={group.value}
        defaultValue={group.defaultValue ?? group.options[0]?.value}
        onValueChange={onValueChange}
        className="gap-1.5"
      >
        {group.options.map((option) => (
          <ChoiceChip key={option.value} value={option.value} className="px-2 py-1 text-xs">
            {option.label}
          </ChoiceChip>
        ))}
      </ChoiceChips>
    </div>
  );
}

function FilterPanel({
  title = "Filters",
  sections = [],
  selected: selectedProp,
  defaultSelected,
  onSelectedChange,
  openSections: openSectionsProp,
  defaultOpenSections,
  onOpenSectionsChange,
  savedSearches,
  savedSearchesLabel = "Saved searches",
  activeSavedSearchId,
  onSavedSearchSelect,
  viewOptions,
  onViewOptionChange,
  onClearAll,
  clearLabel = "Clear all filters",
  className,
  children,
  ...props
}: FilterPanelProps) {
  const savedHeadingId = React.useId();
  const viewHeadingId = React.useId();

  const [internalSelected, setInternalSelected] = React.useState<FilterSelection>(defaultSelected ?? {});
  const selected = selectedProp ?? internalSelected;

  const [internalOpen, setInternalOpen] = React.useState<string[]>(
    () => defaultOpenSections ?? sections.filter((s) => s.defaultOpen ?? true).map((s) => s.id),
  );
  const openSections = openSectionsProp ?? internalOpen;

  const setOpen = (sectionId: string, next: boolean) => {
    const without = openSections.filter((id) => id !== sectionId);
    const value = next ? [...without, sectionId] : without;
    if (openSectionsProp === undefined) setInternalOpen(value);
    onOpenSectionsChange?.(value);
  };

  const commit = (next: FilterSelection) => {
    if (selectedProp === undefined) setInternalSelected(next);
    onSelectedChange?.(next);
  };

  const toggleFacet = (sectionId: string, value: string, checked: boolean) => {
    const current = selected[sectionId] ?? [];
    const values = checked ? [...current, value] : current.filter((v) => v !== value);
    const next = { ...selected };
    if (values.length > 0) next[sectionId] = values;
    else delete next[sectionId];
    commit(next);
  };

  const anySelected = Object.values(selected).some((values) => values.length > 0);

  return (
    <div
      data-slot="filter-panel"
      className={cn("bg-background flex w-full flex-col gap-4", className)}
      {...props}
    >
      {title === null ? null : (
        <div data-slot="filter-panel-header" className="flex items-center justify-between gap-2">
          <h3 data-slot="filter-panel-title" className="text-foreground text-sm font-semibold">
            {title}
          </h3>
          {/* A11 at group scope: mounted at all times, disabled when there is
              nothing to clear, so the header never reflows as filters come and go. */}
          <ResetAffordance
            scope="group"
            state={anySelected ? "modified" : "default"}
            label={clearLabel}
            onReset={() => {
              commit({});
              onClearAll?.();
            }}
          />
        </div>
      )}

      {viewOptions && viewOptions.length > 0 ? (
        <div
          data-slot="filter-panel-view-options"
          role="group"
          aria-labelledby={viewHeadingId}
          className="flex flex-col gap-3 border-b pb-4"
        >
          <span id={viewHeadingId} className="sr-only">
            View options
          </span>
          {viewOptions.map((group) => (
            <FilterPanelViewGroupView
              key={group.id}
              group={group}
              onValueChange={(value) => onViewOptionChange?.(group.id, value)}
            />
          ))}
        </div>
      ) : null}

      {savedSearches && savedSearches.length > 0 ? (
        // Its own region with its own heading. A saved search replaces the
        // filter set; a facet narrows it — so it is never one more checkbox.
        <div
          data-slot="filter-panel-saved-searches"
          role="group"
          aria-labelledby={savedHeadingId}
          className="flex flex-col gap-1 border-b pb-4"
        >
          <SectionHeader id={savedHeadingId} size="sm" title={savedSearchesLabel} />
          {savedSearches.map((search) => {
            const active = activeSavedSearchId === search.id;
            return (
              <button
                key={search.id}
                type="button"
                data-slot="filter-panel-saved-search"
                data-active={active ? "true" : undefined}
                aria-current={active ? "true" : undefined}
                onClick={() => onSavedSearchSelect?.(search.id)}
                aria-label={[
                  search.label,
                  search.count === undefined ? undefined : String(search.count),
                  active ? "active" : undefined,
                ]
                  .filter(Boolean)
                  .join(", ")}
                className="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-sm focus-visible:ring-2 focus-visible:outline-none"
              >
                {/* Shape, not colour: the tick is the visible signal, and
                    "active" is spelled into the accessible name beside it. */}
                <Check aria-hidden className={cn("size-3.5 shrink-0", active ? "opacity-100" : "opacity-0")} />
                <span data-slot="filter-panel-saved-search-label" className="min-w-0 flex-1 truncate">
                  {search.label}
                </span>
                {search.count !== undefined ? (
                  <span
                    data-slot="filter-panel-saved-search-count"
                    className="text-foreground shrink-0 text-xs tabular-nums"
                  >
                    {search.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {sections.length > 0 ? (
        <div data-slot="filter-panel-sections" className="flex flex-col gap-4">
          {sections.map((section) => (
            <FilterPanelSectionView
              key={section.id}
              section={section}
              selected={selected[section.id] ?? []}
              open={openSections.includes(section.id)}
              onOpenChange={(next) => setOpen(section.id, next)}
              onFacetChange={(value, checked) => toggleFacet(section.id, value, checked)}
            />
          ))}
        </div>
      ) : null}

      {children}
    </div>
  );
}

export { FilterPanel };
export type {
  FilterFacet,
  FilterPanelProps,
  FilterPanelSection,
  FilterPanelViewGroup,
  FilterPanelViewOption,
  FilterSelection,
  SavedSearch,
};
