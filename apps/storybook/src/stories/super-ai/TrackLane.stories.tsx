import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { settledFocusRing } from "@/lib/focus-ring";

import { FrameStrip, type FrameStripItem } from "@/registry/super-ai/frame-strip";
import { TrackLane, type TrackClip } from "@/registry/super-ai/track-lane";
import { WaveformEditor } from "@/registry/super-ai/waveform-editor";
import { TrackLaneDocs } from "@/content/components/track-lane.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const DURATION = 20;
const PPS = 34;

const VIDEO: TrackClip[] = [
  { id: "v1", label: "Establishing drone", start: 0, end: 6 },
  { id: "v2", label: "Interview A-cam", start: 6.5, end: 14 },
  { id: "v3", label: "Cutaway: hands", start: 15, end: 19 },
];

const DIALOGUE: TrackClip[] = [
  { id: "d1", label: "Room tone", start: 0, end: 6, peaks: [0.2, 0.15, 0.25, 0.18, 0.22] },
  {
    id: "d2",
    label: "Interview VO",
    start: 6.5,
    end: 14,
    peaks: [0.4, 0.85, 0.6, 0.9, 0.55, 0.75, 0.45, 0.8],
  },
  { id: "d3", label: "Outro breath", start: 15, end: 19, peaks: [0.3, 0.5, 0.35, 0.2] },
];

const CAPTIONS: TrackClip[] = [
  { id: "c1", label: "Caption 1", start: 0, end: 6, text: "Nobody moves for the first minute." },
  { id: "c2", label: "Caption 2", start: 6.5, end: 14, text: "It started in a garage." },
  { id: "c3", label: "Caption 3", start: 15, end: 19, text: "And then it did not." },
];

const GRADE: TrackClip[] = [
  { id: "g1", label: "Exposure lift", start: 0, end: 6, adjustment: { name: "Exposure", amount: 12 } },
  { id: "g2", label: "Warmth", start: 6.5, end: 14, adjustment: { name: "Warmth", amount: 30 } },
  { id: "g3", label: "Vignette", start: 15, end: 19, adjustment: { name: "Vignette" } },
];

const meta: Meta<typeof TrackLane> = {
  title: "Super AI/Track Lane",
  component: TrackLane,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TrackLaneDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[40rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    duration: DURATION,
    pixelsPerSecond: PPS,
    onSelectClip: () => {},
    onMutedChange: () => {},
    onSoloedChange: () => {},
    onLockedChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TrackLane>;

/** Video. The renderer draws frames; everything else is the same lane. */
export const Filmstrip: Story = {
  args: { name: "Video", type: "filmstrip", clips: VIDEO },
};

/** Audio. Same gutter, same geometry, same selection — different drawing. */
export const Waveform: Story = {
  args: { name: "Dialogue", type: "waveform", clips: DIALOGUE, soloed: true },
};

/** Captions and transcript lines are clips too, not a separate surface. */
export const Text: Story = {
  args: { name: "Captions", type: "text", clips: CAPTIONS },
};

/** Effects over a range: the fourth renderer, on the identical lane. */
export const Adjustment: Story = {
  args: { name: "Grade", type: "adjustment", clips: GRADE },
};

/** Locked is an icon, the word, and `aria-pressed` — never colour alone. */
export const Locked: Story = {
  args: { name: "Grade", type: "adjustment", clips: GRADE, locked: true, selectedClipId: "g2" },
};

/** Handles appear on selection and belong to the clip, so they move with it. */
export const TrimHandles: Story = {
  args: {
    name: "Video",
    type: "filmstrip",
    clips: VIDEO,
    selectedClipId: "v2",
    onTrimClip: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing in the lane animates, greppable rather than argued
 * `grep -nE "animate-|transition-|motion-reduce" registry/super-ai/track-lane.tsx`
 * returns nothing: no keyframe class, no transition, no branch to suppress.
 * The lane also renders no Base UI portal — no dialog, popover, menu, tooltip
 * or select — so the `data-open:animate-in` / `data-closed:animate-out` pair
 * that fifteen registry sources now restate at their call sites (counted with
 * `grep -rl motion-reduce:data-open:animate-none registry/super-ai`, 2026-09-06)
 * has no surface to sit on here. The one vendored primitive it composes is
 * `Toggle`, whose base carries `transition-all`; what that transition can reach
 * on these three toggles is `bg-muted`, `border-ring` and the focus ring, so it
 * crossfades colour and fades a ring in. Nothing changes position or size,
 * which is the qualifier convention fact 3 makes load-bearing — and the ring
 * fade is the thing `settledFocusRing` exists to wait out rather than motion to
 * suppress. B6 `thread-list` is what this skip is written against: its skip
 * said the motion belonged upstream, and two popups it owned animated anyway.
 * The difference here is that the popups do not exist.
 * ---------------------------------------------------------------------- */

const laneOf = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-slot="track-lane"]')!;
const gutterOf = (lane: HTMLElement) => lane.querySelector<HTMLElement>('[data-slot="track-lane-header"]')!;
const scrollerOf = (lane: HTMLElement) => lane.querySelector<HTMLElement>('[data-slot="track-lane-clips"]')!;
const clipsOf = (lane: HTMLElement) =>
  Array.from(lane.querySelectorAll<HTMLElement>('[data-slot="track-lane-clip"]'));
const controlOf = (lane: HTMLElement, control: "mute" | "solo" | "lock") =>
  lane.querySelector<HTMLElement>(`[data-control="${control}"]`)!;

/**
 * Right-to-left, and the answer is split: the lane's chrome mirrors and the
 * lane's *time* does not.
 *
 * The gutter is the first child of a `flex` row, so under `dir="rtl"` it moves
 * to the right and the scroller takes the left — asserted below. Clips are
 * positioned with an inline `style={{ left, width }}` computed from `start ×
 * pixelsPerSecond`, which is physical and has no logical form, so second 0
 * stays at the content's left edge and time still runs left to right inside
 * the lane. That is defensible on its own — a timeline is a number line, and
 * mirroring it would put the past on the right — but the two halves were not
 * decided together, and where they meet the lane is wrong in ways a class swap
 * cannot reach. This is the F5 `compare-viewer` shape from wave 3: some
 * participants in the layout are classes and some are not, so check what else
 * decides the side before swapping anything.
 *
 * **Fixed in-wave**, byte-identical in LTR and therefore free: the gutter's
 * `border-r` → `border-e` (under RTL the gutter sits on the right, so its
 * separator has to paint on its left, and `border-r` was stacking a second
 * 1px against the lane root's own border on the outer edge — the
 * `toggle-group` seam shape from wave 3), and `ml-auto` → `ms-auto` on the
 * locked badge and on the adjustment renderer's percentage, both of which push
 * to the logical end of a row that reverses.
 *
 * **Recorded, not swept, because each is more than a class:**
 *
 * - The scroller opens showing the *end* of the timeline. `overflow-x-auto`
 *   under RTL starts at the content's right edge (`scrollLeft` 0 there, on the
 *   spec-compliant Chromium this gate runs), so 680px of timeline in a 478px
 *   viewport opens on the last clip with two pixels of the opening one left.
 *   Asserted below, because it is the finding rather than a defect to hide:
 *   what a consumer needs here is a scroll handle, which §8 already records H3
 *   as not exposing.
 * - The filmstrip renderer's frames flow right to left inside a clip whose own
 *   time axis runs left to right, so the earliest thumbnail is drawn at the
 *   clip's latest edge. Measured on the 0–6s clip, 204px wide with four 51px
 *   placeholders: DOM frame 0 lands at the clip's right-hand 51px — the span
 *   that reads as 4.5–6s — and frame 3 at its left-hand 51px. Asserted
 *   nowhere, because an assertion pinning the reversal would have to be
 *   deleted to fix it.
 * - `TrimHandle` chooses its edge with `left-0 rounded-l-md` / `right-0
 *   rounded-r-md`, and `edge` is a time semantic ("start" = earlier). Because
 *   the clip's geometry is physical, those classes are currently *correct* and
 *   swapping them to `start-`/`end-` would put "Trim start" on the later edge.
 *   The honest fix is direction-aware geometry in JS, the same conclusion F5's
 *   wipe clip reached.
 */
export const RTL: Story = {
  args: { name: "Video", type: "filmstrip", clips: VIDEO, selectedClipId: "v2" },
  render: (args) => (
    <div dir="rtl">
      <TrackLane
        {...args}
        name={args.name!}
        type={args.type!}
        clips={args.clips!}
        duration={args.duration!}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const lane = laneOf(canvasElement);
    const gutter = gutterOf(lane);
    const scroller = scrollerOf(lane);

    // The chrome mirrors: the gutter is now the right-hand column…
    await expect(gutter.getBoundingClientRect().left).toBeGreaterThan(scroller.getBoundingClientRect().left);

    // …so its separator has to paint on its left. This is the in-wave
    // `border-r` → `border-e` swap, pinned: with the physical class the 1px sat
    // on the gutter's right, against the lane root's own border on the outer
    // edge, and the seam with the scroller had none.
    const gutterStyle = getComputedStyle(gutter);
    await expect(gutterStyle.borderLeftWidth).toBe("1px");
    await expect(gutterStyle.borderRightWidth).toBe("0px");

    // The time axis does not. Second 0 is still at the content's left edge and
    // the clips are still in increasing order along it.
    const clips = clipsOf(lane);
    await expect(clips[0].offsetLeft).toBe(0);
    await expect(clips[1].offsetLeft).toBeGreaterThan(clips[0].offsetLeft);
    await expect(clips[2].offsetLeft).toBeGreaterThan(clips[1].offsetLeft);

    // …and because the scroller is RTL, it opens at the far end of that axis.
    // The lane is 680px of timeline in a 478px viewport, so on load the last
    // clip is fully in view and two pixels of the opening one are left.
    const view = scroller.getBoundingClientRect();
    await expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    await expect(clips[0].getBoundingClientRect().right - view.left).toBeLessThan(8);
    await expect(clips[2].getBoundingClientRect().left).toBeGreaterThan(view.left);
    await expect(Math.round(clips[2].getBoundingClientRect().right)).toBeLessThanOrEqual(
      Math.round(view.right),
    );
  },
};

/**
 * Every stop in one lane, walked once, plus the question `trim-handles` makes
 * unavoidable: **can a keyboard user actually trim?**
 *
 * The answer is yes, and it is the reverse of what the `ew-resize` cursor
 * suggests. Left and Right on a focused handle fire `onTrimClip(clipId, edge,
 * ±trimStep)` and are asserted below; there is no pointer drag implemented
 * anywhere in the component, so the keyboard is the *only* path, not the
 * fallback. What a keyboard user cannot do is recorded rather than asserted,
 * because each would have to be deleted to fix it: the handles are `<button>`s
 * with no `onClick`, so Enter and Space announce an activatable control and do
 * nothing; there is no `role="slider"`, no `aria-valuenow` and no live region,
 * so a nudge produces no readout of where the edge now sits; and there is no
 * larger step, no Home/End and no Escape to abandon a nudge.
 *
 * Nine stops here, in document order, with no roving tabindex anywhere: three
 * gutter toggles, the scroll region itself, then one button per clip — plus the
 * selected clip's two handles, which sit *after* its select button because they
 * are its siblings rather than its children. A lane of twenty clips is
 * twenty-four stops and six stacked lanes is around a hundred and fifty, which
 * is the number the docs page leads with.
 *
 * The ring check is `settledFocusRing`, not `boxShadow !== "none"`, and the
 * three gutter toggles are where the difference is measurable. Read on the
 * mute toggle: unfocused its `box-shadow` is the string `"none"`; on the frame
 * focus lands it is five layers, every one of them
 * `rgba(0, 0, 0, 0) 0px 0px 0px 0px`; and only afterwards does the ring layer
 * climb, still mid-fade at `oklab(0.708 0 0 / 0.09) 0px 0px 0px 0.55px` toward
 * its settled 3px. So the old string check would have passed on the exact
 * frame the toggle painted nothing — and note the mechanism here is the
 * `transition-all` in `toggleVariants` rather than the always-present layers
 * `focus-ring.ts` measured on the vendored `Button`, which is a second route to
 * the same false positive.
 *
 * **Recorded:** `locked` puts `disabled` on every clip button, which removes
 * the clips from the tab order entirely, so a locked lane is four stops and its
 * clip names cannot be read by keyboard at all. That is the documented intent
 * (locking is an editing decision) and its documented cost; the `Locked` story
 * above renders it.
 */
export const KeyboardOrder: Story = {
  args: {
    name: "Video",
    type: "filmstrip",
    clips: VIDEO,
    selectedClipId: "v2",
    onTrimClip: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const lane = laneOf(canvasElement);
    const stops: HTMLElement[] = [
      controlOf(lane, "mute"),
      controlOf(lane, "solo"),
      controlOf(lane, "lock"),
      scrollerOf(lane),
      ...clipsOf(lane).flatMap((clip) => [
        clip.querySelector<HTMLElement>('[data-slot="track-lane-clip-select"]')!,
        ...Array.from(clip.querySelectorAll<HTMLElement>('[data-slot="track-lane-trim-handle"]')),
      ]),
    ];
    await expect(stops).toHaveLength(9);

    // Only the selected clip carries handles, and they belong to it.
    const handles = lane.querySelectorAll('[data-slot="track-lane-trim-handle"]');
    await expect(handles).toHaveLength(2);
    await expect(clipsOf(lane)[1].contains(handles[0])).toBe(true);

    await userEvent.tab();
    for (const stop of stops) {
      const focused = document.activeElement as HTMLElement;
      await expect(focused).toBe(stop);
      await expect(focused.matches(":focus-visible")).toBe(true);
      await settledFocusRing(focused, waitFor);
      await userEvent.tab();
    }

    // Nothing traps: the stop after the last clip is outside the lane.
    await expect(lane.contains(document.activeElement)).toBe(false);

    // Trimming, from the keyboard, on the only path there is.
    const startHandle = lane.querySelector<HTMLElement>(
      '[data-slot="track-lane-trim-handle"][data-edge="start"]',
    )!;
    await expect(startHandle).toHaveAccessibleName("Trim start of Interview A-cam");
    startHandle.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(args.onTrimClip).toHaveBeenCalledWith("v2", "start", 0.1);
    await userEvent.keyboard("{ArrowLeft}");
    await expect(args.onTrimClip).toHaveBeenLastCalledWith("v2", "start", -0.1);

    // The handle keeps focus across a nudge, which is what makes repeated
    // presses accumulate rather than restart from the top of the page.
    await expect(document.activeElement).toBe(startHandle);
  },
};

/**
 * A host that holds selection and mute and refuses to move either.
 *
 * Everything stateful in this lane is a controlled pair — `selectedClipId` /
 * `onSelectClip`, and `muted`, `soloed`, `locked` with their handlers. Selection
 * has no uncontrolled mode at all: clicking a clip changes nothing on its own,
 * so a consumer who forgets to apply `onSelectClip` ships a timeline where
 * nothing can be selected. The render counter is what makes the last assertion
 * mean something — the host really re-rendered with an unchanged selection, so
 * the clip held because the prop said so rather than because React skipped the
 * work.
 *
 * **The defect this story exists to record, and does not pin:** the three
 * gutter toggles *do* have an uncontrolled mode, and it half-works. Leave
 * `muted` or `soloed` undefined and the vendored `Toggle` falls back to its own
 * state, so `aria-pressed` flips on click while the icon — which reads the prop
 * — does not. A screen reader is then told the track is muted while the speaker
 * icon says it is not. Passing the handler without the value is the natural
 * half-wiring and it is the broken one. (`locked` cannot reach this: it
 * defaults to `false`, so its toggle is always controlled.) Asserting the
 * disagreement would pin it, so what is asserted here is the half that is right
 * and must stay right: with the value passed, a refused change moves nothing.
 */
function PinnedLane({
  onSelectClip,
  onMutedChange,
}: {
  onSelectClip: (clipId: string) => void;
  onMutedChange: (muted: boolean) => void;
}) {
  const [renders, setRenders] = React.useState(1);
  return (
    <div data-renders={renders}>
      <TrackLane
        name="Video"
        type="filmstrip"
        clips={VIDEO}
        duration={DURATION}
        pixelsPerSecond={PPS}
        // The host pins both and never applies what it is told.
        selectedClipId="v1"
        muted={false}
        onSelectClip={(id) => {
          onSelectClip(id);
          setRenders((n) => n + 1);
        }}
        onMutedChange={(next) => {
          onMutedChange(next);
          setRenders((n) => n + 1);
        }}
      />
    </div>
  );
}

export const Controlled: StoryObj<typeof PinnedLane> = {
  args: { onSelectClip: fn(), onMutedChange: fn() },
  render: (args) => <PinnedLane onSelectClip={args.onSelectClip!} onMutedChange={args.onMutedChange!} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const lane = laneOf(canvasElement);
    const first = canvas.getByRole("button", { name: "Establishing drone" });
    const second = canvas.getByRole("button", { name: "Interview A-cam" });

    await expect(first).toHaveAttribute("aria-pressed", "true");
    await expect(second).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(second);

    // The payload a consumer needs in order to apply the change: which clip.
    await expect(args.onSelectClip).toHaveBeenCalledWith("v2");

    // The prop wins — the click alone moved nothing, including the handles,
    // which are rendered from the same selection.
    await expect(first).toHaveAttribute("aria-pressed", "true");
    await expect(second).toHaveAttribute("aria-pressed", "false");
    await expect(lane.querySelectorAll('[data-slot="track-lane-trim-handle"]')).toHaveLength(2);
    await expect(clipsOf(lane)[0].contains(lane.querySelector("[data-edge='start']"))).toBe(true);

    // The same contract on the gutter, which is where forgetting it hurts most.
    const mute = controlOf(lane, "mute");
    await userEvent.click(mute);
    await expect(args.onMutedChange).toHaveBeenCalledWith(true);
    await expect(mute).toHaveAttribute("aria-pressed", "false");

    // …and the host did re-render twice while holding both there.
    await expect(canvasElement.querySelector("[data-renders]")).toHaveAttribute("data-renders", "3");
  },
};

/**
 * The optional text slots, emptied. Three of the four renderers take content
 * beyond `label` and all three fall back to it: a `text` clip with no `text`
 * captions itself, an `adjustment` clip with no `adjustment` names itself, and
 * an `adjustment` with a name but no `amount` simply draws no percentage rather
 * than a zero. `filmstrip` has the same shape one level down — no `frames`
 * gives four placeholder blocks, which is the honest rendering of "this clip
 * exists and its thumbnails have not arrived", not an error state.
 *
 * That fallback chain is what is asserted, because it is the thing keeping
 * every clip named: `label` is required, so no reachable combination of missing
 * optional content can produce a nameless clip button. The lane stays clear of
 * the hole F1 `result-card` fell into, where an unforwarded label leaves an
 * interactive card with no name at all.
 *
 * **Recorded, not asserted:** `name` is required by the type but nothing stops
 * `name=""`, and it is the stem of five accessible names. An empty one collapses
 * "Mute Video" / "Solo Video" / "Lock Video" to "Mute" / "Solo" / "Lock", the
 * control group to "track controls" and the scroll region to "clips" — so a
 * stack of six unnamed lanes offers eighteen indistinguishable toggles and six
 * identically-named landmarks. The fourth lane below renders it. That is the
 * per-row naming contract again, after `property-inspector`'s resets,
 * `context-chips`' remove control and `result-card`'s checkboxes; pinning it
 * would mean asserting three toggles share one name, which is the assertion a
 * fix has to delete.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <TrackLane
        name="Captions"
        type="text"
        duration={DURATION}
        pixelsPerSecond={PPS}
        clips={[
          { id: "c1", label: "Caption 1", start: 0, end: 6 },
          { id: "c2", label: "Caption 2", start: 6.5, end: 14 },
        ]}
      />
      <TrackLane
        name="Grade"
        type="adjustment"
        duration={DURATION}
        pixelsPerSecond={PPS}
        clips={[
          { id: "g1", label: "Exposure lift", start: 0, end: 6 },
          { id: "g2", label: "Warmth", start: 6.5, end: 14, adjustment: { name: "Warmth" } },
        ]}
      />
      <TrackLane
        name="Video"
        type="filmstrip"
        duration={DURATION}
        pixelsPerSecond={PPS}
        clips={[{ id: "v1", label: "Establishing drone", start: 0, end: 6 }]}
      />
      <TrackLane
        name=""
        type="waveform"
        duration={DURATION}
        pixelsPerSecond={PPS}
        clips={[{ id: "d1", label: "Room tone", start: 0, end: 6 }]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Every clip is still named, whatever the renderer was not given.
    for (const name of [
      "Caption 1",
      "Caption 2",
      "Exposure lift",
      "Warmth",
      "Establishing drone",
      "Room tone",
    ]) {
      await expect(canvas.getByRole("button", { name })).toBeInTheDocument();
    }

    // The fallbacks are drawn, not just announced.
    const captions = laneOf(canvasElement);
    await expect(captions.textContent).toContain("Caption 1");

    // No `amount` means no percentage, rather than "0%".
    const grade = canvasElement.querySelectorAll<HTMLElement>('[data-slot="track-lane"]')[1];
    await expect(grade.textContent).not.toContain("%");

    // No `frames` still fills the clip edge to edge with the placeholder set.
    const video = canvasElement.querySelectorAll<HTMLElement>('[data-slot="track-lane"]')[2];
    await expect(video.querySelectorAll('[data-slot="track-lane-frame"]')).toHaveLength(4);
  },
};

/**
 * An 88-character track name and an 87-character caption, which the lane
 * answers in two different ways.
 *
 * The **track name** truncates inside the fixed `w-40` gutter with no `title`
 * attribute, so there is no tooltip and no way to read the tail: 123px of box
 * for a string that measures 519px, under a quarter of it. That is the same
 * inversion `thread-list` records and it is sharper here, because the whole
 * string is still the accessible name of all three toggles ("Mute <88
 * characters>") — a screen-reader user gets the full track name three times
 * over while a sighted user gets the first 123 pixels of it. Length is a
 * legibility problem here rather than an a11y one.
 *
 * The **caption** is clipped by the clip's *duration* rather than by its own
 * length, which is the fact worth having written down somewhere. A clip's width
 * is `(end - start) × pixelsPerSecond`, so a 3.5-second line of dialogue gets
 * 119px whatever it says — 83px of text box against the 489px the sentence
 * measures — and zooming out shrinks it further: the same caption at 8px/s is
 * 28px, three characters. In a text lane "readable" is a function of the zoom
 * level and not of the content, and nothing in the component warns about it.
 * The two box widths are layout and are asserted; the two string widths are
 * font metrics, measured here and left in prose rather than pinned.
 */
export const LongContent: Story = {
  args: {
    name: "Interview A-cam, second setup after the lighting change and the room-tone retake, take 3",
    type: "text",
    clips: [
      {
        id: "c1",
        label: "Caption 1",
        start: 0,
        end: 3.5,
        text: "We did not know it would work, and the first six weeks were mostly us arguing about it.",
      },
      { id: "c2", label: "Caption 2", start: 4, end: 14, text: "It started in a garage." },
    ],
  },
  play: async ({ canvasElement }) => {
    const lane = laneOf(canvasElement);

    // The gutter name truncates into 123px of a fixed 160px gutter, and offers
    // nothing to recover the tail. The box width is layout, so it is asserted;
    // the 519px the string wants is a text metric, so it stays in the
    // description rather than becoming a font-dependent assertion.
    const nameEl = lane.querySelector<HTMLElement>('[data-slot="track-lane-name"]')!;
    await expect(nameEl.clientWidth).toBe(123);
    await expect(nameEl.scrollWidth).toBeGreaterThan(nameEl.clientWidth);
    await expect(nameEl.getAttribute("title")).toBeNull();

    // …while the whole string is announced, three times, in the gutter.
    await expect(controlOf(lane, "mute")).toHaveAccessibleName(
      "Mute Interview A-cam, second setup after the lighting change and the room-tone retake, take 3",
    );

    // The caption is bounded by duration, not by content: 3.5s at 34px/s.
    const [short] = clipsOf(lane);
    await expect(Math.round(short.getBoundingClientRect().width)).toBe(119);
    const caption = short.querySelector<HTMLElement>("span.truncate")!;
    await expect(caption.clientWidth).toBe(83);
    await expect(caption.scrollWidth).toBeGreaterThan(caption.clientWidth);
  },
};

/**
 * 375px, where the lane's own proportions are the finding rather than overflow.
 *
 * Nothing scrolls sideways — the root is `w-full` and the scroller is `min-w-0
 * flex-1`, so the lane fits any width it is given — and this is one of the
 * few components where that claim is the phone case rather than a squeezed
 * desktop one. The `Mobile` wrapper constrains width and not the breakpoint
 * (wave 3's expansion of mechanical fact 2), which weakened `preset-grid`'s and
 * `generation-wizard`'s stories; the lane carries no responsive-prefixed class
 * at all, asserted below, so there is no wide layout hiding inside this box.
 *
 * What 375px costs is the gutter. It is a fixed `w-40` — 160px, 43% of the
 * screen — leaving exactly 213px of clip viewport for a timeline 680px wide, so
 * a phone shows under a third of a twenty-second lane and the rest is reachable
 * only by dragging inside the strip. The gutter width is a private constant
 * (`HEADER_CLASS`), which is the §8 gap O4 hit from the other side: `timeline-shell`
 * has to hardcode `w-[calc(10rem+1px)]` and `left-[calc(10rem+1px)]` to line
 * its ruler and playhead up with lanes it cannot ask. Both halves of that gap —
 * no scroll handle, no exported gutter width — are API changes, so they are
 * measured here and left recorded.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="phone" className="w-[375px] max-w-full">
      <TrackLane
        name="Video"
        type="filmstrip"
        clips={VIDEO}
        duration={DURATION}
        pixelsPerSecond={PPS}
        selectedClipId="v2"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // `layout: "centered"` plus this file's own decorator mean
    // `canvasElement.firstElementChild` is not the 375px frame — measure the
    // testid, not the wrapper (mechanical fact 2).
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="phone"]')!;
    await expect(frame.clientWidth).toBe(375);
    await expect(frame.scrollWidth).toBe(frame.clientWidth);

    // No responsive variant exists in this subtree, so the wrapper's inability
    // to move the breakpoint costs this story nothing.
    const responsive = Array.from(frame.querySelectorAll("*")).flatMap((el) =>
      Array.from(el.classList).filter((c) => /^(sm|md|lg|xl|2xl):/.test(c)),
    );
    await expect(responsive).toEqual([]);

    // The gutter takes 160 of the 375, leaving 213px of viewport for 680px of
    // timeline: under a third of the lane is on screen at once.
    const lane = laneOf(canvasElement);
    const scroller = scrollerOf(lane);
    await expect(gutterOf(lane).getBoundingClientRect().width).toBe(160);
    await expect(scroller.clientWidth).toBe(213);
    await expect(scroller.scrollWidth).toBe(DURATION * PPS);

    // It is a scroll container with no keys of its own, so it has to be
    // focusable to be reachable at all (axe scrollable-region-focusable).
    await expect(scroller).toHaveAttribute("tabindex", "0");
  },
};

/** Deterministic peaks: a phrase with a breath in it, so there is a region worth selecting. */
const BOUNDARY_PEAKS = Array.from({ length: 128 }, (_, i) => {
  const t = i / 128;
  const breath = t > 0.42 && t < 0.52 ? 0.08 : 1;
  return Math.abs(Math.sin(t * 26)) * (0.35 + 0.6 * Math.sin(Math.PI * t)) * breath;
});

const BOUNDARY_FRAMES: FrameStripItem[] = ["00:00:00", "00:00:06", "00:00:15"].map((timecode, index) => ({
  id: `bf${index + 1}`,
  label: timecode,
  thumbnail: <div className="bg-muted h-full w-full" />,
}));

/**
 * Three surfaces that all draw media along a horizontal axis and are not
 * interchangeable. The rule is **what a selection is made of**:
 *
 * - **Track lane** — selection is a *clip*, a whole reference on a track that
 *   also has mute, solo and lock. It is a row in a stack, and the stack is the
 *   point: everything about it (fixed gutter, shared `pixelsPerSecond`) exists
 *   so six of them line up.
 * - **Waveform editor** — selection is a *sample range* inside one piece of
 *   audio, with zoom running to the individual sample. `gaps.md` R3 records
 *   this pair as a recovered consolidation error: H6 was once folded into H3,
 *   and folding it back loses the only selection audio work actually needs.
 *   The lane's `waveform` renderer draws peaks; it cannot select inside them.
 * - **Frame strip** — selection is a *tile*, and there is no time axis at all.
 *   Items are evenly sized however long they last, which is why it also serves
 *   slide pages and artboards; a lane's clip widths are its durations.
 *
 * If the thing selected is a whole clip on a track that can be muted, it is a
 * lane. If it is a range of samples, it is the waveform editor. If position in
 * the list matters more than position in time, it is a frame strip. The fourth
 * near-twin, H7 `stem-mixer`, is not rendered here because it is not a timeline
 * at all — it stacks per-stem lanes with the same mute and solo controls and no
 * clips, and the spec's own boundary is that its exclusive-versus-additive solo
 * is the behaviour H3 deliberately does not model.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-6 px-12">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Track lane — a clip on a track that can be muted
        </p>
        <TrackLane
          name="Dialogue"
          type="waveform"
          clips={DIALOGUE}
          duration={DURATION}
          pixelsPerSecond={PPS}
          selectedClipId="d2"
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Waveform editor — a range of samples inside one clip
        </p>
        <WaveformEditor
          label="Interview take 3"
          peaks={BOUNDARY_PEAKS}
          sampleCount={131_072}
          sampleRate={44_100}
          view={{ start: 0, end: 131_072 }}
          region={{ start: 54_000, end: 68_500, label: "Breath" }}
          playhead={54_000}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Frame strip — a tile, with no time axis at all</p>
        <FrameStrip kind="video" items={BOUNDARY_FRAMES} defaultValue="bf2" />
      </section>
    </div>
  ),
};
