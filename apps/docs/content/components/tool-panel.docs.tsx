import type { ComponentDocs } from "@/lib/component-docs";
import {
  PromptPinnedBelowSections,
  PromptScrollsAway,
  ViewAllAsButton,
  ViewAllIsALink,
} from "./tool-panel.examples";

/**
 * Seeded from docs/design-system/component-specs.md#i1-tool-panel.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx). The live Do/Don't renders live in the
 * ./tool-panel.examples client sidecar and are referenced as zero-prop
 * elements — see that file for why.
 */
export const ToolPanelDocs: ComponentDocs = {
  whatItIs:
    "The column that sits beside the canvas in an editor: a pinned search field, a stack of curated sections, a grid of pickable tiles, and a prompt box docked at the foot. It is an arrangement rather than a new control — the headings are section-header, the tiles are preview-tile, and this component supplies the frame, the scroll behaviour and the tab switch that hold them together.",
  whyItMatters:
    "CapCut, Canva, Fotor, Simplified and Spline all ship this panel, and their anatomy is remarkably invariant — the same search, the same curated sections, the same grid. Because it is almost entirely composition, a product can vary it cheaply: a new modality is a new sections array, not a new panel. The docked prompt is the part that earns the name. Without it the panel is an asset browser you take things out of; with it, the panel is somewhere you make things, which is what a modality panel means in an AI editor.",
  evidence: ["CapCut", "Canva", "Fotor", "Simplified", "Spline"],
  anatomy: [
    { slot: "tool-panel", note: "The panel frame. Fills its container's height; the caller sets the width." },
    { slot: "tool-panel-header", note: "Pinned top region holding the search field and the tab switch." },
    { slot: "tool-panel-search", note: "Wrapper around the search field. The field itself is a standard input, found by role." },
    { slot: "tool-panel-tabs", note: "Category switch. Only the active tab's sections are mounted." },
    { slot: "tool-panel-sections", note: "The scrolling body. Focusable in its own right so keyboard users can scroll it." },
    { slot: "tool-panel-tab-panel", note: "One tab's sections. Absent when the panel has no tabs." },
    { slot: "tool-panel-section", note: "One curated section: a section-header plus its content." },
    { slot: "section-header", note: "A12, unchanged — title, count, 'View all' action and the collapse trigger." },
    { slot: "tool-panel-section-content", note: "Rendered only while the section is visible. This is the lazy boundary." },
    { slot: "tool-panel-grid", note: "The tile grid a section's `items` produce. Column count is a panel-level prop." },
    { slot: "tool-panel-item", note: "One cell: a single button (or an inert div) wrapping one A8 preview-tile." },
    { slot: "preview-tile", note: "A8, unchanged — aspect, thumbnail, overlay label, badge and selection ring." },
    { slot: "tool-panel-empty", note: "Stands in for the sections when the caller has filtered them all away." },
    { slot: "tool-panel-prompt", note: "The docked prompt. A sibling of the scrolling body, so it never scrolls away." },
  ],
  usage:
    "Reach for it whenever an editor needs a persistent column of insertable content beside a canvas — elements, effects, stock media, uploads, presets. Give each section either `items` (data the panel renders as a tile grid) or `render` (a callback for content the panel does not own); there is deliberately no way to hand it a finished node, because a panel of twenty sections would then have to build all twenty before showing one. Search is wired, not implemented: the panel renders the field and reports the query, and the caller passes back the sections that match, because a section built from a `render` callback is opaque to the panel and half-filtered results are worse than none. Use `tabs` when the panel carries genuinely different content types rather than as a second level of grouping — sections already group.",
  dos: [
    {
      text: "Dock the prompt below the sections, so it stays on screen however far the library scrolls.",
      example: <PromptPinnedBelowSections />,
    },
    {
      text: "Render the section action as a link — it navigates to the full library rather than acting on the panel.",
      example: <ViewAllIsALink />,
    },
  ],
  donts: [
    {
      text: "Don't put the prompt in the scrolling body as one more section; it scrolls out of reach and the panel becomes an asset browser.",
      example: <PromptScrollsAway />,
    },
    {
      text: "Don't make 'View all' a button. A button promises something happens here; the affordance opens another surface.",
      example: <ViewAllAsButton />,
    },
  ],
  pitfalls: [
    "Expecting the search field to filter for you. It reports the query and nothing else — filter your own data and pass the reduced sections back, plus an `empty` node for the no-results case, or the panel will look broken while the user types.",
    "Building section content eagerly and passing it through `render: () => cachedNode`. That defeats the point: the callback exists so a collapsed section and an inactive tab cost nothing, which is what keeps a long library affordable. Do the work inside the callback.",
    "Passing `selected` to tiles that insert rather than toggle. Its presence gives the tile `aria-pressed`, so a screen reader announces a persistent on/off state the tile does not have. Leave it undefined for insert actions.",
    "Overriding the composed components' `data-slot` values from the call site. section-header and preview-tile both spread props after their own attributes, so a slot passed in replaces theirs and quietly breaks anything keyed to them.",
    "Giving the panel no height. It is a flex column sized to its container — drop it into a parent with a real height (a grid track, `h-full`, a fixed shell column), or the sections region has nothing to scroll within.",
  ],
};
