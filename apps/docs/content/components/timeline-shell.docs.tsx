import type { ComponentDocs } from "@/lib/component-docs";
import {
  LaneKeepsItsOwnControls,
  LaneRolledByHand,
  RulerAlignedWithItsLanes,
  RulerDriftingFromItsLanes,
} from "./timeline-shell.examples";

/**
 * Seeded from docs/design-system/block-specs.md — O4 `timeline-shell`.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and the rest directly. Live examples live in the ./timeline-shell.examples
 * client sidecar and arrive here as zero-prop elements.
 */
export const TimelineShellDocs: ComponentDocs = {
  whatItIs:
    "The page shell for a timeline-dominant editor: a tool rail on the left, a content panel beside it, a preview stage with the render queue underneath, transport controls, and a dock along the bottom that is a time ruler with a stack of tracks. It is a variant of the studio shell rather than a second editor — same rail, panel, stage and inspector skeleton, with the page strip swapped for a timeline. It is a block, so it owns arrangement and nothing else: eight shipped components fill the six regions, and each keeps its own props, its own state model and its own accessibility contract.",
  whyItMatters:
    "CapCut, Descript and Topaz are three very different products that arrange themselves the same way once time is the primary axis, which is what makes this an archetype rather than one app's layout. Two decisions are the ones worth copying. The first is that the timeline and the transcript are the same shell: they are two views of one edit-decision list, so switching between them is a flag, not a second product — Descript's whole premise is that editing the words edits the film, and that only holds if both views read the same playhead. The second is that export is staged rather than instant. A cheap preview render precedes the expensive full export, both stages sit in one visible queue, and every row carries the spec it will be billed for. An editor that hides the difference between a 720p proof and a 4K master teaches people to find out from the invoice.",
  evidence: ["CapCut", "Descript", "Topaz"],
  anatomy: [
    {
      slot: 'data-region="rail"',
      note: "B4 modality-rail. Selects which tool panel is shown; it never changes the stage.",
    },
    {
      slot: 'data-region="content-panel"',
      note: "I1 tool-panel — media, effects, presets, with its own search and docked prompt.",
    },
    {
      slot: 'data-region="preview"',
      note: "The stage (a caller-supplied player, or L1) with F6 render-queue mounted beneath it.",
    },
    {
      slot: 'data-region="transport"',
      note: "H1 transport-controls, reading the shell's clock — currentTime, duration, in/out.",
    },
    {
      slot: 'data-region="tracks-ruler"',
      note: 'H2 time-ruler over a stack of H3 track-lanes — or H4 transcript-editor instead, under variant="transcript".',
    },
    {
      slot: 'data-region="inspector"',
      note: "I2 property-inspector. Selection-driven, and it ships its own nothing-selected state.",
    },
    {
      slot: "timeline-shell",
      note: "Root. Carries data-variant so a theme can key on which dock is showing.",
    },
    { slot: "timeline-shell-stage", note: "The player surface itself — a slot, not a component." },
    { slot: "timeline-shell-render-queue", note: "The labelled, focusable section F6 sits in." },
    {
      slot: "timeline-shell-tracks",
      note: "The ruler + lanes dock, with the full-height playhead layered over it.",
    },
    { slot: "timeline-shell-transcript", note: "What the dock renders instead when variant is transcript." },
  ],
  usage:
    'Reach for it when time is the primary axis of the thing being edited — video, audio, motion, anything with a playhead. The shell owns the clock and nothing else: `duration`, `currentTime`, `onSeek`, `zoom`, `snap` and the in/out range are shell props because the transport, the ruler, every lane and the transcript all have to read the same numbers, and passing them separately is how a clip stops sitting under its own timecode. Everything else is forwarded whole — `panel` to the tool panel, `inspector` to the property inspector, `transport` to the transport controls, `transcript` to the transcript editor. Flip `variant` to "transcript" to swap the track stack for the transcript view; both are views of the same edit-decision list, so the playhead and the seek callback stay exactly where they were. Put export jobs in `renderJobs` with their real spec and stage — a preview row and an export row in the same queue is the point.',
  dos: [
    {
      text: "Give the ruler and every lane one scale, and inset the ruler by the lane gutter so second zero lines up.",
      example: <RulerAlignedWithItsLanes />,
    },
    {
      text: "Let each lane keep its own gutter controls — mute, solo and lock belong to the track, not to the shell.",
      example: <LaneKeepsItsOwnControls />,
    },
  ],
  donts: [
    {
      text: "Don't let the ruler run at its own zoom or start at its own left edge; every clip then sits under the wrong timecode.",
      example: <RulerDriftingFromItsLanes />,
    },
    {
      text: "Don't hand-roll a lane because you only need one. You lose the gutter, the lock, the trim handles and the clip's accessible name in one go.",
      example: <LaneRolledByHand />,
    },
  ],
  pitfalls: [
    "H3 owns a horizontal scroller per lane and exposes no way to read or set its scroll position, so a stack of lanes cannot be kept in sync with each other or with the ruler. At a zoom where the timeline is wider than the dock, the ruler is clipped rather than scrolled and each lane scrolls on its own. Keep zoom × duration inside the dock width until H3 grows a shared scroll context.",
    "H3's gutter width is a private constant (`w-40`), so the shell hardcodes the same 10rem + 1px to align the ruler with it. If H3 ever changes that width the ruler drifts silently — nothing fails, the numbers just stop meaning anything. The offset is a named constant here for exactly that reason.",
    "The shell renders a second playhead. H2's ruler always draws its own inside its box, and the spec's \"the playhead spans every track\" needs one layered over the whole dock — so both exist, at the same position and the same zoom. Give the spanning one a `label` and you will get two announcements.",
    "There is no topbar. The studio shell gained one in the 2026-08-08 wireframe reconciliation and this shell's region list was not changed with it, so a document title, breadcrumb or save state has nowhere to live. Put it above the shell until the manifest declares a topbar region here too.",
    "The content panel and the inspector are hidden below the `md` and `lg` breakpoints. They stay mounted, so the regions are still there, but their content is unreachable on a phone — a timeline editor at 375px shows the rail, the stage and the dock and nothing else. Decide deliberately whether your product needs a narrow-viewport route to the inspector.",
    "F6 is a six-column table and the queue sits under the stage rather than in the inspector, because a 20rem column cannot show a spec, a stage, a status and a cost side by side. That is a placement decision the spec does not make for you: if your export flow belongs in a dialog, pass no `renderJobs` and the region keeps its own empty affordance.",
    "Everything is controlled. `currentTime` that never moves, a `selectedClipId` that never changes and a transcript whose `onEdit` goes nowhere produce a screenshot, not an editor — wire the callbacks before demoing it.",
  ],
};
