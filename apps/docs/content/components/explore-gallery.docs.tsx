import type { ComponentDocs } from "@/lib/component-docs";
import {
  LoadMoreIsReal,
  MergedFilterRow,
  ScrollOnlyFeed,
  TwoAxesKeptSeparate,
} from "./explore-gallery.examples";

/**
 * Seeded from docs/design-system/component-specs.md#j3-explore-gallery.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`,
 * etc. directly. Live examples that need interactivity live in the
 * ./explore-gallery.examples client sidecar and are referenced here as
 * zero-prop elements — see that file for why.
 */
export const ExploreGalleryDocs: ComponentDocs = {
  whatItIs:
    "The community feed of a creative product: a masonry wall of other people's work, an ordering control, a type filter, and a prompt bar docked directly above it. Tiles have deliberately unequal heights, because a feed is browsed for surprise and equal-height rows suppress it. Loading the next page is a button, not a scroll position.",
  whyItMatters:
    "Every product on the reference board that has a community surface — Midjourney Explore, Spline Community, Pixlr, Canva templates — builds it the same way, and for the same reason: browsing other people's output is the cheapest onboarding a generative product has. The docked prompt is what turns it from a gallery into a funnel. Seeing something good and wanting to make something like it is one thought; if converting that thought costs a navigation step, most of it evaporates on the way to the editor. Putting the omnibox above the feed means a tile's Remix action fills the prompt in place and the feed never moves.",
  evidence: ["Midjourney Explore", "Spline Community", "Pixlr", "Canva templates"],
  anatomy: [
    { slot: "explore-gallery", note: "Root. Reflects the active sort, type and layout as data attributes." },
    { slot: "explore-gallery-prompt", note: "The docked prompt bar (D1 media-prompt-bar), always above the feed." },
    { slot: "explore-gallery-controls", note: "Holds the two filter axes as two stacked controls, never one row." },
    { slot: "explore-gallery-sorts", note: "Axis one: the sort tablist. Reorders everything, removes nothing." },
    { slot: "explore-gallery-sort", note: "A single sort tab." },
    { slot: "explore-gallery-types", note: "Axis two: the type pill group (A4 choice-chips). Narrows, never reorders." },
    { slot: "explore-gallery-feed", note: "The scrollable region — the tab panel when sorts exist, a labelled region when they don't." },
    { slot: "explore-gallery-masonry", note: "The tile list itself: CSS columns in masonry layout, a grid in rows layout." },
    { slot: "explore-gallery-item", note: "One tile. Owned by this component, not by preview-tile." },
    { slot: "explore-gallery-item-media", note: "The variable-height media box; carries the item's own aspect ratio." },
    { slot: "explore-gallery-item-type", note: "Type badge on the tile, mirroring the type pills." },
    { slot: "explore-gallery-item-actions", note: "Hover- and focus-revealed tile actions, including Remix." },
    { slot: "explore-gallery-item-meta", note: "Title, author and metric under the media." },
    { slot: "explore-gallery-status", note: "Live region announcing how much of the feed has loaded." },
    { slot: "explore-gallery-load-more", note: "The keyboard-reachable next-page control." },
  ],
  usage:
    "Reach for it for a public or team-wide feed of finished work that people browse rather than search. Pass `items` already filtered and sorted — the component owns the controls, your data layer owns the query — and give each item its real `aspectRatio`, because unequal heights are the layout. Sorting and filtering are separate props on purpose: `sorts` reorders the whole feed, `types` narrows it. Keep `dockedPrompt` on unless the surface genuinely has nowhere to send a prompt; giving an item a `prompt` is what turns on its Remix action. For a private list of your own projects, reach for C4 recent-grid instead — that one wants a fixed frame, this one wants the opposite.",
  dos: [
    {
      text: "Keep ordering and filtering as two labelled controls — a sort and a type facet compose, they are not alternatives.",
      example: <TwoAxesKeptSeparate />,
    },
    {
      text: "Ship the next page behind a real button with a live count, and treat scroll-triggered prefetch as an optimisation layered on top of it.",
      example: <LoadMoreIsReal />,
    },
  ],
  donts: [
    {
      text: "Don't flatten the two axes into one row of pills — it makes ordering look like a filter and hides that the two combine.",
      example: <MergedFilterRow />,
    },
    {
      text: "Don't let the feed load only on scroll. With no control, keyboard users cannot reach page two and screen-reader users are never told it arrived.",
      example: <ScrollOnlyFeed />,
    },
  ],
  pitfalls: [
    "Masonry layout uses CSS columns, so tiles flow down the first column before starting the second. That keeps DOM order and reading order identical, but it means position on screen does not track rank: with three columns, the second-hottest item sits near the bottom-left rather than beside the first. When the sort is genuinely the message — a leaderboard, an editorially ranked feed — switch `layout` to \"rows\", which keeps unequal tile heights but lays them out left-to-right so rank and position agree.",
    "Swapping the tile for A8 preview-tile. It is the load-bearing primitive everywhere else in the registry and reaching for it here is the obvious 'cleanup' — but A8 exists to fix the frame to one aspect ratio, and this component exists because the heights vary. Composing it would turn the feed back into a uniform grid, which is C4 recent-grid, which already exists.",
    "Passing the same `aspectRatio` for every item (or omitting it, which defaults to square). The layout still renders, but every tile is the same height and the feed reads as a grid — the exact outcome the component is shaped to avoid.",
    "Controlling `promptValue` from the host and forgetting to update it in the `onPromptValueChange` handler. Remix reports the seeded prompt through that callback; if the controlled value never changes, the bar stays empty and the tile action appears to do nothing.",
    "Filtering `items` in the host but forgetting to update `totalCount`. The status region announces loaded-against-total, so a stale total tells screen-reader users the feed is far longer than it is.",
  ],
};
