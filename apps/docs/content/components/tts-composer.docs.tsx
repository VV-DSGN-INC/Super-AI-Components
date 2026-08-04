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
  pitfalls: [
    "Reaching for one Textarea across the whole script when a line needs editing. The script is a sequence of segments on purpose — editing one segment's text, voice or speed must never require re-parsing or re-splitting a monolithic block.",
    "Disabling every segment's Play control while the script transport is running. `playingSegmentId` is a single source of truth for what's audible whether a whole-script play or a single-segment preview started it — there's no second, competing 'is anything else playing' check to add.",
    "Only swapping the play/pause icon to signal transport state. Pair it with the visually-hidden `tts-composer-playback-status` announcement (which segment is currently playing) — an icon swap alone is invisible to a screen reader mid-playback.",
  ],
};
