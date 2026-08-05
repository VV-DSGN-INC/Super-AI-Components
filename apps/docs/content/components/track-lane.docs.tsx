import type { ComponentDocs } from "@/lib/component-docs";
import {
  ALanePerClip,
  HandlesBelongToTheClip,
  MismatchedScales,
  OneScaleForEveryLane,
} from "./track-lane.examples";

/**
 * Seeded from docs/design-system/component-specs.md#h3-track-lane.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). Live examples live in the ./track-lane.examples client
 * sidecar and are referenced here as zero-prop elements.
 */
export const TrackLaneDocs: ComponentDocs = {
  whatItIs:
    "One row of a timeline: a fixed-width gutter carrying the track name plus mute, solo and lock, and beside it a horizontally scrolling row of clips positioned in seconds. The track type — filmstrip, waveform, text or adjustment — changes what a clip draws and nothing else.",
  whyItMatters:
    "Every editor in the Premiere lineage, and everything CapCut and Descript have built since, is a stack of these. Two decisions make the difference between a timeline that holds up and one that fights you. The first is that the gutter is not part of the scroller: scroll out to 0:48 and the mute button has to still be under your cursor, because the controls belong to the track, not to the moment you happen to be looking at. The second is that a video lane, an audio lane, a caption lane and an adjustment lane are the same lane. Building four components produces four slightly different selection models, four slightly different lock behaviours, and a timeline where the rules change depending on which row you clicked. Here there is one component and four renderers, and the only thing a renderer decides is what a clip looks like.",
  evidence: ["CapCut", "Descript", "Premiere-lineage editors"],
  anatomy: [
    {
      slot: "track-lane",
      note: "The root. Carries `data-type` and, when locked, `data-locked`.",
    },
    {
      slot: "track-lane-header",
      note: "The fixed-width gutter. A sibling of the scroller, never a child of it.",
    },
    { slot: "track-lane-name", note: "The track name. Truncates rather than widening the gutter." },
    {
      slot: "track-lane-controls",
      note: "The mute / solo / lock group. The three toggles keep the primitive's own `toggle` slot and are distinguished by `data-control`.",
    },
    {
      slot: "track-lane-locked-badge",
      note: "The word `Locked` beside a lock icon, so the state is never carried by colour.",
    },
    {
      slot: "track-lane-clips",
      note: "The one horizontally scrolling region. Focusable and named, so a keyboard can reach it.",
    },
    {
      slot: "track-lane-track",
      note: "The positioned surface inside the scroller. Its width is `duration × pixelsPerSecond`.",
    },
    {
      slot: "track-lane-clip",
      note: "One clip, absolutely positioned from `start` and `end`. Carries `data-clip-id` and `data-selected`.",
    },
    {
      slot: "track-lane-clip-select",
      note: "The clip's select target. Sits beneath the renderer so the trim handles are its siblings, not its children.",
    },
    {
      slot: "track-lane-clip-body",
      note: "The renderer output. The only thing in the lane that varies with `type`; carries `data-render`.",
    },
    {
      slot: "track-lane-trim-handle",
      note: "Rendered inside the selected clip, one per edge, carrying `data-edge`.",
    },
  ],
  usage:
    "Reach for a lane whenever a track of time-positioned things needs its own mute, solo and lock — not for a strip of thumbnails, which is `frame-strip`. Stack lanes by rendering several with the same `duration` and `pixelsPerSecond`; that shared scale is the only thing keeping them aligned, so hold it in one piece of state above them. Selection is controlled: pass `selectedClipId` and update it from `onSelectClip`, and hold it above the stack too if clicking a caption should also highlight the shot it sits over. Trim handles appear on their own once a clip is selected — you never render them, you just react to `onTrimClip`, which reports the clip id, which edge moved and how many seconds it moved by. `locked` suppresses selection and trimming but leaves mute and solo alone, because locking a track is an editing decision, not a routing one.",
  dos: [
    {
      text: "Give every stacked lane the same `duration` and `pixelsPerSecond`, so a clip at 0:06 sits at 0:06 in all of them.",
      example: <OneScaleForEveryLane />,
    },
    {
      text: "Let selection drive the handles — set `selectedClipId` and the handles appear on that clip, wherever it is.",
      example: <HandlesBelongToTheClip />,
    },
  ],
  donts: [
    {
      text: "Don't let stacked lanes drift onto different scales; the misalignment reads as an edit that was never made.",
      example: <MismatchedScales />,
    },
    {
      text: "Don't give each clip its own lane — a lane is a track, and one clip per track means mute, solo and lock no longer mean anything.",
      example: <ALanePerClip />,
    },
  ],
  pitfalls: [
    "The gutter width is fixed by the component, not by a prop, and that is deliberate: a per-lane width would let one lane in a stack disagree with the rest and put every clip a few pixels out. If you need a wider gutter, change it once here rather than per call site.",
    "The lane owns its own scale through `pixelsPerSecond` and does not read one from a ruler. Pairing it with `time-ruler` means passing the same number to both — nothing enforces it for you, and a mismatch is invisible until someone trusts a timecode.",
    "Trim handles nudge by `trimStep` seconds from the arrow keys and report through `onTrimClip`; they do not drag. Continuous pointer dragging needs the surrounding timeline's snapping, ripple and collision rules, none of which a single lane can see, so it is left to the consumer — but keep the keyboard path working if you add one.",
    "`onTrimClip` reports a delta. It never mutates the clip, so nothing moves until you fold that delta back into `clips`; a handle that appears stuck is usually a caller that dropped the callback.",
    "A locked lane disables its clip buttons outright, which also removes them from the tab order. That is the right behaviour for an uneditable track, but it means keyboard users cannot inspect clip names on a locked lane — unlock, or expose the names elsewhere.",
    "The renderer layer is `pointer-events-none` on purpose. If you extend a renderer with something clickable it will either swallow selection or become an interactive nested in the clip's own button; put new controls beside the handles instead.",
    'The three gutter toggles keep the vendored primitive\'s `data-slot="toggle"`. Passing your own `data-slot` from here would replace it, so they are addressed by `data-control` instead.',
  ],
};
