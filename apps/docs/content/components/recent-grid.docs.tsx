import type { ComponentDocs } from "@/lib/component-docs";
import {
  BareEmptyString,
  EditedAgoOverTimestamp,
  FixedEmptyTile,
  HoverOnlyActionsUnreachable,
  KeyboardReachableActions,
} from "./recent-grid.examples";

/**
 * Seeded from docs/design-system/component-specs.md#c4-recent-grid.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. If a Do/Don't needs a live example,
 * define a zero-prop component in a sibling "recent-grid.examples.tsx"
 * client module ("use client" at the top of that file, not this one) and
 * reference it here as an element with no props, e.g.:
 *
 * // import { GoodExample } from "./recent-grid.examples";
 * // dos: [{ text: "...", example: <GoodExample /> }]
 *
 * An inline handler on an element created in *this* file — e.g.
 * `<RecentGrid onSelect={() => {}} />` passed straight into `dos`/`donts` —
 * cannot be serialized across the server/client boundary and breaks the
 * static export.
 */
export const RecentGridDocs: ComponentDocs = {
  whatItIs:
    "A grid or list of the user's recent projects, each shown as a fixed-height thumbnail with a title, an optional duration badge, and an optional 'edited N ago' line. It composes preview-tile for the thumbnail frame, badge and title label, and adds recency text plus keyboard-reachable hover actions around it.",
  whyItMatters:
    "Every landing surface on the reference board — Descript, Spline, CapCut, Canva, Midjourney — opens on this exact pattern, because a returning user's first question is 'where did I leave off,' not 'what can I create.' Recency is the entire reason the surface exists: an edited-ago string beats a raw timestamp because it answers that question at a glance, without the user doing date arithmetic.",
  evidence: ["Descript", "Spline", "CapCut", "Canva", "Midjourney"],
  anatomy: [
    { slot: "recent-grid", note: "Root wrapper; data-layout reflects the active 'grid' or 'list' layout." },
    {
      slot: "recent-grid-empty",
      note: "The first-class empty tile (F4) — an in-grid dashed tile, not a page takeover.",
    },
    { slot: "recent-grid-item", note: "One project — a preview-tile in grid layout, a row in list layout." },
    {
      slot: "recent-grid-title",
      note: "List-layout title text. In grid layout the title is preview-tile's own 'below' label instead.",
    },
    {
      slot: "recent-grid-edited-ago",
      note: "The recency line. Always rendered (blank + aria-hidden when absent) so card height never depends on it.",
    },
    { slot: "recent-grid-duration", note: "The duration badge, omitted entirely when there's no duration." },
    {
      slot: "recent-grid-actions",
      note: "Rename/delete-style actions. Always mounted; only opacity is hover/focus-driven.",
    },
  ],
  usage:
    "Reach for it for any 'recent' or 'your projects' surface where each item is a thumbnail-first artifact — video, design, doc, or generation. Pass `layout=\"grid\"` (the default) for a thumbnail-forward landing view or `layout=\"list\"` for a denser, scannable view — it's one component with two renderings of the same item data, not two components, so switching layouts never means re-mapping your data. Every field but `title` is optional, and the component keeps card height constant regardless of which optional fields a given item has.",
  dos: [
    {
      text: "Show 'Edited 19 hours ago' instead of a raw timestamp — recency is the only reason this surface exists.",
      example: <EditedAgoOverTimestamp />,
    },
    {
      text: "Give the empty state real design attention — icon, title, description, and an optional CTA in a single in-grid tile.",
      example: <FixedEmptyTile />,
    },
    {
      text: "Keep hover actions permanently mounted and toggle only their opacity, so keyboard and switch-control users can tab to them.",
      example: <KeyboardReachableActions />,
    },
  ],
  donts: [
    {
      text: "Don't gate actions with `hidden group-hover:flex` — it removes them from the tab order, so a keyboard user can never reach rename or delete no matter how long they tab.",
      example: <HoverOnlyActionsUnreachable />,
    },
    {
      text: "Don't render the empty state as a bare string — it's the default view for new users, not an afterthought, and deserves the same visual weight as a populated grid.",
      example: <BareEmptyString />,
    },
  ],
  accessibility: {
    keyboard: [
      "One tab stop per item for the tile, plus one for every control you put in that item's `actions`. Twelve projects with a rename and a delete button each is thirty-six stops before the reader is past the grid.",
      "The tile is focusable only when that item has `onOpen`. Omit it and `preview-tile` renders a `<div>` instead of a `<button>`, so the item is inert to mouse and keyboard alike — it looks openable and is not.",
      "Actions stay mounted and only their opacity animates, so Tab reaches them and `group-focus-within` makes them visible when it does. They are unconditionally visible on coarse pointers, so a touch user never has to hover.",
      "The container is a plain CSS grid of `<div>`s, not a `role=\"grid\"`. Arrow keys do nothing, there is no roving tabindex, and Home/End do not jump to the first or last project.",
      "Nothing here can be disabled — there is no prop for it, so every rendered control is live.",
    ],
    screenReader: [
      "The tile's accessible name comes from the title even though it renders outside the button: grid layout uses `labelPlacement=\"below\"`, which puts the title in a sibling `<span>` and points the frame at it with `aria-labelledby` (`preview-tile`'s `namedByLabel` path), so the button's name is the visible title by construction, not whatever happens to be inside the frame.",
      "List layout has the same shape and no label element to point at: the tile is `labelPlacement=\"none\"`, so `recent-grid` passes the title through `frameLabel` instead, which becomes `aria-label`. The row's control is named from the same title text either way; only the mechanism differs.",
      "`preview-tile` reports `aria-pressed` only when `selectMode=\"toggle\"`. Both layouts here pass `selectMode=\"open\"`, because `onOpen` navigates rather than toggling a pressed state — opening a project announces as a plain button, not a toggle.",
      "The edited-ago line is rendered even when there is nothing to say, as a non-breaking space with `aria-hidden`, so the height-reserving placeholder stays silent while a real string is announced normally.",
      "The duration badge sits inside the frame in both layouts, but `aria-labelledby`/`aria-label` override the browser's subtree-derived name, so the badge's text never becomes part of the button's accessible name — it is read as ordinary content of the tile, after the title, not folded into it.",
      "There is no live region. Opening a project, renaming one, or the list refreshing announces nothing; whatever you navigate to owns that.",
    ],
    focus: [
      "Deleting an item from `actions` unmounts the button that had focus and nothing restores it, so focus falls to `<body>`. Move focus to a neighbouring tile inside your delete handler.",
      "Switching `layout` re-renders every item through a different tree, so focus is lost there too — hold the focused item's id and restore it yourself if you expose a view switch.",
      "The tile's focus ring is `preview-tile`'s own `focus-visible:ring-2`, applied only when the tile is interactive. Controls you pass through `actions` bring their own: the shared `Button` has a ring, a bare `<button>` does not.",
    ],
  },
  pitfalls: [
    "Reaching for a second grid component for the list view — grid and list are one component with two renderings of the same item data; a `layout` prop switches between them.",
    "Letting item height vary with which optional fields are present. The edited-ago line is rendered blank (and aria-hidden) rather than omitted, specifically so the grid doesn't ripple between taller and shorter cards.",
    "Building rename/delete UI as a button nested inside the thumbnail's clickable area. Hover actions render as a sibling overlay to preview-tile's trigger, not inside it — nesting an interactive action inside the tile's own button is invalid HTML and breaks focus order.",
    "Treating the duration badge as decoration only reachable by sight. It's rendered as real text on the tile, so it survives for screen readers and never depends on colour alone.",
  ],
};
