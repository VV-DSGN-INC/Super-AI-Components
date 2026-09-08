import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";
import { PresetGrid, type PresetGridItem } from "@/registry/super-ai/preset-grid";
import { PreviewTile } from "@/registry/super-ai/preview-tile";
import { RecentGrid } from "@/registry/super-ai/recent-grid";
import { PresetGridDocs } from "@/content/components/preset-grid.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const STYLE_ITEMS: PresetGridItem[] = [
  { id: "anime", label: "Anime" },
  { id: "photoreal", label: "Photoreal" },
  { id: "sketch", label: "Sketch" },
  { id: "watercolor", label: "Watercolor" },
  { id: "claymation", label: "Claymation" },
  { id: "pixel-art", label: "Pixel art" },
];

// Light/mid-tone on purpose: the overlay label always sits on
// `bg-background/80`, so keeping the swatch itself light keeps the blended
// contrast comfortably wide rather than riding the edge of the ratio.
const PALETTE_ITEMS: PresetGridItem[] = [
  { id: "sunset", label: "Sunset orange", color: "#fb923c" },
  { id: "ocean", label: "Ocean blue", color: "#38bdf8" },
  { id: "sage", label: "Sage green", color: "#86efac" },
  { id: "blush", label: "Blush pink", color: "#f9a8d4" },
];

const FILTER_ITEMS: PresetGridItem[] = [
  { id: "vivid", label: "Vivid" },
  { id: "mono", label: "Mono" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
];

const ENVIRONMENT_ITEMS: PresetGridItem[] = [
  { id: "studio", label: "Studio" },
  { id: "outdoor", label: "Outdoor" },
  { id: "night", label: "Night" },
  { id: "golden-hour", label: "Golden hour" },
];

const meta: Meta<typeof PresetGrid> = {
  title: "Super AI/Preset Grid",
  component: PresetGrid,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PresetGridDocs) } },
};

export default meta;
type Story = StoryObj<typeof PresetGrid>;

/**
 * The default content type: rendering styles a run is executed in. Notice
 * that the tiles carry no thumbnail here — the frame's `bg-muted` is standing
 * in for artwork a product would supply — and the grid is still usable,
 * because the overlay label rather than the picture is what names each
 * option. Single-select, so choosing `Sketch` clears `Photoreal` in the same
 * press; the play function pins that both halves move, since a radiogroup
 * that only ever sets and never clears is the failure this state exists to
 * rule out.
 */
export const Style: Story = {
  args: {
    items: STYLE_ITEMS,
    content: "style",
    "aria-label": "Style presets",
    defaultValue: "photoreal",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("radiogroup", { name: "Style presets" })).toBeInTheDocument();
    await expect(canvas.getByRole("radio", { name: "Photoreal" })).toHaveAttribute("aria-checked", "true");

    const sketch = canvas.getByRole("radio", { name: "Sketch" });
    await userEvent.click(sketch);
    await expect(sketch).toHaveAttribute("aria-checked", "true");
    await expect(canvas.getByRole("radio", { name: "Photoreal" })).toHaveAttribute("aria-checked", "false");
  },
};

/**
 * `content="palette"` swaps the children slot for a colour fill and ignores
 * `thumbnail` entirely. The swatch is `aria-hidden`, so the whole of what an
 * assistive-tech or colourblind user receives is the `label` string — which
 * is why `PresetGridItem.label` is typed required while `thumbnail` is not.
 * "Sunset orange" survives that reduction; "Palette 3" would not, and there
 * is no second name source to fall back on.
 */
export const Palette: Story = {
  args: {
    items: PALETTE_ITEMS,
    content: "palette",
    "aria-label": "Colour presets",
    defaultValue: "ocean",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The colour is never the only carrier of meaning — the accessible name
    // says what it is.
    await expect(canvas.getByRole("radio", { name: "Sunset orange" })).toBeInTheDocument();
    await expect(canvas.getByRole("radio", { name: "Ocean blue" })).toHaveAttribute("aria-checked", "true");
  },
};

/**
 * Filters, opening with nothing chosen. No `defaultValue` means every tile
 * reports `aria-checked="false"`, which is the state a radiogroup is
 * genuinely allowed to start in and the one a product hits first. It is also
 * the only one of the four content types here that is a different `items`
 * array and nothing else — same roles, same ring, same overlay label — which
 * is the point the spec makes by refusing a component per content type.
 */
export const Filter: Story = {
  args: {
    items: FILTER_ITEMS,
    content: "filter",
    "aria-label": "Filter presets",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const mono = canvas.getByRole("radio", { name: "Mono" });
    await expect(mono).toHaveAttribute("aria-checked", "false");
    await userEvent.click(mono);
    await expect(mono).toHaveAttribute("aria-checked", "true");
  },
};

/**
 * Environments, and the one state that also flips the API shape: `multiple`
 * moves the root from `radiogroup` to `group`, every tile from `radio` to
 * `checkbox`, and `value`/`onValueChange` from a string to an array — all
 * three together, never just the ring. The play function checks the half a
 * visual review cannot: picking a second environment leaves the first
 * checked, which is exactly what a single-select grid dressed up to look
 * multi-select would get wrong.
 */
export const Environment: Story = {
  args: {
    items: ENVIRONMENT_ITEMS,
    content: "environment",
    "aria-label": "Environment presets",
    multiple: true,
    defaultValue: ["studio"],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("group", { name: "Environment presets" })).toBeInTheDocument();
    await expect(canvas.getByRole("checkbox", { name: "Studio" })).toHaveAttribute("aria-checked", "true");

    const night = canvas.getByRole("checkbox", { name: "Night" });
    await userEvent.click(night);
    // Multi-select: choosing a new preset doesn't clear the existing one.
    await expect(night).toHaveAttribute("aria-checked", "true");
    await expect(canvas.getByRole("checkbox", { name: "Studio" })).toHaveAttribute("aria-checked", "true");
  },
};

/**
 * `visibleCount` collapses the rest behind an overflow affordance that is a
 * tile in the grid rather than a link under it — the spec's reason being that
 * expanding then only appends cells instead of moving anything. `Mobile`
 * measures that claim; this story pins the counting: three radios before, all
 * six after, and the see-more tile gone rather than left behind reading zero.
 *
 * It is a plain `<button>` inside the `radiogroup`, not a radio, so it is not
 * one of the options and never becomes checkable. The trade is recorded in
 * the docs page's screen-reader notes: a non-radio member of a set whose size
 * assistive tech is trying to report.
 */
export const SeeMore: Story = {
  args: {
    items: STYLE_ITEMS,
    content: "style",
    "aria-label": "Style presets",
    visibleCount: 3,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("radio")).toHaveLength(3);

    const seeMore = canvas.getByRole("button", { name: /see more/i });
    await userEvent.click(seeMore);

    await expect(canvas.getAllByRole("radio")).toHaveLength(STYLE_ITEMS.length);
    await expect(canvas.queryByRole("button", { name: /see more/i })).not.toBeInTheDocument();
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this grid meets in a product, as opposed to
 * the four content types above. See docs/design-system/story-conventions.md.
 *
 * All eight are true here, so there are no `case-skip` lines. That follows
 * from the shape rather than from thoroughness: a CSS grid whose flow is
 * direction-dependent, author-supplied labels in every cell, one real
 * `<button>` per tile with its own focus ring, a `value`/`onValueChange`
 * pair a host can genuinely hold, an `animate-pulse` skeleton inherited from
 * A8 through `PresetGridItem.state`, two optional slots that change the
 * accessible name, and two near-twins that put the same A8 tile behind a
 * different verb.
 * ---------------------------------------------------------------------- */

/** 86 characters — a style name a product would really emit, not filler. */
const LONG_LABEL = "Soft-focus watercolour wash on cold-press paper, with bleeding edges and visible grain";
const LONG_SEE_MORE = "Show the remaining watercolour and gouache presets";

const LOADING_ITEMS: PresetGridItem[] = [
  { id: "anime", label: "Anime" },
  { id: "sketch", label: "Sketch", state: "loading" },
  { id: "watercolor", label: "Watercolor", state: "failed" },
];

/**
 * Right-to-left. The grid itself mirrors for free — `grid grid-cols-3 gap-3`
 * carries no physical inline utility, so cell 1 paints at the right edge and
 * the see-more tile, last in DOM order, lands at the visual left where the
 * logical end of the set belongs.
 *
 * What did not mirror for free is the overlay label. Both buttons in
 * `preset-grid.tsx` shipped `text-left`, which a `<button>` needs *some*
 * override for (it centres its text by default) and which pins the label to
 * the visual left in an RTL document while everything around it flips.
 * Swapped in-wave to `text-start` — byte-identical in LTR, so there is
 * nothing to weigh against the RTL correctness. Sanctioned swap class,
 * `CONTINUE.md` §8 "Logical properties".
 *
 * **Recorded, not fixed:** A8's badge slot is pinned `absolute top-2 right-2`,
 * so a badge holds the visual right in RTL while the label beneath it
 * mirrors. That class lives in `preview-tile.tsx`, another component's file,
 * and it is already the last row of §8's sweep table (`right-2` → `end-2`,
 * added 2026-09-05). Cited here rather than filed again, and no badge is
 * rendered in this story so nothing pins the wrong side green.
 */
export const RTL: Story = {
  args: {
    items: STYLE_ITEMS.slice(0, 3),
    content: "style",
    "aria-label": "Style presets",
    defaultValue: "anime",
    visibleCount: 2,
  },
  render: (args) => (
    <div dir="rtl" className="w-full">
      <PresetGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tiles = canvas.getAllByRole("radio");
    const seeMore = canvas.getByRole("button", { name: /see more/i });

    // Mirrored, not merely reordered in the DOM: the first cell paints to the
    // right of the second, and the overflow tile sits left of both.
    await expect(tiles[0].getBoundingClientRect().left).toBeGreaterThan(
      tiles[1].getBoundingClientRect().left,
    );
    await expect(seeMore.getBoundingClientRect().left).toBeLessThan(tiles[1].getBoundingClientRect().left);

    // The label follows the writing direction. Against `text-left` this reads
    // back "left" in both directions, which is the bug the swap removes.
    const label = tiles[0].querySelector<HTMLElement>('[data-slot="preview-tile-label"]')!;
    await expect(getComputedStyle(label).textAlign).toBe("start");
  },
};

/**
 * `prefers-reduced-motion`. One thing in this grid moves, and this component
 * does not own it: `PresetGridItem.state` forwards to A8, whose loading
 * branch is an `animate-pulse` skeleton carrying `motion-reduce:animate-none`.
 * `preset-grid.tsx` has no `animate-*` or `transition-*` class of its own —
 * expanding the grid appends cells with no transition at all — so the branch
 * is inherited rather than restated, and the assertion reads `animationName`
 * back off the live skeleton instead of trusting a class string. A refactor
 * that gave this component its own skeleton would drop the branch and this
 * story would fail; a class-level audit would not notice.
 *
 * **Recorded, not fixed, and it is the interesting half.** Under reduce, the
 * pulse is the *only* thing separating a loading tile from a failed one.
 * A8 paints both on the same `bg-muted` frame, adds no text for either, and
 * `preset-grid` passes no `action` node, so `failed` renders an empty
 * overlay. Stop the animation and the two states are pixel-identical and, as
 * the docs page already records, announce identically too — the motion was
 * carrying meaning on its own. Both tiles are rendered here side by side so
 * the collapse is visible; nothing asserts they are distinguishable, because
 * they are not.
 */
export const ReducedMotion: Story = {
  args: { items: LOADING_ITEMS, content: "style", "aria-label": "Style presets" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const skeleton = canvasElement.querySelector('[data-slot="preview-tile-loading"]');
    await expect(skeleton).not.toBeNull();
    await expect(getComputedStyle(skeleton as Element).animationName).toBe("none");

    // The one thing that survives the state swap: A8 renders the overlay
    // label outside its loading/failed branch, so a tile still has a name
    // while it resolves.
    canvas.getByRole("radio", { name: "Sketch" });
    canvas.getByRole("radio", { name: "Watercolor" });
  },
};

/**
 * Tab traversal across three tiles and the see-more cell. Two facts are
 * load-bearing and only visible here.
 *
 * The overflow affordance is inside the tab sequence, as its last stop —
 * that is what makes "see-more is a tile in the grid" a keyboard claim and
 * not only a layout one. A "Show more" link rendered below the grid would
 * land after whatever else the page put between them.
 *
 * Every cell draws its own `focus-visible:ring-2`, so each stop is visibly
 * focused without any global style, and the closing Tab leaves the grid —
 * nothing here traps focus.
 *
 * **The accepted gap, recorded and not asserted.** There is no roving
 * tabindex: the source says so in a TODO and names A4 `choice-chips` as
 * carrying the same one, so a twelve-preset grid costs twelve stops and the
 * arrow keys a `radiogroup` promises do nothing. This story walks the tab
 * sequence that exists; it does not assert that arrows are inert, because
 * that would pin the gap green.
 *
 * **The defect, likewise recorded.** Activating see-more takes the hidden
 * count to zero, so the control unmounts under the user's own focus and
 * nothing restores it — focus falls to `<body>` at the exact moment three
 * more options appeared. The expansion is driven from the keyboard below to
 * show it is reachable; where focus lands afterwards is left unasserted.
 */
export const KeyboardOrder: Story = {
  args: { items: STYLE_ITEMS, content: "style", "aria-label": "Style presets", visibleCount: 3 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("radiogroup", { name: "Style presets" });
    const stops = Array.from(grid.querySelectorAll<HTMLElement>("button"));

    // Three tiles plus the see-more cell.
    await expect(stops).toHaveLength(4);
    await expect(stops.filter((el) => el.tabIndex === 0)).toHaveLength(4);

    const nameOf = (el: Element | null) =>
      el === null
        ? "nothing"
        : `stop#${stops.indexOf(el as HTMLElement)} [${el.textContent?.trim().slice(0, 24) ?? ""}]`;

    const assertVisiblyFocused = async (el: HTMLElement) => {
      const id = nameOf(el);
      await expect(`${id} focusVisible=${el.matches(":focus-visible")}`).toBe(`${id} focusVisible=true`);
      const style = getComputedStyle(el);
      await expect(`${id} ring=${style.boxShadow !== "none" || style.outlineStyle !== "none"}`).toBe(
        `${id} ring=true`,
      );
    };

    await userEvent.tab();
    await expect(nameOf(document.activeElement)).toBe(nameOf(stops[0]));
    await assertVisiblyFocused(document.activeElement as HTMLElement);

    // One lap, one control per press, no repeats — the sequence is proved
    // rather than counted inside an allowance.
    const seen = new Set<HTMLElement>([document.activeElement as HTMLElement]);
    for (let i = 1; i < stops.length; i += 1) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;
      await expect(`${nameOf(focused)} repeat=${seen.has(focused)}`).toBe(`${nameOf(focused)} repeat=false`);
      await assertVisiblyFocused(focused);
      seen.add(focused);
    }
    await expect(seen.size).toBe(stops.length);

    // …and the last of them is the overflow tile, not a tile of presets.
    await expect(nameOf(document.activeElement)).toBe(nameOf(stops[3]));

    await userEvent.tab();
    await expect(grid.contains(document.activeElement)).toBe(false);

    // The hidden presets are reachable without a pointer.
    stops[3].focus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getAllByRole("radio")).toHaveLength(STYLE_ITEMS.length);
  },
};

/**
 * `value` / `onValueChange` is a real controlled pair, and this host holds it
 * the hard way: it records what the grid asked for and applies it only when
 * told to.
 *
 * In order, that proves clicking a tile does not move the rendered selection
 * on its own; the callback still fires with the item `id` a host needs to
 * apply it; a re-render with an unchanged `value` leaves the grid where it
 * was; and applying the request moves both halves of the radiogroup — the
 * new tile checks *and* the old one clears, which an uncontrolled fallback
 * quietly doing its own thing would also show, so the first two steps are
 * what separate the two.
 *
 * **What is not controllable, and it is a gap.** Expansion is internal state
 * with no `expanded`/`onExpandedChange` pair, and it is one-way: nothing
 * resets it. So a host that swaps `items` on a mounted grid — the natural
 * move, since the four content types are one component with a different
 * array — carries the previous set's expansion into the new one, and
 * `visibleCount` is silently ignored from then on. Recorded rather than
 * pinned; adding the pair is an API decision, not a class swap.
 */
export const Controlled: Story = {
  render: () => <ControlledShell />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sketch = canvas.getByRole("radio", { name: "Sketch" });

    await expect(canvas.getByRole("radio", { name: "Photoreal" })).toHaveAttribute("aria-checked", "true");
    await expect(sketch).toHaveAttribute("aria-checked", "false");

    // 1. Interaction alone does not move the rendered value.
    await userEvent.click(sketch);
    await expect(sketch).toHaveAttribute("aria-checked", "false");
    await expect(canvas.getByRole("radio", { name: "Photoreal" })).toHaveAttribute("aria-checked", "true");

    // 2. …but the callback fired, with the payload a host has to apply.
    await expect(canvas.getByTestId("requested")).toHaveTextContent("sketch");

    // 3. Re-render with an unchanged `value`. Prove the re-render first.
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("1");
    await userEvent.click(canvas.getByRole("button", { name: "Re-render" }));
    await expect(canvas.getByTestId("render-pass")).toHaveTextContent("2");
    await expect(sketch).toHaveAttribute("aria-checked", "false");

    // 4. The payload was sufficient to apply the change, and both halves move.
    await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
    await expect(sketch).toHaveAttribute("aria-checked", "true");
    await expect(canvas.getByRole("radio", { name: "Photoreal" })).toHaveAttribute("aria-checked", "false");
  },
};

function ControlledShell() {
  const [applied, setApplied] = React.useState("photoreal");
  const [requested, setRequested] = React.useState<string | null>(null);
  const [pass, setPass] = React.useState(1);

  return (
    <div className="flex items-start gap-6">
      <div className="w-72">
        <PresetGrid
          aria-label="Style presets"
          items={STYLE_ITEMS.slice(0, 4)}
          content="style"
          value={applied}
          onValueChange={(next) => setRequested(next as string)}
        />
      </div>

      <div className="flex flex-col gap-4 py-1">
        <dl className="text-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt>value prop</dt>
          <dd data-testid="applied">{applied}</dd>
          <dt>last onValueChange</dt>
          <dd data-testid="requested">{requested ?? "—"}</dd>
          <dt>host render pass</dt>
          <dd data-testid="render-pass" className="tabular-nums">
            {pass}
          </dd>
        </dl>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPass((n) => n + 1)}>
            Re-render
          </Button>
          <Button size="sm" disabled={requested === null} onClick={() => requested && setApplied(requested)}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Both optional slots emptied, beside the same grid with one of them filled.
 * `thumbnail` and `badge` are the only slots a caller may omit — `label` is
 * typed required, which is the decision this story exists to explain.
 *
 * With nothing but a label, the tile is still named, and the naming path is
 * worth stating because it is *not* A8's. `preset-grid` renders `PreviewTile`
 * without `onSelect`, so A8's frame collapses to a `<div>` and its whole
 * naming apparatus — `aria-labelledby` for a below-placed label, `frameLabel`
 * for `"none"` — never runs. The name is computed from this component's own
 * button subtree instead. Two consequences: A8's recorded nameless-frame
 * defect cannot reach a preset tile, and `frameLabel` is not an escape hatch
 * a caller could use here.
 *
 * The second grid shows what the badge costs. It sits before the label in
 * A8's frame, so it is read first — "New Anime", the reverse of how the cell
 * reads visually. That is a naming order, not a decoration.
 *
 * **Not rendered, deliberately:** `label=""`. For `palette` content the
 * swatch is `aria-hidden` and for the others a decorative `thumbnail`
 * contributes no text, so an empty label produces a `role="radio"` with no
 * accessible name — an axe `aria-toggle-field-name` violation in a gate that
 * runs at `test: "error"`. Same disposition as `suggestion-chips` and
 * `quote-reply` record for their own required labels: a caller error, and it
 * belongs in the docs page's donts, where it is.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <PresetGrid
        aria-label="Style presets"
        content="style"
        defaultValue="anime"
        items={[
          { id: "anime", label: "Anime" },
          { id: "sketch", label: "Sketch" },
          { id: "watercolor", label: "Watercolor" },
        ]}
      />
      <PresetGrid
        aria-label="Style presets with badges"
        content="style"
        items={[
          { id: "anime", label: "Anime", badge: <span className="text-xs font-medium">New</span> },
          { id: "sketch", label: "Sketch" },
          { id: "watercolor", label: "Watercolor" },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plain = canvas.getByRole("radiogroup", { name: "Style presets" });
    const badged = canvas.getByRole("radiogroup", { name: "Style presets with badges" });

    // No thumbnail, no badge: the label alone names the tile.
    const tile = within(plain).getByRole("radio", { name: "Anime" });

    // …and the target is the whole cell. The icon-sized hit area EmptyLabel
    // usually finds cannot happen here — WCAG 2.2's 24×24 floor is not close.
    const rect = tile.getBoundingClientRect();
    await expect(rect.width).toBeGreaterThan(24);
    await expect(rect.height).toBeGreaterThan(24);

    // The badge is the one optional slot that changes the name, and it lands
    // in front of it.
    within(badged).getByRole("radio", { name: "New Anime" });
  },
};

/**
 * An 86-character preset name, and the component gives it two different
 * answers depending on which cell it lands in.
 *
 * In a tile it truncates. A8's overlay label is `absolute inset-x-0 bottom-0
 * truncate`, so the string is clipped to one line with an ellipsis and — the
 * part that matters for a grid — costs no height at all. The long tile is
 * exactly as tall as its short neighbour, which is the whole of the spec's
 * "labels overlay the thumbnail so a dense grid stays a grid". A
 * `labelPlacement="below"` grid, which is what C4 `recent-grid` uses, would
 * have grown that one row.
 *
 * In the see-more cell it wraps instead: that label is a plain `<span>` in a
 * centred column with no `truncate`. The cell cannot grow — A8's frame is
 * `aspect-square overflow-hidden` — so a long `seeMoreLabel` is cut off mid-
 * phrase with no ellipsis saying anything was lost. The default is "See
 * more", so this is a caller-error shape rather than a shipped one; the
 * assertion below pins the two opposite decisions rather than the clipping.
 *
 * Truncation is visual in both cases: the accessible name is the whole
 * string, which is how `getByRole` finds it at full length below.
 */
export const LongContent: Story = {
  args: {
    items: [
      { id: "watercolor", label: LONG_LABEL },
      { id: "anime", label: "Anime" },
      { id: "sketch", label: "Sketch" },
    ],
    content: "style",
    "aria-label": "Style presets",
    visibleCount: 2,
    seeMoreLabel: LONG_SEE_MORE,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The name is the whole string — nothing about truncation reaches it.
    const long = canvas.getByRole("radio", { name: LONG_LABEL });
    const label = long.querySelector<HTMLElement>('[data-slot="preview-tile-label"]')!;
    const labelStyle = getComputedStyle(label);
    await expect(labelStyle.whiteSpace).toBe("nowrap");
    await expect(labelStyle.textOverflow).toBe("ellipsis");
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);

    // Overlay costs no height: the long cell is the height of the short one.
    const short = canvas.getByRole("radio", { name: "Anime" });
    await expect(long.getBoundingClientRect().height).toBeCloseTo(short.getBoundingClientRect().height, 1);

    // The see-more label takes the opposite decision — wrap, not truncate —
    // inside a cell that is exactly as tall as every other.
    const seeMore = canvasElement.querySelector<HTMLElement>('[data-slot="preset-grid-see-more"]')!;
    const seeMoreLabel = seeMore.querySelector<HTMLElement>("span:not(.sr-only)")!;
    const seeMoreStyle = getComputedStyle(seeMoreLabel);
    await expect(seeMoreStyle.whiteSpace).toBe("normal");
    await expect(seeMoreStyle.textOverflow).toBe("clip");
    await expect(seeMore.getBoundingClientRect().height).toBeCloseTo(short.getBoundingClientRect().height, 1);
  },
};

/**
 * 375px, with the see-more cell in play. Nothing scrolls sideways: the grid
 * is a fixed column count with `gap-3`, so cells shrink rather than the row
 * overflowing.
 *
 * This is also where the spec's geometry claim is either true or is not, and
 * it is true — expanding appends cells and moves nothing that was already on
 * screen. Offsets are measured relative to the grid rather than the viewport
 * on purpose: `layout: "centered"` re-centres the whole story as the grid
 * grows a row taller, and that vertical shift is the page moving, not the
 * grid reflowing. A "Show more" link below the grid would have produced the
 * same page shift *plus* a real reflow, which is the difference the spec is
 * making and the reason the affordance is a tile.
 *
 * One caveat worth having written down, because it is a property of the gate
 * rather than of the component: a wrapper constrains width but not the
 * breakpoint, and `vitest.config.ts` runs headless chromium at its own
 * size, so `sm:grid-cols-4` still applies here. This story therefore renders
 * the *narrower* four-column case; a real 375px viewport gets three columns
 * and wider cells. The no-reflow claim holds either way — the see-more cell
 * is replaced in place by the next preset — but the column count below is
 * the test environment's, not a phone's.
 */
export const Mobile: Story = {
  args: { items: STYLE_ITEMS, content: "style", "aria-label": "Style presets", visibleCount: 3 },
  render: (args) => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <PresetGrid {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByTestId("viewport");
    const grid = canvas.getByRole("radiogroup", { name: "Style presets" });

    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
    await expect(getComputedStyle(grid).gridTemplateColumns.split(" ")).toHaveLength(4);

    const geometry = () => {
      const g = grid.getBoundingClientRect();
      return canvas.getAllByRole("radio").map((tile) => {
        const r = tile.getBoundingClientRect();
        return [r.left - g.left, r.top - g.top, r.width, r.height].map((n) => n.toFixed(2)).join(",");
      });
    };

    const before = geometry();
    await expect(before).toHaveLength(3);

    await userEvent.click(canvas.getByRole("button", { name: /see more/i }));

    const after = geometry();
    await expect(after).toHaveLength(STYLE_ITEMS.length);
    await expect(after.slice(0, before.length)).toEqual(before);
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
  },
};

/**
 * The confusable pair first. `component-specs.md` says A4's `preview-content`
 * chip "embeds A8 — this is the seam where A4 and E4 meet", and the middle
 * row is that shape: a `ChoiceChip` whose child is a `PreviewTile`. It is a
 * composition at the call site rather than a variant of the component, so
 * grepping `choice-chips.tsx` for A8 finds nothing and the seam is invisible
 * outside a story. Both rows are radiogroups of ring-selected tiles, and a
 * screenshot of either could be the other.
 *
 * Three things separate them, and all three are structural:
 *
 * - **Label placement.** E4 pins `overlay`, A4's shape uses `below`. That is
 *   the whole density argument: an overlay label costs no height, so the grid
 *   stays a grid as the set grows; a below label makes every cell taller.
 * - **Layout.** E4 is a CSS grid with a fixed column count and an in-grid
 *   see-more; A4 is `flex flex-wrap`, which has no overflow story at all.
 * - **Multi-select.** Only E4 has it. `ChoiceChips` is single-select in the
 *   source, so a set of presets that can combine has exactly one home here.
 *
 * The rule that falls out: a handful of options that fit on one wrapping row
 * is chips; a set you scan rather than read is a grid.
 *
 * **Recent grid is the other near-twin, and it fails a different test.** Same
 * A8 frame again, but `selectMode="open"` and no pressed state — the tile
 * holds no value, it navigates. If the press opens something that already
 * exists rather than setting a parameter for the next run, neither of the
 * first two is right.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          E4 preset grid — overlay labels, fixed columns, multi-select capable
        </p>
        <PresetGrid aria-label="Style presets" items={STYLE_ITEMS.slice(0, 4)} defaultValue="photoreal" />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          A4 choice chips, preview-content — labels below, one wrapping row
        </p>
        <ChoiceChips aria-label="Style" className="gap-3" defaultValue="photoreal">
          {STYLE_ITEMS.slice(0, 4).map(({ id, label }) => (
            <ChoiceChip key={id} value={id} className="p-1.5">
              <PreviewTile aspect="square" label={label} labelPlacement="below" className="w-16">
                <span aria-hidden className="bg-primary/15 block h-full w-full" />
              </PreviewTile>
            </ChoiceChip>
          ))}
        </ChoiceChips>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          C4 recent grid — the same tile, but it opens something
        </p>
        <RecentGrid
          items={[
            { id: "poster", title: "Tour poster v3", editedAgo: "Edited 19 hours ago", onOpen: () => {} },
            {
              id: "loop",
              title: "Title loop",
              durationLabel: "0:12",
              editedAgo: "Edited 2 days ago",
              onOpen: () => {},
            },
          ]}
        />
      </section>
    </div>
  ),
};
