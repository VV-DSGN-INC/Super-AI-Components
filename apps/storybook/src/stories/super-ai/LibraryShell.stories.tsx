import type { Meta, StoryObj } from "@storybook/react-vite";
import { Compass, Images } from "lucide-react";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { LibraryShellDocs } from "@/content/components/library-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";
import { ExploreShell } from "@/registry/super-ai/explore-shell";
import { LibraryShell, type LibraryShellProps } from "@/registry/super-ai/library-shell";

const FACETS: LibraryShellProps["facets"] = [
  {
    id: "type",
    label: "Type",
    facets: [
      { value: "image", label: "Image", count: 1284 },
      { value: "video", label: "Video", count: 96 },
      { value: "audio", label: "Audio", count: 18 },
      // The dead end, stated before the click rather than after it.
      { value: "3d", label: "3D", count: 0 },
    ],
  },
  {
    id: "model",
    label: "Model",
    visibleCount: 3,
    facets: [
      { value: "v7", label: "Aurora v7", count: 812 },
      { value: "v6", label: "Aurora v6", count: 401 },
      { value: "sketch", label: "Sketch", count: 121 },
      { value: "legacy", label: "Legacy", count: 64 },
    ],
  },
  {
    id: "format",
    label: "Format",
    facets: [
      { value: "portrait", label: "Portrait", count: 604 },
      { value: "landscape", label: "Landscape", count: 588 },
      { value: "square", label: "Square", count: 206 },
    ],
  },
];

const SAVED_SEARCHES = [
  { id: "upscaled", label: "Upscaled keepers", count: 42 },
  { id: "client", label: "Client-ready", count: 17 },
];

/**
 * Decorative stand-ins for real media — an archive's thumbnails are the
 * caller's. Solid semantic fills rather than gradients: axe cannot resolve a
 * gradient to a colour, so a gradient thumbnail would leave every tile's
 * overlay label permanently "incomplete" in the contrast report.
 */
const swatch = (tint: string) => <div aria-hidden className={`h-full w-full ${tint}`} />;

const PROMPT = "A red bicycle leaning on a sunlit wall, shot on 35mm film";
const spanFor = (phrase: string) => ({
  start: PROMPT.indexOf(phrase),
  end: PROMPT.indexOf(phrase) + phrase.length,
});

const GROUPS: LibraryShellProps["groups"] = [
  {
    id: "today",
    label: "Today",
    items: [
      {
        id: "a1",
        name: "Red bicycle, sunlit wall",
        thumbnail: swatch("bg-primary/20"),
        prompt: PROMPT,
        highlightedSpans: [spanFor("a sunlit wall"), spanFor("35mm film")],
        params: [
          { label: "Seed", value: "4471", copyable: true },
          { label: "Sampler", value: "Euler a" },
          { label: "Steps", value: "32" },
          { label: "Model", value: "Aurora v7" },
        ],
      },
      { id: "a2", name: "Blue awning", thumbnail: swatch("bg-secondary") },
      { id: "a3", name: "Rain on glass", thumbnail: swatch("bg-accent") },
      { id: "a4", name: "Market stall", thumbnail: swatch("bg-muted") },
      { id: "a5", name: "Bridge at noon", thumbnail: swatch("bg-primary/10") },
      { id: "a6", name: "Studio portrait", thumbnail: swatch("bg-card") },
      { id: "a7", name: "Cold open", thumbnail: swatch("bg-primary/10") },
      { id: "a8", name: "Paper texture", thumbnail: swatch("bg-muted") },
    ],
  },
  {
    id: "last-week",
    label: "Last week",
    items: [
      { id: "b1", name: "Harbour at dusk", thumbnail: swatch("bg-primary/30") },
      { id: "b2", name: "Neon alley", thumbnail: swatch("bg-secondary") },
      { id: "b3", name: "Upscaling", state: "loading" },
      { id: "b4", name: "Locked render", state: "locked", thumbnail: swatch("bg-secondary") },
    ],
  },
];

const FULL_ARGS: LibraryShellProps = {
  title: "Library",
  facets: FACETS,
  savedSearches: SAVED_SEARCHES,
  defaultSelectedFacets: { type: ["image"] },
  groups: GROUPS,
  onCopyPrompt: () => {},
  onRemix: () => {},
  onEditAsset: () => {},
  onSpanSelect: () => {},
};

const meta: Meta<typeof LibraryShell> = {
  title: "Super AI/Library Shell",
  component: LibraryShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(LibraryShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LibraryShell>;

/** The working archive: counted facets, one filter applied, two date buckets, eight-up. */
export const Archive: Story = { args: FULL_ARGS };

/**
 * Day one. Facets exist but count nothing, and the grid falls to L1 as an
 * in-grid tile rather than a page takeover — the columns stay, so the archive
 * still looks like an archive. Mandatory export for the block contract.
 */
export const Empty: Story = {
  args: {
    title: "Library",
    facets: [
      {
        id: "type",
        label: "Type",
        facets: [
          { value: "image", label: "Image", count: 0 },
          { value: "video", label: "Video", count: 0 },
        ],
      },
    ],
  },
};

/**
 * Narrow viewport. Below `md` the shell stacks: the facet rail becomes a short
 * scrolling band above the header instead of disappearing, and the grid steps
 * down to three columns at `compact`. Mandatory export for the block contract —
 * a shell is a layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing while looking
 * configured, so `options` is declared explicitly rather than relying on a
 * built-in list.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `test:stories` has no manager to resize an iframe, so it
 * renders and axe-checks this story at the browser's default width. The narrow
 * layout here is verified by hand, not by a gate.
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

/** Thumbnail size is the reader's preference: the same archive at four-up. */
export const Comfortable: Story = { args: { ...FULL_ARGS, density: "comfortable" } };

/** Select mode: every tile toggles instead of opening, and F2's bulk bar appears. */
export const SelectMode: Story = {
  args: {
    ...FULL_ARGS,
    selectMode: true,
    selectedIds: ["a2", "a4"],
    onSelectionChange: () => {},
    bulkActions: (
      <>
        <button type="button" className="rounded-md border px-2 py-1 text-xs">
          Download
        </button>
        <button type="button" className="rounded-md border px-2 py-1 text-xs">
          Delete
        </button>
      </>
    ),
  },
};

/** F3 open on the one asset with full provenance — the reason the archive is worth keeping. */
export const AssetOpen: Story = { args: { ...FULL_ARGS, openAssetId: "a1", onOpenAssetChange: () => {} } };

/* -------------------------------------------------------------------------
 * Case stories — the situations this archive meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md
 * for which of the eight apply.
 *
 * All eight are true for this shell and all eight are written, so there are no
 * `case-skip` lines below. Two facts shaped the set. A facet rail plus a grid
 * is a long keyboard surface — twenty stops in the deliberately small fixture
 * `KeyboardOrder` uses, and one more per facet, per applied filter and per
 * asset after that — so the walk is where most of this file's evidence is.
 * And three separate media queries
 * decide the narrow layout (`md:flex-row`, the rail's `md:w-64`, and F2's
 * `sm:`/`lg:` column counts), so `Mobile` moves the real viewport instead of
 * constraining a box.
 *
 * One export beyond the eight: `DividerBaselineLtr` holds the LTR half of the
 * one source change this wave made, because a logical-property swap is only
 * sanctioned when it is byte-identical in LTR and that has to be read back
 * rather than assumed.
 * ---------------------------------------------------------------------- */

/**
 * A smaller archive than `Archive`, sized so a tab walk stays legible: two
 * facet sections rather than three, one saved search, one applied facet, three
 * assets. Every stop it adds is a stop the full fixture also has.
 */
const WALKABLE: LibraryShellProps = {
  title: "Library",
  facets: [
    {
      id: "type",
      label: "Type",
      facets: [
        { value: "image", label: "Image", count: 1284 },
        { value: "video", label: "Video", count: 96 },
        // The dead end, stated before the click rather than after it.
        { value: "3d", label: "3D", count: 0 },
      ],
    },
    {
      id: "model",
      label: "Model",
      visibleCount: 2,
      facets: [
        { value: "v7", label: "Aurora v7", count: 812 },
        { value: "v6", label: "Aurora v6", count: 401 },
        { value: "sketch", label: "Sketch", count: 121 },
      ],
    },
  ],
  savedSearches: [{ id: "upscaled", label: "Upscaled keepers", count: 42 }],
  defaultSelectedFacets: { type: ["image"] },
  groups: [
    {
      id: "today",
      label: "Today",
      items: [
        { id: "a1", name: "Red bicycle, sunlit wall", thumbnail: swatch("bg-primary/20") },
        { id: "a2", name: "Blue awning", thumbnail: swatch("bg-secondary") },
        { id: "a3", name: "Rain on glass", thumbnail: swatch("bg-accent") },
      ],
    },
  ],
};

/**
 * Puts `dir` on the document rather than on a wrapper, because this shell
 * mounts F3 `asset-detail` in a portal: a `<div dir="rtl">` cannot reach a
 * dialog rendered into `<body>`, and floating-ui's `align` mirroring reads
 * *computed* direction, so a wrapper silently fails that half. The idiom is
 * `AccountMenu.stories.tsx`'s; the cleanup is what keeps it out of the next
 * story.
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
 * Right-to-left, and the shell's one physical class — now fixed.
 *
 * The rail's divider was `md:border-r`. Measured under `dir="rtl"` before the
 * swap: the rail sits at x 944..1200 and the grid at 0..944, so the 1px line
 * painted at **x 1200 — the outer edge of the page** — while the seam the
 * divider exists to draw, at 944, had nothing on it. `md:border-e` puts it
 * back on the seam (`border-left-width` 1px, `border-right-width` 0) and is
 * byte-identical in LTR, read back rather than assumed: same `0px/1px/0px/0px`
 * on all four sides, same `oklch(0.922 0 0)`, same 0..256 box. That is the
 * measurement N6 `usage-dashboard` asks for — its `text-left` swap on a `<tr>`
 * was *not* byte-identical, because the user agent had an opinion about the
 * `<th>`s below it. Nothing inherits a border, so this element is the one that
 * paints and the swap is free. Both frames are asserted below, so a revert
 * fails on the geometry rather than on the class name (H3 `track-lane`'s
 * pattern).
 *
 * **Two things this shell does not inherit, checked rather than assumed.**
 * Wave 1's missing `DirectionProvider` costs Base UI composites their arrow
 * keys. Grepping the eight composed sources for one turns up exactly two, both
 * inside J1: its list/grid `ToggleGroup`, which `LIBRARY_HEADER_ONLY` sets to
 * `display: none`, and its per-row overflow menu, which never mounts because
 * the header is handed `items={[]}`. So no arrow-key surface is reachable in
 * this shell at all, and the same hidden `ToggleGroup` is the one carrying
 * `spacing={0}` — the gate on wave 3's vendored seam defect — which therefore
 * also costs nothing here.
 *
 * **One is inherited and stays recorded.** A5's chip pads physically:
 * `filter-chip-toggle` carries `pr-1` and `filter-chip-remove` carries `mr-1`.
 * Measured here in RTL — chip 850.6..928, toggle 871.6..927, remove
 * 851.6..867.6 — the toggle's 12px of padding lands between the label and its
 * own X while 4px lands on the chip's outer edge, the reverse of LTR. Two
 * byte-identical swaps in `filter-bar.tsx`, which is not this shell's file.
 */
export const RTL: Story = {
  args: WALKABLE,
  render: (args) => (
    <RtlDocument>
      <LibraryShell {...args} />
    </RtlDocument>
  ),
  play: async ({ canvasElement }) => {
    const rail = canvasElement.querySelector<HTMLElement>('[data-region="facet-rail"]')!;
    const grid = canvasElement.querySelector<HTMLElement>('[data-region="dense-grid"]')!;
    await expect(getComputedStyle(rail).direction).toBe("rtl");

    // The rail mirrors to the right; the divider has to follow it to the seam.
    const railBox = rail.getBoundingClientRect();
    const gridBox = grid.getBoundingClientRect();
    await expect(railBox.left).toBeGreaterThan(gridBox.left);
    const railStyle = getComputedStyle(rail);
    await expect(railStyle.borderLeftWidth).toBe("1px");
    await expect(railStyle.borderRightWidth).toBe("0px");
    // The painted line and the seam are the same x, within a pixel.
    await expect(Math.abs(railBox.left - gridBox.right)).toBeLessThanOrEqual(1);

    // The chip's own halves keep their order: label first, remove control at
    // the inline end — which under RTL is the left.
    const toggle = canvasElement.querySelector<HTMLElement>('[data-slot="filter-chip-toggle"]')!;
    const remove = canvasElement.querySelector<HTMLElement>('[data-slot="filter-chip-remove"]')!;
    await expect(remove.getBoundingClientRect().left).toBeLessThan(toggle.getBoundingClientRect().left);
  },
};

/**
 * The LTR half of the same claim, and the reason it is a separate export: a
 * logical-property swap is only sanctioned when it changes nothing in LTR, and
 * "nothing" has to be read back on the element that paints. Same four widths,
 * same colour, same box as `md:border-r` gave.
 */
export const DividerBaselineLtr: Story = {
  args: WALKABLE,
  play: async ({ canvasElement }) => {
    const rail = canvasElement.querySelector<HTMLElement>('[data-region="facet-rail"]')!;
    const grid = canvasElement.querySelector<HTMLElement>('[data-region="dense-grid"]')!;
    const style = getComputedStyle(rail);
    await expect(style.borderLeftWidth).toBe("0px");
    await expect(style.borderRightWidth).toBe("1px");
    await expect(style.borderTopWidth).toBe("0px");
    await expect(style.borderBottomWidth).toBe("0px");
    await expect(style.borderRightColor).toBe("oklch(0.922 0 0)");
    const railBox = rail.getBoundingClientRect();
    await expect(railBox.left).toBe(0);
    await expect(railBox.width).toBe(256);
    await expect(Math.abs(railBox.right - grid.getBoundingClientRect().left)).toBeLessThanOrEqual(1);
  },
};

/**
 * Two branches, both already present, and one collapse that has no fix at this
 * layer.
 *
 * `vitest.config.ts` emulates `prefers-reduced-motion: reduce` for every test,
 * so every number below is the rendered result rather than a class-name check.
 * H1 `transport-controls` found a whole class of these assertions that cannot
 * fail, so the emulation itself was checked first: a bare `animate-pulse`
 * appended to this document under the same emulation reads `animation-name:
 * "pulse"`, and a bare `animate-spin` reads `"spin"`. The `"none"`s below are
 * therefore caused by the `motion-reduce:` classes and not by the runner.
 *
 * - **A8's skeleton branches.** `preview-tile`'s loading placeholder is
 *   `animate-pulse motion-reduce:animate-none`, a plain animation where source
 *   order works in the class's favour, and `animation-name` reads back
 *   `"none"`. That is the one piece of motion the archive owns.
 * - **F3's lightbox branches on both halves.** `asset-detail` restates the
 *   variant on its panel (`motion-reduce:data-open:animate-none`) and the
 *   backdrop was fixed centrally on `DialogOverlay` in wave 6, because no call
 *   site could reach it. Verified here rather than assumed — two wave-7 agents
 *   were told the same thing about `alert-dialog` and were right to check, and
 *   that one turned out to be a file short. Both read `"none"`; **nothing was
 *   added by this story.**
 *
 * **What suppressing the motion costs, and it is not nothing.** A8 paints a
 * loading tile and a failed tile on the same `oklch(0.97 0 0)`, and this shell
 * passes no `action` node to either — `LibraryAsset` has no slot for one — so
 * the failed tile's overlay div is empty and transparent. Measured side by
 * side: identical frame background, identical empty overlay, and the only text
 * on either is the asset's own name. With motion on, the pulse is the sole
 * signal separating them; with motion off there is none, and neither state is
 * announced. E4 `preset-grid` recorded the same collapse in wave 2; here it is
 * sharper, because a caller cannot repair it from the outside. `locked` is the
 * counter-case and stays legible: its scrim is `oklab(1 0 0 / 0.6)`, a real
 * lightening of the tile. Recorded, not asserted — the fix is an `action`
 * slot on `LibraryAsset`, an API decision.
 */
export const ReducedMotion: Story = {
  args: {
    ...FULL_ARGS,
    groups: [
      {
        id: "today",
        label: "Today",
        items: [
          { id: "l1", name: "Upscaling a wide crop", state: "loading" },
          { id: "f1", name: "Harbour at dusk", state: "failed" },
          { id: "k1", name: "Locked render", state: "locked", thumbnail: swatch("bg-secondary") },
          {
            id: "d1",
            name: "Red bicycle, sunlit wall",
            thumbnail: swatch("bg-primary/20"),
            prompt: PROMPT,
          },
        ],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const skeleton = canvasElement.querySelector<HTMLElement>('[data-slot="preview-tile-loading"]')!;
    await expect(getComputedStyle(skeleton).animationName).toBe("none");

    // The collapse the description names: the two states paint the same box.
    const frames = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="preview-tile"]'));
    const bg = (state: string) =>
      getComputedStyle(
        frames
          .find((tile) => tile.getAttribute("data-state") === state)!
          .querySelector('[data-slot="preview-tile-frame"]')!,
      ).backgroundColor;
    // Asserted as the shape of the finding, not as a desirable outcome: the
    // repair is an `action` slot on LibraryAsset, recorded in CONTINUE.md §8.
    await expect(bg("loading")).toBe(bg("failed"));

    // The lightbox, opened through the tile's own frame button — the same
    // route a reader takes, and the only affordance the tile offers.
    await userEvent.click(canvas.getByRole("button", { name: "Red bicycle, sunlit wall" }));
    const panel = await waitFor(() => {
      const found = document.querySelector<HTMLElement>('[data-slot="asset-detail"]');
      if (!found) throw new Error("lightbox did not open");
      return found;
    });
    await expect(getComputedStyle(panel).animationName).toBe("none");
    const overlay = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!;
    await expect(getComputedStyle(overlay).animationName).toBe("none");
  },
};

/**
 * Twenty stops, in a fixture chosen so every *kind* of stop appears once. The
 * order is rail → header → grid, which is the reading order in LTR and the
 * mirrored reading order in RTL, and it holds because the shell's regions are
 * in that DOM order rather than because anything manages focus.
 *
 * Three facts the anatomy table cannot show, all asserted below:
 *
 * - **Each scrolling pane costs a tab stop that does nothing.** The rail and
 *   the grid carry `tabIndex={0}` and a name to satisfy axe's
 *   `scrollable-region-focusable`, so a keyboard user meets two dead stops
 *   before the controls in each pane. That is the price of the rule, and it is
 *   worth knowing before you count stops.
 * - **The docs module is wrong about what those stops look like, in the
 *   direction wave 7 corrected twice.** Its focus list says they "have no
 *   `focus-visible` style at all… tabbing into a pane shows nothing moving".
 *   Measured: `outline: auto 1px` at `oklab(0.708 0 0 / 0.5)`, the user
 *   agent's own outline recoloured by the repo's global `outline-ring/50` —
 *   thin against the registry's `ring-2` and `ring-3`, not absent. Same
 *   correction N3 `disclaimer-note` and M1 `settings-dialog` needed.
 * - **A zero-count facet leaves the tab order rather than the page.** J2
 *   disables the 3D facet and Base UI's `useFocusableWhenDisabled` gives the
 *   disabled span `tabindex="-1"`, so the walk steps over it while the count
 *   stays visible.
 *
 * **Both focus checks run at every stop, because they answer different
 * questions.** `settledFocusRing` asks whether anything is painted;
 * a `focusTreatmentSignature` differential — read on the *next* stop while
 * focus is still on the previous one, so no blur disturbs the sequence — asks
 * whether focus is what painted it. Nineteen stops satisfy both.
 *
 * **The twentieth is excluded by name and recorded rather than asserted.** The
 * selected thumbnail-size chip ("Small", because the archive opens dense)
 * carries `choice-chips`' permanent `ring-2 ring-ring border-ring`, and its
 * `focus-visible:ring-2 focus-visible:ring-ring` is the same width at the same
 * colour, so focus changes nothing that can be seen. Measured across the tab
 * that focuses it: `oklch(0.708 0 0) 0px 0px 0px 2px` and a border-colour of
 * `oklch(0.708 0 0)` before and after, byte-identical — and `outline-style`
 * reads `none` throughout, so the user-agent outline that distinguishes the
 * two pane stops is not there to help either. J2 `filter-panel` measured the
 * same thing in wave 5 on the same primitive. The fix belongs to
 * `choice-chips`, and pinning the measurement here would turn that fix into a
 * failure in this file. Confirmed live rather than assumed: dropping the
 * exclusion makes this story fail on that stop and no other.
 *
 * Recorded and not asserted for the same reason: removing the last applied
 * facet unmounts the chip that had focus and nothing restores it, so focus
 * falls to `<body>`. The docs module's first focus bullet already carries it.
 *
 * **One recorded item had gone stale in the component's favour, and this is
 * the story that walked past it.** Every tile stop here used to report
 * `aria-pressed="false"` in browse mode, where the tile is an open action
 * rather than a toggle — §8's A8 entry, and the docs module's fourth pitfall,
 * which said the source fix was "for A8 to let a caller choose". The prop had
 * already been added: `preview-tile` takes `selectMode="toggle" | "open"` and
 * omits `aria-pressed` for `"open"`. This shell was still passing neither and
 * getting the `"toggle"` default. The integrator forwarded it and rewrote the
 * pitfall in the same commit, so the walk below now steps through plain
 * buttons in browse mode. Left described rather than asserted: `aria-pressed`
 * is not part of the keyboard order, and pinning its absence here would put
 * A8's contract under O7's story name.
 */
export const KeyboardOrder: Story = {
  args: WALKABLE,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rail = canvasElement.querySelector<HTMLElement>('[data-region="facet-rail"]')!;
    const grid = canvasElement.querySelector<HTMLElement>('[data-region="dense-grid"]')!;

    // The dead end is out of the tab order, not merely dimmed.
    await expect(canvas.getByRole("checkbox", { name: "3D 0 no matches" })).toHaveAttribute("tabindex", "-1");

    const stops: HTMLElement[] = [
      rail,
      canvas.getByRole("button", { name: "Clear all filters" }),
      canvas.getByRole("radio", { name: "Small" }),
      canvas.getByRole("radio", { name: "Medium" }),
      canvas.getByRole("radio", { name: "Large" }),
      canvas.getByRole("button", { name: /Upscaled keepers/ }),
      canvas.getByRole("button", { name: /^Type/ }),
      canvas.getByRole("checkbox", { name: "Image 1284" }),
      canvas.getByRole("checkbox", { name: "Video 96" }),
      canvas.getByRole("button", { name: /^Model/ }),
      canvas.getByRole("checkbox", { name: "Aurora v7 812" }),
      canvas.getByRole("checkbox", { name: "Aurora v6 401" }),
      canvas.getByRole("button", { name: "Show 1 more in Model" }),
      canvas.getByRole("searchbox"),
      // Every applied facet is two stops, not one: the chip's toggle and its
      // X are separate controls wired to the same removal.
      canvas.getByRole("button", { name: "Image" }),
      canvas.getByRole("button", { name: "Remove Image filter" }),
      grid,
      canvas.getByRole("button", { name: "Red bicycle, sunlit wall" }),
      canvas.getByRole("button", { name: "Blue awning" }),
      canvas.getByRole("button", { name: "Rain on glass" }),
    ];
    await expect(new Set(stops).size).toBe(stops.length);

    // The one stop whose treatment focus does not change; see the description.
    const selectedDensityChip = stops[2];
    await expect(selectedDensityChip).toHaveAttribute("aria-checked", "true");

    for (const stop of stops) {
      // Baseline taken while focus is still on the previous stop — no blur, so
      // the differential costs the sequence nothing (J2 and J5's form).
      const before = focusTreatmentSignature(stop);

      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;
      await expect(focused).toBe(stop);
      await expect(focused.matches(":focus-visible")).toBe(true);
      // settledFocusRing, not `boxShadow !== "none"`: the string check passes
      // on Tailwind's present-but-transparent off-state ring.
      await settledFocusRing(focused, waitFor);

      if (stop !== selectedDensityChip) {
        await expect(focusTreatmentSignature(stop)).not.toBe(before);
      }
    }

    // The two pane stops are real and thin, not absent — the docs correction.
    for (const pane of [rail, grid]) {
      const outline = getComputedStyle(pane).outlineStyle;
      await expect(outline).toBe("none");
    }
    rail.focus();
    await expect(getComputedStyle(rail).outlineWidth).toBe("1px");
    await expect(getComputedStyle(rail).outlineStyle).not.toBe("none");

    // Nothing traps: one tab past the last tile leaves the shell.
    stops[stops.length - 1].focus();
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
  },
};

const onSelectedFacetsChangeSpy = fn();
const onDensityChangeSpy = fn();
const onOpenAssetChangeSpy = fn();

/**
 * Three controlled pairs driven by one frozen host, which is the shape a real
 * archive has: the filter state is the URL, the density is a saved preference,
 * and the open asset is a route.
 *
 * The host below re-renders on every callback while holding all three values
 * fixed, and stamps `data-renders` on the root so the play function can prove
 * the re-render happened. That makes the claim the strong one — not "the DOM
 * did not change because nothing re-rendered", but "a real re-render with an
 * unchanged value holds the shell fixed". Each callback is checked for the
 * payload a consumer needs to apply it: `onSelectedFacetsChange` reports the
 * whole next selection rather than a delta, `onDensityChange` reports F2's own
 * density value verbatim (no translation layer between the rail's
 * thumbnail-size group and the grid), and `onOpenAssetChange` reports the
 * asset id.
 *
 * **The shell itself is a counter-case worth recording**, because §8 carries
 * four findings of the opposite shape (E4, E1, J4, J2 all hold state a host
 * cannot reach). Every piece of view state here is a complete trio —
 * `selectedFacets`/`defaultSelectedFacets`/`onSelectedFacetsChange`,
 * `density`/`defaultDensity`/`onDensityChange`,
 * `openAssetId`/`defaultOpenAssetId`/`onOpenAssetChange` — so a saved
 * position can be restored *and* held against the user, which is N4
 * `trace-timeline`'s standard.
 *
 * **One inherited gap survives it.** J2's see-more expansion lives in the
 * section's own `useState` with no prop in and none out, so swapping `facets`
 * on a mounted rail — the ordinary move, since counts are recomputed as
 * filters apply — carries the old expansion in. That is J2's, recorded in
 * wave 5, and it reaches every shell that composes the rail.
 */
export const Controlled: Story = {
  render: function ControlledStory() {
    const [renders, setRenders] = React.useState(0);
    const bump = () => setRenders((n) => n + 1);
    return (
      <LibraryShell
        {...FULL_ARGS}
        data-renders={renders}
        // Frozen on purpose: every callback re-renders, nothing moves.
        selectedFacets={{ type: ["image"] }}
        onSelectedFacetsChange={(next) => {
          onSelectedFacetsChangeSpy(next);
          bump();
        }}
        density="compact"
        onDensityChange={(next) => {
          onDensityChangeSpy(next);
          bump();
        }}
        openAssetId={null}
        onOpenAssetChange={(id) => {
          onOpenAssetChangeSpy(id);
          bump();
        }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="library-shell"]')!;
    await expect(root).toHaveAttribute("data-renders", "0");

    // 1. A facet click reports the whole next selection and moves nothing.
    const video = canvas.getByRole("checkbox", { name: "Video 96" });
    await expect(video).toHaveAttribute("aria-checked", "false");
    await userEvent.click(video);
    await expect(onSelectedFacetsChangeSpy).toHaveBeenCalledWith({ type: ["image", "video"] });
    await waitFor(() => expect(root).toHaveAttribute("data-renders", "1"));
    await expect(video).toHaveAttribute("aria-checked", "false");
    // The mirrored chip row is derived from the same value, so it holds too.
    await expect(canvas.queryByRole("button", { name: "Remove Video filter" })).toBeNull();

    // 2. Density reports F2's own value and the grid keeps its column count.
    const gridEl = canvasElement.querySelector<HTMLElement>('[data-slot="generation-grid-grid"]')!;
    const columnsBefore = getComputedStyle(gridEl).gridTemplateColumns;
    await userEvent.click(canvas.getByRole("radio", { name: "Large" }));
    await expect(onDensityChangeSpy).toHaveBeenCalledWith("comfortable");
    await waitFor(() => expect(root).toHaveAttribute("data-renders", "2"));
    await expect(getComputedStyle(gridEl).gridTemplateColumns).toBe(columnsBefore);

    // 3. A tile reports its id and the lightbox stays shut.
    await userEvent.click(canvas.getByRole("button", { name: "Red bicycle, sunlit wall" }));
    await expect(onOpenAssetChangeSpy).toHaveBeenCalledWith("a1");
    await waitFor(() => expect(root).toHaveAttribute("data-renders", "3"));
    await expect(document.querySelector('[data-slot="asset-detail"]')).toBeNull();
  },
};

/**
 * Every optional text slot at once — no header title, no header actions, no
 * search placeholder, no badges, no custom empty node — which is the state a
 * shell reaches on the first day of a product, before anyone has written the
 * copy.
 *
 * **What survives.** The rail keeps its landmark name, because
 * `aria-label="Filters"` is the shell's and `filtersTitle` renames only the
 * heading inside J2. The grid keeps `aria-label="Assets"`. Every tile keeps
 * its name, because the name comes from `asset.name` and not from any of these
 * slots. And the header region stays mounted with the applied chip in it,
 * which is what keeps a narrowed archive escapable when the title is gone.
 *
 * **What is lost silently.** `searchPlaceholder=""` is both the field's
 * placeholder and the text of its `sr-only` `<label>`, so the search box ends
 * up with an empty accessible name — and **axe raises nothing**, measured
 * here. Wave 5 recorded the same prop on J1 standalone as a red gate; in this
 * shell it is silent. Both are measurements and neither explains the other,
 * which is exactly K1 `ai-doc-block`'s finding — whether an empty string is
 * caught depends on properties of the field it lands on, not on the defect.
 * Rendered rather than described, because a silent failure is the one worth
 * having on screen; nothing below asserts the empty name, so fixing it will
 * not fail this file.
 *
 * **Two more are red gates and are therefore described, not rendered.**
 * `filtersTitle=""` leaves J2's `<h3>` empty and fails `empty-heading` (a 0×0
 * heading, measured). An asset with `name: ""` renders no label element at
 * all — A8 guards the overlay label on truthiness — leaving its frame button
 * with no accessible name and failing `button-name`. That second one is the
 * archive's realistic case: an untitled upload.
 *
 * A8 has grown a `frameLabel` prop since this shell was built, and with
 * `labelPlacement="overlay"` it does reach the frame (`namedByLabel` is only
 * true for `below`), so the shell could name an untitled asset today — but
 * A8's own doc comment calls passing both an overlay label and `frameLabel` a
 * caller error, so the fallback would have to be conditional on the name being
 * empty. Recorded in the report as a recommended source fix rather than taken
 * here: it changes what the component announces, which is not a mechanical
 * repair.
 */
export const EmptyLabel: Story = {
  args: {
    title: "",
    searchPlaceholder: "",
    facets: FACETS,
    savedSearches: SAVED_SEARCHES,
    defaultSelectedFacets: { type: ["image"] },
    groups: [
      {
        id: "today",
        label: "Today",
        items: [
          { id: "a1", name: "Red bicycle, sunlit wall", thumbnail: swatch("bg-primary/20") },
          { id: "a2", name: "Blue awning", thumbnail: swatch("bg-secondary") },
        ],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The two landmark names are the shell's own and cannot be emptied by a prop.
    await expect(canvasElement.querySelector('[data-region="facet-rail"]')).toHaveAttribute(
      "aria-label",
      "Filters",
    );
    await expect(canvasElement.querySelector('[data-region="dense-grid"]')).toHaveAttribute(
      "aria-label",
      "Assets",
    );
    // Tiles are named from the asset, not from any emptied slot.
    await expect(canvas.getByRole("button", { name: "Red bicycle, sunlit wall" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Blue awning" })).toBeVisible();
    // The header region is still mounted and still holds the applied filter,
    // which is what keeps a narrowed archive escapable.
    await expect(canvas.getByRole("button", { name: "Remove Image filter" })).toBeVisible();
  },
};

/**
 * An author-supplied name at ~85 characters, an author-supplied facet label,
 * and an author-supplied header title — three slots that make three *different*
 * decisions, which is the whole reason this story exists.
 *
 * - **The tile label truncates.** 483px of text in a 100px cell, `text-overflow:
 *   ellipsis`, and **no `title` attribute**, so a pointer user gets no way to
 *   read the rest. The accessible name is the full 85 characters, because A8's
 *   overlay label sits *inside* the frame button — so a screen-reader user gets
 *   the whole file name and the person looking at it does not. Worth knowing
 *   before you decide the label is the caption.
 * - **The facet label truncates too**, 310px into 149px, same ellipsis, same
 *   missing `title`. J2's own count stays visible beside it, which is the part
 *   that had to survive.
 * - **The mirrored chip does neither.** A5 sizes to content, so a long facet
 *   label produces a 326px chip and the header's `flex-wrap` row takes a second
 *   line rather than scrolling. The header's `scrollWidth` equals its
 *   `clientWidth` throughout, so the archive never gains a horizontal
 *   scrollbar from its own filters — which is the failure mode F2's bulk bar
 *   has at 375px and this row does not.
 *
 * The chip's remove control stays distinct at any length ("Remove {label}
 * filter"), which is the per-row naming contract holding — the contract that
 * has failed in four other components.
 */
export const LongContent: Story = {
  args: {
    title: "Everything generated since the studio moved to the new pipeline",
    facets: [
      {
        id: "type",
        label: "Type",
        facets: [
          { value: "image", label: "Photoreal image with an upscaled alpha channel", count: 1284 },
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
          {
            id: "l1",
            name: "Rain on the studio skylight at 4pm, shot on 35mm film with a shallow depth of field",
            thumbnail: swatch("bg-primary/20"),
          },
          { id: "l2", name: "Blue awning", thumbnail: swatch("bg-secondary") },
        ],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const tileLabel = canvasElement.querySelector<HTMLElement>('[data-slot="preview-tile-label"]')!;
    await expect(tileLabel.scrollWidth).toBeGreaterThan(tileLabel.clientWidth);
    await expect(getComputedStyle(tileLabel).textOverflow).toBe("ellipsis");
    // Clipped on screen, whole to assistive tech — the asymmetry the
    // description names. `title` is absent, so there is no pointer route.
    await expect(tileLabel).not.toHaveAttribute("title");
    await expect(
      canvas.getByRole("button", {
        name: "Rain on the studio skylight at 4pm, shot on 35mm film with a shallow depth of field",
      }),
    ).toBeVisible();

    const facetLabel = canvasElement.querySelector<HTMLElement>('[data-slot="filter-panel-facet-label"]')!;
    await expect(facetLabel.scrollWidth).toBeGreaterThan(facetLabel.clientWidth);
    await expect(getComputedStyle(facetLabel).textOverflow).toBe("ellipsis");

    // The chip grows and the row wraps; the header never scrolls sideways.
    const chipToggle = canvasElement.querySelector<HTMLElement>('[data-slot="filter-chip-toggle"]')!;
    await expect(chipToggle.scrollWidth).toBe(chipToggle.clientWidth);
    await expect(
      getComputedStyle(canvasElement.querySelector<HTMLElement>('[data-slot="filter-bar"]')!).flexWrap,
    ).toBe("wrap");
    const header = canvasElement.querySelector<HTMLElement>('[data-region="header"]')!;
    await expect(header.scrollWidth).toBe(header.clientWidth);
    await expect(
      canvas.getByRole("button", {
        name: "Remove Photoreal image with an upscaled alpha channel filter",
      }),
    ).toBeVisible();
  },
};

/**
 * A phone, and this is the one story in the file that moves the viewport
 * rather than constraining a box.
 *
 * `page.viewport(375, 812)` resizes the test iframe itself; the width wrapper
 * every earlier wave used would have been a false pass here, because **three
 * separate media queries decide this shell's narrow layout** — the root's
 * `md:flex-row`, the rail's `md:w-64`, and F2's `sm:`/`lg:` column counts. All
 * three read the viewport, which a wrapper cannot move, so a 375px box at the
 * gate's 1200px viewport would still hold a desktop row and an eight-column
 * grid — and would report success. The half of that this story measures
 * directly: delete the `page.viewport` call and it reads
 * `flex-direction: row`, while every other assertion in it stays green.
 * With the call: `window.innerWidth` 375, `flex-direction: column`, and
 * the grid at three columns of ~103.7px, which is the phone case F2's
 * `compact` density actually gives. It does not leak, and `Boundary` — the
 * next story in this file — is what proves it: its first assertion is that
 * this same shell is back to `flex-direction: row`.
 *
 * **No horizontal scroll anywhere**, asserted on the shell, both scrolling
 * regions, the header and the document. That matters more here than usual: F2's
 * bulk bar is recorded in wave 3 as overflowing at 375px, and this archive's
 * browse mode never mounts it, so the guarantee holds for the view most people
 * are in and is a claim about that view only.
 *
 * **What the phone actually costs, measured.** The rail does not disappear
 * below `md` — deliberately, because a region that vanishes at a breakpoint
 * cannot teach that it exists — it becomes a 224px band above the header
 * (`max-h-56`). With the full facet set that band is a window onto 752px of
 * content: **three and a third band-heights of facets, in a band that is just
 * over a quarter of an 812px fold**, and the archive itself starts below all
 * of it. The shell's docs call this out
 * as costing vertical space; this is the number. A drawer is the alternative
 * and belongs to the host, per the same pitfall.
 */
export const Mobile: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    // Dynamic, not a top-level import: `vitest/browser` throws on evaluation
    // ("can be imported only inside the Browser Mode"), so a static import
    // breaks this whole story file wherever it is evaluated outside the vitest
    // browser runner — the built static Storybook included. Measured in node:
    // `await import("vitest/browser")` rejects with that message. Keeping it
    // inside the play limits the blast radius to this one story.
    const { page } = await import("vitest/browser");
    await page.viewport(375, 812);
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="library-shell"]')!;
    await waitFor(() => expect(getComputedStyle(shell).flexDirection).toBe("column"));
    await expect(window.innerWidth).toBe(375);

    const rail = canvasElement.querySelector<HTMLElement>('[data-region="facet-rail"]')!;
    const header = canvasElement.querySelector<HTMLElement>('[data-region="header"]')!;
    const grid = canvasElement.querySelector<HTMLElement>('[data-region="dense-grid"]')!;

    // Every region is still mounted, in reading order, full width.
    await expect(rail.getBoundingClientRect().width).toBe(375);
    await expect(rail.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      header.getBoundingClientRect().top + 1,
    );

    // The real breakpoint moved: three columns, not the desktop eight.
    const gridEl = grid.querySelector<HTMLElement>('[data-slot="generation-grid-grid"]')!;
    await expect(getComputedStyle(gridEl).gridTemplateColumns.split(" ")).toHaveLength(3);

    // Nothing scrolls sideways.
    for (const el of [shell, rail, header, grid, document.documentElement]) {
      await expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth);
    }

    // The band is short and the facets are long — the cost, stated.
    await expect(rail.getBoundingClientRect().height).toBeLessThanOrEqual(224);
    await expect(rail.scrollHeight).toBeGreaterThan(rail.clientHeight * 3);
  },
};

/**
 * O7 above, O8 `explore-shell` below. They hold the same objects — generated
 * images in a scannable field — and the spec separates them with a derived
 * rule: **two galleries, two jobs.**
 *
 * **Choose O7 when the pile is the reader's own and they came to find one
 * thing they already have.** Every affordance follows from that: counted
 * facets, because the reader knows what they are looking for and wants to know
 * what a filter would leave; a dense grid, because recognition beats browsing
 * when you have seen the image before; and a lightbox that opens on
 * provenance, because the reason to keep an archive is to make something
 * again.
 *
 * **Choose O8 when the pile is everyone's and the reader came to be
 * surprised.** Its feed is masonry rather than a grid, because equal-height
 * rows suppress exactly the surprise it exists for; it docks a prompt bar
 * above the feed so inspiration converts into a generation without navigating;
 * and its two axes are sort and type, not facets, because you cannot count
 * what you have not seen.
 *
 * The tell in one sentence: **a rail of counts means the archive is yours; a
 * prompt bar over the feed means it is not.** Density is the second tell —
 * O7 opens eight-up and lets the reader change it, O8 never offers the control
 * at all.
 *
 * Neither is the right answer for a list of *documents* — that is O9
 * `artifact-shell`, which keys on title and date rather than on the image.
 */
export const Boundary: Story = {
  render: () => (
    <div className="grid h-full grid-rows-2 gap-4 p-4">
      <div className="min-h-0 overflow-hidden rounded-lg border">
        <LibraryShell {...FULL_ARGS} />
      </div>
      <div className="min-h-0 overflow-hidden rounded-lg border">
        <ExploreShell
          rail={[
            { id: "explore", label: "Explore", icon: <Compass /> },
            { id: "organize", label: "Organize", icon: <Images /> },
          ]}
          activeRailId="explore"
          sorts={[
            { value: "new", label: "New" },
            { value: "top", label: "Top" },
          ]}
          defaultSort="new"
          types={[
            { value: "all", label: "All" },
            { value: "image", label: "Images" },
          ]}
          defaultType="all"
          items={[
            { id: "e1", title: "Harbour at dusk", media: swatch("bg-primary/20"), author: "mira" },
            { id: "e2", title: "Neon alley", media: swatch("bg-secondary"), author: "tobias" },
          ]}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const shells = canvasElement.querySelectorAll<HTMLElement>('[data-slot="library-shell"]');
    await expect(shells).toHaveLength(1);
    // Doubles as `Mobile`'s non-leak proof: the story before this one resized
    // the iframe to 375px, and this shell is a desktop row again.
    await expect(getComputedStyle(shells[0]).flexDirection).toBe("row");

    // The tells, asserted so the choosing rule cannot drift from the render.
    // O7 counts its facets; O8 offers no facet rail at all.
    await expect(
      canvasElement.querySelectorAll('[data-slot="filter-panel-facet-count"]').length,
    ).toBeGreaterThan(0);
    // O7 hands the reader the density control; O8 does not have one.
    await expect(within(canvasElement).getByRole("radio", { name: "Small" })).toBeVisible();
    // O8 docks a prompt bar over its feed; O7 has nowhere to type a prompt.
    await expect(canvasElement.querySelector('[data-region="docked-prompt-bar"]')).not.toBeNull();
  },
};
