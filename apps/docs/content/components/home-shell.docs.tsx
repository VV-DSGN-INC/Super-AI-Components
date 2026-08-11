import type { ComponentDocs } from "@/lib/component-docs";
import {
  RecentsDisappearWhenEmpty,
  RecentsKeepTheirEmptyTile,
  StarterFillsTheComposer,
  StarterStartsTheRun,
} from "./home-shell.examples";

/**
 * Seeded from docs/design-system/block-specs.md — O1 `home-shell`.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and the rest directly. Live examples live in the ./home-shell.examples
 * client sidecar and arrive here as zero-prop elements.
 */
export const HomeShellDocs: ComponentDocs = {
  whatItIs:
    "The page shell for an app home or launcher: a sidebar, a title bar, a large composer above the fold, and beneath it the bands that lead back into work you have already done — starters, features, recents, and things worth trying. It is a block, not a component. It owns arrangement and nothing else: nine registry components fill the five regions, and each of them keeps its own props, its own state model and its own accessibility contract.",
  whyItMatters:
    "YouAI, Descript, Zapier, CapCut and Spline all open on the same page, in the same order: composer, then starters, then features, then recents, then inspiration. It is the most consistent archetype on the reference board, and the order is the archetype — so it is hard-coded here rather than offered as a prop. Two decisions follow from it. The composer is the only emphasised element on the page, which is what makes a launcher feel like an invitation rather than a dashboard; every band below it is deliberately quiet. And the whole page is the recents grid's empty state on day one, which is the version most new users actually see — so every band stays mounted when it has nothing in it, and explains the nothing, rather than collapsing into a page that teaches a new user only that the product is empty.",
  evidence: ["YouAI", "Descript", "Zapier", "CapCut", "Spline"],
  anatomy: [
    {
      slot: 'data-region="sidebar"',
      note: "B1 app-sidebar around whatever nav this product has, or L1 when it has none.",
    },
    {
      slot: 'data-region="topbar"',
      note: "The sidebar trigger plus B7 app-topbar, with M2 credits-indicator in its trailing slot.",
    },
    {
      slot: 'data-region="hero-omnibox"',
      note: "C1 hero-omnibox, and C2 suggestion-chips directly under it — starters belong to the composer.",
    },
    {
      slot: 'data-region="feature-cards"',
      note: "C3 feature-card-row, or L1 when there are no features. C3 has no empty affordance of its own.",
    },
    {
      slot: 'data-region="recents-grid"',
      note: "C4 recent-grid, which owns its own in-grid empty tile — that tile is the day-one page.",
    },
    {
      slot: "home-shell-inspiration",
      note: "C5 recommendation-card, last. A slot rather than a region: the manifest declares five.",
    },
    { slot: "home-shell", note: "Root. Contains its own fixed descendants so the shell can be embedded." },
    { slot: "home-shell-page", note: "The scrolling column. Everything below the topbar lives here." },
    { slot: "home-shell-headline", note: "Optional page h1 above the composer." },
    { slot: "home-shell-starters", note: "The C2 chip row, inside the hero region." },
    { slot: "home-shell-recommendations", note: "The C5 card grid, inside the inspiration section." },
  ],
  usage:
    "Reach for it when your product's front door is a prompt rather than a document list. Everything is a prop: `suggestions` fills the starter row, `features` fills the card row, `recents` fills the grid, `recommendations` fills the inspiration band, and `omnibox` is forwarded whole to C1. The composer's text is the shell's, not C1's — pass `promptValue`/`onPromptChange` to control it, and leave both off to let the shell hold it. That is deliberate: selecting a starter chip has to write into the composer, and it must never submit or navigate. Put the balance in `credits` and it renders in the title bar, which is where an app-level cost signal belongs. Give `recentsEmptyAction` the same verb as your primary action (\"New project\", not \"Get started\") — L1 has no CTA of its own precisely so that a generic one is never the path of least resistance.",
  dos: [
    {
      text: "Let a starter chip fill the composer and stop there, so the prompt can still be edited before it runs.",
      example: <StarterFillsTheComposer />,
    },
    {
      text: "Keep the recents band mounted when it is empty — its own tile is the day-one page, and it is what teaches a new user the band exists.",
      example: <RecentsKeepTheirEmptyTile />,
    },
  ],
  donts: [
    {
      text: "Don't wire a chip to submit. A starter that launches a run turns a suggestion into a decision nobody made.",
      example: <StarterStartsTheRun />,
    },
    {
      text: "Don't hide a band because it has nothing in it; a region that appears from nowhere later cannot teach that it exists now.",
      example: <RecentsDisappearWhenEmpty />,
    },
  ],
  pitfalls: [
    "The vendored sidebar's desktop container is `fixed inset-y-0 h-svh`, which is right only when the shell owns the viewport. The root sets `contain: layout` so the shell stays embeddable in a preview, a panel or an app region — if you re-wrap or restyle the root, keep that containment or the sidebar pins itself to the browser's left edge. The trade-off is that the sidebar keeps its full `h-svh` height and is clipped to the shell's, so anything it bottom-anchors — `sidebarPromo` and `sidebarFooter` — falls below the clip and is invisible whenever the shell is shorter than the viewport, which is the default embedded case. Fill those two slots only in a shell rendered at viewport height.",
    "The composer's value belongs to the shell, not to C1, because a starter chip has to write into it. Passing `omnibox.value` does nothing useful — the shell overwrites it. Use `promptValue` and `onPromptChange`, or leave both off and let the shell hold the text.",
    "B7 has no leading slot, so the sidebar trigger is a sibling of the topbar and the row, not the header, draws the bottom rule. It also means the topbar's `actions` are merged rather than replaced: the shell spreads your `topbar` first and then rebuilds `actions` as yours followed by the credits indicator. Passing `actions` and expecting the credits chip to disappear will not work — omit `credits` instead.",
    "M2 paints a `bg-muted` pill and puts a `text-muted-foreground` \"Top up\" control inside it. That is the 4.34:1 pairing this system keeps re-discovering, in the cross-component shape the token check cannot see: the failing element is inside M2, so no `className` on the call site reaches it. The shell rebinds `--muted-foreground` on the chip instead, which the child resolves against. Keep that rebind if you restyle the topbar.",
    "C3 has no empty affordance, so an empty feature row renders as a carousel with two dead arrows and nothing between them; the shell substitutes L1 there. C4 does have one, and the shell deliberately does not substitute — replacing C4's tile with a generic L1 would lose the grid's rhythm and the CTA slot the spec asks you to fill with your own verb.",
    "C3's carousel arrows sit at `-left-12`/`-right-12`, three rem of gutter it assumes the page has. Inside a sidebar inset there is often only the page's own padding, and because setting `overflow-y` on an element forces `overflow-x` to `auto` as well, the arrow that lands outside turns the whole page into a horizontal scroller — measured at 375px, 407px of content in a 375px column, all of it that one arrow. The shell insets the carousel instead of moving the arrows. If you re-lay-out the features band, keep a gutter for them.",
    "C4's columns step at viewport breakpoints, not container width, so in a wide window with the sidebar open the grid can show four fairly narrow tiles inside a column much narrower than the viewport. It degrades gracefully — a thumbnail survives being small in a way an excerpt does not — so the shell leaves it alone, but if you nest this shell inside something narrower still, override the grid rather than the wrapper.",
    "C2's chip row is a Base UI `ScrollArea`, and its viewport schedules a timer that calls `getAnimations()` on itself. jsdom has no Web Animations API, so in a test long enough for that timer to fire it throws — after the test that triggered it has already passed. The suite goes red with every assertion green. The shim lives at the top of `home-shell.test.tsx`; it really belongs in `vitest.setup.ts` next to the ResizeObserver stub.",
    "C5 requires `onDismiss` and renders nothing at all once `dismissed` is true, so the inspiration band is only as durable as the state you feed back into it. Wire dismissal to something that remembers, or a card the user hid will be back on the next render.",
  ],
};
