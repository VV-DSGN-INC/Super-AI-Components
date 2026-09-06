import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { settledFocusRing } from "@/lib/focus-ring";

import { StemMixer, type Stem } from "@/registry/super-ai/stem-mixer";
import { TrackLane } from "@/registry/super-ai/track-lane";
import { StemMixerDocs } from "@/content/components/stem-mixer.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof StemMixer> = {
  title: "Super AI/Stem Mixer",
  component: StemMixer,
  parameters: { layout: "centered", docs: { page: componentDocsPage(StemMixerDocs) } },
};

export default meta;
type Story = StoryObj<typeof StemMixer>;

const SEPARATED: Stem["lineage"] = {
  origin: "separated",
  source: "Midnight Drive (master).wav",
  detail: "Demucs v4",
};

const STEMS: Stem[] = [
  { id: "drums", name: "Drums", volume: 84, pan: 0 },
  { id: "bass", name: "Bass", volume: 71, pan: -12 },
  { id: "vocals", name: "Vocals", volume: 92, pan: 0 },
  { id: "pads", name: "Pads", volume: 58, pan: 34 },
];

/** One solo, and every other lane says why it has gone quiet. */
export const ExclusiveSolo: Story = {
  args: {
    label: "Midnight Drive stems",
    soloMode: "exclusive",
    stems: STEMS.map((stem) => ({ ...stem, soloed: stem.id === "vocals" })),
    onMuteChange: () => {},
    onSoloChange: () => {},
    onVolumeChange: () => {},
    onPanChange: () => {},
  },
};

/** Same markup, same controls — two stems held up together instead of one. */
export const AdditiveSolo: Story = {
  args: {
    label: "Midnight Drive stems",
    soloMode: "additive",
    stems: STEMS.map((stem) => ({
      ...stem,
      soloed: stem.id === "drums" || stem.id === "bass",
    })),
    onMuteChange: () => {},
    onSoloChange: () => {},
    onVolumeChange: () => {},
    onPanChange: () => {},
  },
};

/** Levels arrive from whatever is playing; a muted lane still says "Muted". */
export const LiveMeters: Story = {
  args: {
    label: "Midnight Drive stems",
    stems: [
      { ...STEMS[0], level: 74 },
      { ...STEMS[1], level: 52 },
      { ...STEMS[2], level: 31 },
      { ...STEMS[3], muted: true, level: 0 },
    ],
    onMuteChange: () => {},
    onSoloChange: () => {},
    onVolumeChange: () => {},
    onPanChange: () => {},
  },
};

/** Three stems pulled out of a master, one the model wrote from a prompt. */
export const StemLineage: Story = {
  args: {
    label: "Midnight Drive stems",
    stems: [
      { ...STEMS[0], lineage: SEPARATED },
      { ...STEMS[1], lineage: SEPARATED },
      { ...STEMS[2], lineage: SEPARATED },
      {
        ...STEMS[3],
        lineage: { origin: "generated", source: "warm analogue pad, A minor", detail: "take 3" },
      },
    ],
    onMuteChange: () => {},
    onSoloChange: () => {},
    onVolumeChange: () => {},
    onPanChange: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * All eight are written. Nothing is skipped, because a per-stem mixer meets
 * every one of the eight: it is directional (a pan fader and a level meter
 * both have a direction of travel), it animates (the meter), it is four tab
 * stops per lane, it is fully controlled, every text slot but the stem name
 * is optional, both the stem name and its source filename are author-supplied,
 * and H3 `track-lane` is the near-twin this component was restored *from*.
 * ---------------------------------------------------------------------- */

const lane = (root: HTMLElement, id: string) =>
  root.querySelector<HTMLElement>(`[data-slot="stem-mixer-lane"][data-stem-id="${id}"]`)!;

const stateOf = (root: HTMLElement, id: string) =>
  lane(root, id).querySelector<HTMLElement>('[data-slot="stem-mixer-lane-state"]')!.textContent;

/** Every tab stop the mixer owns, in document order. Meters hold none. */
const stopsOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>('button, input[type="range"]'));

/**
 * The distance from an element to each end of its container, named
 * logically rather than physically. A correct mirror keeps both numbers and
 * swaps which physical edge they are measured from; a half-mirror does not.
 */
function logicalGaps(el: Element, container: Element, dir: "ltr" | "rtl") {
  const e = el.getBoundingClientRect();
  const c = container.getBoundingClientRect();
  return dir === "ltr"
    ? { start: e.left - c.left, end: c.right - e.right }
    : { start: c.right - e.right, end: e.left - c.left };
}

function DirectionalMixer({ dir }: { dir: "ltr" | "rtl" }) {
  // Pan is applied here rather than dropped, so the arrow-key assertion has a
  // value that can actually move. Everything else stays inert.
  const [pan, setPan] = React.useState(-60);
  return (
    <div dir={dir} data-testid={dir}>
      <StemMixer
        label="Midnight Drive stems"
        stems={[
          { ...STEMS[0], level: 74, lineage: SEPARATED },
          { ...STEMS[1], pan },
        ]}
        onMuteChange={() => {}}
        onSoloChange={() => {}}
        onVolumeChange={() => {}}
        onPanChange={(_, next) => setPan(next)}
      />
    </div>
  );
}

/**
 * Right-to-left. Four things on a lane have a direction of travel, and this
 * renders the same two stems twice so each one can be checked as a mirror
 * rather than by eye.
 *
 * **Three mirror correctly and are asserted.** The mute/solo cluster is
 * pushed to the logical end (`ms-auto`, swapped in this wave from `ml-auto`,
 * which is byte-identical in LTR and left the cluster stranded mid-row in
 * RTL); the lineage glyph leads its sentence, so it moves to the right edge;
 * and the level meter fills from the logical start, because Base UI's
 * progress indicator is sized rather than translated.
 *
 * **The pan fader does not, in two separate ways, and neither is asserted.**
 *
 * 1. *It mirrors when it arguably should not.* Base UI positions the thumb
 *    with `inset-inline-start`, so a pan of -60 paints at 21.4% of the track
 *    in LTR and at 74.0% in RTL while still announcing "60% left". Pan is a
 *    map of the stereo field, not of reading order: the left speaker does not
 *    move when the interface language does. Whether a pan control should
 *    mirror at all is a design decision, so it is recorded here rather than
 *    changed.
 * 2. *And the mirror it does perform is wrong by a thumb.* 74.0% measured
 *    against the 78.6% a true mirror of 21.4% requires — a 4.6% shortfall
 *    across a 259px track, which is 11.9px, one 12px thumb. Base UI flips the
 *    thumb's centring `translate` from `useDirection()` while the offset
 *    itself is CSS-logical, and no `DirectionProvider` is mounted anywhere in
 *    this repo (`CONTINUE.md` §8, D/I wave), so the CSS half mirrors and the
 *    JS half does not. Same shape as the vendored switch's thumb, on a
 *    different primitive.
 *
 * The keys are the third piece of the same fact, and only the half that
 * survives a fix is asserted: one press moves the value by exactly one step.
 * Measured, the step is the *same* step in both directions — ArrowRight takes
 * a pan of -60 to -59 under `dir="rtl"` as well as under `dir="ltr"` — and
 * since a higher value sits further from the inline start, the key that says
 * "right" walks the RTL thumb left. Asserting that direction would pin it, so
 * it is written here and not below.
 */
export const RTL: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <DirectionalMixer dir="ltr" />
      <DirectionalMixer dir="rtl" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frames = {
      ltr: canvasElement.querySelector<HTMLElement>('[data-testid="ltr"]')!,
      rtl: canvasElement.querySelector<HTMLElement>('[data-testid="rtl"]')!,
    };

    // A mirror is two numbers that survive the flip, so both directions are
    // measured and compared. A one-sided check would pass on a half-swap.
    const gapsFor = (part: string, within: (l: HTMLElement) => HTMLElement) =>
      (["ltr", "rtl"] as const).map((dir) => {
        const drums = lane(frames[dir], "drums");
        return { part, dir, ...logicalGaps(within(drums), drums, dir) };
      });

    const close = (a: number, b: number) => Math.abs(a - b) < 1;

    // 1. The mute/solo cluster is flush to the logical end in both. Before
    //    the `ms-auto` swap the RTL cluster sat 49px short of the end.
    const [soloLtr, soloRtl] = gapsFor(
      "solo",
      (l) => l.querySelector<HTMLElement>('[data-slot="stem-mixer-solo"]')!,
    );
    await expect(`solo end ltr=${soloLtr.end.toFixed(1)} rtl=${soloRtl.end.toFixed(1)}`).toBe(
      `solo end ltr=${soloLtr.end.toFixed(1)} rtl=${soloLtr.end.toFixed(1)}`,
    );

    // 2. The stem name still leads, so the cluster and the name sit at
    //    opposite ends of the row — flush, which is the lane's own padding on
    //    both sides rather than a number invented for the test.
    const [nameLtr, nameRtl] = gapsFor(
      "name",
      (l) => l.querySelector<HTMLElement>('[data-slot="stem-mixer-lane-name"]')!,
    );
    await expect(close(nameLtr.start, nameRtl.start)).toBe(true);
    await expect(close(soloLtr.end, nameLtr.start)).toBe(true);
    await expect(nameLtr.start < soloLtr.start).toBe(true);

    // 3. The lineage glyph leads its sentence, so it swaps edges with it.
    const [iconLtr, iconRtl] = gapsFor(
      "lineage-icon",
      (l) => l.querySelector<HTMLElement>('[data-slot="stem-mixer-lineage"] svg')!,
    );
    await expect(close(iconLtr.start, iconRtl.start)).toBe(true);

    // 4. The meter fills from the logical start: same 74% of the track,
    //    anchored to the right edge under RTL.
    for (const dir of ["ltr", "rtl"] as const) {
      const indicator = lane(frames[dir], "drums").querySelector<HTMLElement>(
        '[data-slot="progress-indicator"]',
      )!;
      const gaps = logicalGaps(indicator, indicator.parentElement!, dir);
      await expect(`${dir} meter start gap ${gaps.start.toFixed(1)}`).toBe(`${dir} meter start gap 0.0`);
    }

    // 5. Both faders announce the same stereo position whichever way the
    //    page reads — which is the fact that makes the mirrored thumb wrong,
    //    not a fact about the keys.
    for (const dir of ["ltr", "rtl"] as const) {
      const pan = within(lane(frames[dir], "bass")).getByRole("slider", { name: "Bass pan" });
      await expect(pan).toHaveAttribute("aria-valuetext", "60% left");

      // One press, one step. The *sign* of that step is the direction defect
      // recorded above and is deliberately not asserted: pinning it would
      // mean deleting this assertion to fix the component.
      const before = Number(pan.getAttribute("aria-valuenow"));
      pan.focus();
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(Number(pan.getAttribute("aria-valuenow"))).not.toBe(before));
      await expect(Math.abs(Number(pan.getAttribute("aria-valuenow")) - before)).toBe(1);
    }
  },
};

/**
 * `prefers-reduced-motion: reduce`, which every test in this project runs
 * under (`vitest.config.ts`). **This component owns no branch, and the story
 * exists to say what that costs — which here is nothing, by design.**
 *
 * What moves is the level meter, and it moves for everyone.
 * `components/ui/progress.tsx`'s indicator carries `transition-all` with no
 * reduced-motion counterpart: read back inside this project's emulated
 * reduce, it is still `transition-property: all` at `0.15s`, so a level
 * change animates its width for a reduced-motion user exactly as it does for
 * anyone else. **Recorded, not asserted** — the class is on a vendored file
 * shared by the eight registry components that import `Progress`, the F wave
 * settled it as one decision for all of them (`CONTINUE.md` §8), and a lane
 * cannot reach the indicator without an arbitrary-variant override that would
 * fix this consumer and none of the others. The mixer's own transitions are
 * `color, box-shadow` on the fader thumbs, which move nothing.
 *
 * What that would normally cost is the E/P wave's finding on `preset-grid`:
 * a component whose only signal is motion becomes ambiguous the moment the
 * motion stops. **The three lanes below are the counter-case, and that is
 * what is asserted.** All three hold `level={0}`, so all three meters are
 * pixel-identical and frozen — and the lanes still read "Audible", "Muted"
 * and "Silenced by solo", carry different `data-audible`, and the live
 * summary names the soloed stem. A stopped meter tells you nothing here
 * because the meter was never telling you anything: that is the component's
 * second rule and the spec's "meters are indicators, never the only signal",
 * proved with the indicators switched to zero rather than argued.
 */
export const ReducedMotion: Story = {
  render: () => (
    <StemMixer
      label="Midnight Drive stems"
      stems={[
        { ...STEMS[0], soloed: true, level: 0 },
        { ...STEMS[1], muted: true, level: 0 },
        { ...STEMS[2], level: 0 },
      ]}
      onMuteChange={() => {}}
      onSoloChange={() => {}}
      onVolumeChange={() => {}}
      onPanChange={() => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="stem-mixer"]')!;

    // 1. Three meters, indistinguishable from one another.
    const meters = canvas.getAllByRole("progressbar");
    await expect(meters).toHaveLength(3);
    const widths = meters.map((m) =>
      m
        .querySelector<HTMLElement>('[data-slot="progress-indicator"]')!
        .getBoundingClientRect()
        .width.toFixed(1),
    );
    await expect(new Set(widths).size).toBe(1);

    // 2. Three lanes, told apart without them.
    await expect([stateOf(root, "drums"), stateOf(root, "bass"), stateOf(root, "vocals")]).toEqual([
      "Solo",
      "Muted",
      "Silenced by solo",
    ]);
    await expect(lane(root, "drums")).toHaveAttribute("data-audible", "true");
    await expect(lane(root, "bass")).toHaveAttribute("data-audible", "false");
    await expect(lane(root, "vocals")).toHaveAttribute("data-audible", "false");

    // 3. And announced, once, by the live region rather than per lane.
    await expect(root.querySelector<HTMLElement>('[data-slot="stem-mixer-summary"]')!.textContent).toBe(
      "Soloing Drums. 1 of 3 stems audible.",
    );
  },
};

/**
 * Four tab stops per lane, in the order the docs page promises: Mute, Solo,
 * volume, pan. Two lanes are eight stops, and a five-stem mixer is twenty —
 * the count is asserted here because it is the component's strongest argument
 * for keeping stem counts small, and because a meter is the obvious thing to
 * make focusable by accident. The first lane below has one and the second
 * does not; both are four stops.
 *
 * The names are the other half. Every control is named with its own stem
 * ("Mute Drums", "Bass pan"), so eight stops are eight distinct names — the
 * per-row naming contract three earlier waves found broken on
 * `property-inspector`, `context-chips` and `result-card`, honoured here.
 *
 * **Defect recorded, not asserted: the two fader stops paint no visible
 * focus indicator.** `stem-mixer.tsx` puts `focus-visible:ring-3` on
 * `Slider.Thumb`, but Base UI renders the thumb as a `<div>` wrapping an
 * `<input type="range">` and focus lands on the input, so the div is never
 * `:focus-visible` and reads back `box-shadow: none` while focused. The input
 * does carry the UA ring — `outline: auto 1px` — and it is clipped away by
 * Base UI's own `clip-path: inset(50%)`. F5 `compare-viewer` has the identical
 * shape on its wipe handle (§8, F wave); this is the second instance, and here
 * it is half of every lane. The docs page's focus bullet claims both thumbs
 * show `focus-visible:ring-3`, which is the sentence to correct with the fix.
 *
 * **That also puts a hole in `settledFocusRing` itself.** The helper landed
 * in the F wave to stop the ring check passing on things that paint nothing,
 * and it passes on these inputs: `outlineStyle !== "none"` with a non-zero
 * width is true for a UA ring on an element clipped to zero area. So the
 * buttons below are checked with it and the faders deliberately are not —
 * asserting a ring on the faders would pin the bug green through the very
 * helper written to prevent that.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <StemMixer
      label="Midnight Drive stems"
      stems={[{ ...STEMS[0], level: 74 }, { ...STEMS[1] }]}
      onMuteChange={() => {}}
      onSoloChange={() => {}}
      onVolumeChange={() => {}}
      onPanChange={() => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="stem-mixer"]')!;
    const stops = stopsOf(root);

    // 1. Four per lane, meter or no meter.
    await expect(stops).toHaveLength(8);
    await expect(stopsOf(lane(root, "drums"))).toHaveLength(4);
    await expect(stopsOf(lane(root, "bass"))).toHaveLength(4);
    //    And nothing reorders them: every stop resolves to tabIndex 0, so
    //    document order is the traversal. Read as a property rather than as a
    //    missing attribute — the vendored Button writes `tabindex="0"`
    //    explicitly, which is the same trap that makes `[tabindex]` an unsafe
    //    way to count stops.
    await expect(stops.every((el) => el.tabIndex === 0)).toBe(true);

    // 2. Eight stops, eight names, each carrying its own stem.
    const names = stops.map((el) => el.getAttribute("aria-label"));
    await expect(names).toEqual([
      "Mute Drums",
      "Solo Drums",
      "Drums volume",
      "Drums pan",
      "Mute Bass",
      "Solo Bass",
      "Bass volume",
      "Bass pan",
    ]);

    // 3. Walk the lap. Each tab lands on exactly the next stop.
    stops[0].focus();
    for (let i = 0; i < stops.length; i += 1) {
      const focused = document.activeElement as HTMLElement;
      await expect(focused).toBe(stops[i]);
      await expect(focused.matches(":focus-visible")).toBe(true);
      if (focused.tagName === "BUTTON") {
        // The vendored Button fades its ring in over 0.15s, so this waits for
        // a layer with real alpha and real geometry rather than reading the
        // start frame of the transition.
        await settledFocusRing(focused, waitFor);
      } else {
        // The fader stops: focus is inside the thumb, which is the durable
        // half of the finding above and stays true after any fix. The ring
        // itself is not asserted in either direction.
        const thumb = focused.parentElement!;
        await expect(thumb.dataset.slot).toMatch(/stem-mixer-(volume|pan)-thumb/);
        await expect(thumb.contains(focused)).toBe(true);
      }
      await userEvent.tab();
    }

    // 4. Nothing traps and nothing hides: the stop after the last is outside.
    await expect(root.contains(document.activeElement)).toBe(false);

    // 5. The meter is not a stop. It is a named progressbar and no more.
    const meter = within(lane(root, "drums")).getByRole("progressbar", { name: "Drums level" });
    await expect(stops).not.toContain(meter);
  },
};

function SoloShell({
  onExclusiveSolo,
  onAdditiveSolo,
  onPan,
}: {
  onExclusiveSolo: (stemId: string, soloedIds: string[]) => void;
  onAdditiveSolo: (stemId: string, soloedIds: string[]) => void;
  onPan: (stemId: string, pan: number) => void;
}) {
  const start = STEMS.map((stem) => ({ ...stem, soloed: stem.id === "vocals" }));
  const [exclusive, setExclusive] = React.useState(start);
  const [additive, setAdditive] = React.useState(start);
  const [holding, setHolding] = React.useState(true);
  const [renders, setRenders] = React.useState(1);

  const apply = (set: string[]) => (stems: Stem[]) =>
    stems.map((stem) => ({ ...stem, soloed: set.includes(stem.id) }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setHolding(false)} className="text-sm underline">
          Start applying
        </button>
        <span data-testid="renders" className="text-muted-foreground text-xs">
          {renders}
        </span>
      </div>
      <div data-testid="exclusive">
        <StemMixer
          label="Midnight Drive stems, exclusive solo"
          soloMode="exclusive"
          stems={exclusive}
          onSoloChange={(id, ids) => {
            onExclusiveSolo(id, ids);
            setRenders((n) => n + 1);
            if (!holding) setExclusive(apply(ids));
          }}
          onPanChange={onPan}
        />
      </div>
      <div data-testid="additive">
        <StemMixer
          label="Midnight Drive stems, additive solo"
          soloMode="additive"
          stems={additive}
          onSoloChange={(id, ids) => {
            onAdditiveSolo(id, ids);
            setRenders((n) => n + 1);
            if (!holding) setAdditive(apply(ids));
          }}
          onPanChange={onPan}
        />
      </div>
    </div>
  );
}

/**
 * The one behavioural decision this component was restored to carry, driven
 * from outside and proved in both modes.
 *
 * `onSoloChange` reports `(stemId, soloedIds)` — the complete set of soloed
 * stems *after* the press, already resolved against `soloMode`. That second
 * argument is the whole difference between the two behaviours, because a
 * per-stem boolean cannot say "and the other lanes just turned off". H3
 * `track-lane`, which this component was split back out of, has exactly that
 * boolean (`onSoloedChange(soloed: boolean)`) and therefore cannot express
 * exclusivity at all — see `Boundary`.
 *
 * The host below holds both mixers and starts out refusing to apply anything,
 * so the first half is the controlled contract: pressing Solo moves nothing
 * rendered, the callback still fires with the payload a consumer needs, and
 * the host provably re-rendered while holding the lanes fixed. Then it starts
 * applying, and the same press resolves differently in each mode — exclusive
 * collapses the set to Bass and Vocals goes to "Silenced by solo"; additive
 * grows the set to Bass and Vocals, in **stem order rather than press
 * order**, which is the part a host re-deriving the set from `stemId` alone
 * would get wrong without noticing.
 *
 * The faders are the same shape and are checked once at the end: ArrowRight
 * on a pan thumb emits 1 and leaves `aria-valuenow` at 0.
 */
export const Controlled: StoryObj<typeof SoloShell> = {
  args: { onExclusiveSolo: fn(), onAdditiveSolo: fn(), onPan: fn() },
  render: (args) => <SoloShell {...args} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = (id: string) => canvasElement.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
    const soloOf = (id: string, stem: string) =>
      within(frame(id)).getByRole("button", { name: `Solo ${stem}` });

    // Both mixers open on the same state: Vocals soloed, everyone else
    // silenced by it. The modes are indistinguishable until something is
    // pressed, which is why the component states the mode in words.
    for (const id of ["exclusive", "additive"]) {
      await expect(stateOf(frame(id), "vocals")).toBe("Solo");
      await expect(stateOf(frame(id), "bass")).toBe("Silenced by solo");
    }

    // 1. Held: the press reports and changes nothing.
    await userEvent.click(soloOf("exclusive", "Bass"));
    await expect(args.onExclusiveSolo).toHaveBeenCalledWith("bass", ["bass"]);
    await userEvent.click(soloOf("additive", "Bass"));
    await expect(args.onAdditiveSolo).toHaveBeenCalledWith("bass", ["bass", "vocals"]);

    for (const id of ["exclusive", "additive"]) {
      await expect(soloOf(id, "Bass")).toHaveAttribute("aria-pressed", "false");
      await expect(soloOf(id, "Vocals")).toHaveAttribute("aria-pressed", "true");
      await expect(stateOf(frame(id), "bass")).toBe("Silenced by solo");
    }
    // …and the host really re-rendered twice while holding them there, so the
    // lanes held because `soloed` is a prop, not because React skipped work.
    await expect(canvas.getByTestId("renders")).toHaveTextContent("3");

    // 2. Applying: the same press, resolved two different ways.
    await userEvent.click(canvas.getByRole("button", { name: "Start applying" }));

    await userEvent.click(soloOf("exclusive", "Bass"));
    await waitFor(() => expect(stateOf(frame("exclusive"), "bass")).toBe("Solo"));
    await expect(stateOf(frame("exclusive"), "vocals")).toBe("Silenced by solo");
    await expect(frame("exclusive").querySelector('[data-slot="stem-mixer-summary"]')!.textContent).toBe(
      "Soloing Bass. 1 of 4 stems audible.",
    );

    await userEvent.click(soloOf("additive", "Bass"));
    await waitFor(() => expect(stateOf(frame("additive"), "bass")).toBe("Solo"));
    await expect(stateOf(frame("additive"), "vocals")).toBe("Solo");
    await expect(frame("additive").querySelector('[data-slot="stem-mixer-summary"]')!.textContent).toBe(
      "Soloing Bass, Vocals. 2 of 4 stems audible.",
    );

    // 3. The faders are controlled the same way. The host applies solo but
    //    still only reports pan, so this is the held case again on the other
    //    pair: one arrow press emits a value and the thumb does not move.
    const pan = within(frame("exclusive")).getByRole("slider", { name: "Drums pan" });
    pan.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(args.onPan).toHaveBeenCalledWith("drums", 1);
    await expect(pan).toHaveAttribute("aria-valuenow", "0");
  },
};

/**
 * Everything optional dropped: no `label`, no `lineage`, no `level`. This is
 * the smallest lane the component can render, and the claim is that it is
 * still complete — four controls, each still named with its own stem, and the
 * lane state text still saying whether the stem can be heard. The spec asks
 * for exactly this ("mute and solo must be readable as state… with the meters
 * switched off entirely") and it is the only story where the meters are off.
 *
 * The stem `name` is deliberately not emptied. It is `string`, not
 * `string | undefined`, and it is the stem of all four accessible names on
 * the lane, so `name=""` leaves four controls announcing "Mute", "Solo",
 * "volume" and "pan" with nothing to say which stem, and the summary
 * interpolates the empty string too ("Soloing ."). That is a caller error and
 * belongs in the docs page's donts, not in a story that would walk an
 * accessible-name failure into the axe gate to make its point.
 *
 * **Recorded: `label=""` leaves the group with no name at all.** The default
 * is the literal string "Stem mixer", so passing an empty string does not
 * fall back to it — it renders `aria-label=""`, which assistive tech ignores.
 * A caller writing `label=""` to mean "this one does not need naming" gets a
 * `role="group"` with nothing on it, which is strictly worse than the default
 * the docs page already warns is ambiguous between two mixers on a page.
 */
export const EmptyLabel: Story = {
  render: () => (
    <StemMixer
      label=""
      stems={[
        { id: "drums", name: "Drums" },
        { id: "bass", name: "Bass", muted: true },
      ]}
      onMuteChange={() => {}}
      onSoloChange={() => {}}
      onVolumeChange={() => {}}
      onPanChange={() => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="stem-mixer"]')!;

    // 1. Both optional slots are gone, not empty.
    await expect(root.querySelectorAll('[data-slot="stem-mixer-meter"]')).toHaveLength(0);
    await expect(root.querySelectorAll('[data-slot="stem-mixer-lineage"]')).toHaveLength(0);
    await expect(canvas.queryAllByRole("progressbar")).toHaveLength(0);

    // 2. The lane is still four named controls and still says what it does.
    await expect(stopsOf(root)).toHaveLength(8);
    await expect(stateOf(root, "drums")).toBe("Audible");
    await expect(stateOf(root, "bass")).toBe("Muted");
    canvas.getByRole("button", { name: "Mute Bass" });
    canvas.getByRole("slider", { name: "Drums pan" });

    // 3. The group's name, recorded above: empty, not defaulted.
    await expect(root).toHaveAttribute("aria-label", "");
  },
};

/**
 * An 86-character stem name and the working filename a separation run really
 * produces, in a 375px column — the width where the answer is visible at all.
 *
 * **The answer is wrap, everywhere, with nothing clipped and nothing
 * hidden.** Measured against the short lane rendered beside it: the long name
 * takes 40px against the short one's 20px, so it takes two lines and the full
 * row width; the mute/solo cluster drops onto the next flex line underneath
 * it rather than being squeezed; and the lineage sentence wraps to two lines
 * with `scrollWidth === clientWidth`, so none of the filename is cut off.
 * Nothing anywhere gets a `title` attribute, and nothing needs one.
 *
 * That is the opposite decision from B6 `thread-list`, which truncates, and
 * it is the right one here for a reason worth stating: a stem name is how you
 * tell one fader from another, and it is also the stem of all four accessible
 * names on the lane. The Mute button's name here is 91 characters, and the
 * same string is read again before Solo, volume and pan. Truncating would fix
 * the row and leave the reading exactly as long.
 *
 * The cost the wrap does carry is height: this lane measures 166px against
 * the short one's 106px, so a long-named mixer runs out of phone screen
 * faster than the stem count suggests.
 */
export const LongContent: Story = {
  render: () => (
    <div data-testid="frame" className="w-[375px] max-w-full">
      <StemMixer
        label="Midnight Drive stems"
        stems={[
          { id: "drums", name: "Drums", volume: 84, pan: 0, lineage: SEPARATED },
          {
            id: "vocal-double",
            name: "Lead vocal double, comped from takes four through eleven, then de-essed for the chorus",
            volume: 50,
            pan: -70,
            lineage: {
              origin: "separated",
              source: "Midnight Drive (rough mix, 2026-08-30, 24-bit 48 kHz).wav",
              detail: "Demucs v4 htdemucs_ft",
            },
          },
        ]}
        onMuteChange={() => {}}
        onSoloChange={() => {}}
        onVolumeChange={() => {}}
        onPanChange={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="frame"]')!;
    const root = frame.querySelector<HTMLElement>('[data-slot="stem-mixer"]')!;
    const nameOf = (id: string) =>
      lane(root, id).querySelector<HTMLElement>('[data-slot="stem-mixer-lane-name"]')!;
    const muteOf = (id: string) =>
      lane(root, id).querySelector<HTMLElement>('[data-slot="stem-mixer-mute"]')!;

    // 1. Nothing scrolls sideways, at the width where it would.
    await expect(frame.scrollWidth).toBe(frame.clientWidth);
    await expect(root.scrollWidth).toBe(root.clientWidth);

    // 2. It wraps rather than truncating: two lines against the short lane's
    //    one, measured rather than assumed from a class.
    const short = nameOf("drums").getBoundingClientRect();
    const long = nameOf("vocal-double").getBoundingClientRect();
    await expect(long.height > short.height * 1.5).toBe(true);

    // 3. And the cluster moves down instead of being squeezed: in the short
    //    lane it shares the name's line, in the long one it is below it.
    await expect(muteOf("drums").getBoundingClientRect().top < short.bottom).toBe(true);
    await expect(muteOf("vocal-double").getBoundingClientRect().top >= long.bottom).toBe(true);

    // 4. The lineage sentence wraps too — no clipping, so the whole filename
    //    is readable without a tooltip.
    const lineage = lane(root, "vocal-double").querySelector<HTMLElement>(
      '[data-slot="stem-mixer-lineage"]',
    )!;
    await expect(lineage.scrollWidth).toBe(lineage.clientWidth);
    await expect(lineage.textContent).toContain("24-bit 48 kHz");

    // 5. The accessible name carries the whole string, which is the reason
    //    the visible one is allowed to.
    await expect(muteOf("vocal-double").getAttribute("aria-label")).toBe(
      "Mute Lead vocal double, comped from takes four through eleven, then de-essed for the chorus",
    );
  },
};

/**
 * 375px, four stems, meters and lineage on every lane. Unlike most `Mobile`
 * stories in this repo, this one really is the phone case: the volume/pan
 * grid is a bare `grid-cols-2` with no `sm:` or `md:` variant, so what the
 * 1200px gate renders inside a 375px box is byte-for-byte what a phone
 * renders. Each fader gets a 166.5px column.
 *
 * Nothing scrolls sideways: the frame, the mixer root and every lane are
 * each checked, which covers both places it could. The mixer header puts the
 * solo-mode sentence and the live summary in one `flex-wrap` row, so at this
 * width they stack instead of widening it; the lane header does the same
 * with four children.
 *
 * The touch fact worth writing down is size rather than layout. The mute and
 * solo buttons are `size="xs"` and measure 24px tall — **exactly** WCAG 2.2's
 * 24×24 minimum, with no margin for a future padding change, and they are the
 * two most-tapped controls in the component. The fader thumbs are 12px and
 * would fail outright, except that each carries `after:absolute after:-inset-2`,
 * which extends the hit area to 28px without changing what is drawn. That
 * pseudo-element is the only thing between this component and eight
 * sub-minimum targets on a four-stem mix, and no gate can see it: axe's
 * `target-size` rule is experimental and off.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="frame" className="w-[375px] max-w-full">
      <StemMixer
        label="Midnight Drive stems"
        soloMode="additive"
        stems={STEMS.map((stem, i) => ({
          ...stem,
          level: [74, 52, 31, 0][i],
          soloed: stem.id === "drums",
          lineage: SEPARATED,
        }))}
        onMuteChange={() => {}}
        onSoloChange={() => {}}
        onVolumeChange={() => {}}
        onPanChange={() => {}}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Measured on the 375px frame, not on `canvasElement.firstElementChild` —
    // the meta's `layout: "centered"` wraps every story in a ~1200px div, and
    // an overflow check against that passes for the wrong reason.
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="frame"]')!;
    const root = frame.querySelector<HTMLElement>('[data-slot="stem-mixer"]')!;

    await expect(frame.scrollWidth).toBe(frame.clientWidth);
    await expect(root.scrollWidth).toBe(root.clientWidth);
    for (const el of root.querySelectorAll<HTMLElement>('[data-slot="stem-mixer-lane"]')) {
      await expect(el.scrollWidth).toBe(el.clientWidth);
    }

    // The two faders stay side by side at 375px: the grid is unconditional,
    // so this is the phone layout rather than a desktop one squeezed narrow.
    const drums = lane(root, "drums");
    const volume = drums.querySelector<HTMLElement>('[data-slot="stem-mixer-volume"]')!;
    const pan = drums.querySelector<HTMLElement>('[data-slot="stem-mixer-pan"]')!;
    const [v, p] = [volume.getBoundingClientRect(), pan.getBoundingClientRect()];
    await expect(v.top).toBe(p.top);
    await expect(v.right <= p.left).toBe(true);

    // Tap targets, recorded above. 24px is the floor, and Mute sits on it.
    for (const slot of ["stem-mixer-mute", "stem-mixer-solo"]) {
      const button = drums.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
      await expect(button.getBoundingClientRect().height >= 24).toBe(true);
    }
    const thumb = drums.querySelector<HTMLElement>('[data-slot="stem-mixer-volume-thumb"]')!;
    await expect(thumb.className).toContain("after:-inset-2");
  },
};

/**
 * The mixer beside the component it was split back out of.
 *
 * H3 `track-lane` also has a gutter with mute and solo, and the two look
 * close enough that an early consolidation folded this one into it. The
 * restoration (gaps.md R4, D12) turned on two things a timeline lane cannot
 * express, and both are visible below.
 *
 * **The choosing rule: a track lane is about *when*, a stem mixer is about
 * *what you can hear*.** A lane's horizontal axis is time and its content is
 * clips you trim and select; the mixer has no time axis at all, and its
 * content is a fader, a pan and a provenance line per part. If you are asking
 * "what happens at 0:48", that is a lane. If you are asking "is this drum
 * separation clean enough to keep", that is this.
 *
 * The two concrete differences:
 *
 * 1. **Solo resolution.** `track-lane` exposes
 *    `onSoloedChange(soloed: boolean)` — per lane, one bit. A boolean can say
 *    "this one is soloed now"; it cannot say "and the other three just went
 *    quiet", so a stack of lanes has no way to make solo exclusive without
 *    the host inventing the rule. The mixer's `onSoloChange(stemId,
 *    soloedIds)` reports the resolved set, and `soloMode` decides how it
 *    resolved. `Controlled` proves both modes.
 * 2. **Lineage.** A lane names a track ("Dialogue"); it has nowhere to say
 *    where that audio came from. Once one stem in a mix was generated from a
 *    prompt and three were separated out of a master, that is the difference
 *    between trusting what you are hearing and not, so it is a line of text
 *    on every lane rather than a badge or a tooltip.
 *
 * Not a boundary case, for the record: J7 `track-list` also renders audio
 * rows, but it is a library of whole tracks with artwork, BPM and key. It has
 * no per-part controls and nothing to solo.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-[40rem] max-w-full flex-col gap-6">
      <div data-testid="mixer">
        <StemMixer
          label="Midnight Drive stems"
          soloMode="exclusive"
          stems={[
            { ...STEMS[0], soloed: true, level: 74, lineage: SEPARATED },
            { ...STEMS[1], level: 52, lineage: SEPARATED },
            {
              ...STEMS[3],
              level: 18,
              lineage: { origin: "generated", source: "warm analogue pad, A minor", detail: "take 3" },
            },
          ]}
          onMuteChange={() => {}}
          onSoloChange={() => {}}
          onVolumeChange={() => {}}
          onPanChange={() => {}}
        />
      </div>
      <div data-testid="lane">
        <TrackLane
          name="Dialogue"
          type="waveform"
          duration={20}
          pixelsPerSecond={34}
          clips={[
            { id: "d1", label: "Room tone", start: 0, end: 6, peaks: [0.2, 0.15, 0.25, 0.18] },
            { id: "d2", label: "Interview VO", start: 6.5, end: 14, peaks: [0.4, 0.85, 0.6, 0.9] },
          ]}
          soloed
          onMutedChange={() => {}}
          onSoloedChange={() => {}}
          onSelectClip={() => {}}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const mixer = canvasElement.querySelector<HTMLElement>('[data-testid="mixer"]')!;
    const laneFrame = canvasElement.querySelector<HTMLElement>('[data-testid="lane"]')!;

    // The mixer says what soloing means and what it cost — three stems, one
    // audible — because the resolution is a property of the whole mixer.
    await expect(mixer.querySelector('[data-slot="stem-mixer-solo-mode"]')!.textContent).toBe(
      "Solo is exclusive — soloing a stem clears the others.",
    );
    await expect(mixer.querySelector('[data-slot="stem-mixer-summary"]')!.textContent).toBe(
      "Soloing Drums. 1 of 3 stems audible.",
    );
    await expect(stateOf(mixer, "bass")).toBe("Silenced by solo");

    // The lane's solo is a single pressed toggle with nothing around it: no
    // set, no mode, and no other lane to have silenced.
    const laneSolo = laneFrame.querySelector<HTMLElement>('[data-control="solo"]')!;
    await expect(laneSolo).toHaveAttribute("aria-pressed", "true");
    await expect(laneFrame.querySelectorAll('[data-slot="stem-mixer-lane-state"]')).toHaveLength(0);

    // And lineage exists on one side only: every mixer lane carries a source,
    // the lane carries none.
    await expect(mixer.querySelectorAll('[data-slot="stem-mixer-lineage"]')).toHaveLength(3);
    await expect(
      Array.from(mixer.querySelectorAll<HTMLElement>('[data-slot="stem-mixer-lineage"]')).map((el) =>
        el.getAttribute("data-origin"),
      ),
    ).toEqual(["separated", "separated", "generated"]);
  },
};
