import type { ComponentDocs } from "@/lib/component-docs";
import {
  BucketsHoldSessions,
  ExcerptIdentifiesTheArtifact,
  ThumbnailHidesTheArtifact,
  TwoFacetRowsOverOneIndex,
} from "./artifact-shell.examples";

/**
 * Seeded from docs/design-system/block-specs.md — O9 `artifact-shell`.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence` and
 * the rest directly. Live examples live in the ./artifact-shell.examples client
 * sidecar and arrive here as zero-prop elements.
 */
export const ArtifactShellDocs: ComponentDocs = {
  whatItIs:
    "The page shell for an artifact or document index: a sidebar that navigates the library, a header carrying the index's name and its type facets, a search field of its own, and a scrolling grid of everything the product has generated. It is a block, not a component — it owns arrangement and nothing else. B1 fills the sidebar, A5 renders the facets, J4 renders every card, A3 buckets those grids by recency, K1 holds a passage that has not been filed yet, and L1 covers both the empty index and the emptied one. Each of them keeps its own props, its own state model and its own accessibility contract.",
  whyItMatters:
    "Claude Artifacts and the Manus Library converge on the same four regions, and on the same unusual card: a text excerpt rather than a thumbnail. That is the decision worth copying. Artifacts are mostly text, and the titles they arrive with are auto-generated and frequently wrong, so the first lines are the only field that reliably identifies one — which is why the excerpt is the card's largest text, the accessible name of its link, and the field this shell's search reads first. The second decision is that the grid's unit is the originating session, so an artifact stays one heading away from the conversation that produced it; an index that flattens that link turns a workspace back into a downloads folder.",
  evidence: ["Claude Artifacts", "Manus Library"],
  anatomy: [
    {
      slot: 'data-region="sidebar"',
      note: "B1 app-sidebar holding whatever navigates the library, or L1 when nothing does.",
    },
    {
      slot: 'data-region="header"',
      note: "The sidebar trigger, the index title, and A5's type facets. Filter and header are one region.",
    },
    {
      slot: 'data-region="search"',
      note: "A labelled search field over the whole index, plus the live result count.",
    },
    {
      slot: 'data-region="artifact-card-grid"',
      note: "The scroll container: A3 date buckets of J4 sessions. Named, and its own tab stop.",
    },
    {
      slot: "artifact-shell",
      note: "Root. Contains its own fixed descendants so the shell can be embedded.",
    },
    { slot: "artifact-shell-title", note: "The index's heading, inside the header region." },
    {
      slot: "artifact-shell-result-count",
      note: "Live region reporting how much of the index the filter and search left showing.",
    },
    {
      slot: "artifact-shell-draft",
      note: "K1 ai-doc-block: the passage that has not been filed yet, above the buckets.",
    },
  ],
  usage:
    "Reach for it when generated documents are objects in your product rather than attachments to a conversation. `groups` is the whole index — date buckets on the outside, J4 sessions inside them — and everything else is scoping: `activeType` for the facets, `query` for the search, both controlled or uncontrolled as you prefer. The facets are derived from the artifacts you pass, so there is no facet list to keep in step with your data. Pass `draft` when something has just been generated and is still waiting on a Keep or a Discard: it renders above the index with K1's own verbs and is exempt from the filter, because it is not in the index until it is kept. Turn `localSearch` off when the query round-trips to a server and `groups` already arrives filtered.",
  dos: [
    {
      text: "Let the excerpt identify the artifact — it is the field people recognise, and the one they will search for.",
      example: <ExcerptIdentifiesTheArtifact />,
    },
    {
      text: "Bucket by recency on the outside and keep the originating session on the inside, so a card stays linked to its conversation.",
      example: <BucketsHoldSessions />,
    },
  ],
  donts: [
    {
      text: "Don't swap the text card for a thumbnail because the grid looks emptier without one — a file-type glyph carries no information and the generated title underneath it is the least reliable field on the card.",
      example: <ThumbnailHidesTheArtifact />,
    },
    {
      text: "Don't leave J4's own facet row on while the header renders facets too; two pieces of state over one index is how a badge and its filter start disagreeing.",
      example: <TwoFacetRowsOverOneIndex />,
    },
  ],
  accessibility: {
    keyboard: [
      "The shell's own tab order is: the sidebar trigger, then every facet chip in turn, then the Filters button if you passed `onOpenFilters`, then the search field, then the grid region itself, then everything inside it. The sidebar's slots come before all of that.",
      "The grid carries `tabIndex={0}` on purpose — it is the scroll container, so it is a real tab stop that can be scrolled with the arrows. It does not skip the cards beyond it; every card link is still its own stop after it.",
      "A5's chips have no roving tabindex, so the facet row is one Tab per chip. An index with six types costs seven presses (\"All\" included) before the search field, and Left/Right do nothing.",
      "Cmd/Ctrl+B toggles the sidebar from anywhere on the page, including while you are typing in this shell's search field — the vendored `SidebarProvider` binds it to `window` and calls `preventDefault()` unconditionally.",
      "Nothing focuses the search field by shortcut: there is no \"/\" handler and no skip link into the index. Reaching a card from the page body means tabbing the whole header.",
      "With `collapsibleSessions`, each session header adds a tab stop inside the grid, activated with Space or Enter.",
    ],
    screenReader: [
      "Only the grid is a landmark: `<section aria-label={gridLabel}>`, \"Artifacts\" by default. The header and search regions are plain `div`s carrying `data-region` for styling and tests, so they are not navigable as landmarks.",
      "The index title renders as a hard-coded `<h1>`. Embed the shell in a page that already has one and you get two; the level is not configurable.",
      "The result count is a `role=\"status\"` that is always mounted, which is the correct shape and is what makes \"the filter emptied the page\" audible. Its text is recomputed on every keystroke, though, with no debounce — typing a seven-letter query queues seven announcements.",
      "The no-results empty state also carries `role=\"status\"`, and it mounts at the moment it becomes true. So an emptying search fires two live regions for one event, and the second one breaks the always-mounted rule the count deliberately follows.",
      "The search field has a real visually-hidden `<label>` from `searchLabel`, so its name survives typing; the magnifier is `aria-hidden` and the placeholder is an example rather than the name.",
      "A facet chip announces as a pressed or unpressed toggle button named \"Markdown 3\" — the count is inside the chip, so it fuses into the name. The row is a `role=\"group\"` named by `filterLabel`, not a radio group, so nothing announces that the facets are mutually exclusive even though this shell enforces that in its handler.",
      "The draft is its own `<section>` labelled by an `<h2>` from `draftLabel`, and the K1 block inside it brings its own persistent `role=\"status\"` — so mounting a draft announces \"This block is generated and waiting on your decision\" alongside whatever the result count is saying.",
      "Date buckets are `role=\"group\"`s named by their label and session groups are named `<section>`s inside them, so the index is navigable by region even though it exposes no headings below the `<h1>` and `<h2>`.",
      "The sidebar trigger is named \"Toggle Sidebar\" and carries no `aria-expanded`, so the sidebar's state is never announced in either direction.",
    ],
    focus: [
      "Nothing in the shell moves focus. Searching, switching a facet, and emptying the index all leave focus exactly where it was, so the reader has to go looking for the result count to learn what happened.",
      "Collapsing the sidebar while focus is inside `sidebarPromo` drops focus to `<body>`: that slot is removed from the layout at icon-rail width rather than hidden. Focus inside the nav survives the same collapse.",
      "The grid region and the facet chips carry their own `focus-visible` rings; the search field and the header actions inherit whatever the primitives and your own components supply.",
    ],
  },
  pitfalls: [
    "J4's card grid steps columns at viewport breakpoints, not at its container's width, and this shell always has a sidebar beside it — so at 1024px the grid believes it has the full window, takes three columns, and clamps the excerpt the card is built around. The shell shifts each step up one breakpoint through a descendant variant on J4's inner grid slot. If you restyle the grid region, restyle that inner slot, not the wrapper.",
    "The vendored sidebar's desktop container is `fixed inset-y-0 h-svh`, right only when the shell owns the viewport. The root sets `contain: layout` so the shell stays embeddable in a preview or a panel — keep that containment if you re-wrap the root, or the sidebar pins itself to the browser's left edge. The root also constrains that container to the shell's own height, which is what makes `sidebarPromo` and `sidebarFooter` usable in an embedded shell.",
    "A5's `FilterChip` has no notion of a selected group — each chip is an independent toggle with its own `aria-pressed`, and there is no `filter-bar` prop that makes the row single-select or gives it a roving tabstop. This shell enforces single-select in its own handler; if you copy the pattern, enforce it in yours, and do not reach for a radio group instead, because the chips are also individually removable in other surfaces.",
    "The type facets are derived from the artifacts you hand in, so a type with nothing in it has no chip. That is deliberate — a facet that always returns nothing is a broken control — but it means the facet row changes shape as the index changes, and a facet count reflects the search, not the active facet. When one type is all that is left, the chips disappear entirely rather than offering a choice with one option.",
    "The grid is the scroll container, which is why it carries `tabIndex={0}` and an accessible name. Moving the overflow onto an inner wrapper without moving those two with it fails axe's scrollable-region-focusable rule and strands keyboard users outside the index.",
    "`localSearch` filters the artifacts this shell was handed, matching the excerpt, the title and the type label. Leave it on for a server-backed index and the local pass filters the server's results a second time — an artifact matched on its body text will vanish because that text is not in its excerpt. Turn it off and the search field becomes a pure `onQueryChange` reporter.",
    "K1's four verbs are the approval contract, and a draft that never resolves is a draft that blocks the index it is sitting on. Wire `draft.onKeep` and `draft.onDiscard` to real handlers that remove the prop; the shell renders whatever it is given and has no idea when the decision was made.",
    "Every region mounts whether it has content or not, including the search field over an empty index. That is the point — a control that appears only once you already have data cannot teach anyone that it exists — so do not conditionally render the regions away on day one.",
  ],
};
