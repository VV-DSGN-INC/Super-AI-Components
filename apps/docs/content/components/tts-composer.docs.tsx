import type { ComponentDocs } from "@/lib/component-docs";
import {
  PerSegmentRegenerateCost,
  PlayAndRegenerateAreSeparate,
  RegenerateAllButtonBoltedOn,
  SelectionByColorOnly,
} from "./tts-composer.examples";

/**
 * Seeded from docs/design-system/component-specs.md#e9-tts-composer.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples that need interactivity
 * live in the ./tts-composer.examples client sidecar and get referenced
 * here as zero-prop elements — see that file for why.
 */
export const TtsComposerDocs: ComponentDocs = {
  whatItIs:
    "A voiceover script editor built out of independently editable, independently regenerable segments — not one big textarea with a settings panel bolted on. Each segment carries its own text, voice, emotion and speed, its own generation status, and its own priced regenerate control. A transport control at the top plays the assembled script back in order.",
  whyItMatters:
    "This is a restoration, not a new idea (decisions.md D12, gaps.md R6): it was in the approved spec, dropped in consolidation, and brought back because the drop was a mistake, not a scoping call. The reason it earned its place back is the granularity problem every script-driven voiceover tool runs into — a take three segments in is good, the fourth is wrong, and a component that can only regenerate the whole script forces you to throw away the good takes to fix the bad one. Treating the script as a sequence of independently regenerable units, each with its own cost, is the entire point of the pattern; collapsing it back into a textarea with buttons is the exact failure mode this component exists to prevent.",
  evidence: ["ElevenLabs Studio", "Descript", "Approved spec (pre-consolidation)"],
  anatomy: [
    { slot: "tts-composer", note: "Root wrapper around the transport header and the segment list." },
    { slot: "tts-composer-header", note: "Whole-script Play/Pause and the total runtime." },
    { slot: "tts-composer-playback-status", note: "Visually hidden role=status announcing which segment is currently playing." },
    { slot: "tts-composer-segments", note: "The list of segments, in script order." },
    { slot: "tts-composer-segment", note: "One segment: an entity row, its editable script text, and — while selected — its settings." },
    { slot: "tts-composer-segment-badge", note: "Visible generation-status text, paired with the status icon — never icon shape alone." },
    { slot: "tts-composer-segment-select", note: "Toggles which segment's settings are expanded; named after that segment." },
    { slot: "tts-composer-segment-text", note: "The segment's own editable script text — a real Textarea, not read-only." },
    { slot: "tts-composer-segment-play", note: "Per-segment preview playback, named after that segment." },
    { slot: "tts-composer-segment-regenerate", note: "The only regenerate control this pattern offers — always per segment, always priced." },
    { slot: "tts-composer-segment-status", note: "Visually hidden role=status announcing that segment's idle → generating → ready/failed transition." },
    { slot: "tts-composer-segment-settings", note: "Voice / Emotion / Speed, built from field-row, shown only for the selected segment." },
  ],
  usage:
    "Reach for it wherever a user assembles a multi-line voiceover, narration or dialogue script rather than a single short line — the moment a script has more than one beat, a per-segment regenerate loop pays for itself. The component is fully controlled: pass `segments`, and drive `selectedSegmentId`, `playingSegmentId` and `isPlayingScript` from your own state. Give each segment a `regenerateCost` so the price of redoing just that line is visible before the user commits to it, and supply `voiceOptions`/`emotionOptions` to make Voice and Emotion pickers rather than read-only text.",
  dos: [
    {
      text: "Price every regenerate control per segment — the cost of redoing one line is a different, smaller number than redoing the script, and the user should see that before committing.",
      example: <PerSegmentRegenerateCost />,
    },
    {
      text: "Keep Play and Regenerate as separate, independently enabled controls on every segment — previewing a take should never require regenerating it first.",
      example: <PlayAndRegenerateAreSeparate />,
    },
  ],
  donts: [
    {
      text: "Don't add a single \"regenerate all\" control anywhere in the composer — whole-script regeneration wastes credits and throws away every good take along with the bad one.",
      example: <RegenerateAllButtonBoltedOn />,
    },
    {
      text: "Don't mark the selected segment with a tinted background alone — pair it with a pressed Select control so the selection survives for screen readers and high-contrast themes.",
      example: <SelectionByColorOnly />,
    },
  ],
  accessibility: {
    keyboard: [
      "A collapsed segment is four tab stops — Select, Play, Regenerate, then its script `Textarea`. Selecting it expands the settings and adds up to five more: the Voice select, the Emotion select when offered, the speed slider thumb, the numeric speed input and the reset control. One Play-script button sits above the whole list.",
      "Focusing a segment's `Textarea` selects that segment — `onFocus` calls `onSelectSegment`. So tabbing down the list expands each segment in turn and collapses the one before it, changing the tab order as you go. That is the single most surprising keyboard behaviour here, and it means you can never Tab or Shift+Tab into a segment's settings without first landing on its script field.",
      "Play is `disabled` unless the segment is `ready` or already playing, and Regenerate is `disabled` while it is `generating`. Both leave the tab order while disabled, so the stop count changes underneath the user as generations land.",
      "The speed slider is a Base UI thumb: arrows move by 0.1, Shift with an arrow and Page Up/Page Down move by ten steps, Home and End jump to 0.5 and 2. The numeric input beside it takes a typed value over the same range, so an exact speed never needs the slider.",
      "Reset is a real button and is `disabled` whenever speed is already 1, so it drops out of the tab order for an unmodified segment.",
      "Nothing here has an arrow-key list, a Delete shortcut or an Escape. Every action is a `<button>` reached by Tab and fired with Enter or Space.",
    ],
    screenReader: [
      "Every per-segment control is named after its segment: \"Select Segment 2\", \"Play Segment 2\", \"Regenerate Segment 2\", \"Segment 2 script text\", \"Voice for Segment 2\", \"Speed for Segment 2\". Change `segmentLabel` and all of them follow, which is the whole reason that prop exists.",
      "Selection is `aria-pressed` on the Select button plus an icon swap from `Square` to `SquareCheck`; the border tint is supplementary and carries nothing on its own. Play carries `aria-pressed` too.",
      "Segments are `<li>` in a `<ul>`, so position and count announce, and the expanded settings are a `role=\"group\"` named \"<label> settings\".",
      "Each row owns a visually hidden `role=\"status\"` reading \"Segment 2: Generating…\", \": Ready, 0:04\" or \": Failed to generate\", so a status change announces without the icon. Regenerate a whole list at once and several of those regions change in the same tick, which queues rather than collapses.",
      "A separate `role=\"status\" aria-live=\"polite\"` at the top announces \"Playing script — Segment 3\" as playback advances. It clears to an empty string when playback stops, and an empty string announces nothing — so starting the script is spoken and stopping it is not.",
      "Status is never icon-only: a visible `Badge` sits beside every status icon, and the failed badge is forced solid (`bg-destructive text-background`) because the vendored destructive badge's tinted variant measures 4.0:1 against a 4.5:1 minimum.",
      "The speed slider's name is duplicated onto the thumb through `getAriaLabel`, because `FieldRow`'s `<label for>` cannot reach a nested Base UI thumb, and its value is spoken as \"1.4×\" rather than a bare number.",
      "The row's title and its \"voice · emotion · speed\" description are plain text in an entity row, not part of any control's name. The current voice is readable in browse mode and is never announced when you focus a button on that row.",
    ],
    focus: [
      "Pressing Regenerate disables the button you just pressed the moment `status` becomes `generating`, and focus drops to `<body>`. Play does the same when a segment stops being `ready`. Both are the ordinary path through this component, so move focus deliberately in the handler that flips the status.",
      "Collapsing a segment's settings always happens behind the moving cursor when you tab forward, so tabbing never strands focus. Changing `selectedSegmentId` from outside — clearing it, or selecting a different segment — while focus is inside the expanded settings does drop focus to `<body>`.",
      "Focus rings come from the vendored `Button`, `Textarea` and `Select`; the slider thumb ships its own `focus-visible:ring-3` and the reset control its own `focus-visible:ring-2`.",
      "Nothing scrolls a segment into view when it expands, so selecting a segment low in a long script opens its settings below the fold.",
    ],
  },
  pitfalls: [
    "Reaching for one Textarea across the whole script when a line needs editing. The script is a sequence of segments on purpose — editing one segment's text, voice or speed must never require re-parsing or re-splitting a monolithic block.",
    "Disabling every segment's Play control while the script transport is running. `playingSegmentId` is a single source of truth for what's audible whether a whole-script play or a single-segment preview started it — there's no second, competing 'is anything else playing' check to add.",
    "Only swapping the play/pause icon to signal transport state. Pair it with the visually-hidden `tts-composer-playback-status` announcement (which segment is currently playing) — an icon swap alone is invisible to a screen reader mid-playback.",
  ],
};
