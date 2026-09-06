import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { FrameStrip, type FrameStripItem, type FrameStripMarks } from "@/registry/super-ai/frame-strip";
import { ReferenceStrip } from "@/registry/super-ai/reference-strip";
import { TrackLane } from "@/registry/super-ai/track-lane";
import { FrameStripDocs } from "@/content/components/frame-strip.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { settledFocusRing } from "@/lib/focus-ring";

const FRAMES: FrameStripItem[] = ["00:00:00", "00:00:04", "00:00:08", "00:00:12", "00:00:16"].map(
  (timecode, index) => ({
    id: `f${index + 1}`,
    label: timecode,
    thumbnail: (
      <img src={`https://placehold.co/320x180?text=${index + 1}`} alt="" className="h-full w-full object-cover" />
    ),
  }),
);

const PAGES: FrameStripItem[] = ["1. Title", "2. Problem", "3. Approach", "4. Results"].map((label, index) => ({
  id: `p${index + 1}`,
  label,
  thumbnail: (
    <img src={`https://placehold.co/320x180?text=${index + 1}`} alt="" className="h-full w-full object-cover" />
  ),
}));

const ARTBOARDS: FrameStripItem[] = ["Hero", "Pricing", "Footer"].map((label, index) => ({
  id: `a${index + 1}`,
  label,
  thumbnail: <img src={`https://placehold.co/320x320?text=${label}`} alt="" className="h-full w-full object-cover" />,
}));

const meta: Meta<typeof FrameStrip> = {
  title: "Super AI/Frame Strip",
  component: FrameStrip,
  parameters: { layout: "centered", docs: { page: componentDocsPage(FrameStripDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[36rem] max-w-full px-12">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FrameStrip>;

/**
 * The video case: five timecoded frames, one of them current. Watch what
 * carries "current" — `aria-current` on the frame button, with the ring as the
 * visual echo rather than the only signal. Clicking a frame moves the
 * selection and nothing else: focus stays where it was, and because the ring
 * is a box-shadow no neighbour shifts, which is the geometry the spec asks for.
 */
export const VideoFrames: Story = {
  args: {
    kind: "video",
    items: FRAMES,
    defaultValue: "f2",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Timecodes are the tiles' accessible names, and the active one is
    // programmatic — never the ring alone.
    await expect(canvas.getByRole("button", { name: "00:00:04" })).toHaveAttribute("aria-current", "true");
    await userEvent.click(canvas.getByRole("button", { name: "00:00:12" }));
    await expect(canvas.getByRole("button", { name: "00:00:12" })).toHaveAttribute("aria-current", "true");
  },
};

/**
 * The deck case, and the point is how little changes: `kind="slides"` swaps the
 * tile aspect and the words on the add tile, and selection behaves exactly as
 * it does for video. Notice the add tile sits in the strip rather than beside
 * it — same cell geometry as a page, so appending is part of the same row a
 * reader is already scanning.
 */
export const SlidePages: Story = {
  args: {
    kind: "slides",
    items: PAGES,
    defaultValue: "p1",
    onAdd: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Same component, same behaviour — only the tile contents differ.
    await userEvent.click(canvas.getByRole("button", { name: "3. Approach" }));
    await expect(canvas.getByRole("button", { name: "3. Approach" })).toHaveAttribute("aria-current", "true");
    await expect(canvas.getByRole("button", { name: /add page/i })).toBeInTheDocument();
  },
};

/**
 * Picking a range instead of a position. Two things separate this from the
 * `select` variant: the marks are words in the badge corner ("In", "Out") so
 * they survive a colourblind reader and a screen reader alike, and the frame
 * itself stops being a control — the two toggles beneath it own the
 * interaction, because a clickable frame plus two toggles would be two answers
 * to one question. The pair is also ordered: setting an in point past the out
 * point clears the far mark rather than keeping a range downstream
 * conditioning cannot use.
 */
export const InOutPicker: Story = {
  args: {
    kind: "video",
    variant: "in-out",
    items: FRAMES,
    defaultInPoint: "f2",
    defaultOutPoint: "f4",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Two marks, each named in words rather than by colour.
    await expect(canvas.getByRole("button", { name: /in point at 00:00:04/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(canvas.getByRole("button", { name: /out point at 00:00:12/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(canvasElement.querySelectorAll('[data-slot="frame-strip-mark"]')).toHaveLength(2);
  },
};

/**
 * Passing `onReorder` turns on the per-item move controls, and this is the
 * state where the strip grows a second row: the controls row is rendered with
 * its height reserved whether or not the controls are visible, so revealing
 * them on hover cannot move anything. They are hidden with `opacity-0` rather
 * than `display:none` precisely so they stay in the tab order — see
 * `KeyboardOrder`, which walks them.
 *
 * The move at each end of the strip is `disabled`, which is also where this
 * state's known defect lives: moving an item to index 0 disables the button
 * under the cursor and focus is dropped. Described in `KeyboardOrder` and
 * asserted nowhere, because the repair is focus management rather than a class.
 */
export const Reorder: Story = {
  args: {
    kind: "artboards",
    items: ARTBOARDS,
    defaultValue: "a1",
    onReorder: () => {},
    onAdd: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Hover-revealed but keyboard-reachable: the controls are in the tab
    // order and disabled only at the ends of the strip.
    await expect(canvas.getByRole("button", { name: /move hero left/i })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: /move pricing right/i }));
    await expect(canvas.getByRole("button", { name: /add artboard/i })).toBeInTheDocument();
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this strip meets in a product, as opposed to
 * the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * All eight are written, so there are no case-skip lines. Each is true for a
 * reason rather than to complete the set: the strip inherits a physical gutter
 * and physical chevrons from the vendored Carousel and adds two more of its
 * own (`RTL`); an item can be `state: "loading"`, which reaches A8's pulsing
 * skeleton (`ReducedMotion`); a reorderable frame is three tab stops
 * (`KeyboardOrder`); `value`/`onValueChange` and `inPoint`/`outPoint`/
 * `onInOutChange` are two controlled pairs (`Controlled`); `addLabel` is
 * optional and an item's `label` is emptiable (`EmptyLabel`); that label is
 * author-supplied and lands in a 144px cell (`LongContent`); and three
 * catalog neighbours are built from the same tiles (`Boundary`). `Mobile` is
 * always written.
 * ---------------------------------------------------------------------- */

/**
 * The same strip under `dir="ltr"` and `dir="rtl"`, because "it mirrors" is
 * only checkable against the thing it mirrors. One half of the strip does
 * mirror and four things do not.
 *
 * **Mirrors, and it is asserted below.** The In/Out mark sits in A8
 * `preview-tile`'s badge corner, which is `absolute top-2 end-2` — a logical
 * inset since the wave-3 sweep that moved it off `right-2`. Measured here: the
 * badge's inset from the tile's inline-end edge is 8px in both directions, so
 * the mark follows the reading direction rather than the viewport. A8's
 * overlay label is `inset-x-0`, so it is direction-agnostic by construction.
 *
 * **Does not mirror, recorded rather than fixed.** Three of the four are the
 * vendored `components/ui/carousel.tsx`, already recorded against C3
 * `feature-card-row` and D2 `reference-strip`: Embla's `direction` option
 * defaults to `'ltr'` and is never set from the document, so the tween
 * arithmetic counts one way while the flex row lays cells out the other; the
 * gutter is compensated physically (`-ml-4` on the content, `pl-4` on each
 * cell); and previous/next are pinned by physical class — this component
 * overrides the vendored offsets to `left-2`/`right-2`, so "previous" stays on
 * the left, which under RTL is the side the *next* frame arrives from. The
 * physical→logical swap is *not* taken here, and F5 `compare-viewer` is why:
 * the swap is safe only when every participant in the layout is a class, and
 * here the other participant is Embla's LTR axis in JavaScript. Swapping the
 * two classes alone would put "previous" on the side that scrolls forward.
 *
 * The fourth is this component's own and is the shape wave 1 recorded on D2:
 * the reorder controls are named and iconed by *physical* direction. "Move
 * 00:00:04 left" carries a `ChevronLeft` and calls `onReorder(id, "left")`,
 * which means "toward index 0" — and index 0 renders on the **right** here.
 * The array semantics stay correct; the label and the icon mislead. It is a
 * rename of a public callback's argument (`"start" | "end"`, or an index
 * delta), so it is an API decision rather than a class swap, and nothing below
 * asserts it.
 *
 * **And a defect this story is the first to hit, because it is the first to
 * render two strips at once.** The root is a `role="region"` named from `kind`
 * alone — "Frames", "Pages", "Artboards" — so two strips of the same kind on
 * one page are two landmarks with the same role and the same accessible name,
 * which is an axe `landmark-unique` violation. It failed this story and
 * `Controlled` outright before each strip was given its own `aria-label`. The
 * escape hatch does work: props spread after the internal `aria-label`, so a
 * caller can name a strip whatever it likes. Nothing in the component or its
 * docs page says a caller has to, and the surfaces most likely to need two —
 * a comparison view, a shot list beside its deck — are exactly the ones that
 * would ship it unnoticed.
 */
export const RTL: Story = {
  render: () => {
    const items = FRAMES.slice(0, 3);
    return (
      <div className="flex w-[26rem] max-w-full flex-col gap-6">
        <section className="flex flex-col gap-2" dir="ltr" data-testid="ltr">
          <p className="text-foreground text-xs font-medium">dir=&quot;ltr&quot;</p>
          <FrameStrip
            aria-label="Frames, left to right"
            kind="video"
            variant="in-out"
            items={items}
            defaultInPoint="f1"
            onReorder={() => {}}
          />
        </section>
        <section className="flex flex-col gap-2" dir="rtl" data-testid="rtl">
          <p className="text-foreground text-xs font-medium">dir=&quot;rtl&quot;</p>
          <FrameStrip
            aria-label="Frames, right to left"
            kind="video"
            variant="in-out"
            items={items}
            defaultInPoint="f1"
            onReorder={() => {}}
          />
        </section>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const endInset = (testId: string) => {
      const root = canvasElement.querySelector<HTMLElement>(`[data-testid="${testId}"]`)!;
      const badge = root.querySelector<HTMLElement>('[data-slot="preview-tile-badge"]')!;
      const frame = badge.closest<HTMLElement>('[data-slot="preview-tile-frame"]')!;
      const badgeBox = badge.getBoundingClientRect();
      const frameBox = frame.getBoundingClientRect();
      return root.dir === "rtl"
        ? { fromEnd: badgeBox.left - frameBox.left, fromStart: frameBox.right - badgeBox.right }
        : { fromEnd: frameBox.right - badgeBox.right, fromStart: badgeBox.left - frameBox.left };
    };

    const ltr = endInset("ltr");
    const rtl = endInset("rtl");
    // The mark is 8px from the inline-end edge in both directions — it moved
    // with the reading direction rather than staying on one side of the
    // viewport. A half-swept `right-2` would fail this in the RTL half.
    await expect(Math.round(ltr.fromEnd)).toBe(8);
    await expect(Math.round(rtl.fromEnd)).toBe(8);
    await expect(rtl.fromStart).toBeGreaterThan(rtl.fromEnd);

    // The premise under the reorder finding, measured rather than reasoned:
    // the flex row mirrors, so index 0 is the *rightmost* cell here. That is
    // what makes "Move 00:00:00 left" move a frame to the right.
    const cellLefts = (testId: string) =>
      Array.from(
        canvasElement.querySelectorAll<HTMLElement>(`[data-testid="${testId}"] [data-slot="frame-strip-item"]`),
      ).map((cell) => cell.getBoundingClientRect().left);
    const ltrCells = cellLefts("ltr");
    const rtlCells = cellLefts("rtl");
    await expect(ltrCells[0]).toBeLessThan(ltrCells[ltrCells.length - 1]);
    await expect(rtlCells[0]).toBeGreaterThan(rtlCells[rtlCells.length - 1]);
  },
};

/**
 * A frame still rendering. `FrameStripItem.state` is this component's own API,
 * so a caller can put a pulsing skeleton in the strip, and the branch that
 * suppresses it is A8 `preview-tile`'s `motion-reduce:animate-none` —
 * inherited, not restated here. The assertion reads `animationName` back off
 * the skeleton rather than trusting a class string, so it fails if the strip
 * ever grows a skeleton of its own, which is the plausible refactor and the
 * one that would silently drop the branch.
 *
 * Three things in this tree move and none of them branches, so they are
 * described rather than suppressed:
 *
 * - The scroll. Embla tweens `transform: translate3d(...)` from JavaScript, so
 *   there is no `animate-*` to cancel and no `transition-*` on the translated
 *   element. Honouring the media feature there means branching `opts.duration`
 *   to 0, which is behavioural and belongs to the shared carousel. Same
 *   finding and same disposition as C3 and D2.
 * - The reorder reveal is `transition-opacity`: a crossfade, which moves
 *   nothing. `motion-reduce:transition-none` is for a transition a user
 *   perceives as motion (the convention's mechanical fact 3), so adding it
 *   here would document no branch — the `reset-affordance` reasoning.
 * - The vendored `Button`'s press nudge (`transition-all` plus
 *   `active:translate-y-px`) reaches every control in this strip and has no
 *   reduced-motion branch. That is a primitive-wide posture recorded in
 *   CONTINUE.md §8, not this component's to fix at one call site.
 *
 * **A measurement that settles an open disagreement, and it is about the gate
 * rather than this component.** F6 `render-queue` records that the browser run
 * injects `*, *:before, *:after { transition: none !important }`, defeating
 * every Tailwind `transition-*`; CONTINUE.md §9's wave 3 entry records that
 * claim as checked and refuted, measuring `transition-property: all` at
 * `0.15s` on a plain vendored `Button`. Both are right, and the missing
 * variable is **whether an earlier story in the same file already failed**.
 * Measured here on this strip's own move control, which carries
 * `transition-all`: in a run where `RTL` failed first, the document holds an
 * injected 185-character `<style>` — `animation-delay: 0s`,
 * `animation-direction: reverse`, `animation-play-state: paused`,
 * `transition: none`, all `!important` — and the button reads `none` / `0s`;
 * with that failure fixed and nothing else changed, the style is absent and
 * the same button reads `all` / `0.15s`. It is Playwright's
 * animations-disabled CSS, left behind by the screenshot Vitest takes on
 * failure, and unlayered `!important` beats every utility. So a transition
 * assertion is vacuous exactly while you are iterating on a red file — which
 * is when it is being written. Animation assertions are unaffected:
 * `animation-name` is not in that block, which is why the one above is real.
 */
export const ReducedMotion: Story = {
  args: {
    kind: "video",
    items: [FRAMES[0], { ...FRAMES[1], state: "loading" as const }, FRAMES[2]],
    defaultValue: "f1",
    onReorder: () => {},
  },
  play: async ({ canvasElement }) => {
    const skeleton = canvasElement.querySelector<HTMLElement>(
      '[data-slot="frame-strip-item"] [data-slot="preview-tile-loading"]',
    );
    await expect(skeleton).not.toBeNull();
    await expect(getComputedStyle(skeleton!).animationName).toBe("none");

    // The class is still on the element, so this is the branch rather than its
    // absence — the `render-queue` idiom.
    const skeletonClass = skeleton!.getAttribute("class") ?? "";
    await expect(skeletonClass).toContain("animate-pulse");

    // The reveal is a crossfade rather than motion, and it is deliberately
    // left running: `transition-opacity` is what the wrapper carries, and it
    // is what a reduced-motion user still gets.
    const controls = canvasElement.querySelector<HTMLElement>(
      '[data-slot="frame-strip-controls"] > div:last-child',
    )!;
    await expect(controls.className).toContain("transition-opacity");
    await expect(getComputedStyle(controls).opacity).toBe("0");
  },
};

/**
 * Three reorderable artboards, at a width where the strip cannot scroll — so
 * previous and next are `disabled` and drop out of the traversal, and what is
 * left is the per-frame cost. The stop count is asymmetric: two on the first
 * artboard, three on the middle one, two on the last, because a move is
 * `disabled` at each end of the array and a disabled button is not a stop.
 * Seven stops for three frames, which is the arithmetic the docs page asks
 * callers to do before shipping a long strip.
 *
 * Two contracts are asserted here that the component would otherwise only
 * claim. The move controls are `opacity-0` until hover, so focus has to reveal
 * them or a keyboard user is aiming at nothing — the opacity is waited for
 * rather than read once, because their wrapper carries `transition-opacity`
 * and the read on the frame focus lands is still mid-fade. And Left and Right
 * are captured at the strip root and `preventDefault`ed, so they scroll and
 * never move selection or focus; the assertion is that `aria-current` and
 * `document.activeElement` both survive an ArrowRight.
 *
 * Focus visibility uses `settledFocusRing`, not the older
 * `boxShadow !== "none"` string check — Tailwind's ring composes shadow layers
 * that are present but transparent when the ring is off, so the string check
 * passes on an element painting nothing.
 *
 * **Not asserted, and a real defect.** Pressing the last enabled move on an
 * artboard walks it to an end of the strip, and that button becomes
 * `disabled` under the cursor; a focused element that becomes disabled is
 * blurred, so focus drops to `<body>` mid-reorder. The repair is for
 * `onReorder` to hand focus to the sibling control, which is focus management
 * — recorded, not pinned. Identical to D2 `reference-strip`'s finding, on
 * identical controls.
 */
export const KeyboardOrder: Story = {
  args: {
    kind: "artboards",
    items: ARTBOARDS,
    defaultValue: "a1",
    onReorder: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Nothing to scroll at this width, so both affordances are inert and out
    // of the tab order — the asymmetry below is the whole traversal.
    await expect(canvas.getByRole("button", { name: "Previous slide" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Next slide" })).toBeDisabled();

    // Two, three, two: the ends lose the move they cannot make.
    const moves = Array.from(canvasElement.querySelectorAll<HTMLButtonElement>('[data-slot="frame-strip-move"]'));
    await expect(moves).toHaveLength(6);
    await expect(moves[0]).toBeDisabled();
    await expect(moves[moves.length - 1]).toBeDisabled();

    const stops = Array.from(canvasElement.querySelectorAll<HTMLElement>("button:not([disabled])"));
    await expect(stops).toHaveLength(7);
    await expect(stops[0]).toHaveAttribute("data-slot", "frame-strip-frame");
    await expect(stops[1]).toHaveAttribute("data-slot", "frame-strip-move");

    // One lap: every stop is new, and every stop paints something.
    const seen = new Set<Element>();
    await userEvent.tab();
    for (const stop of stops) {
      await expect(document.activeElement).toBe(stop);
      await expect(seen.has(stop)).toBe(false);
      seen.add(stop);
      await expect(stop.matches(":focus-visible")).toBe(true);
      await settledFocusRing(stop, waitFor);
      // A move control is `opacity-0` until hover or focus-within, and the
      // wrapper crossfades it over 150ms — so this is waited for rather than
      // read once.
      if (stop.dataset.slot === "frame-strip-move") {
        await waitFor(() => expect(getComputedStyle(stop.parentElement!).opacity).toBe("1"));
      }
      await userEvent.tab();
    }

    // Nothing traps: the stop after the last one is outside the strip.
    await expect(canvasElement.contains(document.activeElement)).toBe(false);

    // Left and Right belong to the scroller, not to the selection.
    const pricing = canvas.getByRole("button", { name: "Pricing" });
    pricing.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(document.activeElement).toBe(pricing);
    await expect(canvas.getByRole("button", { name: "Hero" })).toHaveAttribute("aria-current", "true");
    await expect(pricing).not.toHaveAttribute("aria-current");
  },
};

/** A host that owns the current frame and refuses to move to one that has not rendered yet. */
function ControlledSelection() {
  const items: FrameStripItem[] = FRAMES.slice(0, 4).map((item, index) =>
    index === 2 ? { ...item, state: "loading" as const } : item,
  );
  const [current, setCurrent] = React.useState("f1");
  const [requests, setRequests] = React.useState<string[]>([]);

  return (
    <section className="flex flex-col gap-2">
      <p className="text-foreground text-xs font-medium">value / onValueChange</p>
      <FrameStrip
        aria-label="Frames, host-controlled selection"
        kind="video"
        items={items}
        value={current}
        onValueChange={(id) => {
          setRequests((log) => [...log, id]);
          // A frame that has not finished rendering cannot be scrubbed to.
          if (items.find((item) => item.id === id)?.state === "loading") return;
          setCurrent(id);
        }}
      />
      <p className="text-foreground text-xs">{`Requested ${requests.length} · showing ${current}`}</p>
    </section>
  );
}

/** A host that controls the in point only — and applies nothing it is handed. */
function ControlledMarks() {
  const [last, setLast] = React.useState<FrameStripMarks>({});
  return (
    <section className="flex flex-col gap-2">
      <p className="text-foreground text-xs font-medium">inPoint only / onInOutChange</p>
      <FrameStrip
        aria-label="Frames, host-controlled in point"
        kind="video"
        variant="in-out"
        items={FRAMES.slice(0, 3)}
        inPoint="f1"
        onInOutChange={setLast}
      />
      <p className="text-foreground text-xs">{`Last change in=${last.inPoint ?? "—"} out=${last.outPoint ?? "—"}`}</p>
    </section>
  );
}

/**
 * Two controlled pairs, and the second one has a trap in it.
 *
 * **`value` / `onValueChange`.** The host here refuses to scrub to a frame
 * that is still rendering, which is a real constraint rather than a
 * contrivance. Three things follow, in the order the play function takes
 * them: a refused click fires the callback with the id a caller needs and
 * leaves `aria-current` where it was; an accepted one moves the strip only
 * because the host applied it; and clicking the frame that is already current
 * re-renders with an unchanged `value` and changes nothing, which is the half
 * of "controlled" that a component holding a shadow copy would fail.
 *
 * **`inPoint` / `outPoint` / `onInOutChange`, and the trap.** The component
 * decides the pair is controlled if *either* mark is supplied
 * (`inPointProp !== undefined || outPointProp !== undefined`). So a host that
 * controls the in point and leaves the out point to the component has in fact
 * taken both: pressing Out fires `onInOutChange` with the pair a caller needs,
 * and no Out mark renders until that host applies it. Asserted below, because
 * it is correct controlled behaviour — but it is silent, and the natural
 * reading of two separate props is that they can be controlled separately.
 * Worth a sentence in the docs; not a defect to fix here.
 *
 * Both strips here carry an explicit `aria-label`, for the reason `RTL`
 * records: the default region name comes from `kind`, so two video strips on
 * one page are two identically named landmarks and axe fails the story.
 */
export const Controlled: Story = {
  render: () => (
    <div className="flex w-[26rem] max-w-full flex-col gap-8">
      <ControlledSelection />
      <ControlledMarks />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const current = () =>
      canvasElement.querySelector<HTMLElement>('[data-slot="frame-strip-frame"][aria-current="true"]')?.textContent;

    await expect(current()).toBe("00:00:00");

    // Refused: the callback fires with the payload, the rendering holds.
    await userEvent.click(canvas.getByRole("button", { name: "00:00:08" }));
    await expect(canvas.getByText(/Requested 1 · showing f1/)).toBeInTheDocument();
    await expect(current()).toBe("00:00:00");

    // Applied: the strip moves only because the host moved it.
    await userEvent.click(canvas.getByRole("button", { name: "00:00:04" }));
    await expect(canvas.getByText(/Requested 2 · showing f2/)).toBeInTheDocument();
    await expect(current()).toBe("00:00:04");

    // Re-rendered with an unchanged `value`: nothing moves.
    await userEvent.click(canvas.getByRole("button", { name: "00:00:04" }));
    await expect(canvas.getByText(/Requested 3 · showing f2/)).toBeInTheDocument();
    await expect(current()).toBe("00:00:04");

    // The in point is controlled, so the out point is too — even though the
    // host never passed one.
    await expect(canvasElement.querySelectorAll('[data-mark="in"]')).toHaveLength(1);
    await userEvent.click(canvas.getByRole("button", { name: /out point at 00:00:08/i }));
    await expect(canvas.getByText(/Last change in=f1 out=f3/)).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('[data-mark="out"]')).toHaveLength(0);
  },
};

/**
 * Two of the three frames carry `label=""`. The label is typed as required
 * because it is the tile's accessible name, but an empty string satisfies the
 * type, and a strip built from a file listing will hit it the first time a
 * frame has no timecode.
 *
 * What renders: A8 drops the overlay band entirely rather than painting an
 * empty one, so the tiles keep their geometry and one label band survives out
 * of three — asserted below. What announces is the sharp edge. The In and Out
 * toggles build their names as `In point at {label}`, so an unlabelled frame
 * gives "In point at" with nothing after it. Measured on this story's own
 * tree: the six toggles carry "In point at 00:00:00", "Out point at
 * 00:00:00", then "In point at" and "Out point at" twice each — four controls
 * on two names. A screen-reader user cannot tell
 * which frame either pair belongs to, in exactly the configuration where the
 * tiles carry no visible text either. That is the per-row naming shape
 * CONTINUE.md §8 has now recorded on `property-inspector`, `context-chips`
 * and `result-card`; the play function pins the half that is unambiguously
 * right — no control ships unnamed — and leaves the collision described,
 * because the repair (an index, or requiring a label) would rightly break an
 * assertion that expected the duplicates.
 *
 * The `select` variant is deliberately not shown here. There the frame is a
 * `<button>` whose only name source is the overlay label, so `label=""` ships
 * an axe `button-name` violation into a gate that runs at `test: "error"` —
 * and the same is true of `addLabel=""`, which empties the add tile's only
 * text node. Both are caller errors that belong in the docs page's donts,
 * where the second one already is; rendering either here would fail the gate
 * rather than document anything.
 */
export const EmptyLabel: Story = {
  args: {
    kind: "video",
    variant: "in-out",
    items: [FRAMES[0], { ...FRAMES[1], label: "" }, { ...FRAMES[2], label: "" }],
    defaultInPoint: "f1",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Three tiles, one label band: the empty label is absent, not blank.
    await expect(canvasElement.querySelectorAll('[data-slot="preview-tile-frame"]')).toHaveLength(3);
    await expect(canvasElement.querySelectorAll('[data-slot="preview-tile-label"]')).toHaveLength(1);

    // Nothing ships unnamed, which is the half that holds.
    const all = canvas.getAllByRole("button");
    const named = canvas.getAllByRole("button", { name: /\S/ });
    await expect(named).toHaveLength(all.length);
  },
};

/**
 * An artboard name of 84 characters in a 144px cell. The decision the
 * component makes is truncate, not wrap and not scroll: A8's overlay band is
 * `truncate`, so the long name is clipped to one line and the cell keeps the
 * width every other cell has — asserted both ways below, because "it
 * truncates" and "it does not widen its neighbour" are different claims and
 * only the second one protects the strip's geometry.
 *
 * Two things a reader should notice. The accessible name is the *whole*
 * label, so a screen-reader user gets what a sighted user cannot see; and
 * there is no `title`, so a mouse user has no way to recover the rest. The
 * same missing-`title` shape wave 1 recorded on D3 `context-chips`' truncated
 * label.
 *
 * The measurement worth keeping is the other one. `frame-strip.tsx` overrides
 * the vendored arrow offsets to `left-2`/`right-2` and its own comment argues
 * that the vertically-centred arrow clears A8's label band "narrowly, not with
 * room to spare", and that passing `onReorder` shrinks the clearance further
 * because the arrow re-centres on a taller cell. This story is that
 * configuration — five reorderable artboards, so the strip scrolls and both
 * arrows are painted over the end cells rather than beside them (the previous
 * one is disabled at rest and occupies its box all the same) — and the gap is
 * **9px**: the arrow's box ends at y=95 and
 * the band starts at y=104, with the arrow sitting over the first artboard's
 * picture. The comment is right that the clearance is narrow and right that it
 * holds. Asserted, because that number is what a later change to cell height
 * or arrow size would break, and nothing else in the repo would notice.
 */
export const LongContent: Story = {
  args: {
    kind: "artboards",
    items: [
      {
        id: "a1",
        label: "Hero — full-bleed opening panel with the product shot and the primary call to action",
        thumbnail: <img src="https://placehold.co/320x320?text=Hero" alt="" className="h-full w-full object-cover" />,
      },
      ...ARTBOARDS.slice(1),
      {
        id: "a4",
        label: "Changelog",
        thumbnail: <img src="https://placehold.co/320x320?text=4" alt="" className="h-full w-full object-cover" />,
      },
      {
        id: "a5",
        label: "Footer alt",
        thumbnail: <img src="https://placehold.co/320x320?text=5" alt="" className="h-full w-full object-cover" />,
      },
    ],
    defaultValue: "a1",
    onReorder: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const LONG = "Hero — full-bleed opening panel with the product shot and the primary call to action";

    // The whole label is the accessible name, however little of it is drawn.
    await expect(canvas.getByRole("button", { name: LONG })).toBeInTheDocument();

    // It does not widen its cell.
    const cells = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="frame-strip-item"]'));
    const widths = new Set(cells.map((cell) => Math.round(cell.getBoundingClientRect().width)));
    await expect(widths.size).toBe(1);

    // …and it is genuinely clipped rather than merely long.
    const band = canvasElement.querySelector<HTMLElement>('[data-slot="preview-tile-label"]')!;
    await expect(band.scrollWidth).toBeGreaterThan(band.clientWidth);

    // The arrow sits over the first cell's picture and clears the label band by
    // 9px — measured, not assumed, in the configuration `frame-strip.tsx`'s own
    // comment calls the narrow one: square tiles plus a controls row, so the
    // vertically-centred arrow has re-centred on the taller cell.
    const prev = canvasElement.querySelector<HTMLElement>('[data-slot="frame-strip-previous"]')!;
    const arrowBox = prev.getBoundingClientRect();
    const bandBox = band.getBoundingClientRect();
    await expect(arrowBox.bottom).toBeLessThan(bandBox.top);
    await expect(Math.round(bandBox.top - arrowBox.bottom)).toBe(9);
  },
};

/**
 * 375px. The vendored `Carousel` draws its arrows at `-left-12`/`-right-12`,
 * outside its own box — correct on a full-bleed marketing row, and in a
 * constrained column either clipped or turning the page into a horizontal
 * scroller. O1 measured 407px of content in a 375px column on C3
 * `feature-card-row`, and D2 `reference-strip` measures 471px on the same
 * primitive today.
 *
 * This component overrides both offsets at its own call site
 * (`left-2`/`right-2`, `frame-strip.tsx`), and that override is what this
 * story exists to hold: the assertions are that the strip does not scroll its
 * own column sideways and that both arrows are inside the strip's box. They
 * fail the moment the override is dropped, which is the only reason a story
 * that renders "correctly" is worth its place.
 */
export const Mobile: Story = {
  args: {
    kind: "video",
    items: FRAMES,
    defaultValue: "f2",
  },
  render: (args) => (
    <div className="w-[375px] max-w-full overflow-x-hidden" data-testid="phone-column">
      <FrameStrip {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector<HTMLElement>('[data-testid="phone-column"]')!;
    await expect(Math.round(column.getBoundingClientRect().width)).toBe(375);

    // Nothing escapes the column, arrows included: this is the assertion the
    // vendored offsets would fail.
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);

    const strip = canvasElement.querySelector<HTMLElement>('[data-slot="frame-strip"]')!;
    await expect(strip.scrollWidth).toBeLessThanOrEqual(strip.clientWidth);

    const stripBox = strip.getBoundingClientRect();
    for (const slot of ["frame-strip-previous", "frame-strip-next"]) {
      const arrow = canvasElement.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
      const box = arrow.getBoundingClientRect();
      await expect(box.left).toBeGreaterThanOrEqual(stripBox.left);
      await expect(box.right).toBeLessThanOrEqual(stripBox.right);
    }
  },
};

/**
 * Three rows of small pictures that are routinely confused, and the rule is
 * about **what a cell is**.
 *
 * - **Frame strip** — a cell is a *position in a sequence that already
 *   exists*: frame 3 of a clip, page 2 of a deck. Cells are evenly sized
 *   because an index has no duration, selection picks which one is current,
 *   and there is no such thing as an empty cell.
 * - **Reference strip** (D2) — a cell is a *typed input to the next
 *   generation*. Its label is data the model is conditioned on, and an
 *   unfilled slot stays on screen because it advertises an input the mode
 *   accepts.
 * - **Track lane** (H3) — a cell is a *clip on a time axis*. Width is
 *   proportional to duration and position means *when*, so two lanes at the
 *   same scale line up; a strip's cells never do, because they are indexed
 *   rather than timed.
 *
 * The test, in order: if a cell's width means duration, it is a track lane. If
 * its label changes what the model is conditioned on, it is a reference strip.
 * If it names a position inside one artifact, it is a frame strip — and the
 * in/out variant is the seam between the first and the second, because the two
 * marks it produces are exactly what D2 takes as first and last frame.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-[26rem] max-w-full flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Frame strip — positions inside one artifact</p>
        <FrameStrip kind="video" items={FRAMES.slice(0, 3)} defaultValue="f2" />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Reference strip — typed inputs to the next generation</p>
        <ReferenceStrip
          items={[
            {
              id: "first-frame",
              role: "first-frame",
              thumbnail: { src: "https://placehold.co/200x200?text=First", alt: "First frame of the shot" },
            },
            { id: "last-frame", role: "last-frame" },
          ]}
          onAdd={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Track lane — clips on a time axis</p>
        <TrackLane
          name="Video"
          type="filmstrip"
          duration={20}
          pixelsPerSecond={14}
          clips={[
            { id: "v1", label: "Establishing drone", start: 0, end: 6 },
            { id: "v2", label: "Interview A-cam", start: 6.5, end: 14 },
          ]}
          onSelectClip={() => {}}
        />
      </section>
    </div>
  ),
};
