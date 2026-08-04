import type { ComponentDocs } from "@/lib/component-docs";
import {
  BoundariesAreTypeable,
  BoundariesInSeconds,
  SelectionAsPictureOnly,
  ZoomedToSampleLevel,
} from "./waveform-editor.examples";

/**
 * H6 has no entry in component-specs.md. It is a D12 restoration, and this
 * guidance is derived from catalog.md row H6, gaps.md R3 and decisions.md D12
 * instead. `evidence` is deliberately empty rather than invented — the same
 * precedent E9 `tts-composer` and E10 `voice-clone-recorder` set.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`,
 * etc. directly. Live examples that need interactivity live in the
 * ./waveform-editor.examples client sidecar and are referenced here as
 * zero-prop elements — see that file for why.
 */
export const WaveformEditorDocs: ComponentDocs = {
  whatItIs:
    "A sample-accurate audio editing surface: a peak strip you can zoom until one column is one sample, a playhead you can scrub, a region you can select and adjust one sample at a time, and a set of actions that operate on that region. Every offset it takes and every offset it emits is an integer sample index — the sample rate is used only to also show those offsets as a time. It is fully controlled and owns no playback: it reports where the user put the playhead and holds no timer of its own.",
  whyItMatters:
    "This is a restoration, not a new idea. It was in the approved spec, collapsed into H3 track-lane during consolidation, and brought back by decisions.md D12 because that collapse was a mistake. gaps.md R3 states the reason precisely: track-lane selects whole clips, so region selection has no equivalent there, and H2 time-ruler tops out at frames rather than samples. Audio work has a resolution video tooling never needs — a click, a breath and a plosive are all shorter than a video frame — and a timeline that cannot address a single sample cannot fix any of them. That resolution is the whole justification for a separate component, which is why it is the one thing this API refuses to round away.",
  evidence: [],
  anatomy: [
    {
      slot: "waveform-editor",
      note: "Root group. Carries data-sample-level, the programmatic form of the zoom-to-sample state.",
    },
    {
      slot: "waveform-editor-toolbar",
      note: "Zoom slider, Zoom to region, Fit, and the zoom stated in words.",
    },
    {
      slot: "waveform-editor-zoom",
      note: "Zoom slider, composed from Base UI so its thumb can be named. One stop halves or doubles the visible window.",
    },
    {
      slot: "waveform-editor-view-readout",
      note: "How many samples are visible and how many samples each column covers — the zoom level as text.",
    },
    {
      slot: "waveform-editor-canvas",
      note: "The frame holding the peak strip, the region overlay and the playhead.",
    },
    {
      slot: "waveform-editor-peaks",
      note: "The drawn waveform. aria-hidden decoration: everything it shows is stated as text elsewhere.",
    },
    {
      slot: "waveform-editor-region-overlay",
      note: "The shaded selection band. Also decoration — the selection is carried by the boundary fields and the status region.",
    },
    {
      slot: "waveform-editor-playhead",
      note: "The playhead, as a real named slider. Dragging it and pressing an arrow key are the same gesture; the arrow key moves one sample.",
    },
    {
      slot: "waveform-editor-playhead-readout",
      note: "The playhead offset in samples and in time. Deliberately not a live region.",
    },
    {
      slot: "waveform-editor-region-band",
      note: "Both region boundaries as a two-thumb slider, named Region start and Region end.",
    },
    {
      slot: "waveform-editor-region-clipped",
      note: "Shown when the region runs past the visible window and its handles are parked at the edge.",
    },
    {
      slot: "waveform-editor-region-fields",
      note: "The boundaries as typeable sample offsets, plus the derived length and duration.",
    },
    {
      slot: "waveform-editor-region-actions",
      note: "Actions on the selected region. Each names the region it will act on.",
    },
    {
      slot: "waveform-editor-region-status",
      note: "Visually hidden role=status announcing the current selection in samples and in time.",
    },
    {
      slot: "waveform-editor-view-status",
      note: "Visually hidden role=status announcing the visible window and whether it has reached sample level.",
    },
  ],
  usage:
    "Reach for it when the edit is smaller than a clip: trimming a breath, silencing a click, moving a cut a few samples off a transient. If the user is arranging whole clips on a timeline that is H3 track-lane, and if they are generating audio from a script that is E9 tts-composer — this component has no generate control on purpose. Drive it entirely from your own state: pass `peaks`, `sampleCount` and `sampleRate`, then hold `view`, `region` and `playhead` yourself and update them from `onViewChange`, `onRegionChange` and `onScrub`. Omitting a handler makes the matching control inert rather than fake: with no `onScrub` the playhead is disabled, and with no `onViewChange` the zoom controls are not rendered at all.",
  dos: [
    {
      text: "Keep both region boundaries readable and typeable as sample offsets, so a one-sample adjustment never depends on how many pixels a column happens to be.",
      example: <BoundariesAreTypeable />,
    },
    {
      text: "Let the zoom run all the way down to one column per sample, and say so in words — a magnification factor does not tell anyone whether they can address a single sample yet.",
      example: <ZoomedToSampleLevel />,
    },
  ],
  donts: [
    {
      text: "Don't let the shaded band be the only representation of the selection — a waveform is a picture, and a selection that exists only in it cannot be read, checked or adjusted without seeing it.",
      example: <SelectionAsPictureOnly />,
    },
    {
      text: "Don't express boundaries in seconds. Two decimal places of a second is hundreds of samples wide, so every edit inside that window becomes unreachable through the very fields meant to make it precise.",
      example: <BoundariesInSeconds />,
    },
  ],
  pitfalls: [
    "Letting the component own playback. It holds no timer and never advances the playhead: `onScrub` reports where the user put it, and moving it during playback is the caller's job. Wiring an interval into it is how two competing sources of truth for the playhead appear.",
    "Announcing the playhead in a live region. It changes on every arrow press, so an aria-live on it talks over the selection and zoom announcements that actually carry meaning. The playhead slider's own value text already reports it on focus.",
    "Pushing the far boundary when the near one moves. When a region runs past the visible window its off-screen handle is parked at the window edge for display only — writing that clamped value back silently rewrites a boundary the user never touched. Only the handle that moved is ever written.",
    "Adding a regenerate or voice control because the content happens to be speech. That is E9 tts-composer's loop, and duplicating it here reproduces exactly the kind of overlap D12 restored this component to undo.",
  ],
};
