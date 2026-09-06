import type { Meta, StoryObj } from "@storybook/react-vite";
import { AudioLines, Film, Sparkles, Type, Wand2 } from "lucide-react";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { StudioShell } from "@/registry/super-ai/studio-shell";
import { TimelineShell, type TimelineShellProps } from "@/registry/super-ai/timeline-shell";
import { TimelineShellDocs } from "@/content/components/timeline-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { settledFocusRing } from "@/lib/focus-ring";

const RAIL = [
  { id: "media", label: "Media", icon: <Film /> },
  { id: "audio", label: "Audio", icon: <AudioLines /> },
  { id: "text", label: "Text", icon: <Type /> },
  { id: "effects", label: "Effects", icon: <Sparkles />, badge: "new" as const },
];

const PANEL_SECTIONS = [
  {
    id: "recent",
    title: "Recent clips",
    count: 4,
    items: [
      { id: "m1", label: "Harbour, wide" },
      { id: "m2", label: "Harbour, close" },
      { id: "m3", label: "Interview A" },
      { id: "m4", label: "Interview B" },
    ],
  },
  {
    id: "b-roll",
    title: "Suggested b-roll",
    collapsible: true,
    items: [
      { id: "b1", label: "Gulls over the pier" },
      { id: "b2", label: "Crane at dusk" },
    ],
  },
];

const TRACKS: TimelineShellProps["tracks"] = [
  {
    id: "video",
    name: "Video",
    type: "filmstrip",
    clips: [
      { id: "v1", label: "Harbour, wide", start: 0, end: 5.5 },
      { id: "v2", label: "Interview A", start: 5.5, end: 13 },
    ],
  },
  {
    id: "voice",
    name: "Voice",
    type: "waveform",
    clips: [{ id: "a1", label: "Narration", start: 0.5, end: 12.5 }],
  },
  {
    id: "captions",
    name: "Captions",
    type: "text",
    clips: [
      { id: "t1", label: "Opening line", text: "The harbour never really closes.", start: 0.5, end: 4 },
      { id: "t2", label: "Second line", text: "It just gets quieter.", start: 4, end: 7 },
    ],
  },
];

const TRANSCRIPT: TimelineShellProps["transcript"] = {
  speakers: [{ id: "ada", name: "Ada" }],
  segments: [
    {
      id: "seg1",
      speakerId: "ada",
      tokens: [
        { id: "w1", kind: "word", text: "The", start: 0.5, end: 0.8 },
        { id: "w2", kind: "word", text: "harbour", start: 0.8, end: 1.4 },
        { id: "w3", kind: "word", text: "never", start: 1.4, end: 1.9 },
        { id: "w4", kind: "word", text: "really", start: 1.9, end: 2.4 },
        { id: "w5", kind: "word", text: "actually", start: 2.4, end: 3, deleted: true },
        { id: "w6", kind: "word", text: "closes", start: 3, end: 3.6 },
        { id: "m1", kind: "media", media: "image", label: "Pier, dusk", start: 3.6, end: 5 },
      ],
    },
  ],
};

const JOBS: TimelineShellProps["renderJobs"] = [
  {
    id: "preview",
    name: "Rough cut preview",
    stage: "preview",
    state: "done",
    spec: { format: "MP4", codec: "H.264", resolution: "1280×720", fps: 24 },
    cost: { amount: 2, unit: "credits" },
    downloadUrl: "#",
  },
  {
    id: "export",
    name: "Harbour film — final",
    stage: "export",
    state: "streaming",
    progress: 38,
    spec: { format: "MP4", codec: "H.265", resolution: "3840×2160", fps: 24 },
    cost: { amount: 40, unit: "credits" },
  },
];

/** ~80 characters each, and the kind of string a camera department really
 *  hands over. Used by `LongContent`. */
const LONG_CLIP = "Harbour, wide — take 3, colour graded, second unit handover, 4K master, do not trim";
const LONG_TRACK = "Voice — narration, second pass, room tone removed, levels matched to the score";
const LONG_JOB = "Harbour film — final master for the festival submission, 4K HDR, second pass";

const STAGE = (
  <div className="flex h-full w-full flex-col items-center justify-center gap-2">
    <Wand2 aria-hidden className="size-6" />
    <p className="text-sm">Harbour film — 0:13</p>
  </div>
);

const FULL_ARGS: TimelineShellProps = {
  railItems: RAIL,
  activeRailId: "media",
  onRailSelect: () => {},
  panel: { sections: PANEL_SECTIONS, searchable: true, searchPlaceholder: "Search media" },
  preview: STAGE,
  renderJobs: JOBS,
  onRetryJob: () => {},
  onCancelJob: () => {},
  onDownloadJob: () => {},
  duration: 13,
  currentTime: 3.2,
  onSeek: () => {},
  zoom: 44,
  snap: 1 / 24,
  inPoint: 1,
  outPoint: 9,
  transport: { variant: "frame-accurate", fps: 24 },
  tracks: TRACKS,
  selectedClipId: "v1",
  onSelectClip: () => {},
  inspector: {
    elementType: "clip",
    selectionLabel: "Harbour, wide",
    sections: {
      clip: [
        { id: "timing", label: "Timing", content: null },
        { id: "transform", label: "Transform", state: "modified", onReset: () => {}, content: null },
      ],
    },
  },
};

const meta: Meta<typeof TimelineShell> = {
  title: "Super AI/Timeline Shell",
  component: TimelineShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(TimelineShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TimelineShell>;

/** The working editor: media panel, stage, staged renders, transport, three tracks. */
export const Tracks: Story = { args: FULL_ARGS };

/**
 * The other half of the one variant flag. H4 replaces the track stack entirely —
 * both are views of the same edit-decision list, so the playhead and the seek
 * callback are unchanged and only the dock is different.
 */
export const Transcript: Story = {
  args: {
    ...FULL_ARGS,
    variant: "transcript",
    transcript: TRANSCRIPT,
    currentTime: 1.6,
    selectedClipId: null,
  },
};

/**
 * Day one. Nothing on the timeline, nothing queued, nothing selected — five
 * empty affordances at once (stage, dock, queue, panel, inspector), which is
 * the version most new users actually see. Mandatory export for the block
 * contract.
 */
export const Empty: Story = {
  args: {
    railItems: RAIL,
    activeRailId: "media",
    duration: 0,
    transport: { variant: "frame-accurate", fps: 24 },
  },
};

/**
 * Narrow viewport. The content panel drops below `md` and the inspector below
 * `lg`, leaving the rail, the stage and the dock — the three things a timeline
 * editor cannot do without. Mandatory export for the block contract: a shell is
 * a layout, and layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing while looking configured.
 * `options` is declared explicitly so the selection cannot silently resolve to
 * nothing.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `pnpm test:stories` has no manager to resize an iframe, so it
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

/** Export staged: a finished 720p proof and a 4K master still rendering, in one queue. */
export const Exporting: Story = {
  args: {
    ...FULL_ARGS,
    renderJobs: [
      ...JOBS,
      {
        id: "failed",
        name: "Vertical cut",
        stage: "export",
        state: "failed",
        spec: { format: "MP4", codec: "H.264", resolution: "1080×1920", fps: 30 },
        cost: { amount: 18, unit: "credits" },
        error: "The source clip was trimmed while the export was running.",
      },
    ],
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this shell meets in a real edit, as opposed
 * to the two docks above. See docs/design-system/story-conventions.md.
 *
 * All eight are written, so there are no `case-skip` lines. That follows from
 * the layer rather than from ambition: a shell composing nine components
 * inherits every situation each of them has. The three that looked skippable
 * are not. `Controlled` — the clock (`currentTime`/`onSeek`), the selection
 * (`selectedClipId`/`onSelectClip`) and the rail (`activeRailId`
 * /`onRailSelect`) are three controlled pairs, and "everything is controlled"
 * is the last line of this component's own docs page. `ReducedMotion` — one
 * real branch reaches the shell, `animate-spin motion-reduce:animate-none` on
 * F6's rendering row (`render-queue.tsx:81`), and it is read back off the live
 * element rather than asserted from the class. `Boundary` — the spec calls O4
 * "a variant of O3" in as many words, so the pair is declared, not inferred.
 *
 * One mechanical fix landed with these stories — `border-l` → `border-s` on
 * the inspector, measured both ways and pinned in `RTL`. Two shell-level
 * defects are recorded and asserted nowhere, per the fix policy: the spanning
 * playhead is 8px out in LTR and 402px out in RTL (`RTL` below), and the dock
 * scrolls 24px sideways at 375px (`Mobile` below). Neither is a class.
 * ---------------------------------------------------------------------- */

/** Sets `dir` on the document, the only place a Base UI portal can read it. */
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

const leftOf = (el: Element | null | undefined) => Math.round(el!.getBoundingClientRect().left);

/** What a tab stop is, for the walk below: its own slot, else its region, else
 *  its name — Base UI's slider handles are `<input>`s with neither slot. */
const stopId = (el: Element) =>
  el.getAttribute("data-slot") ??
  el.getAttribute("data-region") ??
  el.getAttribute("aria-label") ??
  el.tagName.toLowerCase();

/**
 * Right-to-left, and the shell splits cleanly in two: **the frame mirrors, the
 * timeline does not** — and the second half is a coordinate model, not a class.
 *
 * **What mirrors, asserted below.** Every region swaps ends. Measured at
 * 1200px with the same args: LTR rail `0..92`, panel `92..380`, stage and
 * transport `380..880`, inspector `880..1200`; RTL inspector `0..320`, stage
 * and transport `320..820`, panel `820..1108`, rail `1108..1200`. H3's lane
 * gutter goes with it for free (`border-e`, and the shell's alignment spacer is
 * a plain width in the same flex row): gutter `389..549` in LTR, `651..811` in
 * RTL. One class had to change for the same to be true of the inspector's
 * separator: `border-l` → `border-s`, which is on the sanctioned swap list and
 * measured byte-identical in LTR — `1px` left, `0px` right, box `880..1200`,
 * before and after — while RTL goes from a rule against the window edge to one
 * facing the stage. It is asserted below rather than trusted.
 *
 * **What holds across both, and is the shell's actual promise.** The ruler and
 * every lane draw against one origin: LTR both start at `549`, RTL both start
 * at `79`. That equality is what "a clip sits under its own timecode" means,
 * and it survives mirroring because both layers are physical inside boxes that
 * mirror together. The tick labels prove the other half — `0:00@79`,
 * `0:02@167`, `0:04@255` under RTL — so **time still runs left to right in an
 * RTL document**, which is H2 `time-ruler`'s recorded decision and not this
 * shell's to reverse.
 *
 * **What is wrong, measured and left alone.**
 *
 * 1. *The spanning playhead leaves the ruler's.* The shell layers
 *    `TimeRulerPlayhead` over the whole stack (the spec's "the playhead spans
 *    every track") inside a box positioned `left-[calc(10rem+1px)] right-2`.
 *    At `currentTime=3.2` the ruler's own head paints at `219` under RTL and
 *    the shell's at `621` — **402px apart** — where the source comment claims
 *    the two "can never disagree". They already disagree by 8px in LTR (`689`
 *    against `681`), which is the dock's own `p-2` missing from the constant.
 * 2. *And the class swap does not fix it*, which is the F5 `compare-viewer`
 *    rule (`CONTINUE.md` §8, F wave) reached from a new direction. Swapping to
 *    `start-`/`end-` is byte-identical in LTR and would recover 153px of the
 *    402 — the overlay's left edge would land on the ruler window's `328` —
 *    but the remaining 249px is the ruler element overflowing its window
 *    (`79..651` inside `328..651`), because an RTL overflow anchors at the
 *    inline start. A box that does not overflow cannot be aligned with one
 *    that does. The fix is direction-aware positioning in H2, the same JS
 *    change §8 records for N4 `trace-timeline`.
 * 3. *An RTL reader opens on the end of the film.* Same overflow anchoring:
 *    the visible window is `328..651`, which at `zoom=44` is **5.7s–13.0s** of
 *    a 13s timeline, where LTR shows 0.0s–7.3s. Nothing scrolls it back — the
 *    ruler's wrapper is `overflow-hidden` (see Mobile).
 * 4. Two inherited findings this story renders but does not repeat: the
 *    composites still never learn about direction (no `DirectionProvider`, so
 *    ArrowRight on the rail and on H2's handles advances in DOM order), and in
 *    `variant="transcript"` H4 orders Latin words by flex axis, so an English
 *    transcript reads backwards. Both are §8 entries, both measured here again.
 */
export const RTL: Story = {
  args: FULL_ARGS,
  render: (args) => (
    <RtlDocument>
      <TimelineShell {...args} />
    </RtlDocument>
  ),
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="timeline-shell"]')!;
    const region = (id: string) => shell.querySelector<HTMLElement>(`[data-region="${id}"]`)!;

    // 1. The frame mirrors: inspector, stage, panel, rail, left to right.
    await expect(leftOf(region("inspector"))).toBeLessThan(leftOf(region("preview")));
    await expect(leftOf(region("preview"))).toBeLessThan(leftOf(region("content-panel")));
    await expect(leftOf(region("content-panel"))).toBeLessThan(leftOf(region("rail")));

    // 2. The inspector's separator follows the inspector. `border-l` →
    //    `border-s`, swapped in this wave: measured byte-identical in LTR
    //    (1px left, 0 right, box 880..1200 either way) and mirrored here, so
    //    the swap cannot regress silently — H3 `track-lane`'s pattern.
    const inspectorStyle = getComputedStyle(region("inspector"));
    await expect(inspectorStyle.borderRightWidth).toBe("1px");
    await expect(inspectorStyle.borderLeftWidth).toBe("0px");

    // 3. The gutter mirrors too — it is the lane's own `border-e` plus the
    //    shell's width-only spacer, so nothing had to be swapped for that.
    const lane = shell.querySelector<HTMLElement>('[data-slot="track-lane"]')!;
    const gutter = lane.querySelector<HTMLElement>('[data-slot="track-lane-header"]')!;
    const scroller = lane.querySelector<HTMLElement>('[data-slot="track-lane-clips"]')!;
    await expect(leftOf(gutter)).toBeGreaterThan(leftOf(scroller));

    // 4. The promise that has to survive mirroring: the ruler and the lanes
    //    share one origin, so second zero is second zero in both.
    const ruler = shell.querySelector<HTMLElement>('[data-slot="time-ruler"]')!;
    const firstClip = shell.querySelector<HTMLElement>('[data-slot="track-lane-clip"]')!;
    await expect(leftOf(ruler)).toBe(leftOf(firstClip));

    // 5. Time still runs left to right — H2's coordinate model, unmirrored.
    const labels = [...ruler.querySelectorAll<HTMLElement>('[data-slot="time-ruler-label"]')];
    await expect(labels.length).toBeGreaterThan(2);
    await expect(leftOf(labels[0])).toBeLessThan(leftOf(labels[1]!));
    await expect(leftOf(labels[1])).toBeLessThan(leftOf(labels[2]!));
  },
};

/**
 * `prefers-reduced-motion: reduce`, which `vitest.config.ts` emulates for every
 * test in this project. One branch reaches the shell and it is F6's: a job in
 * `streaming` draws `Loader2` with `animate-spin motion-reduce:animate-none`,
 * so the ring stops and the row keeps saying "Rendering" in text. Read back
 * off the live element rather than from the class — `animationName` is `"none"`
 * here and `"spin"` without the pair.
 *
 * Nothing else in the shell moves, and the check is a sweep rather than a
 * reading of the source: across the 424 elements under the root, no element
 * has a running animation under reduce (asserted below), and eight carry a
 * transition that is neither `all` nor `none`. All eight are colour or ring
 * crossfades — H2's scrub thumb (`transition-[color,box-shadow]`) among them,
 * which `story-conventions.md` records under `reset-affordance` as the case not
 * worth a story, since the thumb moves by value rather than by transition.
 *
 * Two motion surfaces are inherited rather than owned, and neither is this
 * component's to fix: B4's rail tooltip and H1's speed `SelectContent` both
 * already carry the restated `motion-reduce:data-open/closed` pair (and H1
 * measured in wave 4 that a default `SelectContent` computes `animation-name:
 * none` anyway, because `alignItemWithTrigger` defaults to true). The one that
 * is still open is vendored: `components/ui/progress.tsx` moves F6's progress
 * indicator with `transition-all` and no reduced-motion branch, so an export
 * that jumps from 38% to 72% still slides under reduce. `components/ui` is
 * outside this wave's reach and outside MOT-2's rule scope, so it is recorded
 * here and in §8, not swept.
 */
export const ReducedMotion: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="timeline-shell"]')!;

    // SVG `className` is an SVGAnimatedString, so read the attribute — a
    // `.animate-spin` querySelector finds it, `el.className.includes` does not.
    const spinners = [...shell.querySelectorAll<SVGElement>("svg")].filter((svg) =>
      (svg.getAttribute("class") ?? "").includes("animate-spin"),
    );
    await expect(spinners).toHaveLength(1);
    await expect(getComputedStyle(spinners[0]!).animationName).toBe("none");

    // The state survives the suppression, which is why stopping the spin is
    // safe here and was not in K5 `source-panel` (§8, K/L wave).
    const queue = within(shell.querySelector<HTMLElement>('[data-slot="timeline-shell-render-queue"]')!);
    await expect(queue.getByText("Rendering")).toBeVisible();

    // Nothing else animates: one animation in the whole tree, and it is that one.
    const animated = [...shell.querySelectorAll<HTMLElement>("*")].filter(
      (el) => getComputedStyle(el).animationName !== "none",
    );
    await expect(animated).toHaveLength(0);
  },
};

/**
 * The tab sequence, in full, with one lane so the lap is 32 stops rather than
 * 44. It is the shell's most load-bearing accessibility claim: four of its own
 * elements are stops because each is the element that actually scrolls, and
 * each must come *before* the controls inside it, or a keyboard user reaches a
 * clip before the region that holds it.
 *
 * The walk confirms the docs page's list exactly: rail (one stop — B4 is a
 * roving composite, so the other three tools are `tabindex="-1"`), the panel's
 * search and section group, the render-queue `<section>` then its two row
 * buttons, nine transport controls, the tracks group then the ruler's three
 * handles, then per lane three gutter toggles, the clip scroller and its clips,
 * then the inspector and its rows. One tab past the last inspector control
 * leaves the shell — the lap is asserted as a cycle rather than counted inside
 * an allowance (`story-conventions.md`, fact 4).
 *
 * **Every stop paints a settled focus ring except three, and the three are H2's
 * range handles.** Base UI puts a real `<input>` inside each thumb and clips it
 * with `position: fixed; clip-path: inset(50%)`; focus lands there, the user
 * agent paints its own outline on something 0×0, and the thumb carrying
 * `focus-visible:ring-3` never matches `:focus-visible` — measured here:
 * `hasVisibleFocusRing` false on all three, `thumb.matches(":focus-visible")`
 * false, `input.matches(":focus-visible")` true. That is §8's four-component
 * finding from wave 4, reached again through a shell, and the `isPainted` guard
 * in `focus-ring.ts` exists because of it. They are excluded from the ring
 * check by name and asserted in neither direction, because pinning "no ring" is
 * pinning the bug.
 */
export const KeyboardOrder: Story = {
  args: { ...FULL_ARGS, tracks: [TRACKS![0]!] },
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="timeline-shell"]')!;
    const RULER_HANDLES = ["Playhead", "In point", "Out point"];
    const EXPECTED = [
      "modality-rail-item",
      "input",
      "tool-panel-sections",
      "section-header-trigger",
      "timeline-shell-render-queue",
      "render-queue-download",
      "render-queue-cancel",
      "transport-controls-skip-back",
      "transport-controls-play",
      "transport-controls-skip-forward",
      "transport-controls-step-back",
      "transport-controls-step-forward",
      "transport-controls-mark-in",
      "transport-controls-mark-out",
      "transport-controls-timecode",
      "select-trigger",
      "timeline-shell-tracks",
      ...RULER_HANDLES,
      "toggle",
      "toggle",
      "toggle",
      "track-lane-clips",
      "track-lane-clip-select",
      "track-lane-trim-handle",
      "track-lane-trim-handle",
      "track-lane-clip-select",
      "inspector",
      "section-header-trigger",
      "section-header-trigger",
      "reset-affordance",
    ];

    (document.activeElement as HTMLElement | null)?.blur();
    const walked: string[] = [];
    const seen = new Set<Element>();
    let previous: Element | null = document.body;
    for (let i = 0; i < EXPECTED.length; i += 1) {
      const from = previous;
      await userEvent.tab();
      // Settle on departure: a press that has not applied yet leaves focus on
      // the previous stop, which is itself a stop, so an arrival-only wait
      // reads stale (story-conventions.md, fact 4).
      await waitFor(() => expect(document.activeElement).not.toBe(from));
      const el = document.activeElement!;
      await expect(shell.contains(el)).toBe(true);
      await expect(seen.has(el)).toBe(false);
      seen.add(el);
      walked.push(stopId(el));
      if (!RULER_HANDLES.includes(stopId(el))) await settledFocusRing(el, waitFor);
      previous = el;
    }
    await expect(walked).toEqual(EXPECTED);

    // The three shell stops in this variant each precede what they scroll.
    for (const [stop, inner] of [
      ["timeline-shell-render-queue", "render-queue-download"],
      ["timeline-shell-tracks", "Playhead"],
      ["inspector", "section-header-trigger"],
    ] as const) {
      await expect(walked.indexOf(stop)).toBeLessThan(walked.lastIndexOf(inner));
    }

    // One more tab and the lap is over — the shell traps nothing.
    await userEvent.tab();
    await waitFor(() => expect(shell.contains(document.activeElement)).toBe(false));
  },
};

/**
 * Three controlled pairs in one surface, driven from outside and refusing to
 * move on their own. The shell holds no state at all: `currentTime`,
 * `selectedClipId` and `activeRailId` are props, and the play below clicks the
 * three affordances a user would reach for and asserts the render is
 * unchanged afterwards — the playhead stays where it was painted, "Harbour,
 * wide" stays `aria-pressed="true"`, "Media" stays the active tool.
 *
 * The payload half matters more here than in a component, because a shell
 * fans one clock out to four children. Skip-forward reports `onSeek(8.2)` —
 * H1 computes `currentTime + skipBy` and hands back an absolute position, not
 * a delta — and the ruler's own ArrowRight reports the same callback one snap
 * step later, so a host that applies `onSeek` moves the transport, the ruler,
 * every lane and the transcript together. `onSelectClip` carries the clip id
 * and nothing else, which is all I2 needs to redraw the inspector.
 *
 * What a host cannot reach is the counterpart to §8's four host-unreachable
 * folds: the tool panel's own section expansion and H4's editing state are
 * internal to those components, so a shell that swaps `panel` or `transcript`
 * carries the old expansion in. This shell adds none of its own.
 */
export const Controlled: Story = {
  args: {
    ...FULL_ARGS,
    onSeek: fn(),
    onSelectClip: fn(),
    onRailSelect: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="timeline-shell"]')!;
    const heads = [...shell.querySelectorAll<HTMLElement>('[data-slot="time-ruler-playhead"]')];
    const before = heads.map(leftOf);

    // 1. The clock. The button reports an absolute seconds value; nothing moves.
    await userEvent.click(canvas.getByRole("button", { name: "Skip forward 5 seconds" }));
    await expect(args.onSeek).toHaveBeenCalledTimes(1);
    expect((args.onSeek as ReturnType<typeof fn>).mock.calls[0]![0]).toBeCloseTo(8.2, 5);
    await expect(heads.map(leftOf)).toEqual(before);

    // 2. The same callback from the other end of the dock: H2's own handle.
    const playhead = shell
      .querySelector<HTMLElement>('[data-slot="time-ruler-scrub-thumb"]')!
      .querySelector<HTMLInputElement>("input")!;
    const value = playhead.value;
    playhead.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(args.onSeek).toHaveBeenCalledTimes(2);
    expect((args.onSeek as ReturnType<typeof fn>).mock.calls[1]![0]).toBeGreaterThan(Number(value));
    await expect(playhead.value).toBe(value);

    // 3. Selection. The inspector is driven by this id, so the payload is it.
    const other = canvas.getByRole("button", { name: "Interview A" });
    await userEvent.click(other);
    await expect(args.onSelectClip).toHaveBeenCalledWith("v2");
    await expect(other).toHaveAttribute("aria-pressed", "false");
    await expect(canvas.getByRole("button", { name: "Harbour, wide" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // 4. The rail. It switches the panel and nothing else — see the docblock
    //    in timeline-shell.tsx: it never re-derives the stage.
    await userEvent.click(canvas.getByRole("button", { name: "Audio" }));
    await expect(args.onRailSelect).toHaveBeenCalledWith("audio");
    await expect(canvas.getByRole("button", { name: "Media" })).toHaveAttribute("aria-pressed", "true");
  },
};

/**
 * The five labels this shell owns are optional props with English defaults —
 * `previewLabel`, `renderQueueLabel`, `tracksLabel`, `transcriptLabel`,
 * `inspectorLabel` — and `""` defeats a default parameter rather than falling
 * back to it, the shape §8 records on H7 `stem-mixer` and J7 `records-shell`.
 * Three of them are rendered here. The fourth cannot be.
 *
 * **Three are silent.** The stage, the tracks dock and the inspector are
 * `role="group"` with `aria-label=""`, so three of the shell's four scroll
 * stops become unnamed focus destinations and this story is green: axe has no
 * rule for an unnamed `group`, and `scrollable-region-focusable` is satisfied
 * by `tabIndex={0}` however the region is named.
 *
 * **The fourth is a red gate, so it is written down instead of rendered.**
 * `renderQueueLabel=""` puts the empty string in an `<h2>`, and axe 4.12 fails
 * `empty-heading` outright: *"Element does not have text that is visible to
 * screen readers"*, on `<h2 id="…" class="px-1 text-sm font-medium"></h2>`.
 * The `<section>` that points at it with `aria-labelledby` also loses its
 * accessible name — J4 `artifact-grid`'s shape, where a label reference to an
 * empty element is worse than no reference at all.
 *
 * That is the clearest instance yet of K1 `ai-doc-block`'s lesson, and it is
 * cleaner here because the four props are the same prop four times: **the same
 * empty string is caught or not caught depending only on which element this
 * shell chose to render it into** — a heading is gated, an `aria-label` is not.
 * The fix is a fallback in the shell rather than a default parameter, for all
 * five.
 *
 * The composed children are the control: their names are computed from their
 * own data, so "Transport controls", "Video clips" and "Video track controls"
 * survive intact in the same render.
 */
export const EmptyLabel: Story = {
  args: {
    ...FULL_ARGS,
    previewLabel: "",
    tracksLabel: "",
    inspectorLabel: "",
  },
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="timeline-shell"]')!;

    // 1. Three groups lose their names outright, and nothing raises it.
    for (const selector of [
      '[data-slot="timeline-shell-stage"]',
      '[data-slot="timeline-shell-tracks"]',
      '[data-region="inspector"]',
    ]) {
      await expect(shell.querySelector(selector)).toHaveAttribute("aria-label", "");
    }

    // 2. The one that is gated keeps its default, so this story stays green
    //    while the docblock above carries the measurement.
    const queue = shell.querySelector<HTMLElement>('[data-slot="timeline-shell-render-queue"]')!;
    const heading = queue.querySelector<HTMLElement>("h2")!;
    await expect(heading.textContent).toBe("Render queue");
    await expect(queue.getAttribute("aria-labelledby")).toBe(heading.id);

    // 3. The children are unaffected: their names come from their own data.
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("group", { name: "Transport controls" })).toBeInTheDocument();
    await expect(canvas.getByRole("region", { name: "Video clips" })).toBeInTheDocument();
    await expect(canvas.getByRole("group", { name: "Video track controls" })).toBeInTheDocument();
  },
};

/**
 * A production name in every author-supplied slot — the 83-character clip
 * label a camera department really hands over, the same string in the panel,
 * the inspector and the export queue. The shell makes **three different
 * decisions in one screen**, and none of them is its own: it forwards the text
 * and inherits whatever the child does with it.
 *
 * - *Truncate, with no recovery.* H3's lane name is `truncate` in a 160px
 *   gutter shared with the type icon: 123px of box against 467px of laid-out
 *   text, about a quarter of the name, and no `title`. I2's selection line is
 *   the same decision at 217px against 478px. A pointer user cannot read
 *   either one, and neither offers a tooltip.
 * - *Wrap.* I1's panel item wraps to three lines (77px tall) inside the 288px
 *   panel, which is the only place the whole name is legible.
 * - *Neither.* F6's job cell is `white-space: nowrap` with no max-width, so the
 *   cell grows to 523px and pushes the table to **1053px inside a 466px
 *   scroller**. The name is reachable only by scrolling a container that is not
 *   a tab stop; it stays out of `scrollable-region-focusable` because the row's
 *   Download and Cancel buttons happen to be focusable. F6 found the same
 *   container in wave 3 with nothing focusable in it, where it failed axe
 *   outright.
 *
 * What holds regardless: the accessible names carry the full string — the clip
 * button, the lane's control group and its clip region each announce all 83
 * characters — so the truncation is visual only, and the shell itself never
 * scrolls sideways (1200/1200 at desktop width).
 */
export const LongContent: Story = {
  args: {
    ...FULL_ARGS,
    tracks: [
      {
        id: "video",
        name: "Video",
        type: "filmstrip",
        clips: [{ id: "v1", label: LONG_CLIP, start: 0, end: 5.5 }],
      },
      {
        id: "voice",
        name: LONG_TRACK,
        type: "waveform",
        clips: [{ id: "a1", label: "Narration", start: 0.5, end: 12.5 }],
      },
    ],
    renderJobs: [{ ...JOBS![0]!, name: LONG_JOB }],
    inspector: { ...FULL_ARGS.inspector, selectionLabel: LONG_CLIP },
    panel: { sections: [{ id: "recent", title: "Recent clips", items: [{ id: "m1", label: LONG_CLIP }] }] },
  },
  play: async ({ canvasElement }) => {
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="timeline-shell"]')!;
    // The laid-out width of the text itself. `scrollWidth` reports the box on a
    // truncated flex item, so it cannot see the overflow it is hiding.
    const textWidth = (el: Element) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return Math.round(range.getBoundingClientRect().width);
    };

    // 1. Truncated, twice, in two different components.
    const laneName = shell.querySelectorAll<HTMLElement>('[data-slot="track-lane-name"]')[1]!;
    await expect(getComputedStyle(laneName).textOverflow).toBe("ellipsis");
    await expect(textWidth(laneName)).toBeGreaterThan(laneName.getBoundingClientRect().width * 3);
    await expect(laneName).not.toHaveAttribute("title");

    // 2. Not truncated: the queue cell grows and the table scrolls instead.
    const queue = shell.querySelector<HTMLElement>('[data-slot="timeline-shell-render-queue"]')!;
    const container = queue.querySelector<HTMLElement>('[data-slot="table-container"]')!;
    await expect(getComputedStyle(queue.querySelector("tbody td")!).whiteSpace).toBe("nowrap");
    await expect(container.scrollWidth).toBeGreaterThan(container.clientWidth * 2);

    // 3. The name survives where it matters: every control announces it whole.
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: LONG_CLIP })).toBeInTheDocument();
    await expect(canvas.getByRole("region", { name: `${LONG_TRACK} clips` })).toBeInTheDocument();

    // 4. And the page still does not scroll sideways.
    await expect(shell.scrollWidth).toBe(shell.clientWidth);
  },
};

/**
 * A real 375×812 viewport, not a 375px box. `page.viewport` from
 * `@vitest/browser/context` resizes the test iframe, so `window.innerWidth`
 * reads 375 and the media queries actually flip — the width wrapper the other
 * twelve waves used would have rendered this shell's desktop layout inside a
 * narrow box and reported success (`story-conventions.md`, fact 2).
 *
 * What the shell does, asserted: the content panel (`md`) and the inspector
 * (`lg`) go to `display: none` while staying mounted, so the regions still
 * exist and their contents leave the tab order entirely rather than becoming
 * invisible stops. The rail, the stage, the transport and the dock survive, and
 * the document does not scroll sideways: 375/375.
 *
 * What it costs, measured and recorded:
 *
 * 1. *The dock scrolls 24px sideways on its own* — `scrollWidth` 307 against
 *    `clientWidth` 283. The cause is this shell's own overlay: the spanning
 *    playhead is drawn at `left: 141px` inside a box already inset by the
 *    161px gutter constant, which puts it at 302px in a 283px dock. It is the
 *    same 8px-in-LTR miscalculation as `RTL` above, amplified by a narrow box.
 * 2. *2.4 seconds of a 13 second film are visible.* The lane scroller is 105px
 *    wide at `zoom=44`, and the ruler cannot scroll at all — its wrapper is
 *    `overflow-hidden`, so it is clipped rather than scrolled while each lane
 *    scrolls independently. That is §8's "H3 exposes no scroll handle" gap,
 *    still open and re-measured here: the playhead at 3.2s is off-window in
 *    both the ruler and every lane, with no keyboard or pointer route to it.
 * 3. *The queue is a 720px table in a 249px scroller*, which at this width is
 *    where a phone user meets F6.
 */
export const Mobile: Story = {
  args: FULL_ARGS,
  play: async ({ canvasElement }) => {
    // Resolvable in the vitest runner, which is what gates this file; it moves
    // the iframe itself and does not leak into the next story.
    const { page } = await import("@vitest/browser/context");
    await page.viewport(375, 812);

    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="timeline-shell"]')!;
    const region = (id: string) => shell.querySelector<HTMLElement>(`[data-region="${id}"]`)!;

    // The breakpoint really moved — the whole reason for `page.viewport`.
    await waitFor(() => expect(window.innerWidth).toBe(375));
    await expect(window.matchMedia("(min-width: 768px)").matches).toBe(false);

    // Every region is still mounted; two of them are switched off by display.
    for (const id of ["rail", "content-panel", "preview", "inspector", "transport", "tracks-ruler"]) {
      await expect(region(id)).toBeInTheDocument();
    }
    await expect(getComputedStyle(region("content-panel")).display).toBe("none");
    await expect(getComputedStyle(region("inspector")).display).toBe("none");
    for (const id of ["rail", "preview", "transport", "tracks-ruler"]) {
      await expect(getComputedStyle(region(id)).display).not.toBe("none");
    }

    // No sideways page scroll, which is the claim this story exists to make.
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
  },
};

/**
 * O4 beside O3 `studio-shell`, which the spec names as its parent: "same
 * regions as O3, but the bottom dock is a time ruler with tracks instead of a
 * page strip. One shell, one variant flag."
 *
 * **The choosing rule is what the dock is for.** Reach for O4 when time is the
 * primary axis and the thing being edited has a playhead — video, audio,
 * motion — so the bottom of the screen has to show *when*. Reach for O3 when
 * the primary axis is a set of surfaces and the bottom of the screen has to
 * show *which* — pages, artboards, frames. Everything above the dock is the
 * same skeleton in both (rail → panel → stage → inspector), which is why they
 * are one archetype with two docks rather than two editors.
 *
 * Two structural differences a reader should notice, both asserted below.
 * O3 has a topbar and O4 does not: O3 gained one in the 2026-08-08 wireframe
 * reconciliation and O4's region list was never changed with it, so a document
 * title or save state has nowhere to live in this shell (its docs page carries
 * that as a pitfall). And O3 puts I3 `context-toolbar` over the canvas for
 * selection actions, where O4 spends that space on the transport, because a
 * player needs a permanent control row and a canvas does not.
 */
export const Boundary: Story = {
  args: FULL_ARGS,
  render: (args) => (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
        <TimelineShell {...args} tracks={[TRACKS![0]!]} renderJobs={[JOBS![0]!]} />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border">
        <StudioShell
          title="Harbour film — key art"
          topbar={{ zoomLabel: "100%" }}
          modalities={RAIL}
          activeModalityId="media"
          onModalityChange={() => {}}
          toolPanels={{ media: { sections: PANEL_SECTIONS } }}
          frames={[
            { id: "p1", label: "1. Poster" },
            { id: "p2", label: "2. Banner" },
            { id: "p3", label: "3. Thumbnail" },
          ]}
          activeFrameId="p1"
          onFrameChange={() => {}}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const timeline = canvasElement.querySelector<HTMLElement>('[data-slot="timeline-shell"]')!;
    const studio = canvasElement.querySelector<HTMLElement>('[data-slot="studio-shell"]')!;

    // The dock is the difference: a ruler with lanes against a page strip.
    await expect(timeline.querySelector('[data-region="tracks-ruler"]')).not.toBeNull();
    await expect(timeline.querySelector('[data-slot="time-ruler"]')).not.toBeNull();
    await expect(studio.querySelector('[data-region="page-strip"]')).not.toBeNull();
    await expect(studio.querySelector('[data-slot="time-ruler"]')).toBeNull();

    // The skeleton above it is shared — rail and inspector in both.
    for (const shell of [timeline, studio]) {
      await expect(shell.querySelector('[data-slot="modality-rail"]')).not.toBeNull();
      await expect(shell.querySelector('[data-region="inspector"]')).not.toBeNull();
    }

    // And the two asymmetries: a topbar only in O3, a transport only in O4.
    await expect(studio.querySelector('[data-region="topbar"]')).not.toBeNull();
    await expect(timeline.querySelector('[data-region="topbar"]')).toBeNull();
    await expect(timeline.querySelector('[data-region="transport"]')).not.toBeNull();
  },
};
