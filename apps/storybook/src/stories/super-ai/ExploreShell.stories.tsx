import { page } from "@vitest/browser/context";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Compass, Library, MessagesSquare, Settings, Sparkles } from "lucide-react";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { settledFocusRing } from "@/lib/focus-ring";

import { ExploreShell, type ExploreShellProps } from "@/registry/super-ai/explore-shell";
import { LibraryShell, type LibraryShellProps } from "@/registry/super-ai/library-shell";
import { ExploreShellDocs } from "@/content/components/explore-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

/** Stand-in for real community artwork — token-only, no palette classes. */
function Swatch({ tone }: { tone: "primary" | "secondary" | "muted" }) {
  return (
    <div
      className={
        tone === "primary"
          ? "bg-primary/25 size-full"
          : tone === "secondary"
            ? "bg-secondary size-full"
            : "bg-muted size-full"
      }
    />
  );
}

const RAIL = [
  { id: "explore", label: "Explore", icon: <Compass /> },
  { id: "create", label: "Create", icon: <Sparkles />, badge: "new" as const },
  { id: "library", label: "Library", icon: <Library /> },
  { id: "chat", label: "Chat", icon: <MessagesSquare /> },
];

const RAIL_PINNED = [{ id: "settings", label: "Settings", icon: <Settings /> }];

const ITEMS: ExploreShellProps["items"] = [
  {
    id: "neon",
    title: "Neon city at dusk",
    aspectRatio: "3 / 4",
    type: "image",
    typeLabel: "Image",
    author: "@lumen",
    metric: "1.2k",
    prompt: "neon city at dusk, wet asphalt reflections, anamorphic",
    media: <Swatch tone="primary" />,
    asset: {
      media: <Swatch tone="primary" />,
      prompt: "neon city at dusk, wet asphalt reflections, anamorphic",
      highlightedSpans: [{ start: 22, end: 47 }],
      params: [
        { label: "Model", value: "Flux 1.1 Pro" },
        { label: "Seed", value: "884201", copyable: true },
        { label: "Sampler", value: "DPM++ 2M", copyable: true },
        { label: "Steps", value: "28" },
      ],
      cost: { amount: 4, unit: "credits", status: "confirmed" },
    },
  },
  {
    id: "forest",
    title: "Paper-cut forest",
    aspectRatio: "16 / 9",
    type: "image",
    typeLabel: "Image",
    author: "@fold",
    metric: "840",
    prompt: "layered paper-cut forest, warm rim light",
    media: <Swatch tone="secondary" />,
    asset: {
      media: <Swatch tone="secondary" />,
      prompt: "layered paper-cut forest, warm rim light",
      params: [
        { label: "Model", value: "Flux 1.1 Pro" },
        { label: "Seed", value: "119003", copyable: true },
      ],
    },
  },
  {
    id: "jellyfish",
    title: "Chrome jellyfish",
    aspectRatio: "1 / 1",
    type: "video",
    typeLabel: "Video",
    author: "@drift",
    metric: "3.4k",
    prompt: "chrome jellyfish drifting through black water, slow motion",
    media: <Swatch tone="muted" />,
    asset: {
      media: <Swatch tone="muted" />,
      prompt: "chrome jellyfish drifting through black water, slow motion",
      params: [{ label: "Model", value: "Veo 3.1" }],
    },
  },
  {
    id: "greenhouse",
    title: "Brutalist greenhouse",
    aspectRatio: "4 / 5",
    type: "image",
    typeLabel: "Image",
    author: "@slab",
    metric: "612",
    prompt: "brutalist greenhouse, overgrown, morning fog",
    media: <Swatch tone="secondary" />,
    asset: {
      media: <Swatch tone="secondary" />,
      prompt: "brutalist greenhouse, overgrown, morning fog",
      params: [{ label: "Model", value: "Flux 1.1 Pro" }],
    },
  },
  {
    id: "launch-deck",
    title: "Launch deck",
    aspectRatio: "16 / 10",
    type: "template",
    typeLabel: "Template",
    author: "@studio",
    metric: "9.1k",
    media: <Swatch tone="primary" />,
    template: {
      templates: [
        {
          id: "launch-deck",
          title: "Launch deck",
          description: "Twelve slides that open on the problem and close on the ask.",
          previews: [
            { id: "cover", label: "Cover slide", media: <Swatch tone="primary" /> },
            { id: "metrics", label: "Metrics slide", media: <Swatch tone="secondary" /> },
          ],
          options: [
            {
              id: "length",
              label: "Length",
              choices: [
                { value: "12", label: "12 slides" },
                { value: "20", label: "20 slides" },
              ],
            },
          ],
          author: { id: "studio", name: "Studio Ninefold", meta: "84 templates" },
        },
      ],
    },
  },
  {
    id: "zine",
    title: "Risograph zine cover",
    aspectRatio: "3 / 4",
    type: "image",
    typeLabel: "Image",
    author: "@press",
    metric: "455",
    prompt: "risograph zine cover, two-colour overprint, halftone",
    media: <Swatch tone="muted" />,
    asset: {
      media: <Swatch tone="muted" />,
      prompt: "risograph zine cover, two-colour overprint, halftone",
      params: [{ label: "Model", value: "Flux 1.1 Pro" }],
    },
  },
];

const SORTS = [
  { value: "hot", label: "Hot" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
];

const TYPES = [
  { value: "image", label: "Images", count: 812 },
  { value: "video", label: "Videos", count: 44 },
  { value: "template", label: "Templates", count: 126 },
];

const FULL_ARGS: ExploreShellProps = {
  rail: RAIL,
  railPinned: RAIL_PINNED,
  activeRailId: "explore",
  sorts: SORTS,
  defaultSort: "hot",
  types: TYPES,
  items: ITEMS,
  gallery: { hasMore: true, totalCount: 982 },
};

const meta: Meta<typeof ExploreShell> = {
  title: "Super AI/Explore Shell",
  component: ExploreShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(ExploreShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ExploreShell>;

/** The working shell: a rail, a loaded prompt bar, both axes, and a feed of uneven tiles. */
export const Feed: Story = { args: FULL_ARGS };

/**
 * Day one. The rail and both axes are there — they are product chrome, not user
 * content — but nobody has published anything, so the feed falls to L1 rather
 * than to J3's own empty list and its "0 shown" line. Mandatory export for the
 * block contract, and the view a community surface actually launches with.
 */
export const Empty: Story = {
  args: {
    rail: RAIL,
    railPinned: RAIL_PINNED,
    activeRailId: "explore",
    sorts: SORTS,
    defaultSort: "hot",
    types: TYPES.map((type) => ({ ...type, count: 0 })),
    items: [],
  },
};

/**
 * Narrow viewport. The rail keeps its 92px column — B4 has no compact width and
 * no drawer of its own — the prompt bar and control strip take the rest, and
 * J3's masonry collapses to a single column below `sm`. Mandatory export for
 * the block contract; a shell is a layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing while looking configured.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner has no manager to resize an iframe, so `pnpm test:stories` renders and
 * axe-checks this story at the browser's default width.
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

/** A tile opened into F3, with more-like-this derived from the feed behind it. */
export const AssetOpen: Story = { args: { ...FULL_ARGS, openItemId: "neon" } };

/** The same tile grammar, opening into J6 instead — a template is configured before it is used. */
export const TemplateOpen: Story = { args: { ...FULL_ARGS, openItemId: "launch-deck" } };

/** A feed that offers neither axis still mounts the control region, and says what it holds. */
export const NoAxes: Story = {
  args: {
    rail: RAIL,
    railPinned: RAIL_PINNED,
    activeRailId: "explore",
    items: ITEMS,
    scopeLabel: "Showing everything, newest first",
  },
};

/* ---------------------------------------------------------------------------
 * Case stories — the situations a community gallery shell meets in a product,
 * as opposed to the six arrangements above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are written; none is skipped. A shell that mirrors, opens two
 * animated dialogs, holds four controlled pairs, has four optional text slots
 * and reflows a masonry at a viewport breakpoint is true for every one of
 * them, and the near-twin the spec argues against by name (O7 `library-shell`)
 * sits one row up in the catalog.
 *
 * `CONTINUE.md` §8 carries three composition gaps against this shell. Writing
 * these stories settled all three:
 *
 * - **"J3 bundles prompt, sort tabs, type pills and feed under one root with
 *   no slots" — still true, and the cost is now measured rather than
 *   asserted.** The shell mounts J3 feed-only and hosts the other three
 *   regions itself, because a `data-region` cannot be put on an element you do
 *   not render. No component was forked — the pills are A4 composed verbatim,
 *   exactly as J3 composes it — but the shell owns a *second call site* of the
 *   same primitive, and it inherited both of that call site's defects: the
 *   physical `ml-1.5` on the facet count, swapped in this wave one wave after
 *   J3's identical swap, and the missing textual separator, so these pills
 *   still announce "Images812". Duplicated call sites drift and need fixing
 *   twice. That is the argument for the slot props, as a measurement rather
 *   than a preference.
 * - **"O8 and O10 both wanted a per-item slot on J3/J4/J5" — half stale for
 *   O8.** `ExploreGalleryItem.actions` takes nodes beside Remix, and the shell
 *   attaches its own open behaviour by mapping `onOpen` per item, so the
 *   controls half of that gap does not bite here. What J3 still has no slot
 *   for is the tile *body*. J3's own wave-5 file reached the same correction
 *   independently.
 * - **"B4 `modality-rail`'s stacked label never renders" — live, and
 *   re-measured in the gate.** 63×0 CSS px, asserted in `EmptyLabel`. O4
 *   verified it in a browser; this is the first time it is pinned by a test.
 *   `Mobile` adds the consequence: an icon-only 92px column that never
 *   narrows is a quarter of a phone screen.
 *
 * One §8 item that reads as a risk here and is not: J6 `template-detail`'s
 * `SelectContent` was named in wave 5, so `TemplateOpen` opens a labelled
 * listbox. The two still-unnamed call sites are `model-picker` and
 * `records-shell`, and this shell composes neither.
 * ------------------------------------------------------------------------ */

/** `dir` on the document, not on a wrapper: a `<div>` cannot reach a portal,
 *  and this shell mounts two of them (F3, J6). The convention's mechanical
 *  fact 5 and CONTINUE.md §8's `align`/`side` split are why. */
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
 * The narrow signature J2 `filter-panel` arrived at, reused rather than
 * re-derived. `focusTreatmentSignature` also reads `outline-width`, which on
 * this registry's controls flips 3px → 1px on focus under an `outline-style`
 * of `none` that paints neither — so including it reports "changed" on
 * elements whose appearance is identical. Box-shadow and border colour are
 * what the eye sees at every stop in this shell.
 */
const paintedFocus = (el: Element) => {
  const style = getComputedStyle(el);
  return `${style.boxShadow}|${style.borderColor}`;
};

/**
 * Right-to-left. The shell's own arrangement is a rail plus three stacked
 * bands, and all four mirror with no direction-aware code — which is the
 * finding, because everything underneath that does *not* mirror belongs to a
 * composed child and is already recorded there.
 *
 * **What mirrors, and why.** The root is a plain flex row, so B4 lands on the
 * right and its `border-e` seam resolves to a left border — the edge facing
 * the canvas, which is what that class was chosen for. The prompt band, the
 * control strip and the feed inherit `direction: rtl` and hug the right edge.
 * Nothing here positions with an inline `left`, a clip path or a JavaScript
 * axis, so the F5/H3 "check what else decides the side" test comes back clean.
 *
 * **Fixed in-wave.** The facet count beside a type pill was `ml-1.5`, a
 * physical margin, and the shell renders that span itself — it is not J3's,
 * which wave 5 already swapped. The same one-class swap is taken here. It is
 * byte-identical in LTR, measured rather than assumed: `LongContent` reads the
 * used margins back in the LTR frame (`6px` inline-start, `0px` inline-end,
 * unchanged across the swap), and this story reads them back mirrored. This is
 * the element that paints the text, not an ancestor of one, so N6
 * `usage-dashboard`'s `<tr>` trap does not apply.
 *
 * **Recorded, not swept, both in composed children.** J3's tile corners
 * (`top-2 left-2` badge, `top-2 right-2` action strip) stay physical —
 * measured in `ExploreGallery.stories.tsx`'s own `RTL`, cited rather than
 * re-measured. And the mixed-script cost of the margin swap is J3's finding
 * too: with a Latin facet label the bidi run keeps "Images 812" left-to-right,
 * so a logical margin resolves against the container's direction and the gap
 * lands on that run's trailing edge.
 */
export const RTL: Story = {
  render: (args) => (
    <RtlDocument>
      <ExploreShell {...args} />
    </RtlDocument>
  ),
  args: { ...FULL_ARGS, defaultType: "image" },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="explore-shell"]')!;
    const slot = (name: string) => root.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;
    const region = (id: string) => root.querySelector<HTMLElement>(`[data-region="${id}"]`)!;

    await expect(getComputedStyle(root).direction).toBe("rtl");

    // 1. The rail is the inline-start column, so it is now the rightmost one,
    //    and its seam is the edge facing the canvas.
    const rail = slot("modality-rail");
    await expect(Math.round(rail.getBoundingClientRect().right)).toBe(
      Math.round(root.getBoundingClientRect().right),
    );
    const seam = getComputedStyle(rail);
    await expect(`${seam.borderLeftWidth}/${seam.borderRightWidth}`).toBe("1px/0px");

    // 2. Every band sits in the column beside the rail, and the control strip's
    //    first control starts on the right.
    for (const id of ["docked-prompt-bar", "sort-tabs", "masonry-feed"]) {
      await expect(region(id).getBoundingClientRect().right).toBeLessThanOrEqual(
        rail.getBoundingClientRect().left + 1,
      );
    }
    const controls = region("sort-tabs");
    const sorts = slot("explore-shell-sorts");
    await expect(sorts.getBoundingClientRect().right).toBeGreaterThan(
      controls.getBoundingClientRect().right - 8,
    );

    // 3. The swap, read back as used values rather than as a class name.
    const count = root.querySelector<HTMLElement>('[data-slot="choice-chip"] span')!;
    const margins = getComputedStyle(count);
    await expect(`${margins.marginRight}/${margins.marginLeft}`).toBe("6px/0px");
  },
};

/**
 * The reduced-motion branch, on the two surfaces this shell mounts that have
 * one — and the honest answer for everything else, which is that the shell's
 * own markup animates nothing.
 *
 * `grep -n "animate-\|transition-"` over `explore-shell.tsx` returns **zero
 * hits**: the rail, the prompt band, the control strip and the feed wrapper
 * are static boxes. What animates is what the shell opens. F3 `asset-detail`
 * and J6 `template-detail` are Base UI dialogs, and both halves of each are
 * checked below by reading `animationName` back rather than trusting a class —
 * the only form of this assertion that can fail (mechanical fact 3).
 *
 * **The panel is the half a call site can reach**, and F3 already carries the
 * restated pair. **The backdrop is the half none can**: `DialogContent`
 * renders `<DialogOverlay />` with no `className` threaded through, so wave 6
 * put the pair on `DialogOverlay`'s own class string in both copies of the
 * vendored file. Measured here as `"none"` on both — this shell adds nothing
 * and needed to add nothing, which is what a completed sweep looks like from
 * a consumer's side.
 *
 * **Recorded, not fixed — two transitions in the composed tree that no case
 * story should touch.** The vendored `TabsTrigger` under the sort strip
 * carries `transition-all`, and the vendored `Button` under Attach and Create
 * carries `transition-all` plus `active:translate-y-px`, so every button in
 * this shell still nudges a pixel on press under `prefers-reduced-motion`.
 * `CONTINUE.md` §8 records that as a primitive-wide posture (MOT-2's scope
 * excludes `components/ui` entirely, so `check:tokens` never even reports it),
 * and it is not this block's to repair. J3's tile action strip fades with
 * `transition-opacity`, which moves nothing — the `reset-affordance` case the
 * convention names.
 */
export const ReducedMotion: Story = {
  args: { ...FULL_ARGS, openItemId: "neon" },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="explore-shell"]')!;

    // 1. The dialog the shell opened, both halves, read back as used values.
    const panel = document.querySelector<HTMLElement>('[data-slot="asset-detail"]')!;
    await expect(panel).not.toBeNull();
    await waitFor(() => expect(getComputedStyle(panel).animationName).toBe("none"));

    const backdrop = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]');
    await expect(backdrop).not.toBeNull();
    await waitFor(() => expect(getComputedStyle(backdrop!).animationName).toBe("none"));

    // 2. Nothing the shell itself renders is animating behind it. The rail,
    //    the prompt band and the control strip are the shell's own boxes.
    for (const el of [
      root,
      root.querySelector<HTMLElement>('[data-region="docked-prompt-bar"]')!,
      root.querySelector<HTMLElement>('[data-region="sort-tabs"]')!,
      root.querySelector<HTMLElement>('[data-slot="explore-shell-controls"]')!,
    ]) {
      await expect(getComputedStyle(el).animationName).toBe("none");
    }
  },
};

/**
 * The whole tab sequence of a page-sized shell, and the three things it says
 * that no anatomy table can.
 *
 * **Fifteen stops with two feed tiles, in this order:** the rail (*one* stop —
 * B4 is a Base UI toggle group with a roving index), the pinned rail group
 * (*a second* stop, because B4 renders settings as its own group), the prompt
 * textarea, Attach, "Add negative prompt", the sort tablist (one stop, arrows
 * move between sorts), three type pills as *three* stops, the feed, then per
 * tile an Open and a Remix, then Load more.
 *
 * **1. The primary action is not in the tab order.** "Create" never appears
 * above, because D1 disables its submit while the field is empty — and an
 * empty field is how this page loads. So the control the spec's second
 * decision exists for is reachable only after something is typed *or* seeded.
 * The end of the play does the seeding through the affordance that shell wires
 * by hand: pressing Remix on a tile fills the bar and Create joins the
 * sequence. That is the Remix seam proved from the keyboard rather than from a
 * callback.
 *
 * **2. The feed is one stop, not two, and that is the shell's own doing.**
 * With `sorts` supplied the shell wraps the feed in a Base UI `Tabs.Panel`,
 * which is `tabIndex={0}` whenever it is open — right when the panel is the
 * scroll container, wrong here, because J3 keeps its own named focusable
 * scrolling region inside it. `FEED_PANEL_TAB_STOP` pins it to `-1`; the walk
 * below proves the region is what receives focus and the assertion above it
 * proves the panel is out, so a Base UI merge-order change cannot quietly
 * reinstate the duplicate.
 *
 * **3. Reaching page two costs every control on page one.** Load more is the
 * last stop and there is no shortcut onto it, so two tiles put four stops in
 * front of it and the docs module's thirty-tile figure puts sixty. J3 records
 * this for the component; in the shell it is worse by five, because the rail,
 * the prompt band and the type pills all sit in front of the feed as well.
 *
 * **One stop is excluded from the focus check, measured and not asserted in
 * either direction.** D1's textarea sets `border-none focus-visible:ring-0`,
 * so it paints no ring; what focus changes there is a *colour* at zero
 * geometry, which is why `settledFocusRing` correctly says "no ring" while the
 * differential says "something changed". Wave 1 recorded the class and J3
 * measured the shape; repairing it is `media-prompt-bar`'s call, not this
 * block's. Every other stop is held to both checks.
 */
export const KeyboardOrder: Story = {
  args: { ...FULL_ARGS, items: ITEMS.slice(0, 2) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="explore-shell"]')!;

    // The panel wrapping the feed is deliberately out of the tab order.
    const panel = root.querySelector<HTMLElement>('[data-region="masonry-feed"]')!;
    await expect(panel).toHaveAttribute("tabindex", "-1");

    const bySlot = (slot: string, index = 0) =>
      Array.from(root.querySelectorAll<HTMLElement>(`[data-slot="${slot}"]`))[index];

    const stops = [
      bySlot("modality-rail-item", 0),
      // The pinned group is a second B4 toggle group, so a second stop.
      bySlot("modality-rail-item", RAIL.length),
      bySlot("media-prompt-bar-textarea"),
      bySlot("media-prompt-bar-attach"),
      bySlot("media-prompt-bar-negative-toggle"),
      canvas.getByRole("tab", { name: "Hot" }),
      bySlot("choice-chip", 0),
      bySlot("choice-chip", 1),
      bySlot("choice-chip", 2),
      bySlot("explore-gallery-feed"),
      bySlot("explore-gallery-item-open", 0),
      bySlot("explore-gallery-item-remix", 0),
      bySlot("explore-gallery-item-open", 1),
      bySlot("explore-gallery-item-remix", 1),
      bySlot("explore-gallery-load-more"),
    ];
    await expect(new Set(stops).size).toBe(stops.length);

    // The one stop that paints nothing; see the description.
    const textarea = stops[2];

    for (const stop of stops) {
      // The baseline is read while focus is still on the *previous* stop, so
      // the differential costs no blur and cannot disturb the sequence.
      const before = paintedFocus(stop);

      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;
      await expect(focused).toBe(stop);
      await expect(focused.matches(":focus-visible")).toBe(true);

      if (stop !== textarea) {
        // Does it paint anything…
        await settledFocusRing(focused, waitFor);
        // …and did focus cause it? Neither check subsumes the other.
        await expect(paintedFocus(stop)).not.toBe(before);
      }
    }

    // Create is disabled at rest, so it was never in the walk. Remix — the
    // seam this shell hand-wires — is what puts it there.
    const create = root.querySelector<HTMLElement>('[data-slot="media-prompt-bar-submit"]')!;
    await expect(create).toBeDisabled();
    await userEvent.click(bySlot("explore-gallery-item-remix", 0));
    await waitFor(() => expect(create).not.toBeDisabled());
    create.focus();
    await expect(document.activeElement).toBe(create);
  },
};

/**
 * Four controlled pairs, held the hard way: the host records what the shell
 * asked for and applies it only when told to. Nothing below moves because the
 * user clicked; everything moves because the host applied.
 *
 * The fourth pair is why this story earns its place beside J3's. `openItemId`
 * is a pair no composed component has — the shell owns which tile's detail
 * surface is open, and F3 and J6 are mounted with `open` fixed true rather
 * than with a trigger. So a host that controls it gets the whole
 * open/close lifecycle: a tile click *asks*, and **Escape asks too**. Pressing
 * Escape on a controlled detail fires `onOpenItemChange(null)` and leaves the
 * dialog open, which is correct controlled behaviour and also the sharpest
 * foot-gun in this block's API — a host that forwards the id and forgets the
 * callback ships a modal with no exit.
 *
 * The other three are the shell's own copies of the two axes and the prompt.
 * Clicking a sort tab does not reorder; clicking a type pill does not filter;
 * Remix does not fill the field. All three still report the value a consumer
 * needs, and a re-render with unchanged props holds them fixed — proved by the
 * pass counter rather than assumed.
 *
 * Worth naming beside it: `data-sort` and `data-type` on the root are how the
 * axes are observed here. They are documented as test hooks, and this is the
 * story that makes that true rather than decorative.
 */
export const Controlled: Story = {
  render: () => <ControlledHost />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="explore-shell"]')!;
    const textarea = root.querySelector<HTMLTextAreaElement>(
      '[data-slot="media-prompt-bar-textarea"]',
    )!;
    // Pills are addressed by position: the facet count is a bare span set off
    // by a margin, so the name computes as "Images812" — see `EmptyLabel`.
    const pills = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="choice-chip"]'));

    await expect(root.dataset.sort).toBe("hot");
    await expect(root.dataset.type).toBe("image");
    await expect(textarea.value).toBe("");

    // 1. Interaction alone moves nothing on any of the four axes.
    await userEvent.click(canvas.getByRole("tab", { name: "Top" }));
    await expect(root.dataset.sort).toBe("hot");
    await userEvent.click(pills[1]);
    await expect(root.dataset.type).toBe("image");
    await expect(pills[0]).toHaveAttribute("aria-checked", "true");
    await userEvent.click(root.querySelector<HTMLElement>('[data-slot="explore-gallery-item-remix"]')!);
    await expect(textarea.value).toBe("");
    await userEvent.click(root.querySelector<HTMLElement>('[data-slot="explore-gallery-item-open"]')!);
    await expect(document.querySelector('[data-slot="asset-detail"]')).toBeNull();

    // 2. …and every callback fired with the payload a host has to apply.
    await expect(canvas.getByTestId("sort")).toHaveTextContent("top");
    await expect(canvas.getByTestId("type")).toHaveTextContent("video");
    await expect(canvas.getByTestId("prompt")).toHaveTextContent("neon city at dusk");
    await expect(canvas.getByTestId("open")).toHaveTextContent("neon");

    // 3. A re-render with unchanged props holds all four fixed. Prove the
    //    re-render happened first, or this asserts nothing.
    await expect(canvas.getByTestId("pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("pass")).toHaveTextContent("2");
    await expect(root.dataset.sort).toBe("hot");
    await expect(root.dataset.type).toBe("image");
    await expect(textarea.value).toBe("");
    await expect(document.querySelector('[data-slot="asset-detail"]')).toBeNull();

    // 4. Applying is sufficient — the payloads carried enough to act on.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(root.dataset.sort).toBe("top"));
    await expect(root.dataset.type).toBe("video");
    await expect(textarea.value).toBe(
      "neon city at dusk, wet asphalt reflections, anamorphic",
    );
    await waitFor(() =>
      expect(document.querySelector('[data-slot="asset-detail"]')).not.toBeNull(),
    );

    // 5. Escape asks; it does not close. The dialog is still there afterwards
    //    and the host has been told what the user wanted.
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getByTestId("open")).toHaveTextContent("null");
    await waitFor(() =>
      expect(document.querySelector('[data-slot="asset-detail"]')).not.toBeNull(),
    );
  },
};

/** Hoisted out of `ControlledHost`: `ITEMS` is declared as
 *  `ExploreShellProps["items"]`, and TypeScript drops the initializer's
 *  narrowing inside a hoisted function declaration. */
const CONTROLLED_ITEMS = ITEMS.slice(0, 3);

function ControlledHost() {
  const [applied, setApplied] = React.useState({
    sort: "hot",
    type: "image",
    prompt: "",
    openId: null as string | null,
  });
  const [requested, setRequested] = React.useState({
    sort: "—",
    type: "—",
    prompt: "—",
    openId: "—",
  });
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <ExploreShell
          rail={RAIL}
          railPinned={RAIL_PINNED}
          activeRailId="explore"
          sorts={SORTS}
          sort={applied.sort}
          onSortChange={(sort) => setRequested((r) => ({ ...r, sort }))}
          types={TYPES}
          type={applied.type}
          onTypeChange={(type) => setRequested((r) => ({ ...r, type }))}
          promptValue={applied.prompt}
          onPromptValueChange={(prompt) => setRequested((r) => ({ ...r, prompt }))}
          openItemId={applied.openId}
          onOpenItemChange={(openId) => setRequested((r) => ({ ...r, openId: openId ?? "null" }))}
          items={CONTROLLED_ITEMS}
        />
      </div>
      <div className="flex shrink-0 items-end justify-between gap-4 border-t px-4 py-2">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-3 text-xs">
          <dt>last onSortChange</dt>
          <dd data-testid="sort">{requested.sort}</dd>
          <dt>last onTypeChange</dt>
          <dd data-testid="type">{requested.type}</dd>
          <dt>last onPromptValueChange</dt>
          <dd data-testid="prompt" className="truncate">
            {requested.prompt}
          </dd>
          <dt>last onOpenItemChange</dt>
          <dd data-testid="open">{requested.openId}</dd>
          <dt>host render pass</dt>
          <dd data-testid="pass" className="tabular-nums">
            {pass}
          </dd>
        </dl>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
            Re-render
          </Button>
          <Button
            size="sm"
            onClick={() =>
              setApplied({
                sort: requested.sort === "—" ? "hot" : requested.sort,
                type: requested.type === "—" ? "image" : requested.type,
                prompt: requested.prompt === "—" ? "" : requested.prompt,
                openId: requested.openId === "—" || requested.openId === "null" ? null : requested.openId,
              })
            }
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * The empty string in the four text slots this shell owns, and it is four
 * different outcomes — none of which any gate sees.
 *
 * The top shell has both axes with `sortLabel=""` and `typeLabel=""`. The
 * bottom one has neither axis, which is the only configuration that renders
 * `scopeLabel`, so it is the only place `scopeLabel=""` can be measured; its
 * feed is L1 rather than J3, so there is no second `role="region"` and the
 * pairing costs no `landmark-unique` risk.
 *
 * - **`sortLabel=""` leaves the tablist unnamed.** It is passed straight to
 *   `aria-label`, and an empty `aria-label` is *valid*, so the attribute
 *   survives and the accessible name is empty. axe has no rule requiring a
 *   name on `role="tablist"`, so the ordering axis becomes an anonymous group
 *   of three tabs and nothing raises a word. Same for the pills:
 *   `typeLabel=""` gives `role="radiogroup"` an empty name, and
 *   `aria-toggle-field-name` covers the radios (named from content) rather
 *   than their group. The whole point of keeping the two axes as two controls
 *   is that they announce as two *named* things, and one empty string per axis
 *   silently deletes that.
 * - **`scopeLabel=""` deletes the only sentence on the page.** The guard is
 *   `sorts.length === 0 && types.length === 0`, not a truthiness check on the
 *   label, so the paragraph is rendered and rendered empty: a zero-height
 *   element where the shell's own explanation of what the feed contains should
 *   be. The K1/N3 shape again — a collapse with no fallback and no rule.
 * - **The shell's own interpolation survives an empty label rather than
 *   collapsing.** F3's "more like this" thumbnails are named
 *   `${openLabel} ${title}`, so `gallery.openLabel=""` degrades the name to
 *   the title with a leading space, which name computation trims. That is the
 *   opposite outcome to J3's Remix button, whose `${remixLabel}: ${title}`
 *   leaves a colon behind — measured in `ExploreGallery.stories.tsx` and cited
 *   here, because the shell copies the naming idiom but not the separator.
 *
 * **B4's stacked label never renders, and this story is where it is pinned.**
 * The rail item's label span measures **63×0** CSS px: `ToggleGroupItem`'s
 * base `h-8` bounds the column and the icon consumes it, so the rail is
 * icon-only to a sighted user while the accessible name survives. Pre-existing,
 * recorded in `CONTINUE.md` §8 from O4 in a browser, re-measured here in the
 * gate — still live as of this wave. Not repaired: the fix is a height on a
 * vendored primitive's variant, not a class on this block.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1" data-testid="with-axes">
        <ExploreShell
          rail={RAIL}
          railPinned={RAIL_PINNED}
          activeRailId="explore"
          sorts={SORTS}
          defaultSort="hot"
          types={TYPES}
          sortLabel=""
          typeLabel=""
          items={ITEMS.slice(0, 2)}
          openItemId="neon"
          gallery={{ openLabel: "" }}
        />
      </div>
      <div className="min-h-0 flex-1 border-t" data-testid="no-axes">
        <ExploreShell rail={RAIL} activeRailId="explore" items={[]} scopeLabel="" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const withAxes = canvas.getByTestId("with-axes");
    const noAxes = canvas.getByTestId("no-axes");

    // 1. Both axes keep their attribute and lose their name.
    const tablist = withAxes.querySelector<HTMLElement>('[data-slot="explore-shell-sorts"]')!;
    await expect(tablist).toHaveAttribute("role", "tablist");
    await expect(tablist).toHaveAttribute("aria-label", "");
    const pills = withAxes.querySelector<HTMLElement>('[data-slot="choice-chips"]')!;
    await expect(pills).toHaveAttribute("role", "radiogroup");
    await expect(pills).toHaveAttribute("aria-label", "");

    // 2. The scope line is rendered and empty, not skipped.
    const scope = noAxes.querySelector<HTMLElement>('[data-slot="explore-shell-scope"]')!;
    await expect(scope).not.toBeNull();
    await expect(scope.textContent).toBe("");
    await expect(Math.round(scope.getBoundingClientRect().height)).toBe(0);

    // 3. The shell's own interpolated name degrades to the title, trimmed —
    //    no stray separator, unlike J3's Remix.
    const thumb = document.querySelector<HTMLElement>('[data-slot="explore-shell-more-item"]')!;
    await expect(thumb).toHaveAttribute("aria-label", " Paper-cut forest");
    await expect(thumb.getAttribute("aria-label")!.trim()).toBe("Paper-cut forest");

    // 4. B4's stacked label: named, and not painted.
    const label = withAxes.querySelector<HTMLElement>(
      '[data-slot="modality-rail-item"] span:nth-of-type(2)',
    )!;
    const box = label.getBoundingClientRect();
    await expect(`${Math.round(box.width)}x${Math.round(box.height)}`).toBe("63x0");
    await expect(label.textContent).toBe("Explore");
  },
};

/**
 * Eighty to ninety characters in each of the shell's own author-supplied
 * slots, and the control strip answers in three different ways in one row.
 *
 * - **A sort tab neither wraps nor truncates.** The vendored `TabsTrigger` is
 *   `whitespace-nowrap` with no bound, so the tablist grows with the label —
 *   the same shape J3 measured on its own sort strip, inherited here because
 *   the shell hosts the tabs itself rather than getting them from J3.
 * - **A type pill wraps.** `choice-chip` sets no whitespace rule and
 *   `ChoiceChips` is `flex-wrap`, so the same length grows the pill's height
 *   instead of the row's width. Two composed controls, opposite answers — a
 *   second reason the spec keeps the two axes as two controls.
 * - **The strip itself wraps, and that is the shell's own contribution.**
 *   `explore-shell-controls` is `flex-wrap` with `gap-y-2`, so when the
 *   tablist and the pills cannot share a line the pills drop to a second row
 *   rather than pushing the feed sideways. J3's own control block stacks them
 *   unconditionally; the shell's shares a line when it can.
 *
 * The margin swap's LTR half lives here: the facet count's used margins read
 * `6px` inline-start / `0px` inline-end under `dir="ltr"`, the same values the
 * physical `ml-1.5` produced before the swap. That is the byte-identical claim
 * `RTL` makes, measured rather than assumed.
 *
 * The fifth long slot belongs to a composed child and is cited rather than
 * re-measured: a tile's title and author truncate inside J3's `min-w-0`
 * column, with no `title` attribute, so the full string is unreachable by
 * hover.
 */
export const LongContent: Story = {
  args: {
    rail: RAIL,
    railPinned: RAIL_PINNED,
    activeRailId: "explore",
    sorts: [
      {
        value: "hot",
        label: "Hot right now across every model, every community collection and every public remix",
      },
      { value: "new", label: "New" },
    ],
    defaultSort: "hot",
    types: [
      {
        value: "image",
        label: "Everything anyone has shared publicly, including drafts, remixes and derived works",
        count: 812,
      },
      { value: "video", label: "Videos", count: 44 },
    ],
    items: [
      {
        ...ITEMS[0],
        title:
          "Neon city at dusk with wet asphalt reflections, shot on an anamorphic lens and graded warm",
        author: "@a-very-long-community-handle-that-will-not-fit-inside-a-tile-meta-row-at-any-width",
      },
      ITEMS[1],
    ],
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="explore-shell"]')!;
    const slot = (name: string) => root.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;

    // 1. The tab does neither — nothing clips it, and the list grows to fit.
    const tab = root.querySelector<HTMLElement>('[data-slot="tabs-trigger"]')!;
    await expect(getComputedStyle(tab).whiteSpace).toBe("nowrap");
    await expect(getComputedStyle(tab).textOverflow).toBe("clip");
    await expect(tab.scrollWidth).toBeLessThanOrEqual(tab.clientWidth + 1);
    await expect(slot("explore-shell-sorts").getBoundingClientRect().width).toBeGreaterThan(375);

    // 2. The pill wraps instead, so the row grows down rather than out.
    const chip = root.querySelector<HTMLElement>('[data-slot="choice-chip"]')!;
    await expect(getComputedStyle(chip).whiteSpace).toBe("normal");
    await expect(chip.getBoundingClientRect().height).toBeGreaterThan(
      tab.getBoundingClientRect().height,
    );

    // 3. …and the shell's strip wraps around both, so nothing pushes the feed
    //    sideways. Two rows: the pills start below the tablist's bottom edge.
    const controls = slot("explore-shell-controls");
    await expect(getComputedStyle(controls).flexWrap).toBe("wrap");
    const sortsBox = slot("explore-shell-sorts").getBoundingClientRect();
    const pillsBox = slot("choice-chips").getBoundingClientRect();
    await expect(pillsBox.top).toBeGreaterThanOrEqual(sortsBox.bottom - 1);
    await expect(controls.scrollWidth).toBeLessThanOrEqual(controls.clientWidth + 1);

    // 4. The LTR half of the ms-1.5 swap, as used values.
    const count = chip.querySelector<HTMLElement>("span")!;
    const margins = getComputedStyle(count);
    await expect(`${margins.marginLeft}/${margins.marginRight}`).toBe("6px/0px");
  },
};

/**
 * A real 375×812 viewport, not a 375px box — and for this shell the two give
 * different answers, which is the whole reason the mechanism exists.
 *
 * `page.viewport(375, 812)` from `@vitest/browser/context` resizes the test
 * iframe, so `matchMedia` moves with it. The width wrapper every earlier wave
 * used constrains the box and leaves the breakpoint at the gate's 1200px, and
 * J3 `explore-gallery`'s masonry keys `sm:columns-2 lg:columns-3` off the
 * *viewport* — so J3's own `Mobile` story measures **three** ~114px columns
 * inside its 375px frame and says so. The same feed measured through a real
 * phone viewport here is **one** column. Both measurements are correct; only
 * this one is the phone, and the difference is the argument for the mechanism.
 * It does not leak — the stories after this one read 1200 again — so there is
 * no cleanup.
 *
 * **What the shell costs a phone, and it is the finding.** B4 keeps its
 * `w-[92px]` column at every width: no compact mode, no drawer, no breakpoint
 * of its own. So a quarter of a 375px screen is a destination rail, and the
 * feed that the spec says exists to be browsed for surprise gets 283px minus
 * padding — one column of tiles about 250px wide. B1 `app-sidebar` swaps to a
 * drawer at this width and B4 has nothing equivalent; a shell built on B4
 * therefore has no narrow layout to swap into. That is a component-layer gap,
 * recorded rather than papered over with a wrapper here.
 *
 * What holds: nothing scrolls sideways — not the root, not the feed, not the
 * control strip — the strip wraps its two axes onto separate rows, and D1's
 * toolbar wraps rather than pushing the bar wider than its column.
 */
export const Mobile: Story = {
  args: { ...FULL_ARGS, items: ITEMS.slice(0, 4) },
  play: async ({ canvasElement }) => {
    await page.viewport(375, 812);

    const root = canvasElement.querySelector<HTMLElement>('[data-slot="explore-shell"]')!;
    const slot = (name: string) => root.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;

    // 1. The breakpoint actually moved. A wrapper cannot make this true.
    await waitFor(() => expect(window.innerWidth).toBe(375));
    await expect(window.matchMedia("(min-width: 640px)").matches).toBe(false);
    await expect(Math.round(root.getBoundingClientRect().width)).toBe(375);

    // 2. …so the masonry is one column here, where J3's wrapper-framed story
    //    measures three. The claim this story exists to make.
    const masonry = slot("explore-gallery-masonry");
    await waitFor(() => expect(getComputedStyle(masonry).columnCount).toBe("1"));

    // 3. A quarter of the screen is rail, at every width.
    const rail = slot("modality-rail");
    await expect(Math.round(rail.getBoundingClientRect().width)).toBe(92);
    const tile = root.querySelector<HTMLElement>('[data-slot="explore-gallery-item"]')!;
    await expect(tile.getBoundingClientRect().width).toBeGreaterThan(200);

    // 4. Nothing scrolls sideways, at any level that owns a box.
    for (const el of [
      root,
      root.querySelector<HTMLElement>('[data-region="docked-prompt-bar"]')!,
      slot("explore-shell-controls"),
      slot("explore-gallery-feed"),
    ]) {
      await expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
    }

    // 5. Both wrapping chrome rows do wrap rather than overflow.
    const sortsBox = slot("explore-shell-sorts").getBoundingClientRect();
    const pillsBox = slot("choice-chips").getBoundingClientRect();
    await expect(pillsBox.top).toBeGreaterThanOrEqual(sortsBox.bottom - 1);
    await expect(getComputedStyle(slot("media-prompt-bar-toolbar")).flexWrap).toBe("wrap");
  },
};

/**
 * O8 beside O7 `library-shell`, the near-twin the spec argues against by name:
 * *"Two galleries, two jobs — a derived rule."* From a screenshot they are one
 * component with a density toggle. They are not, and the rule is **whose work
 * it is**:
 *
 * - **Explore shell** is other people's finished work, browsed for surprise.
 *   Tile heights vary, because equal rows make every row scan the same; the
 *   prompt bar sits above the feed so seeing something good and making your
 *   own version of it is one control away; and the two ways to narrow it are
 *   *ordering* and *type*, two axes that compose.
 * - **Library shell** is your own archive, scanned for a known item. Every
 *   tile is one aspect ratio through A8, so the grid never reflows; there is
 *   no prompt bar, because you did not come here to generate; and narrowing is
 *   a J2 facet rail with counts, which is a different job from ordering.
 *
 * So: someone else's work, browsed → O8. Your own work, searched → O7.
 * Reaching for a density toggle on either turns it into the other, which is
 * why `layout` is deliberately not forwardable through this shell.
 *
 * Rendered live rather than described, because the two failure modes are
 * visual: an O8 whose tiles have been normalised looks like a worse O7, and an
 * O7 that grew a prompt bar looks like a worse O8.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex h-full flex-col">
      <section className="flex min-h-0 flex-1 flex-col gap-1 p-2">
        <p className="text-foreground shrink-0 text-xs font-medium">
          O8 explore shell — other people&apos;s work, uneven tiles, a prompt above the feed
        </p>
        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
          <ExploreShell {...FULL_ARGS} items={ITEMS.slice(0, 4)} />
        </div>
      </section>
      <section className="flex min-h-0 flex-1 flex-col gap-1 p-2">
        <p className="text-foreground shrink-0 text-xs font-medium">
          O7 library shell — your own archive, one fixed frame, facets instead of axes
        </p>
        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
          <LibraryShell {...BOUNDARY_LIBRARY_ARGS} />
        </div>
      </section>
    </div>
  ),
  play: async () => {
    // Doubles as the non-leak guard for `Mobile`'s `page.viewport(375, 812)`:
    // this story is the next one in the file, and it renders at the gate's own
    // width. One-way — it can only catch a leak when it runs after Mobile —
    // but it costs a line and the claim is otherwise unchecked here.
    await expect(window.innerWidth).toBeGreaterThan(375);
  },
};

const BOUNDARY_LIBRARY_ARGS: LibraryShellProps = {
  title: "Library",
  facets: [
    {
      id: "type",
      label: "Type",
      facets: [
        { value: "image", label: "Image", count: 1284 },
        { value: "video", label: "Video", count: 96 },
      ],
    },
  ],
  defaultSelectedFacets: { type: ["image"] },
  groups: [
    {
      id: "today",
      label: "Today",
      items: [
        { id: "a1", name: "Neon city at dusk", thumbnail: <Swatch tone="primary" /> },
        { id: "a2", name: "Paper-cut forest", thumbnail: <Swatch tone="secondary" /> },
        { id: "a3", name: "Chrome jellyfish", thumbnail: <Swatch tone="muted" /> },
        { id: "a4", name: "Brutalist greenhouse", thumbnail: <Swatch tone="secondary" /> },
      ],
    },
  ],
};
