import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { settledFocusRing } from "@/lib/focus-ring";

import { TimeRuler } from "@/registry/super-ai/time-ruler";
import { TrackLane } from "@/registry/super-ai/track-lane";
import {
  WaveformEditor,
  type WaveformRegion,
  type WaveformRegionAction,
  type WaveformView,
} from "@/registry/super-ai/waveform-editor";
import { WaveformEditorDocs } from "@/content/components/waveform-editor.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof WaveformEditor> = {
  title: "Super AI/Waveform Editor",
  component: WaveformEditor,
  parameters: { layout: "centered", docs: { page: componentDocsPage(WaveformEditorDocs) } },
};

export default meta;
type Story = StoryObj<typeof WaveformEditor>;

const SAMPLE_RATE = 44_100;
const SAMPLE_COUNT = 131_072;

// A deterministic stand-in for real peak data — a decaying phrase with a
// breath in the middle, so there is something worth selecting.
const PEAKS = Array.from({ length: 256 }, (_, i) => {
  const t = i / 256;
  const breath = t > 0.42 && t < 0.52 ? 0.08 : 1;
  return Math.abs(Math.sin(t * 26)) * (0.35 + 0.6 * Math.sin(Math.PI * t)) * breath;
});

const BASE = {
  peaks: PEAKS,
  sampleCount: SAMPLE_COUNT,
  sampleRate: SAMPLE_RATE,
  label: "Interview take 3",
};

/**
 * The four operations an audio editor actually offers on a selection. "Trim to
 * region" is kept rather than shortened to "Trim", because it is what surfaces
 * the accessible-name stutter `RegionActions` records — and a button labelled
 * that way is what an audio tool really ships.
 */
const REGION_ACTIONS: WaveformRegionAction[] = [
  { id: "trim", label: "Trim to region" },
  { id: "silence", label: "Silence" },
  { id: "fade", label: "Fade in" },
  { id: "delete", label: "Delete", destructive: true },
];

const root = (el: HTMLElement) => el.querySelector<HTMLElement>('[data-slot="waveform-editor"]')!;
const slot = (scope: HTMLElement, name: string) =>
  scope.querySelector<HTMLElement>(`[data-slot="waveform-editor-${name}"]`)!;
const thumbInput = (scope: HTMLElement, name: string) =>
  scope.querySelector<HTMLInputElement>(`[data-slot="waveform-editor-${name}"] input`)!;
const centre = (el: Element) => {
  const b = el.getBoundingClientRect();
  return b.left + b.width / 2;
};

/* -------------------------------------------------------------------------
 * Declared states
 * ---------------------------------------------------------------------- */

/**
 * A selection over the whole buffer — the state everything else is an edit of.
 * Worth noticing: the selection is carried three times over, and only one of
 * them is the picture. The shaded band is `aria-hidden`; the two number fields
 * are the same boundaries as typeable sample offsets; and the visually hidden
 * `role="status"` announces "Region 54,000 to 68,500 samples, 0:01.224 to
 * 0:01.553, 14,500 samples long". That redundancy is the spec's fourth H6 rule
 * ("the waveform is a drawing, so the region must also exist as numbers"), and
 * it is what makes every other story in this file possible to write.
 *
 * At this zoom the window is the whole 131,072-sample buffer, so one of the 96
 * drawn columns covers 1,366 samples and `data-sample-level` is `false`.
 */
export const RegionSelect: Story = {
  args: {
    ...BASE,
    view: { start: 0, end: SAMPLE_COUNT },
    region: { start: 54_000, end: 68_500, label: "Breath" },
    playhead: 54_000,
    onRegionChange: () => {},
    onScrub: () => {},
    onViewChange: () => {},
  },
};

/**
 * The zoom stop that justifies the component existing: sixteen samples across
 * the whole strip, so one drawn column is one sample and `data-sample-level`
 * flips to `true`. At 44.1 kHz this window is 0.36 ms wide, against the 33 ms
 * of a single 30fps video frame — that is the resolution H2 `time-ruler` cannot
 * reach, and the reason `Boundary` below exists.
 *
 * The readout says it in words rather than as a magnification factor: "16
 * samples visible · 1 sample per column". A "40×" would not tell anyone whether
 * an individual sample can be addressed yet, and that is the only question this
 * state answers.
 */
export const ZoomToSample: Story = {
  args: {
    ...BASE,
    // Sixteen samples across the whole strip: one column is one sample, which
    // is the point at which a click or a plosive can actually be edited.
    view: { start: 61_432, end: 61_448 },
    region: { start: 61_436, end: 61_442 },
    playhead: 61_440,
    onRegionChange: () => {},
    onScrub: () => {},
    onViewChange: () => {},
  },
};

/**
 * The playhead with nothing selected — the state a user is in before an edit
 * exists. Two things are deliberate here. The empty message is a sentence that
 * says what to do next rather than a dash, because a region is a precondition
 * for every action the component offers. And the playhead is a real named
 * slider rather than a decorated div, so "drag it" and "press an arrow key" are
 * the same gesture: this state has three tab stops (zoom, Fit, playhead)
 * against the twelve a fully-wired region has.
 *
 * The component never advances the playhead. `onScrub` reports where the user
 * put it; playing from there belongs to the caller.
 */
export const Scrub: Story = {
  args: {
    ...BASE,
    view: { start: 49_152, end: 81_920 },
    playhead: 61_440,
    region: null,
    onScrub: () => {},
    onViewChange: () => {},
  },
};

/**
 * The actions that operate on a selection, which per the spec is the only thing
 * they may operate on — a destructive action with nothing selected is the bug
 * H6's third rule exists to prevent, and the actions row simply does not render
 * without a region.
 *
 * Two measured details. Delete is painted with a solid fill —
 * `oklch(0.577 0.245 27.325)` behind `oklch(1 0 0)` text, 4.8:1 — rather than
 * the `Button` destructive variant's 10% tint, which measures 4.0:1 against a
 * 4.5:1 minimum. And every action's accessible name is rebuilt from the
 * offsets: "Silence region 54,000 to 68,500 samples". That template assumes the
 * visible label is a bare verb, so a label that already ends in the word
 * *region* stutters — this story's first button announces as "Trim to region
 * region 54,000 to 68,500 samples". Recorded, not worked around: shortening the
 * fixture would hide it.
 */
export const RegionActions: Story = {
  args: {
    ...BASE,
    view: { start: 49_152, end: 81_920 },
    region: { start: 54_000, end: 68_500, label: "Breath" },
    playhead: 54_000,
    onRegionChange: () => {},
    onScrub: () => {},
    onViewChange: () => {},
    regionActions: REGION_ACTIONS,
    onRegionAction: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — grepped the file and its three composed registry children: no `animate-*` anywhere, and the only `transition-*` is `transition-[box-shadow]`, which cannot move anything
 * `waveform-editor.tsx` contains zero `animate-` classes. It contains exactly
 * three `transition-` classes, all the same one — `transition-[box-shadow]` on
 * the zoom thumb and the two region-band thumbs (lines 294, 462, 471) — and the
 * property list is explicit, so nothing but the shadow can transition: no
 * position, no size, no opacity. `field-row.tsx`, `kbd.tsx` and
 * `stat-readout.tsx`, the three registry components it composes, carry neither
 * class (same grep). Nothing in the tree changes position or size over time, so
 * the convention's second idiom — `motion-reduce:transition-none` beside a
 * transition *a user would perceive as motion* — has no subject here; this is
 * the `reset-affordance` case, where suppressing a paint-only transition would
 * document a branch that does not exist. Since `vitest.config.ts` already forces
 * `reducedMotion: "reduce"` on every test, the story would render
 * pixel-identical to `RegionActions`.
 *
 * There is one moving thing in the composed tree and it is not this component's
 * branch: the vendored `Button` used by Fit, Zoom to region and every region
 * action carries `transition-all` plus `active:not-aria-[haspopup]:translate-y-px`,
 * so it nudges a pixel while pressed under reduced motion. That is the
 * primitive-wide posture recorded in `CONTINUE.md` §8 ("the vendored `Button`
 * moves on press with no reduced-motion branch"), which no case story is meant
 * to patch per consumer.
 *
 * Everything else in the eight is written below.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and the finding is that **this component contains no direction
 * decision at all** — three independent mechanisms decide which way its time
 * axis runs, and they do not agree.
 *
 * Two of them mirror, which is what the assertions below pin, and they pin it
 * without assuming a side: the check is that the playhead lands on the column
 * of the strip its own value names, whichever end of the strip that is. So the
 * story stays true if someone later decides a waveform's time axis should
 * *not* mirror (a real question — time is not text, and pinning `dir="ltr"` on
 * the canvas is a defensible answer) as long as the two keep agreeing.
 *
 * - **The peak strip mirrors**, because it is a plain flex row and `dir="rtl"`
 *   reverses a row's main axis. Measured in a 576px canvas: the first drawn
 *   column sits 566px from the left edge and the last sits 5px from it, so
 *   sample 0 is on the right.
 * - **The playhead mirrors**, because Base UI positions a thumb with
 *   `inset-inline-start`, which is a CSS logical property and follows the
 *   inherited `direction`. At 61,440 of a 49,152–81,920 window it sits 357px
 *   from the left, and the column carrying that sample is centred at 356px.
 *
 * **Three things do not, and none is fixed here.**
 *
 * 1. *The shaded region band does not mirror.* It is an inline
 *    `style={{ left: "14.79%", width: "44.25%" }}` — physical, so it stays put
 *    while the picture underneath it flips. Measured: the band paints 86–340px
 *    from the left, where the audio it names is drawn at 236–490px. The band is
 *    over the wrong audio. This is the one swap a class-level fix could reach
 *    (`left` → `inset-inline-start`, byte-identical in LTR), and it is left
 *    alone on the F5 `compare-viewer` rule: swap only when every participant in
 *    the layout is a class and you know what else decides the side. Here the
 *    side is decided by a flex axis, a Base UI logical property and an inline
 *    style, and the component never chose between them — so a one-property swap
 *    picks the answer rather than correcting drift, and it would still leave 2
 *    and 3 below broken.
 * 2. *Arrow keys run backwards.* `SliderThumb` takes its direction from
 *    `useDirection()`, a React context, and `CONTINUE.md` §8 records that no
 *    `DirectionProvider` is mounted anywhere in this repo, so it reads `"ltr"`
 *    under any amount of `dir="rtl"` markup. Measured on the playhead:
 *    ArrowRight raises the value 61,440 → 61,441 and moves the handle *left*,
 *    357px → 356px. On a mirrored axis the handle travels away from the key
 *    that was pressed. Same root cause as `mode-tabs`; the fix is one provider
 *    at the app shell.
 * 3. *Every thumb is offset by half its own width.* The same missing context
 *    makes Base UI emit the LTR centring `translate: -50% -50%`, which pushes a
 *    thumb the wrong way off its `inset-inline-start` anchor — 1px on the 2px
 *    playhead, 4px on the 8px region handles, 6px on the 12px zoom handle.
 *
 * What does mirror correctly and is asserted: the boundary fields. `UnitInput`
 * is already written in logical properties (`text-end`, `pe-2`), so the "smp"
 * suffix moves to the visual left and the digits sit against it.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <WaveformEditor {...args} />
    </div>
  ),
  args: {
    ...BASE,
    view: { start: 49_152, end: 81_920 },
    region: { start: 54_000, end: 68_500, label: "Breath" },
    playhead: 61_440,
    regionActions: REGION_ACTIONS,
    onRegionChange: () => {},
    onScrub: () => {},
    onViewChange: () => {},
    onRegionAction: () => {},
  },
  play: async ({ canvasElement }) => {
    const el = root(canvasElement);
    const canvas = slot(el, "canvas");
    const bars = Array.from(slot(el, "peaks").children);
    await expect(bars).toHaveLength(96);

    // 1. Which end of the strip carries sample 0 is read off the geometry, not
    //    assumed — that is what keeps the rest of this story direction-agnostic.
    const forward = Math.sign(centre(bars[bars.length - 1]) - centre(bars[0]));
    await expect(forward).not.toBe(0);

    // 2. The playhead agrees with the strip. 61,440 of the 49,152–81,920 window
    //    is 37.5% in, which is column 36 of 96; the thumb has to be on that
    //    column whichever way the strip runs.
    const fraction = (61_440 - 49_152) / (81_920 - 49_152);
    const column = bars[Math.floor(fraction * bars.length)];
    const thumb = slot(el, "playhead-thumb");
    await expect(Math.abs(centre(thumb) - centre(column))).toBeLessThan(12);

    // 3. …and so does the region band below the canvas: its start handle sits
    //    on the sample-0 side of its end handle, the same way round as the
    //    strip. `Math.sign` rather than a fixed side, for the same reason.
    const bandStart = slot(el, "region-start-thumb");
    const bandEnd = slot(el, "region-end-thumb");
    await expect(Math.sign(centre(bandEnd) - centre(bandStart))).toBe(forward);

    // 4. The boundary fields mirror properly, because `UnitInput` was written
    //    in logical properties: the unit suffix crosses to the visual left and
    //    `text-end` puts the digits against it.
    const field = el.querySelectorAll<HTMLElement>('[data-slot="unit-input"]')[0];
    const digits = field.querySelector<HTMLInputElement>("input")!;
    const unit = field.querySelector<HTMLElement>('[data-slot="unit-input-unit"]')!;
    await expect(centre(unit)).toBeLessThan(centre(digits));
    await expect(getComputedStyle(digits).textAlign).toBe("end");

    // 5. The toolbar's two ends swap with the reading direction: the readout is
    //    a `justify-between` sibling of the zoom group, so it changes sides.
    const toolbar = slot(el, "toolbar");
    const readout = slot(el, "view-readout");
    await expect(readout.getBoundingClientRect().left - toolbar.getBoundingClientRect().left).toBeLessThan(
      toolbar.getBoundingClientRect().width / 2,
    );

    // 6. The band's *width* is right whichever way the axis runs — it is the
    //    selection's share of the window and mirroring cannot change it. Its
    //    position is the broken half, so nothing here asserts that, or the
    //    direction an arrow key travels: both are described above, and pinning
    //    either would make it permanent.
    const overlay = slot(el, "region-overlay");
    const share = (68_500 - 54_000) / (81_920 - 49_152);
    const expected = share * canvas.getBoundingClientRect().width;
    await expect(Math.abs(overlay.getBoundingClientRect().width - expected)).toBeLessThan(2);
  },
};

/**
 * Twelve tab stops, in DOM order, and the component advertises its own
 * shortcuts — so this story's job is to check that what the `kbd` hint promises
 * is what the keys do. **Three of the four handles honour it exactly and the
 * fourth does not.**
 *
 * The hint reads "Left / Right nudge the focused handle by one sample". On the
 * playhead and both region boundaries that is literally true, and understated:
 * Up and Down work as well as Left and Right, and Shift with an arrow, PageUp
 * and PageDown move `largeStep` — a tenth of the visible window, 3,277 samples
 * here. On the **zoom** handle, which is also a focused handle, one press is
 * one power of two: 32,768 samples visible becomes 16,384. So the sentence is
 * wrong for a quarter of the controls it covers, and the press it describes as
 * one sample throws away half the window. Both behaviours are asserted below;
 * it is the copy that needs the fix, and copy is not a mechanical change.
 *
 * Home and End are window-relative, not buffer-relative: on the playhead they
 * go to 49,152 and 81,920, the edges of the visible window, so arrowing can
 * never leave the window. On the two-thumb band they address the neighbouring
 * thumb instead, which means End on Region start collapses a 14,500-sample
 * selection to one sample (68,499 against an end of 68,500). Both are asserted.
 * Escape, Delete and Backspace do nothing at all — asserted, because "there is
 * no keyboard way to clear a selection" is a claim the docs make and nothing
 * else checks.
 *
 * **Four of the twelve stops paint no focus treatment, and the repo's own
 * helper cannot see it.** Base UI puts focus on a `<input type="range">` that
 * is clipped to nothing with `clip-path: inset(50%)`; the `focus-visible:ring-3`
 * is on the `<span>` wrapping it, and `:focus-visible` never matches a parent.
 * So the thumbs paint nothing on focus — and `settledFocusRing` passes on both
 * halves anyway. On the input because a clipped element still reports
 * `outline: auto 1px`, which is the E1 `generation-panel` false positive with
 * `clip-path` in place of a 1×1 clip; on three of the four spans because
 * `shadow-sm` is a real, permanent shadow layer with 0.1 alpha and 3px of blur,
 * which the helper reads as a painted ring. That is a third false-positive
 * shape for `@/lib/focus-ring`: it asks whether an element paints *a*
 * treatment, never whether focus is what caused it. So the check below runs the
 * helper *and* a differential — the treatment's signature before focus and
 * after must differ — and the four slider stops are excluded from both rather
 * than asserted in either direction, exactly as `tool-panel` excludes its
 * `Tabs.Panel`. Second instance of F5 `compare-viewer`'s wipe handle, and the
 * docs module's focus bullet ("all four thumbs draw `focus-visible:ring-3`") is
 * wrong because of it.
 *
 * One more thing measured and not asserted: firing a region action that clears
 * the selection unmounts the button that was pressed along with both band
 * thumbs, both fields and Zoom to region, and focus lands on `<body>`. The next
 * Tab restarts from the top of the document. Asserting it would make it
 * permanent; it is in this component's report and the docs already carry it.
 */
export const KeyboardOrder: Story = {
  // A live host, because a key pressed against a no-op handler is
  // indistinguishable from a key that is not bound at all — the component holds
  // no state, so nothing moves without a consumer that applies the change.
  render: () => <LiveHost />,
  play: async ({ canvasElement }) => {
    const el = root(canvasElement);
    const canvas = within(el);

    // The twelve stops, in document order — nothing here sets a tabindex, so
    // document order is the traversal. Disabled controls are filtered out
    // because omitting a handler leaves the matching slider mounted and
    // `disabled` rather than removing it: with no handlers at all this tree
    // still holds three disabled range inputs.
    const stops = Array.from(el.querySelectorAll<HTMLElement>("input, button")).filter(
      (n) => !(n as HTMLInputElement).disabled,
    );
    await expect(stops).toHaveLength(12);
    // Named by `aria-label`, else by visible text, else — for the two boundary
    // fields, which carry neither — by input type.
    const stopName = (s: HTMLElement) =>
      s.getAttribute("aria-label") ?? (s.textContent?.trim() || s.getAttribute("type"));
    await expect(stops.map(stopName)).toEqual([
      "Zoom level",
      "Zoom to region",
      "Fit",
      "Playhead",
      "Region start",
      "Region end",
      "number",
      "number",
      "Trim to region region 54,000 to 68,500 samples",
      "Silence region 54,000 to 68,500 samples",
      "Fade in region 54,000 to 68,500 samples",
      "Delete region 54,000 to 68,500 samples",
    ]);
    // The two unnamed stops are the boundary fields, named by their `FieldRow`
    // labels rather than by an aria-label.
    await expect(canvas.getByLabelText("Start")).toBe(stops[6]);
    await expect(canvas.getByLabelText("End")).toBe(stops[7]);

    // The element that is supposed to paint on focus is not always the element
    // that takes focus: a slider's ring lives on the thumb span, a number
    // field's on its `unit-input` wrapper.
    const painter = (stop: HTMLElement) =>
      stop.closest<HTMLElement>('[data-slot="unit-input"]') ??
      (stop.getAttribute("type") === "range" ? (stop.parentElement as HTMLElement) : stop);
    const resting = stops.map((s) => ringSignature(painter(s)));
    // Indices 0, 3, 4 and 5 are the four Base UI slider thumbs, which paint
    // nothing on focus (see this story's description). Excluded, not asserted.
    const paints = new Set([1, 2, 6, 7, 8, 9, 10, 11]);

    // One lap: every stop reached once, in order, then out of the component.
    (document.activeElement as HTMLElement | null)?.blur?.();
    for (const [i, stop] of stops.entries()) {
      const previous = document.activeElement;
      await userEvent.tab();
      await waitFor(() => expect(document.activeElement).not.toBe(previous));
      await expect(document.activeElement).toBe(stop);
      await expect(`${i} focusVisible=${stop.matches(":focus-visible")}`).toBe(`${i} focusVisible=true`);
      if (paints.has(i)) {
        const target = painter(stop);
        // The convention's helper first: it waits out the vendored `Button`'s
        // 250ms ring fade, which an immediate read would miss.
        await settledFocusRing(target, waitFor);
        // Then the half it cannot see — that focus is what *caused* the
        // treatment, rather than a permanent `shadow-sm` sitting underneath it.
        await expect(`${i} changed=${ringSignature(target) !== resting[i]}`).toBe(`${i} changed=true`);
      }
    }
    await userEvent.tab();
    await expect(el.contains(document.activeElement)).toBe(false);

    // The hint's own claim, on the three handles it describes correctly.
    const playhead = thumbInput(el, "playhead-thumb");
    const step = async (input: HTMLInputElement, keys: string, expected: number) => {
      await userEvent.keyboard(keys);
      await waitFor(() => expect(Number(input.value)).toBe(expected));
    };
    playhead.focus();
    await expect(Number(playhead.value)).toBe(61_440);
    await step(playhead, "{ArrowRight}", 61_441);
    await step(playhead, "{ArrowLeft}", 61_440);
    await step(playhead, "{ArrowUp}", 61_441);
    await step(playhead, "{ArrowDown}", 61_440);
    // largeStep is a tenth of the visible window: round(32768 / 10).
    await step(playhead, "{Shift>}{ArrowRight}{/Shift}", 64_717);
    await step(playhead, "{PageDown}", 61_440);
    // Home and End are the window's edges, not the buffer's.
    await step(playhead, "{Home}", 49_152);
    await step(playhead, "{End}", 81_920);

    const regionStart = thumbInput(el, "region-start-thumb");
    regionStart.focus();
    await step(regionStart, "{ArrowRight}", 54_001);
    // End on a two-thumb band means "up to the neighbour", so it collapses the
    // selection instead of running to the end of the audio.
    await step(regionStart, "{End}", 68_499);

    // Nothing answers to Escape, Delete or Backspace: there is no keyboard
    // route to clearing a selection.
    const before = slot(el, "region-status").textContent;
    await userEvent.keyboard("{Escape}{Delete}{Backspace}");
    await expect(slot(el, "region-status").textContent).toBe(before);

    // The fourth handle, where the hint stops being true: one press is one
    // power of two, not one sample.
    const zoom = thumbInput(el, "zoom-thumb");
    zoom.focus();
    await expect(slot(el, "view-readout").textContent).toContain("32,768 samples visible");
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(slot(el, "view-readout").textContent).toContain("16,384 samples visible"));
    // …and its far end is the whole point of the component: one column, one
    // sample. `data-sample-level` is the programmatic form of that claim.
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(root(canvasElement).getAttribute("data-sample-level")).toBe("true"));
    await expect(slot(root(canvasElement), "view-readout").textContent).toContain("1 sample per column");
  },
};

/** A focus treatment has to be *caused* by focus. See `KeyboardOrder`'s description. */
function ringSignature(el: Element) {
  const s = getComputedStyle(el);
  return `${s.outlineStyle}|${s.outlineWidth}|${s.outlineColor}|${s.boxShadow}`;
}

/** An ordinary consumer: every request is applied, which is what makes a key press visible. */
function LiveHost() {
  const [view, setView] = React.useState<WaveformView>({ start: 49_152, end: 81_920 });
  const [region, setRegion] = React.useState<WaveformRegion | null>({
    start: 54_000,
    end: 68_500,
    label: "Breath",
  });
  const [playhead, setPlayhead] = React.useState(61_440);
  return (
    <WaveformEditor
      {...BASE}
      view={view}
      onViewChange={setView}
      region={region}
      onRegionChange={setRegion}
      playhead={playhead}
      onScrub={setPlayhead}
      regionActions={REGION_ACTIONS}
      onRegionAction={() => setRegion(null)}
    />
  );
}

type Request =
  | { kind: "view"; view: WaveformView }
  | { kind: "region"; region: WaveformRegion }
  | { kind: "playhead"; playhead: number }
  | { kind: "action"; id: string; region: WaveformRegion };

type Applied = { view: WaveformView; region: WaveformRegion; playhead: number };

/**
 * The other kind of consumer: this one holds the three controlled values the
 * hard way, recording what the editor asked for and applying it only when told.
 * `LiveHost` above is the same component wired the ordinary way; the pair is
 * what makes "the editor moves nothing on its own" checkable rather than
 * asserted.
 */
function ControlledShell({ initial }: { initial: Applied }) {
  const [applied, setApplied] = React.useState<Applied>(initial);
  const [request, setRequest] = React.useState<Request | null>(null);
  const [, rerender] = React.useReducer((n: number) => n + 1, 0);

  return (
    <div className="flex w-full flex-col gap-3">
      <WaveformEditor
        {...BASE}
        view={applied.view}
        region={applied.region}
        playhead={applied.playhead}
        regionActions={REGION_ACTIONS}
        onViewChange={(view) => setRequest({ kind: "view", view })}
        onRegionChange={(region) => setRequest({ kind: "region", region })}
        onScrub={(playhead) => setRequest({ kind: "playhead", playhead })}
        onRegionAction={(id, region) => setRequest({ kind: "action", id, region })}
      />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span data-testid="request" className="text-foreground font-mono">
          {request ? JSON.stringify(request) : "none"}
        </span>
        <button
          type="button"
          data-testid="apply"
          className="focus-visible:ring-ring rounded border px-2 py-1 focus-visible:ring-2 focus-visible:outline-none"
          onClick={() => {
            if (!request) return;
            setApplied((prev) =>
              request.kind === "view"
                ? { ...prev, view: request.view }
                : request.kind === "region"
                  ? { ...prev, region: request.region }
                  : request.kind === "playhead"
                    ? { ...prev, playhead: request.playhead }
                    : prev,
            );
          }}
        >
          Apply request
        </button>
        <button
          type="button"
          data-testid="rerender"
          className="focus-visible:ring-ring rounded border px-2 py-1 focus-visible:ring-2 focus-visible:outline-none"
          onClick={rerender}
        >
          Re-render
        </button>
      </div>
    </div>
  );
}

/**
 * All three of this component's values are controlled and it holds none of
 * them: there is no `useState` in the file. The host below proves that the hard
 * way, by recording every request and applying it only on demand — and the same
 * shell proves the component's own sharpest pitfall, which is why the window
 * starts cropped to 2,000 samples with the region running 13,500 samples past
 * its right edge.
 *
 * What is asserted, in order:
 *
 * 1. **Interaction alone moves nothing.** ArrowRight on the playhead leaves the
 *    readout at 54,000 while the request records 54,001.
 * 2. **A re-render with unchanged props holds it fixed** — the value comes from
 *    the prop on every render, not from a remembered first one.
 * 3. **Applying the request moves it**, so the pair really is a controlled one
 *    rather than an inert component.
 * 4. **The far boundary is never pushed.** With the region's end off screen its
 *    handle is parked at the window edge and the band reads 54,000–55,000, but
 *    the *fields* still read 54,000 and 68,500 and so does the status line.
 *    Nudging the start handle emits `{ start: 54001, end: 68500 }` — the true
 *    end, not the parked one. This is what `thumbCollisionBehavior="none"` plus
 *    the `activeThumbIndex` check buys, and getting it wrong would silently
 *    rewrite a boundary the user never touched.
 * 5. **A view request is a whole window**, in samples: Fit asks for
 *    `{ start: 0, end: 131072 }` and the rendered zoom does not move until the
 *    host agrees.
 * 6. **A region action carries a snapshot of the region**, not just an id, so a
 *    host does not have to re-derive what was selected when the action fired.
 *
 * The one thing a host cannot reach: there is no `open`/`selection` state to
 * clear. Clearing a selection means passing `region={null}`, and the component
 * gives no callback that asks for it — no Escape, no clear control (see
 * `KeyboardOrder`). A host that wants "click away to deselect" has to build it
 * outside.
 */
export const Controlled: Story = {
  render: () => (
    <ControlledShell
      initial={{
        // Cropped to 2,000 samples with the region running 13,500 past its
        // right edge — the state assertion 4 is about.
        view: { start: 53_000, end: 55_000 },
        region: { start: 54_000, end: 68_500, label: "Breath" },
        playhead: 54_000,
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const el = root(canvasElement);
    const canvas = within(canvasElement);
    const request = () => JSON.parse(canvas.getByTestId("request").textContent || "null");
    const playheadText = () => slot(el, "playhead-readout").textContent;

    // 1. A key press is a request, not a change.
    await expect(playheadText()).toContain("54,000 smp");
    thumbInput(el, "playhead-thumb").focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(request()).toEqual({ kind: "playhead", playhead: 54_001 }));
    await expect(playheadText()).toContain("54,000 smp");

    // 2. …and re-rendering with the same props does not let it slip through.
    await userEvent.click(canvas.getByTestId("rerender"));
    await expect(playheadText()).toContain("54,000 smp");

    // 3. Applying it is what moves the playhead.
    await userEvent.click(canvas.getByTestId("apply"));
    await waitFor(() => expect(playheadText()).toContain("54,001 smp"));

    // 4. The off-screen boundary keeps its real value everywhere it is stated
    //    as a number, and is never written back from the parked handle.
    await expect(slot(el, "region-clipped")).toBeTruthy();
    const band = [thumbInput(el, "region-start-thumb"), thumbInput(el, "region-end-thumb")];
    await expect(band.map((b) => b.value)).toEqual(["54000", "55000"]);
    const fields = Array.from(el.querySelectorAll<HTMLInputElement>('[data-slot="unit-input"] input'));
    await expect(fields.map((f) => f.value)).toEqual(["54000", "68500"]);
    await expect(slot(el, "region-status").textContent).toContain("54,000 to 68,500 samples");

    band[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(request()).toEqual({
        kind: "region",
        region: { start: 54_001, end: 68_500, label: "Breath" },
      }),
    );

    // 5. Zoom requests are windows in samples, and are equally refusable.
    const zoomBefore = slot(el, "view-readout").textContent;
    await userEvent.click(canvas.getByRole("button", { name: "Fit" }));
    await waitFor(() => expect(request()).toEqual({ kind: "view", view: { start: 0, end: SAMPLE_COUNT } }));
    await expect(slot(el, "view-readout").textContent).toBe(zoomBefore);

    // 6. An action arrives with the region it acted on.
    await userEvent.click(canvas.getByRole("button", { name: /^Silence region/ }));
    await waitFor(() =>
      expect(request()).toEqual({
        kind: "action",
        id: "silence",
        region: { start: 54_000, end: 68_500, label: "Breath" },
      }),
    );
  },
};

/**
 * Every text slot this component owns, emptied at once: no `label` on the
 * editor, no `label` on the region, and — in the second panel — no
 * `emptyRegionMessage`.
 *
 * The good half, which is asserted: **nothing that names a control comes from
 * those slots.** Both band handles stay "Region start" and "Region end", both
 * fields stay "Start" and "End" through their `FieldRow` labels, and all four
 * actions keep full names because the template rebuilds them from the offsets —
 * "Silence region 54,000 to 68,500 samples". This is the opposite of the usual
 * `EmptyLabel` finding: there are no icon-only controls here to go unnamed,
 * because the component derives its names from data rather than from copy.
 *
 * The costs, measured and recorded rather than asserted, because each is a
 * caller passing an empty string where the component's default would have done:
 *
 * - **A region with no label loses its only human name.** The `Region` row
 *   simply vanishes from the stat readout — two rows instead of three — and
 *   nothing else in the tree ever carried it. Two saved regions in one session
 *   are then distinguishable only by their offsets.
 * - **`label=""` leaves the root group with no accessible name and no gate sees
 *   it.** `role="group"` is not in any axe name-required rule, so this story
 *   renders green with an unnamed group; the docs' warning that two editors on
 *   one page announce identically is the mild version of the same problem.
 * - **`emptyRegionMessage=""` renders an empty paragraph**, so the one place
 *   the component tells a user what to do next — "Select a region to edit part
 *   of this audio" — becomes blank space with nothing in its place.
 */
export const EmptyLabel: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-6">
      <div data-testid="unnamed">
        <WaveformEditor
          {...BASE}
          label=""
          view={{ start: 49_152, end: 81_920 }}
          region={{ start: 54_000, end: 68_500 }}
          playhead={54_000}
          regionActions={REGION_ACTIONS}
          onRegionChange={() => {}}
          onScrub={() => {}}
          onViewChange={() => {}}
          onRegionAction={() => {}}
        />
      </div>
      <div data-testid="silent-empty">
        <WaveformEditor
          {...BASE}
          view={{ start: 49_152, end: 81_920 }}
          region={null}
          playhead={54_000}
          emptyRegionMessage=""
          onScrub={() => {}}
          onViewChange={() => {}}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const unnamed = root(canvas.getByTestId("unnamed"));

    // Every control keeps a name with no copy to build one from.
    await expect(thumbInput(unnamed, "region-start-thumb").getAttribute("aria-label")).toBe("Region start");
    await expect(thumbInput(unnamed, "region-end-thumb").getAttribute("aria-label")).toBe("Region end");
    await expect(within(unnamed).getByLabelText("Start")).toBeTruthy();
    await expect(within(unnamed).getByLabelText("End")).toBeTruthy();
    const actions = Array.from(
      unnamed.querySelectorAll<HTMLElement>('[data-slot="waveform-editor-region-action"]'),
    ).map((b) => b.getAttribute("aria-label"));
    await expect(actions).toHaveLength(4);
    await expect(new Set(actions).size).toBe(4);
    for (const name of actions) await expect(name).toContain("54,000 to 68,500 samples");

    // The region's own name is the one thing that had nowhere else to live.
    const rows = Array.from(unnamed.querySelectorAll('[data-slot="stat-readout-label"]')).map(
      (n) => n.textContent,
    );
    await expect(rows).toEqual(["Length", "Duration"]);

    // The status line still carries the selection in full, so what is lost is
    // the name, not the selection.
    await expect(slot(unnamed, "region-status").textContent).toContain("Region 54,000 to 68,500 samples");
  },
};

/** 86 characters — a region name a person would really type while editing an interview. */
const LONG_REGION_LABEL =
  "Breath before the second answer, keep for the podcast cut, drop from the vertical reel";

/**
 * An author-supplied region name at 86 characters, in the one slot that takes
 * free text. **The decision is wrap-and-grow: no truncation, no scroll, no
 * ellipsis.** `stat-readout` lays its values into a `grid-cols-[auto_1fr]`
 * column, so a long value takes the width it needs and then a second line —
 * measured, the `Region` value cell is 505px wide and 40px tall against 20px
 * for `Length` and `Duration` beside it, and the whole `dl` stays inside the
 * editor's 576px root with nothing overflowing.
 *
 * That is the right call for this slot: a region name earns its place by being
 * readable, and clipping it to one line would leave two regions named
 * "Breath before the second…" indistinguishable — which is the exact failure
 * this component's whole redundancy posture exists to avoid. The cost is that a
 * pathological label grows the panel rather than being contained by it, and the
 * component sets no ceiling.
 *
 * What the length does *not* reach, and this is the useful half: the label
 * appears in no accessible name anywhere. The band handles stay "Region start"
 * and "Region end", the actions name offsets, and the `role="status"` line
 * announces the selection without it. So the region name is a display-only
 * affordance — a sighted user can tell two regions apart by name and a screen
 * reader user cannot, whatever the caller writes here.
 *
 * `stat-readout`'s copy control is not exercised: this component passes no
 * `copyable` item, and that component's own stories pin those buttons.
 */
export const LongContent: Story = {
  args: {
    ...BASE,
    view: { start: 49_152, end: 81_920 },
    region: { start: 54_000, end: 68_500, label: LONG_REGION_LABEL },
    playhead: 54_000,
    regionActions: REGION_ACTIONS,
    onRegionChange: () => {},
    onScrub: () => {},
    onViewChange: () => {},
    onRegionAction: () => {},
  },
  play: async ({ canvasElement }) => {
    const el = root(canvasElement);
    await expect(LONG_REGION_LABEL.length).toBeGreaterThan(80);

    const values = Array.from(el.querySelectorAll<HTMLElement>('[data-slot="stat-readout-value"]'));
    await expect(values).toHaveLength(3);
    const [length, , region] = values;

    // Whole text present, nothing clipped away.
    await expect(region.textContent).toBe(LONG_REGION_LABEL);
    await expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth);
    await expect(getComputedStyle(region).textOverflow).toBe("clip");

    // Wrap and grow: the long row is taller than its single-line neighbours,
    // and the readout stays inside the root rather than pushing it wide.
    await expect(region.getBoundingClientRect().height).toBeGreaterThan(
      length.getBoundingClientRect().height,
    );
    const list = el.querySelector<HTMLElement>('[data-slot="stat-readout"]')!;
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
    await expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth);

    // The label reaches no accessible name — a long one cannot help a screen
    // reader tell two regions apart.
    await expect(thumbInput(el, "region-start-thumb").getAttribute("aria-label")).toBe("Region start");
    await expect(slot(el, "region-status").textContent).not.toContain("Breath before");
    for (const action of Array.from(
      el.querySelectorAll<HTMLElement>('[data-slot="waveform-editor-region-action"]'),
    )) {
      await expect(action.getAttribute("aria-label")).not.toContain("Breath before");
    }
  },
};

/**
 * 375px, fully wired: twelve controls, four region actions and a 96-column peak
 * strip in a phone column. It fits, and the fit is real rather than a
 * squeezed-desktop artefact — the component carries no `sm:` or `md:` variants
 * at all, so the wrapper narrows exactly what a phone would narrow. (Compare
 * `preset-grid` and `generation-wizard`, where the convention warns the gate's
 * 1200px chromium keeps the wide layout inside the frame.)
 *
 * What the width costs, measured: the toolbar's `flex-wrap` engages and the
 * zoom slider drops to 184px of travel against a 14-stop range, so one arrow
 * press is worth about 13px of thumb movement and dragging the zoom becomes
 * imprecise where the keyboard stays exact. The view readout moves to a line of
 * its own. Everything else holds: all four action buttons stay on one row
 * ending 50px short of the edge, and both boundary fields keep their full 112px.
 *
 * The touch story is worse than the layout story, and nothing gates it. The
 * visible handles are 12×12 (zoom), 8×16 (each region boundary) and 2×94
 * (playhead) — every one of them under WCAG 2.2's 24×24 as drawn. Each carries
 * an `after:-inset-2` pseudo-element, which lifts the hit areas to 28×28, 24×32
 * and 34×94 respectively, so they clear the minimum by 0–4px and only because
 * of that overlay. Axe's `target-size` rule is experimental and off, so this
 * story renders it and no gate reads it.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full" data-testid="viewport">
      <WaveformEditor {...args} />
    </div>
  ),
  args: {
    ...BASE,
    view: { start: 49_152, end: 81_920 },
    region: { start: 54_000, end: 68_500, label: "Breath" },
    playhead: 61_440,
    regionActions: REGION_ACTIONS,
    onRegionChange: () => {},
    onScrub: () => {},
    onViewChange: () => {},
    onRegionAction: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The 375px frame, not the meta's `layout: "centered"` wrapper.
    const viewport = canvas.getByTestId("viewport");
    const el = root(viewport);
    await expect(Math.round(viewport.getBoundingClientRect().width)).toBe(375);
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
    await expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth);

    // Nothing is painted outside the frame either — an overflow check alone
    // would miss an absolutely positioned escape.
    const frame = viewport.getBoundingClientRect();
    for (const node of Array.from(el.querySelectorAll<HTMLElement>('[data-slot^="waveform-editor"]'))) {
      const box = node.getBoundingClientRect();
      await expect(box.left).toBeGreaterThanOrEqual(frame.left - 1);
      await expect(box.right).toBeLessThanOrEqual(frame.right + 1);
    }

    // The toolbar wraps: the readout is on a line below the zoom slider.
    const zoom = slot(el, "zoom");
    const readout = slot(el, "view-readout");
    await expect(readout.getBoundingClientRect().top).toBeGreaterThan(zoom.getBoundingClientRect().bottom);

    // All four actions still share one row.
    const actions = Array.from(
      el.querySelectorAll<HTMLElement>('[data-slot="waveform-editor-region-action"]'),
    );
    await expect(actions).toHaveLength(4);
    const tops = new Set(actions.map((a) => Math.round(a.getBoundingClientRect().top)));
    await expect(tops.size).toBe(1);
    await expect(actions[3].getBoundingClientRect().right).toBeLessThanOrEqual(frame.right);

    // Both boundary fields keep their width, so the digits never clip.
    const fields = Array.from(el.querySelectorAll<HTMLElement>('[data-slot="unit-input"]'));
    for (const field of fields) {
      await expect(Math.round(field.getBoundingClientRect().width)).toBe(112);
    }

    // The peak strip still draws its full column count at this width.
    await expect(slot(el, "peaks").children).toHaveLength(96);
  },
};

/**
 * The three components that draw a time axis, side by side, because H6 exists
 * only as the answer to "why not one of the other two". `gaps.md` R3 is the
 * whole argument: this component was collapsed into H3 `track-lane` during
 * consolidation, "which selects whole clips. Region selection has no equivalent
 * there, and H2's ruler tops out at frames rather than samples."
 *
 * **The choosing rule is the unit of selection, and it is visible on screen.**
 *
 * - **H6 waveform editor** when the thing you are selecting is *part of a
 *   clip*. The unit is one sample; the panel below is zoomed until one drawn
 *   column is one sample, and the selection is 6 samples — 0.14 ms.
 * - **H3 track-lane** when the thing you are selecting is *a clip*.
 *   `selectedClipId` is a whole clip and there is no sub-clip address in the
 *   API; its trim handles move in `trimStep` **seconds**, and its clips are
 *   `{ start, end }` in seconds. It draws a waveform too, which is exactly why
 *   the two were confused: same picture, different noun.
 * - **H2 time-ruler** when you are placing *a moment* rather than selecting a
 *   span, on a timeline shared by several lanes. Its finest addressable unit is
 *   its `snap` — a frame, `1/30`s, in the panel below. At 44.1 kHz that is
 *   1,470 samples, so a single frame of video is 245 times wider than this
 *   component's entire selection. That factor, not a preference, is why the
 *   spec says "the two rulers are not the same ruler at different settings — do
 *   not fold this back into H2".
 *
 * The fourth neighbour is not on screen and is worth naming because the pull is
 * real: **E9 `tts-composer`** is where audio comes *from*. H6's spec boundary is
 * one sentence — "audio editing only. Script-in / audio-out belongs to E9" — and
 * the component enforces it by having no generate, regenerate or voice control
 * anywhere, which is the pitfall its docs page ends on.
 *
 * (A note for whoever reads the source next: both this component's file header
 * and its docs module open by saying H6 has no `component-specs.md` entry. It
 * does — `#h6-waveform-editor`, written fifteen minutes before the wave that
 * built the component landed. The entry above is quoted from it.)
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-[40rem] max-w-full flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">H6 waveform editor — the unit is one sample</p>
        <WaveformEditor
          {...BASE}
          label="Interview take 3 — click at 1:23"
          view={{ start: 61_432, end: 61_448 }}
          region={{ start: 61_436, end: 61_442, label: "Click" }}
          playhead={61_440}
          regionActions={[
            { id: "silence", label: "Silence" },
            { id: "delete", label: "Delete", destructive: true },
          ]}
          onRegionChange={() => {}}
          onScrub={() => {}}
          onViewChange={() => {}}
          onRegionAction={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">H3 track lane — the unit is one clip</p>
        <TrackLane
          name="Dialogue"
          type="waveform"
          duration={12}
          pixelsPerSecond={44}
          selectedClipId="take-3"
          onSelectClip={() => {}}
          onTrimClip={() => {}}
          trimStep={0.1}
          clips={[
            { id: "take-3", label: "Interview take 3", start: 0.5, end: 7.2, peaks: PEAKS.slice(0, 64) },
            { id: "room-tone", label: "Room tone", start: 7.4, end: 11.6, peaks: PEAKS.slice(64, 96) },
          ]}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          H2 time ruler — the unit is one frame (1/30 s = 1,470 samples)
        </p>
        {/* The horizontal scroller belongs to the caller, and axe's
            `scrollable-region-focusable` requires it to be reachable. */}
        <div
          role="region"
          aria-label="Timeline ruler"
          tabIndex={0}
          className="focus-visible:ring-ring w-full overflow-x-auto rounded-lg border focus-visible:ring-2 focus-visible:outline-none"
        >
          <div className="w-max">
            <TimeRuler duration={12} zoom={44} playhead={1.4} snap={1 / 30} onPlayheadChange={() => {}} />
          </div>
        </div>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editor = root(canvasElement);

    // H6 addresses a sample, and says so where a reader can see it.
    await expect(editor.getAttribute("data-sample-level")).toBe("true");
    await expect(slot(editor, "view-readout").textContent).toContain("1 sample per column");
    await expect(slot(editor, "region-status").textContent).toContain("6 samples long");

    // H3's selectable things are two whole clips — there is no address inside
    // one of them anywhere in its API or its DOM.
    const lane = canvasElement.querySelector<HTMLElement>('[data-slot="track-lane"]')!;
    canvas.getByRole("button", { name: "Interview take 3" });
    canvas.getByRole("button", { name: "Room tone" });
    await expect(lane.querySelectorAll('[data-slot="waveform-editor-region-band"]')).toHaveLength(0);

    // H2 places a moment on a shared timeline, in seconds.
    const ruler = canvasElement.querySelector<HTMLElement>('[data-slot="time-ruler"]')!;
    await expect(ruler.querySelector('[aria-label="Playhead"]')).toBeTruthy();
  },
};
