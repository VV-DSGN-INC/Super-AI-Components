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
  accessibility: {
    keyboard: [
      "The tab-stop count is set by which handlers you pass, not by the audio. Fully wired with a region and four region actions it is twelve: the zoom slider, Zoom to region, Fit, the playhead, both region-band thumbs, the Start and End fields, and one per action. With no region it is three.",
      "Omitting a handler does not always remove a stop. No `onScrub` disables the playhead thumb and takes it out of the tab order, and no `onViewChange` removes the zoom controls entirely — but no `onRegionChange` only makes the boundary fields `readOnly`, and a read-only input is still tabbable, so you tab through two fields you cannot change.",
      "Every slider thumb is a visually hidden `<input type=\"range\">`. Arrow keys move one sample; Shift with an arrow, PageUp and PageDown move `largeStep`, a tenth of the visible window; and Up and Down work as well as Left and Right — the on-screen Left/Right hint understates what is actually bound.",
      "Home and End on the playhead go to the edges of the visible window, not of the buffer, because `min` and `max` are `view.start` and `view.end`. Arrowing cannot leave the window either: reaching audio that is off screen means zooming out or pressing Fit first.",
      "On the two-thumb region band, Home and End address the neighbouring thumb rather than the buffer, so End on Region start collapses the region to a single sample instead of jumping to the end of the audio.",
      "The boundary fields are `type=\"number\"`: arrows step one sample, and an out-of-range value is clamped on the way out rather than blocked on the way in. Clearing a field emits nothing — the parsed value is `NaN`, the callback is skipped, and the controlled value snaps back on the next render.",
      "Nothing answers to Delete, Backspace or Escape. There is no keyboard way to clear a selection or to fire a region action without tabbing to its button, and `action.disabled` is a real `disabled` attribute, so a disabled action is skipped rather than announced as unavailable.",
    ],
    screenReader: [
      "The root is a `role=\"group\"` named by `label`, which defaults to \"Waveform editor\". Two editors on one page both carrying the default announce identically — name them.",
      "The peak strip and the shaded region overlay are `aria-hidden`, and nothing describes the waveform's shape in words. What survives without sight is offsets, lengths and durations, not contour — which is the deliberate trade, but it is a trade.",
      "All four thumbs are named through `getAriaLabel` — Zoom level, Playhead, Region start, Region end — and each reports its own value text, so a boundary announces as \"12,000 samples, 0:00.272\" rather than a percentage. This is why the component reaches for the Base UI slider directly: the vendored `components/ui/slider` forwards neither prop and leaves an anonymous slider behind.",
      "Selection and zoom each own a permanently mounted, visually hidden `role=\"status\"`, so unlike most state changes in this registry these really are announced. The cost is that both fire during a drag: holding an arrow key on a boundary produces a stream of \"Region 12,000 to 18,300 samples…\" on top of the slider's own value text.",
      "The playhead is deliberately outside that — no live region, reported only by its own value text when it has focus.",
      "Each region action's `aria-label` replaces its visible text with \"Trim region 12,000 to 18,300 samples\", so an action always names what it will act on. The visible label is the prefix, so voice control still reaches it by name.",
      "The unit is visible only. `UnitInput` renders \"smp\" as a sibling `<span>` that is in neither the field's name nor its description, so the fields announce as \"Start, spin button, 12,000\" with no unit at all. The `m:ss.mmm` hint beside them is properly wired through `aria-describedby`.",
      "The \"This region extends past the visible window\" warning is a plain `<p>`, not a live region, so it appears silently the moment zooming crops the selection.",
    ],
    focus: [
      "Clearing the selection unmounts both band thumbs, both boundary fields and Zoom to region at once, so focus falls to `<body>` and the next Tab restarts from the top of the page. That includes the case where a destructive region action is what cleared it — the button that was just pressed is one of the things that disappears.",
      "Zooming never moves focus. A boundary that scrolls out of the window keeps its thumb, parked at the window edge, so a focused thumb is not lost — but it stops tracking the value it reports until you zoom back out.",
      "All four thumbs draw `focus-visible:ring-3`, and `UnitInput` rings its whole wrapper on `focus-within`. The zoom, Fit and region-action buttons inherit the shared `Button` ring, so every control here is visible on focus without help from you.",
    ],
  },
  pitfalls: [
    "Letting the component own playback. It holds no timer and never advances the playhead: `onScrub` reports where the user put it, and moving it during playback is the caller's job. Wiring an interval into it is how two competing sources of truth for the playhead appear.",
    "Announcing the playhead in a live region. It changes on every arrow press, so an aria-live on it talks over the selection and zoom announcements that actually carry meaning. The playhead slider's own value text already reports it on focus.",
    "Pushing the far boundary when the near one moves. When a region runs past the visible window its off-screen handle is parked at the window edge for display only — writing that clamped value back silently rewrites a boundary the user never touched. Only the handle that moved is ever written.",
    "Adding a regenerate or voice control because the content happens to be speech. That is E9 tts-composer's loop, and duplicating it here reproduces exactly the kind of overlap D12 restored this component to undo.",
  ],
};
