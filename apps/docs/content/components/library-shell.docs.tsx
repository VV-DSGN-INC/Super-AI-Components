import type { ComponentDocs } from "@/lib/component-docs";
import {
  DenseByDefault,
  FacetsCarryTheirCounts,
  FacetsWithoutCounts,
  GalleryDensityInAnArchive,
} from "./library-shell.examples";

/**
 * Seeded from docs/design-system/block-specs.md — O7 `library-shell`.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and the rest directly. Live examples live in the ./library-shell.examples
 * client sidecar and arrive here as zero-prop elements.
 */
export const LibraryShellDocs: ComponentDocs = {
  whatItIs:
    "The page shell for a personal archive: a faceted rail on the left, a header with search and the filters currently applied, and a dense grid of everything you have made. It is a block, not a component — it owns arrangement and two pieces of view state (thumbnail size, and which asset is open), and nothing else. The rail is J2 filter-panel, the header is J1 asset-library, the grid is F2 generation-grid rendering A8 preview-tiles into A3 date sections, the empty view is L1, and a tile opens F3 asset-detail. Each of those keeps its own props, its own state model and its own accessibility contract.",
  whyItMatters:
    "Midjourney Organize is the reference implementation, and the two things it gets right are the two things this shell exists to preserve. The first is density: an archive is scanned, not browsed, so the grid opens eight-up and thumbnail size is a control the reader owns rather than a decision the brand made — the same archive is a contact sheet for one person and a lightbox wall for another. The second is counts. A facet that does not say how many results it would leave turns every filter click into a gamble, and a rail of gambles is abandoned within a session; J2 makes the count a required field precisely so that cannot happen. Everything else follows from the third promise, that clicking any tile opens the full provenance record — which is what makes an archive worth keeping rather than a folder of files with unhelpful names.",
  evidence: ["Midjourney Organize"],
  anatomy: [
    {
      slot: 'data-region="facet-rail"',
      note: "J2 filter-panel — counted facets, saved searches, and the thumbnail-size control. Scrolls, so it carries its own tab stop and name.",
    },
    {
      slot: 'data-region="header"',
      note: "J1 asset-library's header, search field and A5 filter-chip row. Search lives here, which is why the shell has three regions and not four.",
    },
    {
      slot: 'data-region="dense-grid"',
      note: "F2 generation-grid at the density the rail selected, one A3 date-section per group, L1 in the first cell when there is nothing.",
    },
    { slot: "library-shell", note: "Root. A column below md, a row above it; both panes scroll independently." },
    {
      slot: "preview-tile",
      note: "A8, one per asset, carrying data-asset-id. Its own frame button is what opens F3 or toggles selection.",
    },
    { slot: "asset-detail", note: "F3, mounted at shell level rather than inside a region — a lightbox over the archive, not a fourth pane in it." },
  ],
  usage:
    "Reach for it when the primary object of your product is the pile of things a user has already made. Everything is a prop: `facets` fills the rail, `groups` (or `assets`) fills the grid, `search` and `onSearchChange` drive the header's field, and `openAssetId` opens the lightbox. Filtering is yours — the shell renders the rail and the chips, and hands you back the selection through `onSelectedFacetsChange`; the assets you pass are the assets it shows, so server-side and client-side filtering look identical from here. Give every facet an honest count, including zero: J2 disables a zero-count facet and says \"no matches\" out loud, which is worth more than hiding it. Leave `density` alone unless you are persisting the reader's choice — the default is deliberately the densest one — and pass `groups` rather than `assets` whenever your archive has any notion of when things were made, because a date-bucketed archive is navigable and a flat one is not.",
  dos: [
    {
      text: "Give every facet its count, so a filter states what it would leave before anyone clicks it.",
      example: <FacetsCarryTheirCounts />,
    },
    {
      text: "Open dense. An archive is a page you scan, and eight-up is what makes a day of work fit on one.",
      example: <DenseByDefault />,
    },
  ],
  donts: [
    {
      text: "Don't ship a rail of bare labels — an uncounted facet hides its dead ends until you have already clicked them.",
      example: <FacetsWithoutCounts />,
    },
    {
      text: "Don't bring gallery density to an archive; four-up turns a week of results into a scroll session.",
      example: <GalleryDensityInAnArchive />,
    },
  ],
  accessibility: {
    keyboard: [
      "Both scrolling panes take a tab stop of their own: `data-region=\"facet-rail\"` and `data-region=\"dense-grid\"` each carry `tabIndex={0}` and an `aria-label`, which is what satisfies axe's `scrollable-region-focusable` rule. They are stops that do nothing but let the arrow keys scroll, so expect a dead Tab before the first control in each pane.",
      "Every applied facet is two tab stops in the header, not one. The mirrored `filter-chip` is given both `onClick` and `onRemove`, and both call the same `deselectFacet` — so the toggle and the X are adjacent controls with identical effects. Six applied facets is twelve stops between the search field and the grid.",
      "A tile is a single button. Enter and Space open the asset in browse mode and toggle selection in select mode; the two are never live at once, so there is no checkbox layered over the tile and no second control to reach.",
      "The grid has no roving tabindex and no arrow-key navigation — `role=\"list\"` is for announcement only. Moving between tiles means one Tab per asset, however many the current density is showing.",
      "The lightbox is a dialog: Escape closes it and focus is held inside while it is open. Nothing else in the shell handles a key.",
      "The bulk-actions bar only exists once something is selected, so entering select mode changes the number of stops above the grid partway through a tab sequence.",
    ],
    screenReader: [
      "Three named regions: the rail is an `<aside aria-label=\"Filters\">`, the grid a `<section aria-label=\"Assets\">`, and the header a plain div carrying J1's own structure. The rail's landmark name is fixed — `filtersTitle` renames the heading inside J2, not the landmark around it.",
      "Facet counts are folded into each checkbox's accessible name by J2, so a facet announces as its label and its count together, and a zero-count facet is disabled and carries an sr-only \"no matches\". It is the one thing here a screen-reader user gets more reliably than someone skimming the rail.",
      "The mirrored chips escape the accessible-name trap that usually bites A5: `FilterFacet.label` is typed `string`, so `filter-chip` always builds a real \"Remove {label} filter\" name and the header never degrades into a row of identical \"Remove filter\" buttons.",
      "Every tile uses `labelPlacement=\"overlay\"`, which puts `asset.name` inside the frame button — the only reason the tiles have names at all. A `below` label is a sibling of the button and would leave it nameless whenever the thumbnail is decorative, and A8 spreads extra props onto its wrapper rather than the frame, so an `aria-label` at the call site cannot rescue it either.",
      "A tile's button always reports `aria-pressed`, because A8 stamps it whenever `onSelect` is set. Right in select mode; in browse mode every tile announces as an unpressed toggle when it is really an open action.",
      "The lightbox announces the same name for every asset. F3's `DialogTitle` is a hard-coded, sr-only \"Result detail\", so opening the tenth tile sounds exactly like opening the first and the asset's own name is never spoken on open.",
      "Removing the last facet, changing density and a filter emptying the grid all happen with no live region anywhere in the shell. \"No matches\" is visible text; nothing announces arriving at it.",
    ],
    focus: [
      "Removing a facet chip unmounts the button that had focus and nothing restores it, so focus falls to `<body>` and the next Tab restarts from the top of the page. That is A5's documented behaviour and the shell does not intercept it — and it fires from either half of the chip, since both are wired to the same removal.",
      "Opening a tile moves focus into the lightbox and closing it returns focus to the tile that opened it. That is the one focus handoff in the shell that works without your help.",
      "The two pane tab stops have no `focus-visible` style at all — they are bare `tabIndex={0}` containers, so tabbing into a pane shows nothing moving. Add a ring if that matters to you; the shell does not.",
      "Below `md` the rail becomes a band above the header rather than disappearing, so its tab stop keeps its place in the order. Nothing about the keyboard path changes at the breakpoint.",
    ],
  },
  pitfalls: [
    "J1 asset-library has no header-only mode, and this shell needs exactly its header: title, actions, search field and the chip row. J1 is therefore handed no items, and three of its own affordances are suppressed by a documented call-site variant — the section-header count (which would read 0 above a grid of hundreds), the list/grid view toggle (there is no J1 body here for it to switch) and the leftover empty div. If you restyle the header region, keep that constant, and delete it the day J1 grows an exported header or a `body={false}` prop.",
    "The archive's counts live in the rail, not in the header. That is the spec's position — facet counts are what make a rail usable at scale — but it means there is no single \"1,284 assets\" figure anywhere in the shell. If your product needs one, put it in `headerActions`; do not try to restore J1's own count, which counts J1's body and is always zero here.",
    "A8 preview-tile renders a `below` label as a sibling of its frame button, so a tile whose thumbnail is decorative would have a button with no accessible name at all. Every tile here uses `labelPlacement=\"overlay\"` for that reason. A8 also spreads its extra props onto its wrapper div rather than the frame, so you cannot fix a missing name with an `aria-label` at the call site — the label prop is the only route.",
    "A8's interactive frame is always a toggle button: it stamps `aria-pressed` whenever `onSelect` is set. That is exactly right in select mode and slightly wrong in browse mode, where the tile is an open action reading `aria-pressed=\"false\"`. Nothing fails a gate over it, but do not read the attribute as meaningful outside select mode. The source fix is for A8 to let a caller choose between a toggle and a plain action.",
    "Both panes scroll, so both carry `tabIndex={0}` and a name. Moving the overflow onto an inner wrapper without moving those two with it fails axe's scrollable-region-focusable rule and strands keyboard users outside the archive.",
    "Facet selection, search text, bulk selection and the open asset are all controlled or controllable. Rendering the shell with a `selectedFacets` that never changes produces a screenshot, not an archive — the rail's checkboxes will tick and untick and the grid will never move.",
    "The rail does not disappear below `md`; it becomes a short scrolling band above the header. That is deliberate — a region that vanishes at a breakpoint cannot teach that it exists — but it costs vertical space on a phone. If you want a drawer instead, wrap the shell rather than unmounting the region, and keep the `data-region` marker rendered.",
    "F2's density prop is the only thing that separates dense from roomy, and it lives on one class list inside the grid. Restyling the dense-grid region's wrapper will not change the column count; pass `density`, or drive it from the rail's thumbnail-size group as the shell already does.",
  ],
};
