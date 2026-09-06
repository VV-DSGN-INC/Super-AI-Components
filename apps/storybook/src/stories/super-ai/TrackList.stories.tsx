import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { settledFocusRing } from "@/lib/focus-ring";

import { AssetLibrary, type AssetLibraryItem } from "@/registry/super-ai/asset-library";
import { TrackList, type Track } from "@/registry/super-ai/track-list";
import { TrackListDocs } from "@/content/components/track-list.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const PEAKS = [0.2, 0.6, 0.9, 0.4, 0.7, 0.5, 0.8, 0.3, 0.6, 0.9, 0.4, 0.5];
const QUIET = [0.1, 0.3, 0.5, 0.2, 0.4, 0.2, 0.3, 0.1, 0.4, 0.2, 0.3, 0.2];

const art = (label: string) => (
  <img
    src={`https://placehold.co/80x80?text=${encodeURIComponent(label)}`}
    alt=""
    className="h-full w-full object-cover"
  />
);

const TRACKS: Track[] = [
  {
    id: "1",
    title: "Midnight Drive",
    artist: "Nova Kane",
    artwork: art("MD"),
    tags: ["synthwave", "instrumental"],
    peaks: PEAKS,
    bpm: 124,
    musicalKey: "F minor",
  },
  {
    id: "2",
    title: "Paper Lanterns",
    artist: "Ilya Sound",
    artwork: art("PL"),
    tags: ["ambient", "loop"],
    peaks: QUIET,
    bpm: 92,
    musicalKey: "C major",
  },
  {
    id: "3",
    title: "Drums (stem)",
    artist: "Nova Kane",
    tags: ["stem"],
    peaks: PEAKS,
    bpm: 124,
    musicalKey: "F minor",
  },
];

const meta: Meta<typeof TrackList> = {
  title: "Super AI/Track List",
  component: TrackList,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TrackListDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[56rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    tracks: TRACKS,
    label: "Library",
    onPlayToggle: () => {},
    onSelect: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof TrackList>;

/** Cover art is the caller's own node, decorative so it never re-announces the title. */
export const Artwork: Story = {};

/** Tags describe; they are not where tempo or key belong. */
export const Tags: Story = {
  args: {
    tracks: TRACKS.map((t) => ({ ...t, artwork: undefined })),
  },
};

/** A row-height audition strip, filling in place while a row sounds. */
export const InlineWaveform: Story = {
  args: { playingId: "1", progress: 45 },
};

/** Right-aligned and tabular, so two tempos line up digit for digit. */
export const Bpm: Story = {
  args: {
    tracks: [
      { id: "1", title: "Midnight Drive", artist: "Nova Kane", peaks: PEAKS, bpm: 124 },
      { id: "2", title: "Paper Lanterns", artist: "Ilya Sound", peaks: QUIET, bpm: 92 },
      { id: "3", title: "Half-time edit", artist: "Nova Kane", peaks: PEAKS, bpm: 62 },
    ],
  },
};

/** Free text, because notation conventions differ between tools. */
export const MusicalKey: Story = {
  args: {
    tracks: [
      { id: "1", title: "Midnight Drive", peaks: PEAKS, bpm: 124, musicalKey: "F minor" },
      { id: "2", title: "Paper Lanterns", peaks: QUIET, bpm: 92, musicalKey: "C major" },
      { id: "3", title: "Harmonic import", peaks: PEAKS, bpm: 128, musicalKey: "9A" },
    ],
  },
};

/** A stem has no cover art and a spoken clip has no key. Both absences are stated. */
export const SparseMetadata: Story = {
  args: {
    tracks: [
      TRACKS[0],
      { id: "3", title: "Drums (stem)", artist: "Nova Kane", peaks: PEAKS, bpm: 124 },
      { id: "4", title: "Voice memo 04", peaks: QUIET },
    ],
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations a music library meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * Seven of the eight are written. Not written for this component:
 *
 * // case-skip: ReducedMotion — grepped track-list.tsx for animate-/transition-/duration-/motion-: zero matches, and preview-tile's only animation (animate-pulse) is behind state="loading", which this file never passes
 * What that grep leaves is three vendored classes, none of them this
 * component's and none of them branchable from here: `TableRow`'s
 * `transition-colors` crossfades a hover colour and moves nothing — the
 * `reset-affordance` precedent for why suppressing it would document no
 * branch; the `Button` base's `transition-all` press nudge is the
 * primitive-wide posture `CONTINUE.md` §8 records; and `Badge` carries
 * `transition-all` with nothing that transitions. The positive statement is
 * worth more than the absence, because it is a decision rather than an
 * oversight: **`progress` moves the waveform fill with no transition at
 * all**, so a poll tick repaints the bars in one frame. There is nothing
 * here for a reduced-motion user to be spared, and the story would render
 * pixel-identical to `InlineWaveform`.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, and the interesting part of this component is the column
 * that should *not* mirror.
 *
 * **What mirrors, and correctly.** The table reverses its column order, so
 * the artwork column lands on the right and Key on the left (asserted). The
 * Preview cell is a plain `flex`, so Play sits to the right of the strip it
 * belongs to. Tags are flex items, so the first tag paints rightmost. And the
 * waveform mirrors with them: the played bars are the first `n` in DOM order,
 * which under RTL are the rightmost, so the fill grows leading-edge-inward
 * exactly as a mirrored transport would. Measured here at `progress={50}` —
 * bar 0 filled and the last bar not, with bar 0 painted to the right of it.
 *
 * **What must not mirror: BPM.** The column is `text-right`, a physical
 * class, and it is the sanctioned logical swap's fifth negative — the first
 * one where the physical class is *correct in both directions* rather than
 * merely entangled with geometry that has no logical form (H3's trim clip,
 * H2's inline `left`, H5's Embla axis, F5's wipe `inset()`). Western digits
 * are rendered left-to-right whatever the paragraph direction, so the units
 * digit is always the rightmost glyph, and only a physical right edge lines
 * two tempos up. Measured under RTL: 124 and 92 share a right edge (151px)
 * and differ at the left (125 vs 134). Swapping to `text-end` would flush
 * them left in RTL, putting the hundreds digit of one over the tens of the
 * other and destroying the comparison the column exists for — the spec's own
 * argument for a table. The cost is real and stated rather than hidden: the
 * numbers hug the column's inline *start* under RTL, which looks unfinished
 * next to the columns beside them. Alignment wins; nothing here was swapped.
 *
 * **Recorded, not asserted: heading and data pull apart.** `TableHead` in
 * `components/ui/table.tsx` carries a physical `text-left` while `TableCell`
 * inherits the document's start edge — measured here, every `th` computes
 * `left` and every `td` computes `start`, so under RTL five of six column
 * headings sit against the opposite edge from the data they name. F6
 * `render-queue` recorded the identical mismatch in wave 3 on the same
 * primitive; it is the byte-identical `text-left` → `text-start` swap, but it
 * lives in a vendored file every table in the registry shares, so fixing it
 * from here would repair one caller and hide the rest. Left unasserted so an
 * upstream fix does not fail this story.
 */
export const RTL: Story = {
  args: { playingId: "1", progress: 50 },
  render: (args) => (
    <div dir="rtl">
      <TrackList {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="track-list"]') as HTMLElement;
    const r = (el: Element) => el.getBoundingClientRect();
    const mid = (el: Element) => r(el).left + r(el).width / 2;

    const heads = Array.from(root.querySelectorAll("th"));
    const firstRow = root.querySelector('[data-slot="track-list-row"]') as HTMLElement;
    const bars = Array.from(firstRow.querySelectorAll('[data-slot="track-list-waveform-bar"]'));
    const tags = Array.from(root.querySelectorAll('[data-slot="track-list-tags"] [data-slot="badge"]'));

    // 1. Columns reverse: artwork first in DOM, rightmost on screen.
    await expect(r(heads[0]).left).toBeGreaterThan(r(heads[heads.length - 1]).left);

    // 2. The cluster inside a cell reverses with it, so Play leads the strip.
    await expect(mid(firstRow.querySelector('[data-slot="track-list-play"]')!)).toBeGreaterThan(
      mid(firstRow.querySelector('[data-slot="track-list-waveform"]')!),
    );

    // 3. Tags are flex items: the first tag paints rightmost.
    await expect(mid(tags[0])).toBeGreaterThan(mid(tags[1]));

    // 4. The fill mirrors — the leading (filled) bars are on the right.
    await expect(
      `first bar filled: ${bars[0].className.includes("bg-primary")}, ` +
        `last bar filled: ${bars[bars.length - 1].className.includes("bg-primary")}, ` +
        `first right of last: ${r(bars[0]).left > r(bars[bars.length - 1]).left}`,
    ).toBe("first bar filled: true, last bar filled: false, first right of last: true");

    // 5. BPM stays physically right-aligned, and that is what keeps the units
    //    digits of 124 and 92 in one column. Measured on the text, not the
    //    cell: a right-aligned cell can still hold left-flushed text.
    const bpmCells = Array.from(root.querySelectorAll('[data-slot="track-list-bpm"]')) as HTMLElement[];
    const textBox = (cell: HTMLElement) => {
      const range = document.createRange();
      range.selectNodeContents(cell);
      return range.getBoundingClientRect();
    };
    await expect(getComputedStyle(bpmCells[0]).textAlign).toBe("right");
    await expect(Math.round(textBox(bpmCells[0]).right)).toBe(Math.round(textBox(bpmCells[1]).right));
    await expect(Math.round(textBox(bpmCells[0]).left)).not.toBe(Math.round(textBox(bpmCells[1]).left));
  },
};

/**
 * Tab traversal down a library where every row offers the same two controls.
 *
 * The sequence is the contract, and it is decided entirely by the handlers a
 * caller passes: **two stops per row with both, in cell order — the title
 * first, then Play** — six stops for three tracks, with no arrow navigation,
 * no roving tabindex and no way to skip a row. A hundred tracks is two
 * hundred stops. The header contributes none (asserted), and nothing here is
 * ever `disabled`: the third row has peaks but the flat-strip case in
 * `EmptyLabel` shows an unanalysed track keeps an enabled Play too.
 *
 * The naming contract is the half worth pinning, because the D/I and F waves
 * found it broken four times: every per-row control is named from its own
 * row, so six buttons are six destinations rather than three anonymous
 * "Play"s. Focus treatment is checked with `settledFocusRing`, not
 * `boxShadow !== "none"` — both controls are vendored `Button`s, whose ring
 * fades in over `transition-all` and whose off-state composes transparent
 * zero-size shadow layers, so an immediate string read is wrong in both
 * directions.
 *
 * **Two gaps, described rather than pinned.**
 *
 * - **Two tracks with the same title are two identical buttons.** `title` is
 *   used verbatim in every name on the row, and a library holding two takes
 *   or a master beside its bounce legitimately holds the same title twice —
 *   producing "Play Main cut" twice with the BPM that distinguishes them left
 *   out of the name. Fifth instance of the per-row naming shape after
 *   `property-inspector`, `context-chips`, `render-queue` and
 *   `result-card`; `EmptyLabel` renders the collapse from the empty-string
 *   end and asserts it there. The fix is an API decision, not a class.
 * - **The title button carries no verb.** It announces as "Midnight Drive,
 *   button" beside "Play Midnight Drive, button", so what the first one does
 *   is inferred from the second. The docs module's own screen-reader note
 *   stops one sentence short of this.
 */
export const KeyboardOrder: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="track-list"]') as HTMLElement;

    // The header is not a stop: six cells, none focusable.
    await expect(root.querySelectorAll("thead button, thead a[href]")).toHaveLength(0);

    // Two per row, title before play, and each named by its own track.
    const stops = canvas.getAllByRole("button");
    await expect(stops).toHaveLength(6);
    for (const row of Array.from(root.querySelectorAll('[data-slot="track-list-row"]'))) {
      const [title, play] = Array.from(row.querySelectorAll("button"));
      await expect(title).toHaveAttribute("data-slot", "track-list-title");
      await expect(play).toHaveAttribute("data-slot", "track-list-play");
    }

    await userEvent.tab();
    const seen: string[] = [];
    for (let i = 0; i < stops.length; i++) {
      const focused = document.activeElement as HTMLElement;
      await expect(focused).toBe(stops[i]);
      seen.push(focused.getAttribute("aria-label") ?? focused.textContent ?? "");
      await expect(focused.matches(":focus-visible")).toBe(true);
      // `settledFocusRing`, not the string check: Tailwind's ring composes
      // shadow layers that are present-but-transparent when off, and the
      // Button base's `transition-all` fades the real one in.
      await settledFocusRing(focused, waitFor);
      await userEvent.tab();
    }

    await expect(seen).toEqual([
      "Midnight Drive",
      "Play Midnight Drive",
      "Paper Lanterns",
      "Play Paper Lanterns",
      "Drums (stem)",
      "Play Drums (stem)",
    ]);
    // Six stops and then out — the list traps nothing.
    await expect(root.contains(document.activeElement)).toBe(false);
  },
};

/**
 * `playingId` + `onPlayToggle` is a real controlled pair, which is what makes
 * this component's central promise — audition without navigating — the host's
 * to keep rather than the component's to fake.
 *
 * The component owns no `<audio>` element and no timer, so the row that reads
 * as playing is whatever `playingId` says, and a press only reports. Both
 * halves are asserted here against one host that starts by refusing every
 * change:
 *
 * - **Held.** Pressing Play fires `onPlayToggle("1", true)` — the id and the
 *   state being asked for, already toggled, which is the whole payload a host
 *   needs to apply it — and nothing moves: the button still says "Play
 *   Midnight Drive" and the row stays `data-state="idle"`. A second press on
 *   another row re-renders the host again (the counter reaches 3), so the
 *   rows held because `playingId` is a prop, not because React skipped work.
 * - **Applied.** After "Start applying" the same press flips the row to
 *   `playing`, swaps the control to "Pause Midnight Drive" — a different word
 *   and a different icon, so the state never rests on the row tint — and
 *   fills 3 of 12 bars at `progress={30}`. Pausing reports `("1", false)` and
 *   returns the row to `idle`.
 *
 * **The gap this makes visible.** `progress` is the only channel carrying
 * playback position, it drives `aria-hidden` bars alone, and there is no live
 * region — so a host that correctly holds `playingId` still tells a screen
 * reader nothing except through the Play button's own name changing, and only
 * while that button holds focus. Starting playback from a transport elsewhere
 * on the page is silent here. The docs module records it; nothing asserts it,
 * because the fix is an added announcement rather than a corrected one.
 */
export const Controlled: Story = {
  args: { onPlayToggle: fn() },
  render: function ControlledHost(args) {
    const [playingId, setPlayingId] = React.useState<string | null>(null);
    const [applying, setApplying] = React.useState(false);
    const [renders, setRenders] = React.useState(1);
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="start-applying"
            onClick={() => setApplying(true)}
            className="text-foreground text-sm underline"
          >
            Start applying
          </button>
          <span data-testid="renders" className="text-foreground/70 text-xs">
            {renders}
          </span>
        </div>
        <TrackList
          {...args}
          playingId={playingId}
          progress={30}
          onPlayToggle={(id, playing) => {
            args.onPlayToggle?.(id, playing);
            setRenders((n) => n + 1);
            if (applying) setPlayingId(playing ? id : null);
          }}
        />
      </div>
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="track-list"]') as HTMLElement;
    const rows = () => Array.from(root.querySelectorAll('[data-slot="track-list-row"]'));
    const state = (i: number) => rows()[i].getAttribute("data-state");

    // 1. Held: the press reports the id and the state being asked for…
    await userEvent.click(canvas.getByRole("button", { name: "Play Midnight Drive" }));
    await expect(args.onPlayToggle).toHaveBeenCalledWith("1", true);
    // …and the rendered value does not move.
    await expect(canvas.getByRole("button", { name: "Play Midnight Drive" })).toBeInTheDocument();
    await expect(state(0)).toBe("idle");

    await userEvent.click(canvas.getByRole("button", { name: "Play Paper Lanterns" }));
    await expect(canvas.getByTestId("renders")).toHaveTextContent("3");
    await expect([state(0), state(1)]).toEqual(["idle", "idle"]);

    // 2. Applied: the same press, resolved by the host this time.
    await userEvent.click(canvas.getByTestId("start-applying"));
    await userEvent.click(canvas.getByRole("button", { name: "Play Midnight Drive" }));
    await waitFor(() => expect(state(0)).toBe("playing"));
    await expect(canvas.getByRole("button", { name: "Pause Midnight Drive" })).toBeInTheDocument();

    // `progress` reaches the bars and only the bars: 30% of 12 is 3.
    const bars = Array.from(rows()[0].querySelectorAll('[data-slot="track-list-waveform-bar"]'));
    await expect(bars).toHaveLength(12);
    await expect(bars.filter((b) => b.className.includes("bg-primary"))).toHaveLength(3);

    // 3. Pausing is the same contract in the other direction.
    await userEvent.click(canvas.getByRole("button", { name: "Pause Midnight Drive" }));
    await expect(args.onPlayToggle).toHaveBeenLastCalledWith("1", false);
    await waitFor(() => expect(state(0)).toBe("idle"));
  },
};

/**
 * Every optional slot empty at once — an unanalysed import, which is the
 * ordinary state of a library ten seconds after a drop.
 *
 * Two of the absences are handled well and one is not.
 *
 * - **Absence is stated, twelve times.** Three rows with no artwork, no tags,
 *   no BPM and no key render twelve `NotSet`s, each an `aria-hidden` em-dash
 *   beside a visually hidden "Not set" — so the announcement is words rather
 *   than a dash, a blank or a zero. This is the component's best idea and the
 *   thing `sparse-metadata` exists to protect.
 * - **A track with no peaks keeps an enabled Play.** One flat strip
 *   (`data-peaks="none"`) with a live control beside it: analysis is not a
 *   precondition for auditioning, which is the right call and is the reason
 *   nothing here is ever `disabled`.
 * - **`label=""` leaves the table unnamed.** `label = "Tracks"` is a default
 *   *parameter*, so an explicit empty string is not `undefined` and the
 *   fallback never runs: `aria-label` renders as `""` and the table announces
 *   with no name at all. H7 `stem-mixer` has the identical shape, which makes
 *   this the second measured instance of the same defaulting mistake. No axe
 *   rule covers a nameless table, so nothing catches it. Asserted below as
 *   the measurement it is, not as intended behaviour.
 *
 * **The accessible-name collapse, and the case this story cannot render.**
 * `title: ""` names both play controls `"Play "`, which normalises to two
 * buttons called "Play" — the per-row naming shape again, from the
 * empty-string end. The **rendered** version is safe only because `onSelect`
 * is omitted here: with `onSelect` supplied, an empty title renders a
 * `<Button>` with no text and no `aria-label`. Rendered once to measure it —
 * "Buttons must have discernible text (button-name)" on
 * `.underline-offset-4`, the link-variant title control — and then removed
 * rather than shipped, on H4 `transcript-editor`'s precedent: the story
 * documents the failure instead of pinning it, and a caller who makes the
 * title optional gets a red gate rather than a quiet one. Tap targets are
 * fine by contrast: `size="icon-sm"`
 * measures 28×28, clear of WCAG 2.2's 24×24, unlike the two rails the D/I
 * wave found under it.
 */
export const EmptyLabel: Story = {
  args: {
    label: "",
    onSelect: undefined,
    tracks: [
      { id: "1", title: "", peaks: PEAKS },
      { id: "2", title: "", peaks: QUIET },
      { id: "3", title: "Voice memo 04" },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="track-list"]') as HTMLElement;

    // The default parameter cannot see an explicit "": the table is unnamed.
    await expect(root.querySelector("table")).toHaveAttribute("aria-label", "");

    // Two unnamed rows, one name between them.
    await expect(canvas.getAllByRole("button", { name: "Play" })).toHaveLength(2);
    await expect(canvas.getByRole("button", { name: "Play Voice memo 04" })).toBeInTheDocument();

    // No onSelect, so no title control at all — three plain spans.
    await expect(root.querySelectorAll("button")).toHaveLength(3);
    await expect(root.querySelectorAll('[data-slot="track-list-title"]')).toHaveLength(3);

    // Four absences per row, each announced as words rather than a dash.
    const unset = Array.from(root.querySelectorAll('[data-slot="track-list-unset"]'));
    await expect(unset).toHaveLength(12);
    await expect(unset[0]).toHaveTextContent("Not set");

    // An unanalysed track is still auditionable: flat strip, live control.
    await expect(root.querySelectorAll('[data-peaks="none"]')).toHaveLength(1);
    const play = canvas.getByRole("button", { name: "Play Voice memo 04" });
    await expect(play).not.toBeDisabled();
    const box = play.getBoundingClientRect();
    await expect(`${Math.round(box.width)}×${Math.round(box.height)}`).toBe("28×28");
  },
};

/**
 * An 80-character title and a 68-character key at the width this component
 * ships at, and the answer is neither wrap nor truncate: **the row widens and
 * the two columns the component exists for leave the box.**
 *
 * `TableCell` is `whitespace-nowrap` with no `text-overflow`, and the
 * vendored `Button` adds its own `whitespace-nowrap`, so the title cell grows
 * to 500px and the table to 1292px inside an 896px container. Measured at the
 * right edge: BPM ends at x=889 and survives by seven pixels; the Key column
 * *starts* at 889 and runs 403px past the edge, so the longer of the two
 * fields is entirely off-screen. A caller who names a file properly loses the
 * comparison the table was chosen for, and loses it quietly, because the
 * `overflow-x-auto` container absorbs all of it and the frame itself never
 * scrolls.
 *
 * **The tags column is the one slot that does reflow, and it reflows by
 * losing.** It is the only cell whose contents can break — badges in a
 * `flex-wrap` row — so its min-content is one badge wide, and the browser
 * spends the width on the nowrap cells instead: measured, the cell collapses
 * to 107px and four tags stack four-high at y-offsets 9 / 33 / 57 / 81,
 * taking the row from 57px to 109px. So the component's answer to long
 * content is that the *describing* column pays for the *identifying* one, and
 * a row's height becomes a function of its neighbours' titles. Nothing in the
 * spec or the docs says which slot yields.
 */
export const LongContent: Story = {
  args: {
    tracks: [
      {
        id: "1",
        title: "Midnight Drive — extended club mix, 2026 remaster, sidechain fixed, master v7",
        artist: "Nova Kane",
        tags: ["synthwave", "instrumental", "club", "extended"],
        peaks: PEAKS,
        bpm: 124,
        musicalKey: "F minor",
      },
      {
        id: "2",
        title: "Paper Lanterns",
        artist: "Ilya Sound",
        tags: ["ambient"],
        peaks: QUIET,
        bpm: 92,
        musicalKey: "F# minor / 9A (Camelot), detected from the first 30 seconds",
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="track-list"]') as HTMLElement;
    const container = root.querySelector('[data-slot="table-container"]') as HTMLElement;
    const r = (el: Element) => el.getBoundingClientRect();
    const rows = Array.from(root.querySelectorAll('[data-slot="track-list-row"]'));
    const titleCell = rows[0].querySelectorAll("td")[1];

    // Nothing wraps and nothing truncates, so the table outgrows its box.
    await expect(getComputedStyle(titleCell).whiteSpace).toBe("nowrap");
    await expect(container.scrollWidth).toBeGreaterThan(container.clientWidth);

    // BPM clears the edge; the longer field does not.
    const edge = r(container).right;
    await expect(
      `bpm visible: ${r(root.querySelector('[data-slot="track-list-bpm"]')!).right <= edge}, ` +
        `key visible: ${r(root.querySelector('[data-slot="track-list-key"]')!).right <= edge}`,
    ).toBe("bpm visible: true, key visible: false");

    // Tags are the only breakable cell, so they absorb the squeeze: four
    // badges on four lines, and a row half again as tall as its neighbour.
    const tagsCell = rows[0].querySelector('[data-slot="track-list-tags"]') as HTMLElement;
    const tops = Array.from(tagsCell.querySelectorAll('[data-slot="badge"]')).map((b) =>
      Math.round(r(b).top),
    );
    await expect(tops).toHaveLength(4);
    await expect(new Set(tops).size).toBe(4);
    await expect(r(rows[0]).height).toBeGreaterThan(r(rows[1]).height);
  },
};

/**
 * 375px, and the two columns this component was restored to the catalog for
 * are the two that are not on screen.
 *
 * Six `nowrap` columns measure 566px inside a 375px frame. The frame itself
 * does not scroll sideways (375 = 375); the vendored `Table`'s own
 * `overflow-x-auto` container takes all 191px of it. Measured from the
 * container's left edge: BPM begins at x=453 and Key at x=500, both past the
 * 375px viewport, while artwork, title, tags and the Play control all fit.
 * So a phone gets the generic half of the row for free and has to know to
 * swipe for the tempo and the key — which is the argument in `Boundary`
 * inverted: at this width the component degrades into the asset library it
 * exists to be distinct from.
 *
 * **And the scroll region is keyboard-reachable only by accident.** That
 * container is a bare `<div class="relative w-full overflow-x-auto">` in
 * `components/ui/table.tsx` — no `tabIndex`, no role, no name. It passes axe
 * here only because the six row buttons inside it are focusable, and both
 * handlers are optional. Measured: this same 375px render with `tracks` and
 * **neither** `onPlayToggle` nor `onSelect` fails the a11y gate outright —
 * "Scrollable region must have keyboard access (scrollable-region-focusable)"
 * on `.overflow-x-auto` — because a read-only library contains nothing
 * focusable at all, and a keyboard user then reaches four columns and stops.
 * That is the fourth instance of this shape after L5 `shortcuts-sheet`, P1
 * `data-views` and F6 `render-queue`, and the second in the vendored table;
 * it is recorded rather than fixed from here, because the repair belongs to
 * the primitive every table in the registry shares. The story below renders
 * the passing case and asserts what it depends on.
 */
export const Mobile: Story = {
  render: (args) => (
    <div data-testid="mobile-frame" className="w-[375px] max-w-full">
      <TrackList {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector('[data-testid="mobile-frame"]') as HTMLElement;
    const root = frame.querySelector('[data-slot="track-list"]') as HTMLElement;
    const container = frame.querySelector('[data-slot="table-container"]') as HTMLElement;
    const r = (el: Element) => el.getBoundingClientRect();

    // Measure the frame, not the `layout: "centered"` wrapper above it.
    await expect(frame.clientWidth).toBe(375);
    await expect(frame.scrollWidth).toBe(frame.clientWidth);

    // The table absorbs the overflow instead of the page.
    await expect(container.scrollWidth).toBeGreaterThan(container.clientWidth);

    // Play is on screen; the tempo and the key are not.
    const edge = r(container).right;
    await expect(
      `play visible: ${r(root.querySelector('[data-slot="track-list-play"]')!).right <= edge}, ` +
        `bpm visible: ${r(root.querySelector('[data-slot="track-list-bpm"]')!).left <= edge}, ` +
        `key visible: ${r(root.querySelector('[data-slot="track-list-key"]')!).left <= edge}`,
    ).toBe("play visible: true, bpm visible: false, key visible: false");

    // …and the only reason that scroll region is keyboard-reachable is the
    // per-row controls inside it. Take both handlers away and there are none.
    await expect(container.querySelectorAll("button").length).toBe(6);
  },
};

const LIBRARY_ITEMS: AssetLibraryItem[] = [
  { id: "1", name: "Midnight Drive.wav", type: "Audio", size: "42.1 MB", modified: "2 days ago" },
  { id: "2", name: "Paper Lanterns.wav", type: "Audio", size: "31.6 MB", modified: "Yesterday" },
  { id: "3", name: "Drums (stem).wav", type: "Audio", size: "18.9 MB", modified: "2 days ago" },
];

/**
 * The same three files in both components, which is the only honest way to
 * show why this one was restored.
 *
 * J7 was folded into J1 `asset-library` during consolidation and `gaps.md`
 * R5 reverses that: **a generic asset row cannot express BPM or musical key,
 * and for music those are the two facets people sort and filter by.** Side by
 * side the difference is not a styling preference. The library row spends its
 * columns on type, size and modified — true of every file a product stores
 * and useful for none of the decisions a musician makes — while the track row
 * spends them on tempo, key and an audition strip. Asserted below: the two
 * tables' column headings are disjoint apart from the leading name column,
 * and only one of them has anywhere to put 124 BPM in F minor.
 *
 * The rest follows from that. The track list opens as a table for the same
 * reason: comparability is the point, so a card grid — which is the shape the
 * rest of family J takes — would hide the numbers you opened the library to
 * compare. And playing a row is in-place state rather than navigation,
 * because comparing three takes through a detail view costs three round
 * trips.
 *
 * **Choosing between them, in order.** Does a row carry tempo or key, or does
 * anyone need to audition it without leaving the list — track list. Does the
 * collection mix folders with files, need selection mode, bulk actions or an
 * overflow menu per row — asset library, which is the general case and has
 * all of that; this component has none of it. Both at once is a real
 * position, and today it is unresolved: J7 has no folders, no selection and
 * no row menu, so a music library that also needs bulk moves has to choose
 * which half to give up. Recorded rather than papered over.
 *
 * The third near-twin is not a list at all. H6 `waveform-editor` is what the
 * inline strip is deliberately not: the strip is a 24px preview you scan and
 * cannot scrub, and the moment you want region selection, sample zoom or trim
 * you want the editor on one track, not a column across many.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-4xl flex-col gap-8">
      <section className="flex flex-col gap-2" data-testid="track-list-case">
        <p className="text-foreground text-xs font-medium">
          Track list — tempo and key are columns, and the row auditions in place
        </p>
        <TrackList label="Library" tracks={TRACKS} onPlayToggle={() => {}} onSelect={() => {}} />
      </section>

      <section className="flex flex-col gap-2" data-testid="asset-library-case">
        <p className="text-foreground text-xs font-medium">
          Asset library — the same three files, where type, size and modified are all a row can say
        </p>
        <AssetLibrary title="Assets" items={LIBRARY_ITEMS} onOpen={() => {}} />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const headings = (testId: string) =>
      Array.from(
        canvasElement.querySelectorAll(`[data-testid="${testId}"] thead th`),
        (th) => th.textContent?.trim() ?? "",
      ).filter(Boolean);

    // The columns are the argument. Only one of these can hold a tempo.
    await expect(headings("track-list-case")).toEqual(["Artwork", "Track", "Tags", "Preview", "BPM", "Key"]);
    const library = headings("asset-library-case");
    await expect(library).not.toContain("BPM");
    await expect(library).not.toContain("Key");
  },
};
