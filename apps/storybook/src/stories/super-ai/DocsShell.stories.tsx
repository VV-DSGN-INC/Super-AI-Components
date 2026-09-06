import type { Meta, StoryObj } from "@storybook/react-vite";
import { AudioLines, Blocks, Image as ImageIcon, Rocket } from "lucide-react";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

import { Button } from "@/components/ui/button";
import { DocsShell, type DocsShellProps } from "@/registry/super-ai/docs-shell";
import { SettingsShell } from "@/registry/super-ai/settings-shell";
import { DocsShellDocs } from "@/content/components/docs-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const AREAS: DocsShellProps["areas"] = [
  { id: "platform", label: "Platform", icon: <Blocks /> },
  { id: "images", label: "Image models", icon: <ImageIcon /> },
  { id: "audio", label: "Audio models", icon: <AudioLines /> },
  { id: "deploy", label: "Deploy", icon: <Rocket /> },
];

const NAV_SECTIONS: DocsShellProps["navSections"] = [
  {
    label: "Get started",
    items: [
      { id: "quickstart", label: "Quickstart" },
      { id: "authentication", label: "Authentication" },
      { id: "rate-limits", label: "Rate limits", tier: "Pro" },
    ],
  },
  {
    label: "Generate",
    items: [
      { id: "text-to-image", label: "Text to image" },
      { id: "image-to-image", label: "Image to image" },
      { id: "upscale", label: "Upscale", count: 2 },
    ],
  },
  {
    label: "Reference",
    items: [
      { id: "errors", label: "Errors" },
      { id: "changelog", label: "Changelog", unread: true },
      { id: "status", label: "Status page", href: "https://example.com/status", external: true },
    ],
  },
];

const SECTIONS: DocsShellProps["sections"] = [
  {
    id: "overview",
    title: "Overview",
    body: "Every image request is a POST to /v1/images with a JSON body. The response streams progress events until the final asset URL arrives, so a client can show partial results without polling for them.",
  },
  {
    id: "sizes",
    title: "Supported sizes",
    body: "Square, portrait and landscape are billed identically. Anything above 2048px on the long edge is billed at the upscale rate, whether or not you asked for an upscale.",
    citations: [
      {
        id: "pricing",
        label: "1",
        source: "Pricing — image generation",
        quote: "Outputs above 2048px on the long edge bill at the upscale rate.",
      },
    ],
  },
  {
    id: "errors",
    title: "Errors",
    body: "A 429 carries a Retry-After header in seconds. A 402 means the workspace is out of credits and will not clear on its own.",
    citations: [
      {
        id: "rfc",
        label: "2",
        source: "RFC 6585 §4",
        quote: "The 429 status code indicates that the user has sent too many requests.",
      },
      { id: "orphan", label: "3", state: "unresolved" },
    ],
  },
];

const FULL_ARGS: DocsShellProps = {
  railBrand: <div className="px-1 text-sm font-medium">NW</div>,
  areas: AREAS,
  activeAreaId: "images",
  onSelectArea: () => {},
  navSections: NAV_SECTIONS,
  activePageId: "text-to-image",
  onSelectPage: () => {},
  announcements: [
    {
      id: "streaming-2026-08",
      title: "Streaming image progress",
      description: "Partial frames now arrive before the final asset.",
      stage: "Beta",
      ctaLabel: "Read the guide",
      onCtaClick: () => {},
    },
  ],
  onDismissAnnouncement: () => {},
  title: "Text to image",
  lede: "Generate an image from a prompt, with optional reference images and a seed for reproducibility.",
  sections: SECTIONS,
};

const meta: Meta<typeof DocsShell> = {
  title: "Super AI/Docs Shell",
  component: DocsShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame. It is also what
  // makes the rail's bottom-anchored footer slot usable at all.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(DocsShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DocsShell>;

/** The working shell: four product areas, a sectioned page nav, one announcement, a cited page. */
export const Reference: Story = {
  args: {
    ...FULL_ARGS,
    // Safe here and nowhere else: the story frame is viewport-tall, so B1's
    // bottom-anchored footer is not clipped by the shell's containment.
    railFooter: <div className="px-1 py-1 text-center text-xs">NV</div>,
  },
};

/**
 * Day one. No areas in the rail, no pages in the nav, no announcements, nothing
 * written on the page — the nav and the content column both fall to L1, and the
 * rail and the strip are empty because neither B1 nor L3 has an empty form.
 * Mandatory export for the block contract, and the version a new docs site
 * actually starts from.
 */
export const Empty: Story = {
  args: { railBrand: <div className="px-1 text-sm font-medium">NW</div> },
};

/**
 * Narrow viewport. Below the sidebar's 768px breakpoint the vendored Sidebar
 * swaps itself for a drawer, the page nav stops being a column and stacks above
 * the content as a short scrollable strip, and the content column keeps its
 * measure because the measure is a max, not a width. Mandatory export for the
 * block contract — a shell is a layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing at all while looking
 * configured, so `options` is declared explicitly rather than relying on a
 * built-in list.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `test:stories` has no manager to resize an iframe, so this
 * story is rendered and axe-checked at the browser's default width like any
 * other. The narrow layout here is verified by hand, not by a gate.
 */
export const Responsive: Story = {
  args: FULL_ARGS,
  parameters: {
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" }, type: "mobile" },
      },
    },
  },
  globals: { viewport: { value: "mobile" } },
};

/**
 * The rail expanded to full width. Same rows, same landmark, labels no longer
 * clipped — this is what the vendored sidebar's ⌘B binding toggles to, and the
 * reason the shell advertises that binding with keycaps beside the trigger.
 */
export const RailExpanded: Story = {
  args: { ...FULL_ARGS, defaultRailExpanded: true },
};

/**
 * A quiet page: no news pinned above it. The strip is still mounted, it just
 * has nothing to paint — which is why the region exists on every page rather
 * than appearing the first time there is something to say.
 */
export const NoAnnouncements: Story = {
  args: { ...FULL_ARGS, announcements: [] },
};

/**
 * A product area with nothing published yet. The rail still switches, the page
 * nav falls to L1, and the content column keeps whatever you were reading —
 * three regions in three different states at once.
 */
export const AreaWithoutPages: Story = {
  args: { ...FULL_ARGS, activeAreaId: "audio", navSections: [], activePageId: undefined },
};

/* ----------------------------------------------------------------------
 * Case stories — the situations this shell meets in a product, as opposed to
 * the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * All eight are true here, so there is no `case-skip` line in this file. A
 * shell declares `regions` rather than `states`, so the exports above are
 * arrangements a caller reaches rather than a state machine; the eight below
 * are the conditions that break arrangements.
 *
 * Five of the eight surfaced defects that are recorded rather than asserted,
 * because they live in files this block composes and a block reports rather
 * than forks (block-build-brief.md): the vendored sidebar neither mirrors
 * under RTL nor branches on reduced motion (`RTL`, `ReducedMotion`); K6's
 * quote card and B1's rail tooltips both animate under reduce
 * (`ReducedMotion`); A1's `KbdGroup` reverses a chord under RTL, so the one
 * hand-written affordance in this shell advertises ⌘B as B⌘ (`RTL`); B3's nav
 * rows truncate a page name with no `title` to recover it (`LongContent`); and
 * an invisible tooltip swallows the first Escape inside the mobile drawer
 * (`Mobile`). Two more are the shell's own and are recorded for the same
 * reason — each is an API or host decision rather than a class: an empty
 * string reaching a named slot (`EmptyLabel`) and focus falling to `<body>`
 * when an announcement is dismissed (`Controlled`).
 * ---------------------------------------------------------------------- */

/**
 * `dir` on the document rather than on a wrapper. Two of this shell's surfaces
 * portal on hover or focus — K6's quote card and B1's rail tooltips — and Base
 * UI reads direction from computed style and from its own context, neither of
 * which a `<div dir>` reaches (story-conventions.md, mechanical fact 5).
 */
function RtlDocument({ children }: { children: React.ReactNode }) {
  React.useLayoutEffect(() => {
    const previous = document.documentElement.dir;
    document.documentElement.dir = "rtl";
    return () => {
      document.documentElement.dir = previous;
    };
  }, []);
  return <>{children}</>;
}

/**
 * Right-to-left. This file carried three physical classes and all three are now
 * logical: `mr-1` → `me-1` on the "Sources" label, `md:border-r` → `md:border-e`
 * on the doc-nav column, `ml-auto` → `ms-auto` on the keycaps in the nav header.
 *
 * **Byte-identical in LTR as a measurement, not an assumption** (N6
 * `usage-dashboard`'s lesson). The whole LTR frame was read back before and
 * after the swap and every box matched to the sub-pixel: the "Sources" label
 * `x=409.34..456.41` with `margin: 0px 4px 0px 0px`, the doc-nav column
 * `x=48..304` with `border-right-width: 1px` and `border-left-width: 0px`, the
 * keycap group `x=248.53..295` with `margin-left: 56.375px`, and the article
 * `x=409.34..1094.66`. All three classes sit on the element that consumes
 * them, which is the condition N6 found the exception to — its `text-left` sat
 * on a `<tr>` whose `<th>`s the user agent had its own opinion about.
 *
 * What the swap buys, asserted below from the RTL side: the 4px gap moves to
 * the reading side of the "Sources" label, so it separates the word from the
 * markers instead of sitting behind it; the nav column's rule moves to the edge
 * it shares with the content; and the keycaps go back to the end of the header
 * row instead of floating 64px short of it.
 *
 * TWO DEFECTS THIS STORY CANNOT FIX, both measured at 1200px.
 *
 * **The vendored sidebar does not mirror**, which every shell in family O
 * inherits and O1 `home-shell` measured first at full width. At icon width the
 * numbers are smaller and the shape is identical: `sidebar-gap` mirrors with
 * the flex row to `x=1152..1200` while the `fixed` container stays at
 * `x=0..48`, so under RTL there is a 48px blank strip down the right edge and
 * the rail lies on top of the first 48px of the content column, which starts at
 * `x=0`. The repair is one logical-property pass on `sidebar-container` and
 * `sidebar-gap` in `components/ui/sidebar.tsx`, and it fixes all thirteen
 * shells at once.
 *
 * **A1's `KbdGroup` reverses the chord**, and this shell is where that costs
 * something. `KbdGroup` is a plain `inline-flex` row with no `dir="ltr"` pin,
 * so under RTL the ⌘ paints to the *right* of the B — measured `⌘@930.2`,
 * `B@905.0` — and a keycap row reading "B ⌘" is a different instruction that
 * still looks correct. The nav header exists to advertise the rail's binding,
 * so the one hand-written affordance in this file is the one that lies. It is
 * recorded in `CONTINUE.md` §8 as a real bug in the `kbd` primitive (found by
 * `shortcuts-sheet` and the logical-properties pass); this is the third
 * instance and the first inside a shell. The fix is a behaviour change in
 * `kbd`, not a compile-identical swap, so it is not taken here.
 */
export const RTL: Story = {
  args: FULL_ARGS,
  decorators: [
    (Story) => (
      <RtlDocument>
        <Story />
      </RtlDocument>
    ),
  ],
  play: async ({ canvasElement }) => {
    await expect(document.documentElement.dir).toBe("rtl");
    const at = (selector: string) => canvasElement.querySelector<HTMLElement>(selector)!;

    // 1. `me-1` on the Sources label: the gap is now on the side the markers
    //    are on. `mr-1` kept it at `0px 4px 0px 0px` under RTL, which put the
    //    space behind the word rather than in front of the citations.
    const sourcesLabel = at('[data-slot="docs-shell-sources"] span');
    await expect(getComputedStyle(sourcesLabel).marginLeft).toBe("4px");
    await expect(getComputedStyle(sourcesLabel).marginRight).toBe("0px");
    const firstMarker = at('[data-slot="docs-shell-sources"] [data-slot="citation-ref"]');
    await expect(firstMarker.getBoundingClientRect().right).toBeLessThanOrEqual(
      sourcesLabel.getBoundingClientRect().left,
    );

    // 2. `md:border-e` on the nav column: the rule sits between the nav and the
    //    content, which under RTL is its left edge.
    const navColumn = at('[data-region="doc-nav"]');
    await expect(getComputedStyle(navColumn).borderLeftWidth).toBe("1px");
    await expect(getComputedStyle(navColumn).borderRightWidth).toBe("0px");

    // 3. `ms-auto` on the keycaps: flush to the end of the header row. Under
    //    RTL that is its left edge, 8px in from the row's own padding.
    const header = at('[data-slot="docs-shell-nav-header"]');
    const keycaps = at('[data-slot="kbd-group"]');
    await expect(getComputedStyle(keycaps).marginRight).toBe("56.375px");
    await expect(
      keycaps.getBoundingClientRect().left - header.getBoundingClientRect().left,
    ).toBeLessThanOrEqual(10);

    // 4. The page column itself mirrors, which is what makes the two defects
    //    above visible rather than merely theoretical: the nav is at the start
    //    edge (right) and the content column runs to the left of it.
    const contentColumn = at('[data-region="content-column"]');
    await expect(contentColumn.getBoundingClientRect().right).toBeLessThanOrEqual(
      navColumn.getBoundingClientRect().left + 1,
    );

    // 5. And the measure survives direction — it is a max-width on the article,
    //    not a physical offset, so the column stays centred at 68ch.
    const article = at('[data-slot="docs-shell-article"]');
    await expect(Math.round(article.getBoundingClientRect().width)).toBe(685);
  },
};

/**
 * Under `prefers-reduced-motion: reduce`, which `vitest.config.ts` emulates for
 * every test in this project. **The shell animates nothing of its own** — no
 * `animate-*` and no `transition-*` anywhere in `docs-shell.tsx` — so what this
 * story documents is the motion its composed children own, and the answers
 * differ by child.
 *
 * BRANCHES, and is asserted below: K6's `loading` marker. `citation-ref` pairs
 * `animate-pulse` with `motion-reduce:animate-none`, so a citation still being
 * looked up stops pulsing rather than throbbing under a reader who asked for
 * stillness. That is the one real branch this shell can reach, and this story
 * is its regression guard from four levels up.
 *
 * DOES NOT BRANCH, and is deliberately not asserted, because pinning a
 * measurement would freeze the defect (spec §3.4). Four surfaces, all measured
 * here with `matchMedia("(prefers-reduced-motion: reduce)")` true:
 *
 * - **K6's quote card.** `hover-card.tsx` animates through
 *   `data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95` with no
 *   `motion-reduce:` pair on either half, so opening a citation reads back
 *   `animation-name: enter` and the card zooms. Reachable from every citation
 *   in the page and unreachable from this call site: `CitationRef`'s
 *   `className` lands on the marker, not on the popup.
 * - **B1's rail tooltips.** `tooltip.tsx` is the same shape and reads back
 *   `animation-name: enter`. At icon width the tooltip is how a pointer user
 *   reads a rail row, so it fires constantly.
 * - **The vendored sidebar itself.** `sidebar-gap` is `transition-[width]
 *   duration-200` and the container `transition-[left,right,width]
 *   duration-200`; both measured at `0.2s`. Pressing ⌘B slides the rail for
 *   200ms for a user who asked for no motion. O1 `home-shell` recorded this
 *   first at 256px; at icon width it is the same transition over 48px.
 * - **B1's mobile drawer**, which only exists below 768px and is therefore
 *   measured in `Mobile`. O2 `chat-shell` found it earlier in this same wave.
 *
 * All four are vendored or composed files; the repairs are one
 * `motion-reduce:transition-none` (sidebar, sheet) and one restated
 * `motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none`
 * pair (hover-card, tooltip), each of which fixes every consumer at once.
 */
export const ReducedMotion: Story = {
  args: {
    ...FULL_ARGS,
    sections: [
      SECTIONS![0],
      {
        ...SECTIONS![1],
        citations: [{ id: "pricing", label: "1", state: "loading" }],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    // An assertion that could not fail is worse than none: prove the emulation
    // is on before reading anything back.
    await expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);

    const marker = canvasElement.querySelector<HTMLElement>(
      '[data-slot="citation-ref"][data-state="loading"]',
    )!;
    await expect(getComputedStyle(marker).animationName).toBe("none");

    // The shell's own regions paint no motion at all — the claim the
    // description opens with, asserted rather than asserted-by-absence.
    for (const region of ["icon-rail", "doc-nav", "announcement-strip", "content-column"]) {
      const el = canvasElement.querySelector<HTMLElement>(`[data-region="${region}"]`)!;
      await expect(getComputedStyle(el).animationName).toBe("none");
      await expect(getComputedStyle(el).transitionDuration).toBe("0s");
    }
  },
};

/**
 * The tab order across the whole shell, in one lap. Twenty stops at these
 * fixtures: four rail rows, the rail toggle, nine nav rows, the announcement's
 * CTA and ✕, the content column, and three citation markers — measured, and
 * asserted as an ordered sequence rather than as a count, so a reordering says
 * which seam moved.
 *
 * That number is the point. **There is no skip link**, so a keyboard reader
 * arriving at a docs page passes every product area and every page in the
 * current area before reaching the prose they navigated to; the docs module
 * says forty-four stops for a forty-page nav, and this is the same arithmetic
 * with a nine-page one. Nothing here uses a roving tabindex.
 *
 * **The wave-6 finding on L3 does not reach this shell, and that is worth
 * knowing rather than assuming.** `feature-announcement`'s `anchored` level
 * closes on Base UI's trigger focus guard, and its close path emits
 * `onDismiss(id)` — so a single Tab past its last control permanently dismisses
 * an announcement whose contract says a dismissed id must never re-show. The
 * strip pins `level="dismissible-chip"`, which is not an overlay: `isOverlay`
 * is false, `handleDismiss` is wired only to the ✕'s `onClick`, and there is no
 * focus-out path at all. Asserted below with a counting host — tabbing past the
 * ✕ emits nothing and moves on to the content column. This is the safe
 * behaviour asserted as a guard, not a defect pinned green: if the strip is
 * ever escalated to `anchored`, this assertion goes red.
 *
 * **A docs correction, and the third of its shape in this program.** The docs
 * module's focus list says the content column "does not [carry a
 * focus-visible ring]: it is a tab stop with no focus styling at all". Measured
 * here: it paints the user agent's own `outline: auto` recoloured by this
 * repo's global `outline-ring/50` — `outline-style: auto`, `outline-width:
 * 1px`, `outline-color: oklab(0.708 0 0 / 0.5)`. Thin against the 2px ring
 * every other stop in the shell paints, and not absent. Same correction N3
 * `disclaimer-note` and M1 `settings-dialog` needed in wave 7, and the same
 * cause: prose written from reading a class list.
 *
 * The play is in two halves on purpose. The lap asserts the *order* and
 * touches nothing else, so a reordering reports which seam moved rather than a
 * count that is one short. The ring check then focuses one element of each kind
 * directly, which is where mechanical fact 5 says the differential proves most:
 * with no tab sequence to disturb, the signature can be read before focus
 * arrives and again after. Both checks are taken at every kind of stop because
 * they answer different questions — `settledFocusRing` asks whether anything is
 * painted, which is necessary here because the vendored `Button` carries
 * `transition-all` and fades its ring in over ~250ms (the rail toggle and both
 * announcement controls read a transparent zero-size shadow on the frame focus
 * lands), and the differential asks whether focus is what painted it, which is
 * what a permanent shadow would otherwise pass.
 */
export const KeyboardOrder: Story = {
  render: function Render(args) {
    const [dismissed, setDismissed] = React.useState<string[]>([]);
    return (
      <div className="h-svh w-full">
        <DocsShell
          {...args}
          lede={
            <>
              {args.lede}
              <span data-testid="dismiss-log" className="sr-only">
                {dismissed.join(",") || "none"}
              </span>
            </>
          }
          onDismissAnnouncement={(id) => setDismissed((current) => [...current, id])}
        />
      </div>
    );
  },
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The content column is a region marker rather than a slot, so name stops
    // by whichever it carries — a walk that reports "section" says nothing.
    const slotOf = (el: Element | null) =>
      el === null
        ? "none"
        : (el.getAttribute("data-slot") ?? el.getAttribute("data-region") ?? el.tagName.toLowerCase());

    // One lap of the document, recording where each tab landed and proving each
    // stop paints a treatment that focus itself caused.
    const walked: string[] = [];
    for (let press = 0; press < 20; press += 1) {
      const target = document.activeElement;
      await userEvent.tab();
      const active = document.activeElement as HTMLElement;
      if (active === target || active === document.body) break;
      walked.push(slotOf(active));
    }

    await expect(walked).toEqual([
      // The rail: four product areas. `app-sidebar-rail`, the drag handle, is
      // `tabIndex={-1}` in the vendored file, so the toggle below is the only
      // keyboard route to the rail's own state.
      "sidebar-menu-button",
      "sidebar-menu-button",
      "sidebar-menu-button",
      "sidebar-menu-button",
      // The one hand-written affordance in the shell, and the seam between the
      // two navigations.
      "sidebar-trigger",
      // B3: nine pages. The last is an `<a>` rather than a `<button>` because
      // that row carries `href` — same stop, different activation keys.
      ...Array.from({ length: 9 }, () => "sidebar-nav-item"),
      // The strip, in DOM order: CTA then ✕.
      "feature-announcement-cta",
      "feature-announcement-dismiss",
      // The scroll container. It holds no controls, so it reads as a stop that
      // does nothing until you press an arrow key — which is exactly what it is
      // for (axe `scrollable-region-focusable`).
      "content-column",
      // The prose: one stop per citation, including the unresolved one.
      "citation-ref",
      "citation-ref",
      "citation-ref",
    ]);

    // Focus treatment, one stop at a time, from the top.
    const stops = [
      '[data-slot="sidebar-menu-button"]',
      '[data-slot="sidebar-trigger"]',
      '[data-slot="sidebar-nav-item"]',
      '[data-slot="feature-announcement-cta"]',
      '[data-slot="feature-announcement-dismiss"]',
      '[data-region="content-column"]',
      '[data-slot="citation-ref"]',
    ];
    for (const selector of stops) {
      const el = canvasElement.querySelector<HTMLElement>(selector)!;
      const before = focusTreatmentSignature(el);
      el.focus();
      // Something is painted…
      await settledFocusRing(el, waitFor);
      // …and focus is what painted it.
      await waitFor(() => expect(focusTreatmentSignature(el)).not.toBe(before));
    }

    // Tabbing past the announcement is navigation, not a decision. Nothing is
    // emitted and nothing is lost — the L3 defect above is level-specific.
    const dismissControl = canvasElement.querySelector<HTMLElement>(
      '[data-slot="feature-announcement-dismiss"]',
    )!;
    dismissControl.focus();
    await userEvent.tab();
    await expect(canvas.getByTestId("dismiss-log")).toHaveTextContent("none");
    await expect(canvasElement.querySelector('[data-slot="feature-announcement"]')).not.toBeNull();
    await expect(slotOf(document.activeElement)).toBe("content-column");

    // B1 opens a tooltip on a focused rail row at icon width. Leave nothing
    // mid-dismissal for axe to scan.
    await waitFor(() => expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull());
  },
};

/**
 * Two controlled pairs, held by one host, because they fail differently and a
 * consumer meets both on the same page.
 *
 * `activePageId` / `onSelectPage` is the ordinary kind: the nav proposes, the
 * host applies, and until it does the rail row you clicked is not the current
 * page. `announcements[].dismissed` / `onDismissAnnouncement` is the kind that
 * bites, and it is L3's contract surfacing through the shell — **L3 never
 * stores a dismissal.** It emits an id and expects the host to remember it, so
 * a shell rendered without `onDismissAnnouncement` ships a ✕ that visibly does
 * nothing, and one rendered with a handler that forgets ships an announcement
 * that comes back on the next page load. That is the most-hated pattern on this
 * surface, and the reason the strip is controlled rather than stateful.
 *
 * All four of the convention's assertions are made against both pairs:
 * interaction alone does not move the rendered value, the callback carries the
 * payload a host needs (the page id; the announcement id), the host re-renders
 * with an unchanged value and the shell holds, and the payload is sufficient to
 * apply the change. The render counter is what makes "held" mean "re-rendered
 * and did not move" rather than "never re-rendered".
 *
 * RECORDED, not asserted: **dismissing drops focus to `<body>`.** The ✕ that
 * was activated unmounts with the chip, and nothing in the strip catches focus,
 * so a keyboard user who dismisses an announcement is returned to the top of
 * the document. Measured on the second announcement below, whose host stores on
 * report: focus it, activate it, and `document.activeElement` reads `<body>`
 * on the next frame. The docs module already names the repair — move focus from
 * `onDismissAnnouncement`, to the next announcement or to the content column,
 * which is a legitimate target because it carries both a `tabIndex` and a name.
 * It is a host decision and pinning it would make that repair a red story, so
 * the play stops at the strip.
 */
function ControlledHost() {
  const [requestedPage, setRequestedPage] = React.useState("none");
  const [appliedPage, setAppliedPage] = React.useState("text-to-image");
  const [dismissRequests, setDismissRequests] = React.useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = React.useState<string[]>([]);
  const passes = React.useRef(0);
  passes.current += 1;

  return (
    <div className="h-svh w-full">
      <DocsShell
        {...FULL_ARGS}
        activePageId={appliedPage}
        onSelectPage={setRequestedPage}
        announcements={[
          ...(FULL_ARGS.announcements ?? []),
          // A second announcement whose dismissal this host stores the moment
          // it is reported — a host that remembers, which is what L3's contract
          // asks for and what the focus measurement below needs.
          { id: "seeds-2026-09", title: "Seeds are now per-project", stage: "New" },
        ].map((announcement) => ({
          ...announcement,
          dismissed: dismissedIds.includes(announcement.id),
        }))}
        onDismissAnnouncement={(id) => {
          setDismissRequests((current) => [...current, id]);
          if (id === "seeds-2026-09") setDismissedIds((current) => [...current, id]);
        }}
        lede={
          <>
            {FULL_ARGS.lede}
            <span data-testid="requested-page" className="sr-only">
              {requestedPage}
            </span>
            <span data-testid="dismiss-requests" className="sr-only">
              {dismissRequests.join(",") || "none"}
            </span>
            <span data-testid="render-pass" className="sr-only">
              {passes.current}
            </span>
          </>
        }
        sections={[
          {
            id: "apply",
            title: "Host",
            body: (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setAppliedPage(requestedPage)}>
                  Apply page
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDismissedIds((current) => [...current, ...dismissRequests])}
                >
                  Apply dismissals
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rowNamed = (name: string) =>
      canvas.getByRole("button", { name: new RegExp(`^${name}`) }) as HTMLElement;

    // ---- the page pair ----
    await expect(rowNamed("Text to image")).toHaveAttribute("aria-current", "page");
    const passBefore = Number(canvas.getByTestId("render-pass").textContent);

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(rowNamed("Upscale"));
    await expect(rowNamed("Text to image")).toHaveAttribute("aria-current", "page");
    await expect(rowNamed("Upscale")).not.toHaveAttribute("aria-current");

    // 2. The callback carried the id — the whole payload a host needs.
    await expect(canvas.getByTestId("requested-page")).toHaveTextContent("upscale");

    // 3. That report re-rendered the host with an unchanged `activePageId`, and
    //    the shell held. The counter is what makes "held" mean something.
    await expect(Number(canvas.getByTestId("render-pass").textContent)).toBeGreaterThan(passBefore);

    // 4. And the payload is sufficient to apply the change.
    await userEvent.click(canvas.getByRole("button", { name: "Apply page" }));
    await expect(rowNamed("Upscale")).toHaveAttribute("aria-current", "page");
    await expect(rowNamed("Text to image")).not.toHaveAttribute("aria-current");

    // ---- the announcement pair, which is where a host loses data ----
    const chip = canvasElement.querySelector<HTMLElement>('[data-slot="feature-announcement"]')!;
    const dismiss = canvasElement.querySelector<HTMLElement>('[data-slot="feature-announcement-dismiss"]')!;
    await expect(dismiss).toHaveAccessibleName("Dismiss announcement: Streaming image progress");

    // 1 & 2. The ✕ reports and does not remove: the chip is still mounted, and
    //        the id is what came back — one handler can serve every strip.
    await userEvent.click(dismiss);
    await expect(canvasElement.querySelector('[data-slot="feature-announcement"]')).toBe(chip);
    await expect(canvas.getByTestId("dismiss-requests")).toHaveTextContent("streaming-2026-08");

    // 3 & 4. The host stores it, feeds it back, and only then does the chip
    //        go — while the region stays mounted with one announcement left.
    await userEvent.click(canvas.getByRole("button", { name: "Apply dismissals" }));
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-announcement-id="streaming-2026-08"]')).toBeNull(),
    );
    const strip = canvasElement.querySelector<HTMLElement>('[data-region="announcement-strip"]')!;
    await expect(strip).toBeInTheDocument();
    await expect(strip.childElementCount).toBe(1);

    // The second announcement's host stores on report, which is the shape a
    // real consumer ships — and it is where the focus loss becomes visible.
    const storing = canvas.getByRole("button", {
      name: "Dismiss announcement: Seeds are now per-project",
    });
    storing.focus();
    await expect(document.activeElement).toBe(storing);
    await userEvent.click(storing);
    await waitFor(() => expect(strip.childElementCount).toBe(0));

    // The focus loss is deliberately not asserted here. Reading
    // `document.activeElement` at this point returns `<body>` — the ✕ unmounted
    // while focused and nothing caught it — but pinning that would turn the
    // repair into a failing story, so it is recorded in the description
    // instead (spec §3.4). What is asserted is the part that must not change:
    // the strip is still mounted with nothing in it.
    await expect(strip).toBeInTheDocument();
  },
};

/**
 * Every optional slot left out, plus the one empty string that is *not* caught
 * by a gate. A docs shell is mostly optional slots — no lede, no section
 * bodies, no citations, no section action, no brand, no footer, no stage, no
 * CTA — and the rendering that comes back is honest: A12's headings carry the
 * page on their own and the strip shrinks to a badge-less chip.
 *
 * **The finding is the other direction from every earlier wave's, and it is a
 * good one.** Wave 1 (P1 `data-views`), wave 5 (J4) and O1 `home-shell` all
 * measured the same shape — a caller passes `""` to hide a label and silently
 * deletes structure, with nothing red anywhere. On this shell the same move is
 * *loud*, because a docs page promotes its titles to headings and names two
 * landmarks instead of one. Measured in this tree, all three at once:
 *
 * - `title=""` → the page `<h1>` renders empty and axe fails `empty-heading`.
 *   It is also the `aria-labelledby` target of the content column, so the
 *   region loses its name in the same move.
 * - a section's `title=""` → the A12 header the shell promotes to `role=
 *   "heading" aria-level="2"` is an empty heading too, and fails the same rule.
 * - `railLabel=""` *and* `navLabel=""` → two `nav` landmarks with identical
 *   empty names, and axe fails `landmark-unique`: "the landmark must have a
 *   unique aria-label, aria-labelledby, or title". That is the split this whole
 *   block exists to make — "which product" and "which page" — collapsing into
 *   one indistinguishable pair for a screen-reader user.
 *
 * So this story deliberately renders the *reachable* empty configuration
 * rather than the failing one: a story that fails axe cannot be committed, and
 * suppressing the rules to keep it would widen the exclusion list the a11y
 * baseline forbids widening. The defence — falling back to the shell's own
 * defaults on an empty string rather than only on `undefined` — is an API
 * decision and is recorded, not taken (spec §3.4).
 *
 * What *is* asserted below is the one empty string that stays green, and it is
 * the quiet one: an announcement with `title=""` keeps its ✕, and that control
 * is named from the title, so it announces as "Dismiss announcement: " with a
 * dangling colon. Three announcements in a strip would all announce alike. Same
 * empty-name class wave 1 recorded on D3 `context-chips` and I2
 * `property-inspector`, at the one place in this shell where it does not reach
 * a gate.
 */
export const EmptyLabel: Story = {
  args: {
    railBrand: undefined,
    railFooter: undefined,
    areas: AREAS,
    activeAreaId: "images",
    navSections: [{ label: "Get started", items: [{ id: "quickstart", label: "Quickstart" }] }],
    activePageId: "quickstart",
    title: "Quickstart",
    lede: undefined,
    sections: [{ id: "overview", title: "Overview" }],
    announcements: [{ id: "streaming-2026-08", title: "", stage: "Beta" }],
    onDismissAnnouncement: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The optional slots are gone rather than empty — no lede element, no
    // section body, no citations run, no brand row.
    await expect(canvasElement.querySelector('[data-slot="docs-shell-lede"]')).toBeNull();
    await expect(canvasElement.querySelector('[data-slot="docs-shell-section-body"]')).toBeNull();
    await expect(canvasElement.querySelector('[data-slot="docs-shell-sources"]')).toBeNull();

    // The page keeps its structure: one named h1, one level-2 heading, and the
    // content column still takes its name from the title.
    const title = canvasElement.querySelector<HTMLElement>('[data-slot="docs-shell-title"]')!;
    await expect(canvas.getByRole("heading", { level: 1, name: "Quickstart" })).toBe(title);
    await expect(canvas.getByRole("region", { name: "Quickstart" })).toHaveAttribute(
      "data-region",
      "content-column",
    );

    // And the empty string that no gate sees: the announcement's ✕ is named
    // from a title it does not have.
    const dismiss = canvasElement.querySelector<HTMLElement>('[data-slot="feature-announcement-dismiss"]')!;
    await expect(dismiss).toHaveAccessibleName("Dismiss announcement:");
    await expect(
      canvasElement.querySelector('[data-slot="feature-announcement-title"]'),
    ).toBeEmptyDOMElement();
  },
};

/**
 * Author-supplied text at ~75 characters in the five slots that take it, and
 * five different decisions come back — which is why they are rendered together
 * rather than one at a time. This is where a docs shell differs from a
 * launcher: a nav column beside a measured column means the same string is
 * treated four different ways depending on which column it lands in.
 *
 * **The page title wraps and the measure holds.** The `h1` goes to two 32px
 * lines inside the same 685px article (68ch), `white-space: normal`, nothing
 * clipped, and the sections below simply move down. The lede does the same at
 * 26px lines. That is the right answer for prose, and the reason the measure is
 * on the article rather than on the scroll container.
 *
 * **The nav row truncates and loses the rest.** B3's label is
 * `truncate` in a 256px column: measured `scrollWidth` 430 against
 * `clientWidth` 215 — half the page name gone — with **no `title` attribute**,
 * so the full string is unrecoverable for a pointer user and reads whole only
 * to a screen reader. On a docs site the nav *is* the navigation, so this is
 * the worst place in the shell for it. B3's to fix; the same missing-`title`
 * shape wave 1 recorded on D3 `context-chips` and O1 measured on A12.
 *
 * **The section heading truncates and keeps its name.** A12's title span is
 * `truncate` too, but the heading's accessible name is computed from contents,
 * so the outline a screen-reader user navigates by is intact while the visible
 * heading ends in an ellipsis. One caveat, measured and recorded: `action`
 * renders inside the element the shell promotes to a heading, and the name
 * comes back glued — `"…what happens above 2048 pixelsCopy link"`, no
 * separator. The docs module warns that the action joins the name; it does not
 * say the join has no space in it.
 *
 * **The announcement chip truncates hardest of all**, and this one is the
 * shell's own arrangement rather than a composed component's limit. The strip
 * is 896px wide; the chip inside it is capped at `max-w-md` (448px), which it
 * shares with the stage badge, the CTA and the ✕ — so a 56-character title
 * paints 112px of its 401px and the description 117px of its 419px. Roughly
 * fifteen characters of each survive. L3 sets `w-fit max-w-md` and this shell
 * narrows it further below `sm`; widening it on a full-width strip is a design
 * decision, so it is recorded here rather than changed.
 *
 * **The rail label disappears and stays announced.** At 3rem the vendored
 * sidebar clips a 53-character area label to a 32px row, and it is still the
 * row's accessible name and its tooltip text. That is the deliberate part —
 * the shell's docs page says a tooltip must never be the only source of a
 * name — and it is asserted below so a future "clean up the rail" change
 * cannot quietly replace the label with an icon.
 */
export const LongContent: Story = {
  args: {
    ...FULL_ARGS,
    title: "Text to image, image to image, and the parameters both endpoints accept",
    lede: "Generate an image from a prompt, with optional reference images, a seed for reproducibility, and a parameter set you can save and reuse across a project.",
    areas: [
      { id: "images", label: "Image models, including the legacy diffusion endpoints" },
      ...(AREAS ?? []).slice(2),
    ],
    navSections: [
      {
        label: "Get started",
        items: [
          { id: "seeds", label: "Reproducing a generation from a seed and a saved parameter set" },
          { id: "quickstart", label: "Quickstart" },
        ],
      },
    ],
    activePageId: "seeds",
    sections: [
      {
        id: "sizes",
        title: "Everything the upscale rate applies to, and what happens above 2048 pixels",
        body: "Anything above 2048px on the long edge is billed at the upscale rate, whether or not you asked for an upscale.",
        action: "Copy link",
      },
    ],
    announcements: [
      {
        id: "streaming-2026-08",
        title: "Streaming image progress arrives before the final asset does",
        description: "Partial frames now arrive over the same connection as the final asset URL.",
        stage: "Beta",
        ctaLabel: "Read the guide",
        onCtaClick: () => {},
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const at = (selector: string) => canvasElement.querySelector<HTMLElement>(selector)!;

    // 1. The title wraps inside the measure rather than clipping or widening it.
    const title = at('[data-slot="docs-shell-title"]');
    const titleStyle = getComputedStyle(title);
    await expect(titleStyle.whiteSpace).toBe("normal");
    await expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth + 1);
    await expect(title.getBoundingClientRect().height).toBeGreaterThan(
      parseFloat(titleStyle.lineHeight) * 1.5,
    );
    await expect(Math.round(at('[data-slot="docs-shell-article"]').getBoundingClientRect().width)).toBe(685);

    // 2. The nav row truncates, and nothing carries the rest to a pointer.
    const navLabel = at('[data-slot="sidebar-nav-item"] span.truncate');
    await expect(getComputedStyle(navLabel).textOverflow).toBe("ellipsis");
    await expect(navLabel.scrollWidth).toBeGreaterThan(navLabel.clientWidth);
    await expect(navLabel).not.toHaveAttribute("title");

    // 3. The section heading truncates visually and keeps its name.
    const heading = canvas.getByRole("heading", { level: 2 });
    const headingTitle = at('[data-slot="docs-shell-section"] [data-slot="section-header-title"]');
    await expect(getComputedStyle(headingTitle).textOverflow).toBe("ellipsis");
    await expect(heading).toHaveAccessibleName(
      expect.stringContaining("Everything the upscale rate applies to"),
    );

    // 4. The chip's two text slots both truncate inside the 448px cap.
    for (const slot of ["feature-announcement-title", "feature-announcement-description"]) {
      const el = at(`[data-slot="${slot}"]`);
      await expect(getComputedStyle(el).textOverflow).toBe("ellipsis");
      await expect(el.scrollWidth).toBeGreaterThan(el.clientWidth * 2);
    }

    // 5. The rail row is 32px of icon and keeps the whole label as its name.
    const railRow = at('[data-slot="sidebar-menu-button"]');
    await expect(railRow.getBoundingClientRect().width).toBeLessThan(40);
    await expect(railRow).toHaveAccessibleName("Image models, including the legacy diffusion endpoints");

    // 6. Nothing above turned the page into a horizontal scroller.
    const root = at('[data-slot="docs-shell"]');
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/**
 * 375×812, with the real viewport moved rather than a 375px box drawn around a
 * desktop render — and for this shell, as for every family O shell, that is the
 * difference between a story and a lie. B1's drawer swap keys on a viewport
 * media query, so a width wrapper renders the full desktop rail inside a phone
 * -shaped div and reports success. `page.viewport` resizes the test iframe:
 * `window.innerWidth` 1200 → 375, `matchMedia("(max-width: 767px)")` false →
 * true. It does not leak, so nothing is restored afterwards.
 *
 * What a phone actually gets, measured: **no rail in the document at all**
 * until the nav-header trigger opens it as a sheet, the page nav stops being a
 * 256px column and becomes a full-width strip above the content, and the
 * article keeps its measure because the measure is a max rather than a width —
 * 327px inside a 375px column. Nothing scrolls sideways at any level.
 *
 * Four things worth recording, and only the first is this shell's own.
 *
 * **The nav is a scroller inside a scroller.** The strip is `max-h-56`, so nine
 * pages and a header measure 471px of content in a 224px box: more than half
 * the navigation of the page is behind an inner scroll that shares the screen
 * with the article's own. It is the deliberate trade — the alternative is a nav
 * that pushes the prose off a phone entirely — but at forty pages the strip is
 * a peephole, and a real docs site should swap it for a sheet at this width.
 * The docs page does not say so today.
 *
 * **`data-slot="app-sidebar"` does not exist below 768px**, so
 * `SIDEBAR_FILLS_SHELL` — this shell's `[&_[data-slot=app-sidebar]]:h-full` —
 * cannot match on a phone. The vendored `Sidebar` spreads B1's props onto the
 * `Sheet` *root*, which renders no element; the panel that does render is
 * `data-slot="sidebar"` with `data-mobile="true"`. Inert rather than broken —
 * the sheet takes its own height — but any consumer selector written against
 * that slot silently stops matching at the breakpoint. O1 `home-shell`
 * measured this first; it is the same here, and it is why the geometric
 * `railFooter` guard this shell wants is a desktop-only claim.
 *
 * **The drawer animates under reduced motion.** `components/ui/sheet.tsx` puts
 * `transition duration-200` on the panel and `transition-opacity duration-150`
 * on the backdrop with no `motion-reduce:transition-none` on either, and the
 * `side=left` panel's starting style is a 40px translate. O2 `chat-shell`
 * found and pinned the durations earlier in this wave, so they are not asserted
 * a second time here. The trap worth restating is the *shape*: the panel's
 * `animation-name` reads `none`, because the sheet animates by transition
 * rather than by animation — so the usual `animationName === "none"` check
 * reports a suppressed surface that is still sliding.
 *
 * **And a new one, found here: an invisible tooltip eats the first Escape.**
 * `sidebar.tsx:546` renders every rail row's tooltip and passes
 * `hidden={state !== "collapsed" || isMobile}` to `TooltipContent` — so on a
 * phone the popup still *opens* on focus and is merely hidden with the HTML
 * attribute. Measured, three states in a row: with the drawer open and a rail
 * row focused, the tooltip is mounted at `display: none` with `hidden` set;
 * one Escape closes that tooltip and leaves the drawer open; a second Escape
 * closes the drawer. A keyboard user on a phone presses Escape, sees nothing
 * change, and has to press it again. The repair is to not render the tooltip
 * when it would be hidden, in the vendored file — every B1 consumer whose rows
 * carry tooltips is in this position, and the play below asserts only the half
 * that is correct.
 */
export const Mobile: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    // `vitest/browser`, not `@vitest/browser/context`: both resolve to the same
    // module in vitest 4.1.8 and the older specifier prints a deprecation
    // notice on every run that loads this file. Dynamic, inside the play,
    // because that module throws on evaluation outside Browser Mode — a
    // top-level import would take every story in this file down in a built
    // Storybook rather than just this one.
    const { page } = await import("vitest/browser");
    await page.viewport(375, 812);

    // The breakpoint really moved. Every assertion below is meaningless
    // without this one, which is the whole reason the wrapper idiom is not
    // enough for a family O shell.
    await waitFor(() => expect(window.innerWidth).toBe(375));
    await expect(window.matchMedia("(max-width: 767px)").matches).toBe(true);

    const at = (selector: string) => canvasElement.querySelector<HTMLElement>(selector)!;
    const root = at('[data-slot="docs-shell"]');

    // The rail leaves the document; the shell waits for B1 to swap branches.
    await waitFor(() => expect(canvasElement.querySelector('[data-slot="app-sidebar"]')).toBeNull());

    // Nothing scrolls sideways, at any level.
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );

    // Every region is still mounted — that is the block contract — but the
    // rail's is an empty marker until the drawer is opened.
    for (const region of ["icon-rail", "doc-nav", "announcement-strip", "content-column"]) {
      await expect(canvasElement.querySelector(`[data-region="${region}"]`)).not.toBeNull();
    }
    await expect(at('[data-region="icon-rail"]').getBoundingClientRect().width).toBe(0);

    // The nav column becomes a capped strip with its own scrollbar.
    const nav = at('[data-region="doc-nav"]');
    await expect(nav.getBoundingClientRect().width).toBe(375);
    await expect(nav.clientHeight).toBeLessThan(240);
    await expect(nav.scrollHeight).toBeGreaterThan(nav.clientHeight * 2);

    // The measure survives: an article narrower than the column, not a column
    // stretched to the phone.
    const article = at('[data-slot="docs-shell-article"]');
    await expect(article.getBoundingClientRect().width).toBeLessThan(
      at('[data-region="content-column"]').getBoundingClientRect().width,
    );

    // The chip is capped to the strip. L3's own `w-fit max-w-md` is 448px,
    // which would overflow a 375px page — this shell's `max-w-full sm:max-w-md`
    // is what keeps it inside, and this is the width that proves it.
    const chip = at('[data-slot="feature-announcement"]');
    await expect(chip.getBoundingClientRect().width).toBeLessThanOrEqual(343);
    await expect(chip.scrollWidth).toBeLessThanOrEqual(chip.clientWidth);

    // The trigger is the only route to the product areas now, and it brings
    // them with their labels rather than as a rail of glyphs.
    await userEvent.click(at('[data-slot="sidebar-trigger"]'));
    const drawer = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="sidebar"][data-mobile="true"]');
      if (!el) throw new Error("mobile sidebar sheet did not open");
      return el;
    });
    await expect(within(drawer).getByRole("button", { name: "Image models" })).toBeInTheDocument();

    // Let it settle before the play returns — axe scans a transitioning panel
    // at its transitional opacity otherwise — then close it, so nothing is left
    // mid-dismissal either.
    await waitFor(() => expect(getComputedStyle(drawer).opacity).toBe("1"));
    // Opening the drawer moves focus onto the first product area, and that
    // focus opens a tooltip nobody can see: `sidebar.tsx` passes
    // `hidden={state !== "collapsed" || isMobile}` to `TooltipContent`, which
    // renders the popup and hides it with the HTML attribute rather than not
    // opening it. So the popup is live — `display: none`, `hidden` present —
    // and it is what the first Escape closes. Asserted here because closing a
    // tooltip on Escape is correct; what is *not* asserted is the consequence,
    // measured and recorded above: the drawer needs a second press, and on a
    // phone the first one appears to do nothing at all.
    const tooltip = document.querySelector<HTMLElement>('[data-slot="tooltip-content"]')!;
    await expect(tooltip).toHaveAttribute("hidden");
    await expect(getComputedStyle(tooltip).display).toBe("none");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull());

    // The drawer is left open and settled rather than dismissed, so axe never
    // measures a panel mid-transition (O1 `home-shell` does the same).
    await expect(document.querySelector('[data-slot="sidebar"][data-mobile="true"]')).toBe(drawer);
    await expect(getComputedStyle(drawer).opacity).toBe("1");
  },
};

/**
 * O11's nearest twin is O12 `settings-shell`, and they are confused for the
 * same reason they look alike: a grouped nav in a left column beside a long
 * page of titled sections. Rendered here one above the other, which is the only
 * honest way to compare two shells — see the note at the end.
 *
 * **The choosing rule is what the sections are.** In O11 they are prose you
 * read and check: K6 markers under a section are the evidence for its claims,
 * the column is measured at 68ch because long lines lose a reader's place, and
 * the loudest thing on the page is an announcement chip that you can dismiss.
 * In O12 they are controls you change: M1's rows with their required
 * descriptions, E7's gated features behind a tier badge, a copy-ready code
 * block, and a breadcrumb because "Settings → Workspace → MCP" has to be a URL.
 * **Reading versus writing** is the whole distinction, and everything else
 * follows from it — a docs page is deep-linkable too, but nobody arrives at a
 * settings page to read it end to end.
 *
 * Two structural consequences, asserted below rather than described, because
 * they are what a refactor would quietly lose:
 *
 * 1. **O11 has two navigations, O12 has one and a search field.** The rail
 *    switches product, the nav switches page, and they are separately named
 *    landmarks — collapse them into one list and both questions get harder,
 *    which is the first "don't" on this component's docs page. O12 needs no
 *    rail because settings are one product's; past about twenty settings it
 *    reaches for search instead, which is a different answer to the same
 *    scaling problem.
 * 2. **O11's content column is measured; O12's is not.** 68ch is
 *    non-negotiable for prose and wrong for a settings row, whose control has
 *    to sit at the end of a full-width line.
 *
 * A third shell is deliberately not on this page. O13 `notebook-shell` also
 * pairs K6 citations with a source pane, but its citations are the *output* of
 * a chat over sources the user supplied; O11's are the author's evidence for
 * something already written. Pick O11 when someone else wrote the page.
 *
 * WHY THIS COMPARISON RENDERS AT ALL, when O1's could not: O1 and O2 both
 * compose B1, whose `SidebarInset` renders a `<main>`, so putting them on one
 * page is two main landmarks and axe fails `landmark-no-duplicate-main`. O12
 * composes no sidebar and renders no `main`, so this page has exactly one —
 * asserted below. The two nav landmarks it *does* add are named apart on
 * purpose ("Settings sections"), because three unnamed navigations in one
 * document is `landmark-unique`, which is the same failure `EmptyLabel`
 * measures from the other end.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex h-svh w-full flex-col divide-y overflow-y-auto">
      <div className="h-[38rem] shrink-0">
        <DocsShell {...FULL_ARGS} title="Text to image" />
      </div>
      <div className="h-[38rem] shrink-0 overflow-y-auto">
        <SettingsShell
          title="Settings"
          description="Workspace defaults for every project."
          navLabel="Settings sections"
          defaultSectionId="general"
          sections={[
            {
              id: "general",
              label: "General",
              group: "Workspace",
              rows: [
                {
                  id: "region",
                  label: "Default region",
                  description: "Where new projects run unless a project overrides it.",
                  control: (ids) => (
                    <Button
                      size="sm"
                      variant="outline"
                      id={ids.controlId}
                      aria-labelledby={ids.labelId}
                      aria-describedby={ids.descriptionId}
                    >
                      eu-west-1
                    </Button>
                  ),
                },
              ],
            },
            {
              id: "billing",
              label: "Billing",
              group: "Workspace",
              tier: "Pro",
              rows: [
                {
                  id: "invoices",
                  label: "Invoice emails",
                  description: "Who receives the monthly invoice for this workspace.",
                  control: (ids) => (
                    <Button
                      size="sm"
                      variant="outline"
                      id={ids.controlId}
                      aria-labelledby={ids.labelId}
                      aria-describedby={ids.descriptionId}
                    >
                      billing@example.com
                    </Button>
                  ),
                },
              ],
            },
          ]}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. One `main` on the page, which is what makes "a shell is the page" a
    //    measurable claim — and what makes this comparison renderable.
    await expect(canvasElement.querySelectorAll("main")).toHaveLength(1);

    // 2. Two navigations here, two there, all four separately named — O12's
    //    second is its breadcrumb, which is the deep-link affordance O11 does
    //    not have because a docs page is reached from the nav beside it.
    const navNames = Array.from(canvasElement.querySelectorAll("nav")).map((nav) =>
      nav.getAttribute("aria-label"),
    );
    await expect(navNames).toEqual(["Product areas", "Pages", "breadcrumb", "Settings sections"]);

    // 3. O11 measures its column; O12 does not.
    const article = canvasElement.querySelector<HTMLElement>('[data-slot="docs-shell-article"]')!;
    const column = canvasElement.querySelector<HTMLElement>('[data-region="content-column"]')!;
    await expect(article.getBoundingClientRect().width).toBeLessThan(
      column.getBoundingClientRect().width - 100,
    );
    const settingsSections = canvasElement.querySelector<HTMLElement>('[data-region="setting-sections"]')!;
    await expect(settingsSections.getBoundingClientRect().width).toBeGreaterThan(
      article.getBoundingClientRect().width,
    );

    // 4. And the reading half of the rule: only O11 carries evidence markers.
    await expect(canvasElement.querySelectorAll('[data-slot="citation-ref"]').length).toBe(3);
    await expect(canvas.getByRole("searchbox")).toBeInTheDocument();
  },
};
