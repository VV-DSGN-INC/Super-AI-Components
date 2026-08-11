import type { ComponentDocs } from "@/lib/component-docs";
import {
  MasonryKeepsTheSurprise,
  OneMergedFilterRow,
  TwoAxesStaySeparate,
  UniformRowsFlattenTheFeed,
} from "./explore-shell.examples";

/**
 * Seeded from docs/design-system/block-specs.md — O8 `explore-shell`.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and the rest directly. Live examples live in the ./explore-shell.examples
 * client sidecar and arrive here as zero-prop elements.
 */
export const ExploreShellDocs: ComponentDocs = {
  whatItIs:
    "The page shell for a community gallery: a destination rail on the left, a prompt bar docked above the feed, a strip carrying the two ways to narrow it, and a masonry feed of other people's work. It is a block, not a component — it owns arrangement and nothing else. The feed is J3 explore-gallery, the prompt bar is D1 media-prompt-bar, the type pills are A4 choice-chips, the rail is B4 modality-rail, and a tile opens into F3 asset-detail or J6 template-detail. Each of them keeps its own props, its own state model and its own accessibility contract.",
  whyItMatters:
    "Midjourney Explore, Spline Community, Pixlr and Canva templates all arrive at the same page, and the reason is the job: a community feed is browsed for surprise, not searched for a known item. That is why the feed is masonry. Equal-height rows make every row scan the same, which is exactly the quality a browsing surface needs to avoid — and it is why this shell and the personal archive next to it (O7 library-shell, dense and uniform by design) are two galleries rather than one component with a density toggle. The second decision worth copying is the prompt bar's position: it sits above the feed, so seeing something good and making your own version of it is one control away rather than a navigation step, and a tile's Remix action seeds that bar in place.",
  evidence: ["Midjourney Explore", "Spline Community", "Pixlr", "Canva templates"],
  anatomy: [
    {
      slot: 'data-region="rail"',
      note: "B4 modality-rail — the product's destinations, with settings pinned below.",
    },
    {
      slot: 'data-region="docked-prompt-bar"',
      note: "D1 media-prompt-bar, docked above the feed. Remix seeds it in place.",
    },
    {
      slot: 'data-region="sort-tabs"',
      note: "Both axes, one region: a tablist for ordering, A4 choice-chips for type.",
    },
    {
      slot: 'data-region="masonry-feed"',
      note: "J3 explore-gallery, masonry only, or L1 when the feed is empty.",
    },
    { slot: "explore-shell", note: "Root. Reflects the live axes as data-sort and data-type." },
    { slot: "explore-shell-controls", note: "The control strip itself — the two axes side by side." },
    { slot: "explore-shell-scope", note: "What the feed contains, shown when it offers no axes at all." },
    {
      slot: "explore-shell-more-item",
      note: "One A8 preview-tile in F3's more-like-this, derived from the feed.",
    },
  ],
  usage:
    "Reach for it when the primary object of your product is other people's work. `items` fills the feed and carries the two detail surfaces with it — give a tile an `asset` and it opens F3, give it a `template` and it opens J6, and the shell owns which one is open. `sorts` and `types` are separate props because they are separate axes: sorting reorders the whole feed, a type pill removes things from it, and both are yours to apply — the shell hands you the change and renders what you hand back. Ship facet counts on the type pills; without them every pill click is a gamble. The prompt bar's value is the shell's, because a tile's Remix action seeds it: read it through `onPromptValueChange` and act on `onPromptSubmit`. Everything else about the feed — `hasMore`, `loading`, `onLoadMore`, `totalCount` — is forwarded straight to J3 through `gallery`.",
  dos: [
    {
      text: "Let tile heights vary. The uneven column is what makes a community feed worth scrolling.",
      example: <MasonryKeepsTheSurprise />,
    },
    {
      text: "Keep ordering and filtering as two named controls, so it is obvious they compose.",
      example: <TwoAxesStaySeparate />,
    },
  ],
  donts: [
    {
      text: "Don't normalise every tile to one ratio — a uniform feed is an archive, and O7 library-shell already is one.",
      example: <UniformRowsFlattenTheFeed />,
    },
    {
      text: "Don't merge the two axes into a single row of chips; it reads as one choice when it is two.",
      example: <OneMergedFilterRow />,
    },
  ],
  pitfalls: [
    "J3 explore-gallery renders the docked prompt, the sort tabs, the type pills and the feed inside one root, and offers no slot on any of them — so a shell that needs them as separately addressable regions cannot get there by configuration. This shell mounts J3 feed-only (dockedPrompt off, both axes empty) and hosts D1 and the two control groups itself, handing the axes back through `sort` and `type` so J3's root keeps reflecting them. If J3 later grows slot props for its controls, delete the shell's copies rather than keeping both.",
    "Turning J3's own prompt bar off costs one thing that cannot be restored from outside: its Remix buttons point at the internal bar with `aria-controls`, and that id is not exposed. In this shell the Remix control still says which tile it belongs to in its accessible name, but it no longer announces the field it fills. Reinstating that needs a `promptId` prop on J3.",
    "The Remix seam is hand-wired. J3's `onRemix` seeds J3's own prompt state, which is inert here — the shell re-establishes the seeding through the same callback. Pass `prompt.value` expecting it to win and you will break the one interaction this block exists for; use `promptValue` instead.",
    "`layout` is deliberately not forwardable. J3 supports a row layout and this shell refuses it, because the spec's whole first line is masonry — if you want equal-height rows you want O7 library-shell, not this with a prop flipped.",
    "J3's masonry column count steps at viewport breakpoints, not container width, exactly as J4's grid does. The rail is only 92px so the drift is small here, but a shell that adds a second panel beside the feed will over-column it.",
    "A feed with nothing in it is not J3's empty state — J3 renders an empty list and a \"0 shown\" status, which reads as a broken page. The shell substitutes L1 in the same region, so the region stays mounted and the emptiness is deliberate. Override it with `empty` if your copy should say something more specific.",
    "B4 has no empty affordance of its own, so a rail with no items renders as an empty 92px column. Supply at least the destination the user is currently on.",
    "Base UI makes an open tab panel a tab stop, which is right when the panel is the scroll container and wrong here — J3 keeps its own named, focusable, scrolling feed inside it. The shell sets the panel to `tabIndex={-1}`; if you re-wrap the feed region, keep exactly one tab stop in front of the feed or keyboard users pay for the duplicate on every page.",
    "The sort strip uses the tabs `line` variant, not the default segmented one. The default paints the list `bg-muted` and the trigger's resting colour on that surface is under 4.5:1 — the same pairing this registry keeps re-shipping. Restyle the strip and re-measure it.",
  ],
};
