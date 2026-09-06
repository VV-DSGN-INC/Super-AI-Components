import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { TimeRuler, TimeRulerPlayhead } from "@/registry/super-ai/time-ruler";
import { TrackLane } from "@/registry/super-ai/track-lane";
import { WaveformEditor } from "@/registry/super-ai/waveform-editor";
import { TimeRulerDocs } from "@/content/components/time-ruler.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

/**
 * The horizontal scroller belongs to the caller — it is what keeps the ruler
 * and the track lanes moving together — so every story supplies one, focusable
 * as axe's `scrollable-region-focusable` requires.
 */
function Scroller({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="focus-visible:ring-ring w-full overflow-x-auto rounded-lg border focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="w-max">{children}</div>
    </div>
  );
}

function Lane({ title }: { title: string }) {
  return (
    <div className="bg-background flex h-10 items-center border-b">
      <span className="bg-primary/15 text-foreground mx-1 flex h-8 flex-1 items-center rounded px-2 text-xs">
        {title}
      </span>
    </div>
  );
}

const meta: Meta<typeof TimeRuler> = {
  title: "Super AI/Time Ruler",
  component: TimeRuler,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TimeRulerDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[40rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    duration: 90,
    zoom: 40,
    playhead: 21,
    onPlayheadChange: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TimeRuler>;

const ZOOMS = [
  { zoom: 8, label: "Whole clip — 8 px/s" },
  { zoom: 40, label: "Seconds — 40 px/s" },
  { zoom: 160, label: "Frames — 160 px/s" },
];

/**
 * One number changes. Ticks subdivide, labels thin out rather than colliding —
 * neither density is authored anywhere.
 */
export const ZoomLevels: Story = {
  args: { zoom: 8 },
  render: (args) => (
    <div className="flex flex-col gap-4">
      {ZOOMS.map(({ zoom, label }) => (
        <div key={zoom} className="flex flex-col gap-1">
          <span className="text-foreground text-xs">{label}</span>
          <Scroller label={label}>
            <TimeRuler {...args} zoom={zoom} />
          </Scroller>
        </div>
      ))}
    </div>
  ),
};

/** A half-second grid. Every value the ruler reports lands on it. */
export const Snap: Story = {
  args: { zoom: 40, snap: 0.5, playhead: 21.5 },
  render: (args) => (
    <Scroller label="Timeline, snapping to half seconds">
      <TimeRuler {...args} />
    </Scroller>
  ),
};

/**
 * In and out are a second layer with their own two values — moving them never
 * seeks, and seeking never moves them.
 */
export const InOutRange: Story = {
  args: { zoom: 20, playhead: 30, inPoint: 12, outPoint: 54, onRangeChange: () => {} },
  render: (args) => (
    <Scroller label="Timeline with an export range">
      <TimeRuler {...args} style={{ "--time-ruler-playhead-height": "112px" } as CSSProperties} />
      <Lane title="Interview A — take 3" />
      <Lane title="Room tone" />
    </Scroller>
  ),
};

/** Mid-seek: the timecode is text, and it is announced. */
export const Scrubbing: Story = {
  args: { zoom: 40, playhead: 21.4, scrubbing: true },
  render: (args) => (
    <Scroller label="Timeline, scrubbing">
      <TimeRuler {...args} style={{ "--time-ruler-playhead-height": "112px" } as CSSProperties} />
      <Lane title="Interview A — take 3" />
      <Lane title="Room tone" />
    </Scroller>
  ),
};

/* -------------------------------------------------------------------------
 * Case stories — the situations a ruler meets in an editor, as opposed to the
 * four declared states above. See docs/design-system/story-conventions.md.
 *
 * Seven of the eight are written. One is not:
 *
 * // case-skip: ReducedMotion — read back off all 245 elements under the root: one transitionProperty that is not "all"/"none", zero animationNames
 * The measurement, taken in a play function and then deleted rather than
 * shipped as a story: walking `root.querySelectorAll("*")` and reading
 * `animationName` / `transitionProperty` / `transitionDuration` off every one
 * of the 245 elements a ruler with ticks, labels, a playhead and a range
 * renders returns a single hit — `transition-[color,box-shadow]` at 0.15s on
 * `time-ruler-scrub-thumb`. That is a colour-and-ring crossfade on a control
 * that does not move, which `story-conventions.md` records under
 * `reset-affordance` as the case not worth a story. Everything that does move
 * here moves by direct manipulation: the playhead line is an inline
 * `left: timeToPixels(...)` recomputed on render, and the three slider thumbs
 * are positioned by Base UI per value with no transition of their own. The
 * component imports no `ui/` primitive at all — it is the one registry item
 * declaring `npm: ["@base-ui/react"]` — so the vendored `Button`'s
 * `transition-all` press nudge (`CONTINUE.md` §8, D/I wave) never reaches it
 * either. `vitest.config.ts` already emulates reduce for every test, so a
 * story here would render pixel-for-pixel like `Scrubbing`.
 * ---------------------------------------------------------------------- */

/** The centre of an element, in viewport pixels. */
function centreX(el: Element): number {
  const box = el.getBoundingClientRect();
  return box.left + box.width / 2;
}

/** How far into its own box an element sits. The only comparison that survives
 *  a scroll container, which every story here has. */
function offsetWithin(el: Element, container: Element): number {
  return el.getBoundingClientRect().left - container.getBoundingClientRect().left;
}

/** Focus lands on the `<input type="range">` Base UI renders inside a thumb,
 *  never on the thumb itself. */
function handle(root: ParentNode, slot: string): HTMLInputElement {
  return root.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!.querySelector<HTMLInputElement>("input")!;
}

/**
 * A ruler is the most directional thing in the catalog, and under `dir="rtl"`
 * it splits down the middle: **the layer it draws stays physical, and the two
 * layers Base UI positions mirror.** Each half is internally consistent, and
 * together they describe opposite timelines.
 *
 * **What holds, and is asserted below.** The drawn layer — ticks, labels and
 * the playhead line — is `left: timeToPixels(time, zoom)` throughout, so it
 * ignores direction entirely: the line at 0:21 sits on the 21s tick in LTR and
 * in RTL alike, and time still runs left to right. That is the coordinate
 * model doing its job, and it is what H3 `track-lane` places clips against, so
 * a stack cannot drift.
 *
 * **What does not, measured at `duration=90`, `zoom=40`, `playhead=21`,
 * `inPoint=12`, `outPoint=54` in a 3600px ruler. Recorded, not asserted:**
 *
 * 1. *The scrub thumb leaves the line it drags.* Base UI positions a thumb
 *    with `insetInlineStart`, a CSS logical property that mirrors from the
 *    element's own computed direction. The line does not mirror. Measured from
 *    the ruler's left edge: the line at 839px, the thumb at 2742px — **1903px
 *    apart on a 3600px ruler.** Same shape as F5 `compare-viewer`'s wipe
 *    handle (`CONTINUE.md` §8, F wave), one layer further out: there the seam
 *    was a `clipPath`, here it is an inline `left`.
 *
 * 2. *…and the keys move the two in opposite directions.* `SliderThumb` reads
 *    `useDirection()` for its arrow mapping, no `DirectionProvider` is mounted
 *    anywhere in this repo, and `dir` on a wrapper is invisible to React
 *    context — wave 1's `mode-tabs` finding, reached through a different part.
 *    Measured under `dir="rtl"`: ArrowRight reports `21.5`, so the line moves
 *    right while the thumb that reported it paints further left.
 *
 * 3. *The same fallback shifts the mirrored thumb by its own width.*
 *    `thumbStyle` centres with `translate: ${(!rtl ? -1 : 1) * 50}%` off that
 *    context value, so with the context saying LTR and the CSS saying RTL the
 *    scrub thumb's centre lands a full 12px thumb from the 23.33% point it is
 *    anchored to, and the 8px range handles land 8px off theirs.
 *
 * 4. *The range band paints over the wrong seconds.* It mirrors with its
 *    thumbs, so a 12s–54s export range measures across the ticks labelled 36
 *    to 78 — the band and the labels under it are a flat contradiction.
 *
 * 5. *The scroller opens at the end of the timeline.* An `overflow-x-auto` box
 *    in RTL starts at its right edge, which here is 1:30 rather than 0:00.
 *    A caller consequence rather than a component one, and still the first
 *    thing an RTL user sees.
 *
 * **Why no class was swept.** `pl-1` on the label and `left-2` on the timecode
 * bubble are exactly the byte-identical `ps-`/`start-` swaps the §8 sweep
 * sanctions, and both are deliberately left physical: each pairs with an
 * inline `left`, which has no logical form, so changing the class — the only
 * half a class change can reach — would move the label's text to the far side
 * of the tick it names and the bubble to the far side of its own line. That is
 * F5's rule applied: swap when every participant in the layout is a class, and
 * check what else decides the side before you do.
 */
export const RTL: Story = {
  args: { inPoint: 12, outPoint: 54, onRangeChange: () => {} },
  render: (args) => (
    <div className="flex flex-col gap-6">
      <div dir="ltr" data-testid="ltr" className="flex flex-col gap-1">
        <span className="text-foreground text-xs">Left to right</span>
        <Scroller label="Timeline, left to right">
          <TimeRuler {...args} />
        </Scroller>
      </div>
      <div dir="rtl" data-testid="rtl" className="flex flex-col gap-1">
        <span className="text-foreground text-xs">Right to left</span>
        <Scroller label="Timeline, right to left">
          <TimeRuler {...args} />
        </Scroller>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frames = ["ltr", "rtl"].map(
      (dir) => canvasElement.querySelector<HTMLElement>(`[data-testid="${dir}"]`)!,
    );

    for (const frame of frames) {
      const root = frame.querySelector<HTMLElement>('[data-slot="time-ruler"]')!;
      const line = root.querySelector<HTMLElement>('[data-slot="time-ruler-playhead"]')!;
      const tick = root.querySelector<HTMLElement>('[data-slot="time-ruler-tick"][data-time="21"]')!;

      // The drawn layer is direction-blind, so it agrees with itself in both:
      // the line at 0:21 lands on the tick at 21s either way. This is the
      // guarantee H3 `track-lane` composes against.
      await expect(Math.abs(centreX(line) - centreX(tick))).toBeLessThan(1.5);

      // …and time still runs left to right under RTL: tick 0 is the leftmost.
      const ticks = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="time-ruler-tick"]'));
      await expect(ticks[0].getAttribute("data-time")).toBe("0");
      await expect(offsetWithin(ticks[0], root)).toBeLessThan(offsetWithin(ticks.at(-1)!, root));
    }

    // In LTR the thumb sits on the line it drags. The RTL pair is measured in
    // the description and deliberately not asserted: it is a defect, and
    // pinning one green is the forbidden move.
    const ltrRoot = frames[0].querySelector<HTMLElement>('[data-slot="time-ruler"]')!;
    await expect(
      Math.abs(
        centreX(ltrRoot.querySelector('[data-slot="time-ruler-scrub-thumb"]')!) -
          centreX(ltrRoot.querySelector('[data-slot="time-ruler-playhead"]')!),
      ),
    ).toBeLessThan(1.5);
  },
};

/** A host that applies what it is told, so a keyboard walk shows the value
 *  actually moving rather than a callback firing into nothing. */
function SeekingHost({
  initialPlayhead,
  initialRange,
  ...args
}: React.ComponentProps<typeof TimeRuler> & {
  initialPlayhead: number;
  initialRange: { in: number; out: number };
}) {
  const [playhead, setPlayhead] = React.useState(initialPlayhead);
  const [range, setRange] = React.useState(initialRange);
  return (
    <Scroller label="Timeline, keyboard walk">
      <TimeRuler
        {...args}
        playhead={playhead}
        onPlayheadChange={setPlayhead}
        inPoint={range.in}
        outPoint={range.out}
        onRangeChange={setRange}
      />
    </Scroller>
  );
}

/**
 * Three tab stops in DOM order — playhead, in point, out point — behind the
 * caller's scroll container, which is the component's documented pitfall
 * showing up as a keyboard fact rather than as advice. Each stop is a real
 * `<input type="range">`, so this asserts the native slider contract rather
 * than counting stops: `step` is the `snap`, `largeStep` is ten of them on
 * Shift+arrow and Page Up/Down, and Home/End run to the ends.
 *
 * **No focus ring is asserted, and that is a finding rather than an
 * omission.** `story-conventions.md`'s fact 5 says to reach for
 * `settledFocusRing`; run against this component it returns `true`, and it is
 * wrong, so calling it here would have manufactured exactly the green it was
 * written to prevent. Measured: `focus-visible:ring-3` sits on the thumb
 * `<div>`, focus lands on the `<input>` Base UI renders inside it, and the div
 * never matches `:focus-visible` — its `boxShadow` reads the string `"none"`
 * while its input is focused. What the helper finds instead is that input's UA
 * outline (`outline: auto 1px`), on an element Base UI styles
 * `position: fixed; clip-path: inset(50%)`, so the outline is clipped away to
 * nothing. **`hasVisibleFocusRing` cannot see a clip** — a hole none of the
 * F wave's four measurements covered. The effect is that no handle paints
 * anything a keyboard user can see, and the docs page's focus bullet ("All
 * three handles ship a visible `focus-visible:ring-3`") is wrong. Third
 * instance of the shape, after F5 `compare-viewer`'s wipe handle.
 *
 * **Two more measurements left unasserted.** End on the in handle does not
 * stop one step short of the out point as the docs keyboard list says; it
 * lands exactly on it and reports `{in: 54, out: 54}`, because
 * `minStepsBetweenValues` is left at 0. Home on the out handle collapses the
 * range the same way from the other side, so one keypress produces a
 * zero-length export range with no keyboard route back. The same list's
 * "neither reaches 0 or `duration`" is wrong in the other direction too: Home
 * on the in handle reports 0 and End on the out handle reports 90. Only the
 * clamp's *direction* is asserted below, since that part holds either way.
 */
export const KeyboardOrder: Story = {
  args: { snap: 0.5 },
  render: (args) => <SeekingHost {...args} initialPlayhead={21} initialRange={{ in: 12, out: 54 }} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="time-ruler"]')!;
    const region = canvasElement.querySelector<HTMLElement>('[role="region"]')!;

    const playhead = handle(root, "time-ruler-scrub-thumb");
    const inPoint = handle(root, "time-ruler-in-handle");
    const outPoint = handle(root, "time-ruler-out-handle");

    // 1. Every handle carries its own name and speaks a timecode rather than a
    //    seconds count. Three names, no duplicates.
    const names = (await canvas.findAllByRole("slider")).map((el) => el.getAttribute("aria-label"));
    await expect(names).toEqual(["Playhead", "In point", "Out point"]);
    await expect(playhead.getAttribute("aria-valuetext")).toBe("0:21.00");

    // 2. The walk: the caller's scroller, then the three handles, then out.
    //    Settled on departure rather than on arrival — Base UI blurs and
    //    refocuses the input to restore `:focus-visible`, so an immediate read
    //    can return the previous stop (`story-conventions.md`, fact 4).
    let previous: Element | null = document.activeElement;
    for (const stop of [region, playhead, inPoint, outPoint]) {
      const from = previous;
      await userEvent.tab();
      await waitFor(() => expect(document.activeElement).not.toBe(from));
      await expect(document.activeElement).toBe(stop);
      await expect(stop.matches(":focus-visible")).toBe(true);
      previous = stop;
    }
    await userEvent.tab();
    await waitFor(() => expect(root.contains(document.activeElement)).toBe(false));

    // 3. The slider contract on the playhead. `step` is the `snap`;
    //    `largeStep` is ten of them.
    const seek = async (keys: string) => {
      playhead.focus();
      await userEvent.keyboard(keys);
      return Number(playhead.value);
    };
    await expect(playhead.step).toBe("0.5");
    await expect(await seek("{ArrowRight}")).toBe(21.5);
    await expect(await seek("{ArrowLeft}")).toBe(21);
    await expect(await seek("{Shift>}{ArrowRight}{/Shift}")).toBe(26);
    await expect(await seek("{PageDown}")).toBe(21);
    await expect(await seek("{Home}")).toBe(0);
    await expect(await seek("{End}")).toBe(90);

    // 4. The range handles clamp against each other rather than against the
    //    timeline. Asserted as a direction — in never passes out — because
    //    where exactly it stops contradicts the docs page; see above.
    inPoint.focus();
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(Number(inPoint.value)).toBeGreaterThan(12));
    await expect(Number(inPoint.value)).toBeLessThanOrEqual(Number(outPoint.value));
  },
};

function ControlledHost(args: React.ComponentProps<typeof TimeRuler>) {
  const [seeks, setSeeks] = React.useState<number[]>([]);
  const [range, setRange] = React.useState("");
  const [renders, setRenders] = React.useState(1);
  return (
    <div className="flex flex-col gap-2">
      <Scroller label="Timeline the host refuses to move">
        <TimeRuler
          {...args}
          playhead={21.37}
          inPoint={12}
          outPoint={54}
          onPlayheadChange={(time) => setSeeks((all) => [...all, time])}
          onRangeChange={({ in: start, out }) => setRange(`${start}/${out}`)}
        />
      </Scroller>
      <p className="text-muted-foreground text-xs">
        Seeks reported: <span data-testid="seeks">{seeks.join(",")}</span> · range reported:{" "}
        <span data-testid="range">{range}</span> · renders: <span data-testid="renders">{renders}</span>
      </p>
      <button
        type="button"
        data-testid="rerender"
        className="focus-visible:ring-ring self-start rounded border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
        onClick={() => setRenders((n) => n + 1)}
      >
        Re-render with the same playhead
      </button>
    </div>
  );
}

/**
 * The host holds `playhead` and refuses to move it — which is the only mode
 * this component has. There is no uncontrolled fallback, so a consumer who
 * forgets to apply `onPlayheadChange` ships a ruler that reports every seek
 * and performs none. Both routes into the value are driven here: a press on
 * the ruler body, which is the whole reason the `time-ruler-scrub` layer
 * covers the full width, and an arrow key.
 *
 * **The payload is snapped; the prop is not.** `playhead` is `21.37` against a
 * half-second `snap`, and the line is drawn at exactly 21.37 — the component
 * will not quietly move a controlled value onto its own grid, because that
 * would make the prop lie. The consequence shows up in the first keypress:
 * Base UI rounds the *current* value to the step grid before adding a step, so
 * ArrowRight from 21.37 reports 22 rather than 21.87. The first press is worth
 * 0.63s and every one after it 0.5s; a host that applies what it is handed
 * lands on the grid and stays there.
 *
 * The rendered position is read back as `data-time` rather than as a pixel
 * offset: every story here lives in a scroll container, and a viewport
 * rectangle moves whenever focus scrolls the box, so it would prove nothing.
 */
export const Controlled: Story = {
  args: { snap: 0.5 },
  render: (args) => <ControlledHost {...args} />,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="time-ruler"]')!;
    const line = root.querySelector<HTMLElement>('[data-slot="time-ruler-playhead"]')!;
    const seeks = canvasElement.querySelector<HTMLElement>('[data-testid="seeks"]')!;
    const control = root.querySelector<HTMLElement>('[data-slot="time-ruler-scrub"]')!
      .firstElementChild as HTMLElement;

    await expect(line.getAttribute("data-time")).toBe("21.37");

    // 1. A press on the ruler body seeks, and reports seconds: 400px at
    //    40px/s is 0:10, already on the half-second grid the caller asked for.
    const box = root.getBoundingClientRect();
    await userEvent.pointer([
      { keys: "[MouseLeft>]", target: control, coords: { x: box.left + 400, y: box.top + 16 } },
      { keys: "[/MouseLeft]", target: control },
    ]);
    await waitFor(() => expect(seeks.textContent).toBe("10"));

    // 2. …and the rendered playhead did not move, because the host did not
    //    move it. Interaction alone changes nothing here.
    await expect(line.getAttribute("data-time")).toBe("21.37");

    // 3. The keyboard reports through the same callback, snapped the same way,
    //    and the announced value stays on the prop rather than on the grid.
    const playhead = handle(root, "time-ruler-scrub-thumb");
    playhead.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(seeks.textContent).toBe("10,22"));
    await expect(playhead.getAttribute("aria-valuetext")).toBe("0:21.37");
    await expect(line.getAttribute("data-time")).toBe("21.37");

    // 4. The range is a second controlled pair with a payload of its own, and
    //    none of the seeking above touched it.
    handle(root, "time-ruler-in-handle").focus();
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-testid="range"]')!.textContent).toBe("11.5/54"),
    );

    // 5. Re-rendering with an unchanged `playhead` holds the component fixed.
    await userEvent.click(canvasElement.querySelector<HTMLElement>('[data-testid="rerender"]')!);
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-testid="renders"]')!.textContent).toBe("2"),
    );
    await expect(line.getAttribute("data-time")).toBe("21.37");
    await expect(playhead.getAttribute("aria-valuetext")).toBe("0:21.37");
  },
};

/**
 * Every text this component shows is optional, and dropping each one costs
 * something different.
 *
 * **`TimeRulerPlayhead` without `label`** — the form a shell uses to run the
 * line down a stack of lanes — is a 2px `<div>` with no role, no text and one
 * `aria-hidden` diamond inside it. It contributes nothing to the accessibility
 * tree, which is correct: the value belongs to the ruler's slider, and a
 * second announcement of the same number would be noise. Pass `label` and the
 * same element gains a `role="status"`, so a shell that labels every playhead
 * it draws ends up with one live region per lane.
 *
 * **The root has no name, and no `role` for a name to attach to.** The three
 * handle names are fixed strings from `getAriaLabel`, and the assertion below
 * is the consequence: putting `aria-label` on a ruler root — the remedy the
 * docs page recommends — leaves its thumb called "Playhead", identical to the
 * unlabelled ruler beneath it. Two rulers on a page therefore offer a
 * screen-reader user two sliders called "Playhead", two called "In point" and
 * two called "Out point", with nothing to say which timeline each belongs to.
 * The escape hatch that does work is the one every story here already uses for
 * the scroll container: a labelled `role="region"` around each ruler, which
 * axe requires anyway.
 */
export const EmptyLabel: Story = {
  args: { playhead: 21 },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <Scroller label="Dialogue timeline">
        <TimeRuler {...args} aria-label="Dialogue timeline" />
      </Scroller>
      <Scroller label="Music timeline">
        <TimeRuler {...args} playhead={44} />
      </Scroller>

      <div className="flex gap-4">
        <figure className="flex flex-col gap-1">
          <figcaption className="text-muted-foreground text-xs">Playhead, no label</figcaption>
          <div data-testid="bare" className="relative h-10 w-40 rounded border">
            <TimeRulerPlayhead time={2} zoom={40} />
          </div>
        </figure>
        <figure className="flex flex-col gap-1">
          <figcaption className="text-muted-foreground text-xs">Playhead with a label</figcaption>
          <div data-testid="labelled" className="relative h-10 w-40 rounded border">
            <TimeRulerPlayhead time={1} zoom={40} label="0:01.00" />
          </div>
        </figure>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. A name on the root does not reach the handles: the ruler labelled
    //    "Dialogue timeline" still offers a slider called "Playhead", the same
    //    name as the unlabelled ruler below it.
    const rulers = Array.from(canvasElement.querySelectorAll('[data-slot="time-ruler"]'));
    await expect(rulers.map((el) => el.getAttribute("aria-label"))).toEqual(["Dialogue timeline", null]);
    await expect(await canvas.findAllByRole("slider", { name: "Playhead" })).toHaveLength(2);

    // 2. The label-less playhead is silent by design; labelling it is what
    //    creates a live region.
    const bare = canvasElement.querySelector<HTMLElement>('[data-testid="bare"]')!;
    const bareLine = bare.querySelector<HTMLElement>('[data-slot="time-ruler-playhead"]')!;
    await expect(bareLine.getAttribute("role")).toBeNull();
    await expect(bareLine.textContent).toBe("");
    await expect(bare.querySelector('[role="status"]')).toBeNull();

    const labelled = canvasElement.querySelector<HTMLElement>('[data-testid="labelled"]')!;
    await expect(labelled.querySelector('[role="status"]')!.textContent).toBe("0:01.00");
  },
};

/** ~90 characters of slate — the shape a real `formatTime` takes when an
 *  editor wants the reel and the take beside the timecode. */
const SLATE = (seconds: number) =>
  `Reel 2 · scene 4 · interview A take 3 · ${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(1)}s · flagged in the rough cut review pass`;

/**
 * `formatTime` is the only author-supplied text this component has, and it
 * reaches two places — every tick label, and the timecode bubble. Both make a
 * decision, and neither is the one a reader would guess.
 *
 * **The labels do not thin out.** `MIN_LABEL_GAP_PX` is the entire mechanism
 * behind the spec's "labels thin out rather than overlapping", and it is
 * measured in *interval pixels* — `timeToPixels(candidate, zoom) >= 64` —
 * never against the text a label renders. The assertion below states that
 * directly: the ruler with a 90-character formatter reports the same
 * `data-label-interval` and `data-tick-interval` as the one above it with the
 * default timecode, because zoom is identical and the formatter is not an
 * input to the ladder at all. What it costs, measured at `zoom=40` where the
 * label interval is 2s (80px): an 87-character slate label is 409px wide, so
 * **44 of the 46 labels overlap the next one** and the scale is unreadable.
 * There is no truncation, no wrap and no `max-width` — the labels are
 * absolutely positioned spans that run straight over each other.
 *
 * **The bubble wraps into a column.** Its containing block is the playhead
 * line, which is `w-0.5`, and it is offset from it with `left-2`; with no
 * width available to shrink to fit, the used width collapses to the widest
 * unbreakable word. Measured: the slate renders 63×212 where the default
 * timecode is 57×20, hanging ten lines down over the tracks and putting a
 * vertical scrollbar on the caller's `overflow-x-auto` scroller, which
 * computes `overflow-y: auto` alongside it. The default survives only because
 * `0:21.40` contains no space and so has nothing to break on. Any formatter
 * with a space in it wraps.
 */
export const LongContent: Story = {
  args: { duration: 90, zoom: 40, playhead: 21.4, scrubbing: true },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1" data-testid="timecode">
        <span className="text-foreground text-xs">Default timecode</span>
        <Scroller label="Timeline with the default timecode">
          <TimeRuler {...args} />
        </Scroller>
      </div>
      <div className="flex flex-col gap-1" data-testid="slate">
        <span className="text-foreground text-xs">A 90-character slate</span>
        <Scroller label="Timeline with a slate formatter">
          <TimeRuler {...args} formatTime={SLATE} />
        </Scroller>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const rulers = ["timecode", "slate"].map(
      (id) =>
        canvasElement
          .querySelector<HTMLElement>(`[data-testid="${id}"]`)!
          .querySelector<HTMLElement>('[data-slot="time-ruler"]')!,
    );

    // 1. The formatter is not an input to the density ladder. Same zoom, same
    //    tick and label intervals, whatever the labels turn out to say.
    await expect(SLATE(21.4).length).toBeGreaterThan(80);
    await expect(rulers[1].getAttribute("data-label-interval")).toBe(
      rulers[0].getAttribute("data-label-interval"),
    );
    await expect(rulers[1].getAttribute("data-tick-interval")).toBe(
      rulers[0].getAttribute("data-tick-interval"),
    );

    // 2. The bubble's containing block is the 2px line, which is why a label
    //    with a space in it collapses to min-content and wraps into a column
    //    rather than running along the ruler.
    const line = rulers[1].querySelector<HTMLElement>('[data-slot="time-ruler-playhead"]')!;
    const bubble = rulers[1].querySelector<HTMLElement>('[data-slot="time-ruler-playhead-time"]')!;
    await expect(bubble.offsetParent).toBe(line);
    await expect(Math.round(line.getBoundingClientRect().width)).toBe(2);

    // 3. …so the decision it makes is to wrap, not to truncate or to run
    //    along the ruler: against the default timecode's single 57×20 line the
    //    slate collapses narrower and ten times taller, and pushes the
    //    caller's `overflow-x-auto` scroller — which computes
    //    `overflow-y: auto` alongside it — into scrolling vertically as well.
    const plain = rulers[0].querySelector<HTMLElement>('[data-slot="time-ruler-playhead-time"]')!;
    await expect(bubble.getBoundingClientRect().height).toBeGreaterThan(
      plain.getBoundingClientRect().height * 3,
    );
    await expect(bubble.getBoundingClientRect().width).toBeLessThan(plain.getBoundingClientRect().width * 2);
    const region = canvasElement
      .querySelector<HTMLElement>('[data-testid="slate"]')!
      .querySelector<HTMLElement>('[role="region"]')!;
    await expect(region.scrollHeight).toBeGreaterThan(region.clientHeight);
  },
};

/**
 * 375px, wrapper-constrained rather than `parameters.viewport`, and this is
 * one of the few components where the wrapper really is the phone case rather
 * than a wide layout squeezed narrow: `time-ruler.tsx` carries no `sm:` or
 * `md:` variant, so nothing in its layout is waiting on a breakpoint the
 * gate's 1200px chromium would satisfy anyway.
 *
 * A ruler is `duration × zoom` wide by definition — 3600px here — so the
 * question is never whether it fits but **who scrolls**. Not the page: the
 * 375px frame measures `scrollWidth === clientWidth`, and the 3626px of ruler
 * lives inside the caller's scroll container. That is why the container is the
 * caller's responsibility and why every story here gives it a role, a name and
 * a tab stop; without them axe fails `scrollable-region-focusable` on the
 * consumer's page rather than on this component.
 *
 * **Touch targets, measured.** All three handles are much smaller than a
 * finger and all three carry `after:-inset-2` to make up the difference. It
 * works for the playhead — a 12×12 thumb with a 24×24 pointer target, exactly
 * WCAG 2.2's minimum — and falls 4px short for the range: the 8×16 handles
 * expand to 20×28, under 24 on the axis you drag them along. Axe's
 * `target-size` rule is experimental and off, so nothing in CI sees it;
 * recorded here beside I5 `drawing-tools` and A11 `reset-affordance` in
 * `CONTINUE.md` §8, which are the same class of miss.
 *
 * One smaller measurement: the last label sits at the last tick and runs 26px
 * past the root's own right edge, so the scrollable extent is 3626px against a
 * 3600px ruler. Harmless, and the reason the two never quite match.
 */
export const Mobile: Story = {
  args: { playhead: 21, inPoint: 12, outPoint: 54, onRangeChange: () => {} },
  render: (args) => (
    <div data-testid="phone" className="w-[375px] max-w-full">
      <Scroller label="Timeline">
        <TimeRuler {...args} />
      </Scroller>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Measured on the 375px frame, not on `canvasElement.firstElementChild` —
    // `layout: "centered"` wraps every story, and that wrapper is ~1200px.
    const phone = canvasElement.querySelector<HTMLElement>('[data-testid="phone"]')!;
    const region = phone.querySelector<HTMLElement>('[role="region"]')!;
    const root = phone.querySelector<HTMLElement>('[data-slot="time-ruler"]')!;

    await expect(phone.clientWidth).toBe(375);
    await expect(phone.scrollWidth).toBe(phone.clientWidth);

    // The scroll is the caller's, and it is reachable and named.
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
    await expect(region.tabIndex).toBe(0);
    await expect(region.getAttribute("aria-label")).toBe("Timeline");
    // Nothing scrolls vertically: the playhead is the ruler's own height here.
    await expect(region.scrollHeight).toBe(region.clientHeight);

    // The playhead's pointer target is 24×24 even though the thumb is 12×12.
    const thumb = root.querySelector<HTMLElement>('[data-slot="time-ruler-scrub-thumb"]')!;
    const hit = getComputedStyle(thumb, "::after");
    await expect(Math.round(thumb.getBoundingClientRect().width)).toBe(12);
    await expect(Number.parseFloat(hit.width)).toBeGreaterThanOrEqual(24);
    await expect(Number.parseFloat(hit.height)).toBeGreaterThanOrEqual(24);
  },
};

const LANE_CLIPS = [
  { id: "c1", label: "Interview A — take 3", start: 0, end: 34, text: "…and that was the plan." },
  { id: "c2", label: "Room tone", start: 34, end: 90, text: "Room tone" },
];

const PEAKS = Array.from({ length: 192 }, (_, i) => {
  const t = i / 192;
  const breath = t > 0.42 && t < 0.52 ? 0.08 : 1;
  return Math.abs(Math.sin(t * 26)) * (0.35 + 0.6 * Math.sin(Math.PI * t)) * breath;
});

/**
 * Two neighbours, and the rule for each is different in kind.
 *
 * **Against H6 `waveform-editor` — a genuine twin, and the spec says do not
 * merge them.** Both are a scale with a playhead and a draggable range; the
 * difference is what a position *is*. This ruler counts seconds: `zoom` is
 * pixels per second, the interval ladder bottoms out at 0.04s — one frame —
 * and the selection it owns is an export range over a whole timeline. The
 * waveform editor counts samples: `sampleCount` and `sampleRate` in, a sample
 * window as its view, and zoom that runs until one column is one sample, which
 * is three orders of magnitude past anything on this ladder. Reach for the
 * waveform editor when the edit is *inside* one clip — a plosive, a breath, a
 * click — and for this when the edit is *across* clips.
 *
 * **Against H3 `track-lane` — not a twin at all, the other half.** They share
 * one coordinate model, and the assertion below proves it: a clip starting at
 * 0:34 sits the same distance into the lane's track as the 34s tick sits into
 * the ruler, because both are `time × pixelsPerSecond`. What they do not share
 * is an origin — the lane's header gutter is a private constant — so a shell
 * has to indent the ruler by hand to line them up, which `CONTINUE.md` §8
 * records as a composition gap.
 *
 * **And the gap §8 records against this component, shown rather than
 * restated:** `TimeRuler` always draws its own playhead and offers no opt-out,
 * so a shell rendering the exported `TimeRulerPlayhead` down the whole stack —
 * the composition the spec's "the playhead spans every track" asks for — ends
 * up with two elements at the same x, one 31px tall inside the ruler and one
 * running the full height over the lanes. That they agree is the point of
 * exporting the maths, and it is what is asserted. But a shell that wants a
 * differently-styled line, or none at all above the tracks, cannot have one.
 * Not re-filed and not fixed here: see `CONTINUE.md` §8, "Smaller, but real".
 */
export const Boundary: Story = {
  args: { duration: 90, zoom: 40, playhead: 21 },
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          H2 time ruler with H3 track lane — seconds, across clips
        </p>
        <Scroller label="Edit timeline">
          <div className="relative" data-testid="stack">
            <TimeRuler {...args} />
            <TrackLane name="Dialogue" type="text" clips={LANE_CLIPS} duration={90} pixelsPerSecond={40} />
            <TimeRulerPlayhead time={21} zoom={40} />
          </div>
        </Scroller>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">H6 waveform editor — samples, inside one clip</p>
        <WaveformEditor
          label="Interview A — take 3"
          peaks={PEAKS}
          sampleCount={131_072}
          sampleRate={44_100}
          view={{ start: 61_432, end: 61_448 }}
          region={{ start: 61_436, end: 61_442, label: "Plosive" }}
          playhead={61_440}
          onRegionChange={() => {}}
          onScrub={() => {}}
          onViewChange={() => {}}
        />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const stack = canvasElement.querySelector<HTMLElement>('[data-testid="stack"]')!;
    const root = stack.querySelector<HTMLElement>('[data-slot="time-ruler"]')!;

    // 1. One coordinate model: 0:34 is the same distance into the lane's track
    //    as it is into the ruler, so a stack cannot drift.
    const track = stack.querySelector<HTMLElement>('[data-slot="track-lane-track"]')!;
    const clip = Array.from(stack.querySelectorAll<HTMLElement>('[data-slot="track-lane-clip"]'))[1];
    const tick = root.querySelector<HTMLElement>('[data-slot="time-ruler-tick"][data-time="34"]')!;
    await expect(Math.abs(offsetWithin(clip, track) - offsetWithin(tick, root))).toBeLessThan(1.5);

    // 2. …and the exported playhead agrees with the one the ruler draws, which
    //    is the reason the maths is exported at all. Two lines, one position.
    const lines = Array.from(stack.querySelectorAll<HTMLElement>('[data-slot="time-ruler-playhead"]'));
    await expect(lines).toHaveLength(2);
    await expect(Math.abs(centreX(lines[0]) - centreX(lines[1]))).toBeLessThan(1);
  },
};
