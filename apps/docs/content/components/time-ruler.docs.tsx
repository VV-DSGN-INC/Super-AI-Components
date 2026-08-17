import type { ComponentDocs } from "@/lib/component-docs";
import {
  ClippedPlayhead,
  PlayheadCrossesTheLanes,
  RangeStandingInForThePlayhead,
  ZoomIsTheOnlyDial,
} from "./time-ruler.examples";

/**
 * Seeded from docs/design-system/component-specs.md#h2-time-ruler.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). Live examples live in the ./time-ruler.examples client
 * sidecar and are referenced here as zero-prop elements.
 */
export const TimeRulerDocs: ComponentDocs = {
  whatItIs:
    "The measured edge of a timeline: a scale of ticks and timecodes, a draggable playhead, and an optional in/out range. One number — pixels per second — drives all of it, so the ruler, the playhead and the lanes underneath share a single coordinate system.",
  whyItMatters:
    "Editors that ship a timeline tend to grow three separate ideas of where a moment is: the ruler's labels, the playhead's pixel offset, and whatever the clips were laid out against. They then drift, and a frame-accurate tool becomes an approximate one. Here the scale is derived rather than authored — tick and label intervals are computed from zoom, so a ruler cannot be zoomed into a state its labels were not designed for, and the pixel maths is exported as plain functions the lanes call too. The other recurring failure is a playhead that is really just a marker on the ruler: it tells you where you are on the scale but not what it is cutting through. CapCut, Descript and Topaz all run the line the full height of the stack, and so does this.",
  evidence: ["CapCut", "Descript", "Topaz"],
  anatomy: [
    {
      slot: "time-ruler",
      note: "The root. As wide as `duration × zoom`, and carries `data-zoom`, `data-tick-interval`, `data-label-interval` and `data-scrubbing`.",
    },
    { slot: "time-ruler-ticks", note: "The decorative tick layer. Hidden from assistive tech — the sliders carry the values." },
    { slot: "time-ruler-tick", note: "One tick. `data-major` marks the ones that carry a label." },
    { slot: "time-ruler-label", note: "A timecode. Only ever drawn on a major tick." },
    { slot: "time-ruler-scrub", note: "The playhead's slider, covering the whole ruler so a press anywhere seeks." },
    { slot: "time-ruler-scrub-thumb", note: "The grab handle. Named `Playhead`; its value is spoken as a timecode." },
    { slot: "time-ruler-range", note: "The in/out layer. Present only when both points are set; passes presses through to the scrubber." },
    { slot: "time-ruler-range-band", note: "The shaded span between in and out." },
    { slot: "time-ruler-in-handle", note: "The in handle. A separate value from the playhead." },
    { slot: "time-ruler-out-handle", note: "The out handle." },
    { slot: "time-ruler-playhead", note: "The line. Rendered by the ruler and also exported on its own, for drawing across a stack of lanes." },
    { slot: "time-ruler-playhead-time", note: "The timecode bubble shown while scrubbing. A live region, so the seek is announced." },
  ],
  usage:
    "Give it a `duration` in seconds and a `zoom` in pixels per second, and put it inside your own horizontally scrolling container — the scroller belongs to you because it is what keeps the ruler and the lanes moving together. Everything else is controlled: hold `playhead` in state and update it from `onPlayheadChange`, and hold `inPoint`/`outPoint` separately and update them from `onRangeChange`. Set `snap` to a frame duration, a beat or a whole second when the edit has a grid; leave it off and precision follows zoom instead. To run the playhead down the tracks, set `--time-ruler-playhead-height` to the height of the stack, or render the exported `TimeRulerPlayhead` in the container that holds the ruler and the lanes. When you lay out clips, call the exported `timeToPixels` and `timeRulerScale` rather than repeating the arithmetic — that is what stops the lanes and the ruler disagreeing.",
  dos: [
    {
      text: "Drive density from `zoom` alone and let the labels thin out; never hand-pick a tick count for a zoom level.",
      example: <ZoomIsTheOnlyDial />,
    },
    {
      text: "Run the playhead the full height of the track stack, so it says what it is cutting through and not just where it sits on the scale.",
      example: <PlayheadCrossesTheLanes />,
    },
  ],
  donts: [
    {
      text: "Don't clip the ruler in an `overflow-hidden` frame — the playhead is drawn out of the ruler box on purpose, and clipping it strands the lanes below.",
      example: <ClippedPlayhead />,
    },
    {
      text: "Don't reuse the in/out handles to mark the current position; they are a separate layer with a separate job, and collapsing them onto the playhead loses the export range.",
      example: <RangeStandingInForThePlayhead />,
    },
  ],
  accessibility: {
    keyboard: [
      "One tab stop, or three. The playhead thumb is always there; the in and out handles exist only when both `inPoint` and `outPoint` are numbers. Pass one without the other and the whole range layer never renders.",
      "Each handle is a visually hidden `<input type=\"range\">`, so it takes the native slider keys: Left/Right and Down/Up move by `step`, Shift with an arrow and Page Up/Page Down move by `largeStep` (ten steps), and Home/End jump to the ends.",
      "`step` is your `snap` when you set one and `pixelsToTime(1, zoom)` — one pixel of ruler — when you don't. At the default `zoom` of 40 that is 0.025s per press, so arrowing across a ten-minute timeline is 24,000 keystrokes. Set `snap` on anything a person might traverse.",
      "Home and End on the range handles clamp against each other, not against the timeline: End on the in handle stops one step short of the out point, and Home on the out handle stops one step past the in point. Neither reaches 0 or `duration`.",
      "Keys people expect and don't get: there is no Escape to abandon a drag part-way, no arrow-key movement between the three handles (Tab is the only way across), and no keyboard equivalent of pressing the ruler body to seek — that is pointer-only.",
      "There is no `disabled`. `TimeRulerProps` is a `div` prop set, so a read-only ruler is not expressible; withholding `onPlayheadChange` and `onRangeChange` still leaves all three handles focusable and movable, they just report to nothing.",
    ],
    screenReader: [
      "The entire tick layer is `aria-hidden` — ticks, major ticks and every timecode label. Everything this component announces comes from the three slider handles, deliberately, because two hundred tick elements in the tree would bury them.",
      "Each handle is named by `getAriaLabel` as a fixed string — \"Playhead\", \"In point\", \"Out point\" — and its value is read by `getAriaValueText` as a timecode from `formatTimecode(value, 2)`, or from your `formatTime` when you pass one. The raw seconds are never spoken.",
      "Those names are not derived from anything you pass, and the root carries no name of its own, so two rulers on one page produce two sliders both called \"Playhead\" with nothing to tell them apart. Put an `aria-label` on each root yourself.",
      "The timecode bubble is a `role=\"status\"` region that is mounted and unmounted with the scrub state, and `scrubbing` only turns true on a pointer drag (`details.reason === \"drag\"`) or when you drive it from outside. Seeking with the arrow keys never renders it — the handle's own value text is what carries the announcement.",
      "A zoom change is announced as nothing. Tick interval, label interval and the ruler's own width all change, and the only record is `data-zoom` / `data-tick-interval` / `data-label-interval` on the root, which assistive tech does not read.",
      "`TimeRulerPlayhead` rendered on its own over a stack of lanes has no role and no name unless you pass `label`. Give it one and you get a second `role=\"status\"` alongside the ruler's own.",
    ],
    focus: [
      "All three handles ship a visible `focus-visible:ring-3` plus an `after:-inset-2` hit area, so focus is visible and grabbable without any global style of yours.",
      "Clearing `inPoint`/`outPoint` unmounts the whole range layer. If focus was on one of its handles it falls to `<body>` and the next Tab restarts from the top of the page — move focus to the playhead thumb as part of clearing a range.",
      "Focus and the playhead are independent. Seeking from a transport button elsewhere on the page moves the line and leaves focus where it was; focusing a handle does not seek.",
    ],
  },
  pitfalls: [
    "The horizontal scroller is yours, not the component's. That is deliberate — the ruler and the lanes have to scroll as one — but it means the scrollable region is your accessibility problem: make it focusable, or axe fails `scrollable-region-focusable` on your page rather than on this component.",
    "`zoom` is pixels per second, not a multiplier, and the root's width is `duration × zoom`. A duration of an hour at 120 px/s is a 432,000-pixel element; clamp your zoom range to something a browser can lay out.",
    "The tick layer is `aria-hidden`. Two hundred tick elements in the accessibility tree would bury the three values that matter, so the ruler speaks entirely through the playhead and in/out handles. If you add your own markers, give them names or hide them too.",
    "Snapping applies to reported values, not to the `playhead` you pass in. An unsnapped value renders exactly where you put it — the component will not quietly move a prop onto the grid, because that would make a controlled value lie.",
    "The handles compose Base UI's slider directly rather than the vendored `ui/slider`, which forwards neither `getAriaLabel` nor `getAriaValueText` and leaves its thumbs with no accessible name. If you restyle a handle, keep the label and the timecode value text.",
    "`snap` is one increment for all three values. A ruler that snaps the playhead to frames but lets the in point land between them is worse than one that snaps nothing, so there is no per-value override.",
  ],
};
