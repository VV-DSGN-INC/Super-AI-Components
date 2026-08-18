import type { ComponentDocs } from "@/lib/component-docs";
import {
  CountsAndDeadEnds,
  SavedSearchesAsAFacetGroup,
  SavedSearchesInTheirOwnBlock,
  ZeroHiddenBehindDimming,
} from "./filter-panel.examples";

/**
 * Seeded from docs/design-system/component-specs.md#j2-filter-panel.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and so on directly. Every live example is a zero-prop element defined in the
 * "./filter-panel.examples" client sidecar, so no event handler ever has to
 * serialize across the server/client boundary.
 */
export const FilterPanelDocs: ComponentDocs = {
  whatItIs:
    "A vertical rail of collapsible checkbox groups, each facet carrying the number of results it would leave. Above the facets sit two blocks that are not facets: saved searches, which replace the whole filter set in one click, and view options, which change how the results are displayed rather than which ones survive.",
  whyItMatters:
    "Filtering has a scale ladder. A handful of choices is a row of chips — CapCut, Claude Artifacts and Canva all stop there. Past roughly six facets a row of chips stops being readable and the surface escalates to a rail, which is what Midjourney Organize ships as its reference implementation. The counts are what make the rail worth the width: without them a user picks a facet, waits, and finds out it was empty. With them the panel has already answered the question. Saved searches are the rung above that — the thing that separates a power archive from a library, because a filter combination worth rebuilding by hand is one you should never have to rebuild by hand.",
  evidence: ["Midjourney Organize", "CapCut", "Claude Artifacts", "Canva"],
  anatomy: [
    { slot: "filter-panel", note: "Root rail. Owns the selection, the open sections, and nothing about layout width." },
    { slot: "filter-panel-header", note: "Title plus the A11 clear-all affordance, which stays mounted and goes inert when there is nothing to clear." },
    { slot: "filter-panel-view-options", note: "Sort, layout, density — presentation, kept above and apart from the facets." },
    { slot: "filter-panel-saved-searches", note: "The power archive. Its own named region with its own heading, never a checkbox group." },
    { slot: "filter-panel-saved-search", note: "One saved search. A button, because picking it replaces the filter set." },
    { slot: "filter-panel-sections", note: "The facet stack." },
    { slot: "filter-panel-section", note: "One facet group: a named checkbox group headed by A12 section-header." },
    { slot: "filter-panel-section-selected", note: "'N selected' in the header, so a collapsed group never hides live filters." },
    { slot: "filter-panel-facets", note: "The checkbox list for one group." },
    { slot: "filter-panel-facet", note: "One facet row: checkbox, label, count. Carries data-empty when the count is zero." },
    { slot: "filter-panel-facet-count", note: "The count. Part of the checkbox's accessible name, not decoration beside it." },
    { slot: "filter-panel-see-more", note: "Overflow control inside one group. Its name names the group and the number still hidden." },
  ],
  usage:
    "Reach for the rail when a library has more filters than a row of chips can carry — roughly six facets is the crossover point, below which `filter-bar` is the right answer. Pass `sections` as data, one entry per facet group, and give every facet a real count; the panel treats a count of zero as a dead end and disables that row. Selection is reported as `{ sectionId: value[] }` through `onSelectedChange`, and the panel is happy either uncontrolled (`defaultSelected`) or fully controlled. Collapse state is remembered for the life of the mount; if you want it to survive a reload, take `openSections` / `onOpenSectionsChange` and store it yourself.",
  dos: [
    {
      text: "Give every facet its count, and let a zero disable the row instead of hiding it — a dead end you can see is worth more than one you discover.",
      example: <CountsAndDeadEnds />,
    },
    {
      text: "Keep saved searches in their own block above the facets, with one marked active.",
      example: <SavedSearchesInTheirOwnBlock />,
    },
  ],
  donts: [
    {
      text: "Don't signal an empty facet by dimming it. Faint and clickable is still clickable, and dimming says nothing to a screen reader.",
      example: <ZeroHiddenBehindDimming />,
    },
    {
      text: "Don't model saved searches as one more checkbox group — checkboxes combine, and two saved searches at once is a state nobody asked for.",
      example: <SavedSearchesAsAFacetGroup />,
    },
  ],
  accessibility: {
    keyboard: [
      "Count the stops before you commit to the rail: one per section header, one per visible facet, one more for each section that overflows, one per saved search, one per view-option chip, and the clear-all button once anything is selected. Six sections of ten facets is over sixty stops between the top of the rail and the results.",
      'A facet toggles with Space. The checkbox is a `role="checkbox"` span and the Base UI primitive explicitly cancels Enter on it, so the key most people try second does nothing here.',
      "A facet whose `count` is `0` renders a disabled checkbox, so Tab skips it. The dead end is still in the accessibility tree for anyone reading the rail with a virtual cursor, and simply absent for anyone driving it with Tab.",
      'View options declare `role="radiogroup"` and `role="radio"` and implement it: A4 `choice-chips` carries the roving tabindex, so the group is one tab stop and the arrow keys move and select. What has not changed is that a chip can never be un-checked from the keyboard, only replaced — that is the radio pattern working as specified, not a gap.',
      "Section headers collapse with Space or Enter. There is no Escape handler and no expand-all or collapse-all shortcut.",
      "The clear-all button is `disabled` until something is selected, so the header's tab stop appears and disappears with the selection.",
    ],
    screenReader: [
      'A facet\'s whole row is the checkbox\'s accessible name, count included: "Portrait 128", and "Portrait 0 no matches" for a dead end. Those spaces are real text nodes — name computation concatenates siblings without one — so restyling the row into markup that drops them gives you "Portrait128".',
      'That failure already exists one level up. A12 `section-header` renders its title and its count as adjacent spans with no text node between them, so a facet group\'s header button announces as "Format24" rather than "Format 24".',
      'Each facet group is a `role="group"` named by the whole header element rather than by the title alone, so a collapsed group with filters applied is named "Format24 3 selected" — which is exactly the information the collapse would otherwise hide.',
      'A saved search is a button whose `aria-label` is composed as "<label>, <count>, active", and the active one also carries `aria-current`. Its tick is `aria-hidden` and only ever changes opacity, so it is the name, not the glyph, that carries activeness.',
      'The see-more button names both the group and the remainder — "Show 18 more in Format" — but it carries no `aria-expanded` and no `aria-controls`. It does not announce as a disclosure, and the facets it reveals arrive unannounced.',
      "Nothing in the rail announces a filter change. There is no live region here at all: checking a facet, clearing every facet and expanding a group are all silent, and the counts beside the remaining facets change without a word. The live region belongs on the results.",
    ],
    focus: [
      "Pressing clear-all clears the selection, which is the state that disables clear-all. Focus falls to `<body>` and the next Tab restarts at the top of the page — the panel's most prominent control is the one that strands you.",
      "Collapsing a section unmounts its facets. From the header button that is harmless, since focus stays on the button; but a host driving `openSections` from outside — restoring saved state, collapsing everything at once — can unmount the facet that holds focus, and nothing restores it.",
      "Every control here ships a `focus-visible` ring except the facet row itself. The ring is drawn by the vendored checkbox on its 16px box, not on the `<label>` that spans the row, so a focused facet is far less obvious than the focused section header above it.",
    ],
  },
  pitfalls: [
    "Assuming collapse state persists. The panel remembers which sections are open for as long as it is mounted and no longer; a rail that should reopen the way the user left it needs the host to store `openSections` and feed it back.",
    "Sending stale counts. The counts are a promise about the result set, so they have to be recomputed against the filters already applied — a facet reading 96 that returns nothing is worse than no count at all.",
    "Reaching for a second component when a group gets long. `visibleCount` is the overflow: it shows the first N and adds one button that names the remainder. Splitting a group into two sections to keep it short hides the fact that they are one axis.",
    "Putting sort or layout controls inside a facet group. They change how results are shown, not which results there are, so they belong in `viewOptions` where they render as single-select radio groups rather than combinable checkboxes.",
    "Letting a collapsed group swallow an applied filter. The header keeps a 'N selected' badge for exactly this reason — if you restyle the header, keep it, or a short result list becomes unexplainable.",
  ],
};
