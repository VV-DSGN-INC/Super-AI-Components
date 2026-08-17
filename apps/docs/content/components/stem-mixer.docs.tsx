import type { ComponentDocs } from "@/lib/component-docs";
import {
  DimmingAsTheOnlySignal,
  LineageOnEveryLane,
  MeterAsTheOnlySignal,
  StatedSilence,
} from "./stem-mixer.examples";

/**
 * Seeded from docs/design-system/catalog.md (row H7),
 * docs/design-system/decisions.md §D12 and gaps.md R4 — component-specs.md has
 * no prose section for this component. Same situation as E9/E10, and `evidence`
 * is empty for the same reason: there is no recorded reference-board sample to
 * cite, and inventing one would be worse than leaving it blank.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). Live examples live in the ./stem-mixer.examples client
 * sidecar and are referenced as zero-prop elements.
 */
export const StemMixerDocs: ComponentDocs = {
  whatItIs:
    "A vertical stack of stem lanes — one per separated or generated part of a track — each with mute, solo, volume, pan, an optional live level meter, and a line of text saying where that stem came from. It is fully controlled: it renders the mix state you hand it and emits every change, and it never touches audio, playback or timers.",
  whyItMatters:
    "Stem mixing was folded into the generic timeline track lane during an early consolidation and restored under D12 after an audit found the collapse lost two things a timeline cannot express. The first is exclusive-versus-additive solo, a genuine behavioural decision rather than a styling one: on a mixing desk, soloing a second stem normally clears the first, but when you are auditioning a separation you often want drums and bass together. Building both as one component with a soloMode prop is what stops a product growing two incompatible mixers. The second is lineage. A stem separated out of a master and a stem a model generated from a text prompt look identical once each is a lane with a fader, and the difference decides whether you trust what you are hearing — so it stays on the lane, in words.",
  evidence: [],
  anatomy: [
    {
      slot: "stem-mixer",
      note: "Root group, named by `label`. Carries the current solo behaviour as data-solo-mode.",
    },
    {
      slot: "stem-mixer-solo-mode",
      note: "States which solo behaviour is in force — it cannot be inferred from the lanes.",
    },
    {
      slot: "stem-mixer-summary",
      note: "role=status live region: how many stems are audible, and which are soloed.",
    },
    {
      slot: "stem-mixer-lane",
      note: "One stem. Carries data-stem-id, data-muted, data-soloed and data-audible.",
    },
    {
      slot: "stem-mixer-lane-name",
      note: "The stem name, reused verbatim in every control's accessible name on that lane.",
    },
    {
      slot: "stem-mixer-lane-state",
      note: "Audible / Solo / Muted / Silenced by solo — the text that makes audibility non-visual.",
    },
    {
      slot: "stem-mixer-lineage",
      note: "Where the stem came from, as text. data-origin is separated, generated or uploaded.",
    },
    { slot: "stem-mixer-mute", note: "Per-lane toggle with aria-pressed, named Mute plus the stem." },
    {
      slot: "stem-mixer-solo",
      note: "Per-lane toggle with aria-pressed, named Solo plus the stem. Resolution depends on soloMode.",
    },
    {
      slot: "stem-mixer-meter",
      note: "Wraps a progressbar named for the stem. Rendered only when that stem has a measured level.",
    },
    {
      slot: "stem-mixer-volume",
      note: "0–100 fader. Base UI's slider composed directly, so the thumb can be given a name.",
    },
    {
      slot: "stem-mixer-pan",
      note: "-100 to 100. Announces 30% left, Centre, 20% right — never a bare signed number.",
    },
  ],
  usage:
    "Reach for it wherever a product hands someone the parts of a track rather than the whole: after a stem separation, after a multi-track music generation, or in a remix or dubbing surface. Hold the stems in your own state and pass them down — the component stores nothing. Wire onSoloChange by applying its second argument, the complete resulting set of soloed ids, wholesale; it has already been resolved against soloMode, so re-deriving it from the stem id is how the two behaviours quietly become one. Choose exclusive when the mixer sits beside a transport and should behave like a desk, and additive when the job is auditioning combinations of separated parts. Supply level per stem only while something is actually playing — omit it and no meter is drawn, which is honest, whereas a meter frozen at a stale value is not.",
  dos: [
    {
      text: "Let the lane state text carry audibility — a stem silenced by another stem's solo says so in words, not just by fading.",
      example: <StatedSilence />,
    },
    {
      text: "Give every stem its lineage, so a generated part is never mistaken for one separated out of the source.",
      example: <LineageOnEveryLane />,
    },
  ],
  donts: [
    {
      text: "Don't signal a silenced lane by dimming it and lighting a badge — neither survives greyscale, and neither reaches a screen reader.",
      example: <DimmingAsTheOnlySignal />,
    },
    {
      text: "Don't let the meter stand in for state: a muted lane and a quiet lane both read zero.",
      example: <MeterAsTheOnlySignal />,
    },
  ],
  accessibility: {
    keyboard: [
      "Every lane is four tab stops — Mute, Solo, the volume thumb, the pan thumb — and that count never varies, because none of the four is optional and a lane with no meter still has both faders. A five-stem mixer is twenty stops from top to bottom, which is the strongest argument for keeping the stem count small.",
      "Mute and Solo are real buttons: Space and Enter toggle them. The faders are Base UI sliders, so the thumb takes Left/Right and Up/Down for one step, Home and End for the ends, and Page Up / Page Down for a larger jump. Pan steps by 1 across a -100…100 range, so dragging is far faster than arrowing from hard left to hard right.",
      "Each arrow press emits. `onValueChange` is wired straight through, not a commit-on-release handler, so holding an arrow key sends one callback per step — debounce on your side if a change is expensive.",
      "There is no `disabled` anywhere in this component. A lane cannot be made inert, so a mixer whose audio graph is not ready yet still hands the user four live controls per lane.",
      "Nothing is bound at the mixer level: no arrow-key movement between lanes, no keyboard shortcut for solo or mute, no Escape to clear the solo set. Tab is the only way through.",
    ],
    screenReader: [
      "The root is `role=\"group\"` named by `label`, which defaults to the literal string \"Stem mixer\". Two mixers on one page announce identically unless you name them — pass `label` whenever more than one can be on screen.",
      "The summary line is `role=\"status\" aria-live=\"polite\"`, so pressing Solo announces the whole resulting state — \"Soloing Drums, Bass. 2 of 5 stems audible.\" That is the one place exclusive mode is audible: it names the lanes that just went quiet, which no per-lane control can.",
      'The per-lane audibility text — "Audible", "Solo", "Muted", "Silenced by solo" — is plain text beside the stem name, not part of any control\'s accessible name. Tabbing to a silenced lane\'s Mute button therefore announces "Mute Drums, toggle button, not pressed" with nothing to say the lane is inaudible; the fact is on the row, but only for someone reading it rather than tabbing it.',
      "Mute and Solo carry `aria-pressed` and are named per stem (\"Mute Drums\", \"Solo Bass\"), so a five-lane mixer is ten distinguishable toggles rather than five pairs of \"Mute\" and \"Solo\".",
      'Both faders name their thumb per stem via `getAriaLabel`, which is why Base UI is composed here directly — an `aria-label` on the slider wrapper lands on the root while `role="slider"` sits on the thumb. Pan also overrides `aria-valuetext`, so it announces "Centre", "30% left" or "20% right" instead of a signed number; volume announces "72 percent".',
      "Each meter is a `role=\"progressbar\"` named `\"<stem> level\"`. It is not a live region, so a moving level announces nothing until it is queried — which is correct, and it is why mute, solo and silenced-by-solo are all carried by text that does not move when the level does.",
      "Lineage reads as a sentence — \"Separated from Master mix · Demucs v4\" — with its origin glyph `aria-hidden`, so a separated stem never announces identically to a generated one.",
      "The lanes are plain `<div>`s with no list semantics, so nothing announces how many stems there are. The summary's \"of 5\" is the only count available.",
    ],
    focus: [
      "Nothing unmounts under focus during normal use. Lanes are keyed by `stem.id`, mute and solo re-render in place, and switching a lane to inaudible changes only text — so a keyboard user pressing Solo keeps their position, which is what makes exclusive mode usable at all.",
      "The one thing that does vanish is a meter: stop passing `level` and the meter div unmounts. It holds no tab stop, so focus is unaffected, but the lane gets shorter under the pointer.",
      "Every control has a visible focus indicator of its own — the buttons through the vendored `Button`'s `focus-visible:ring-3`, and both thumbs through `focus-visible:ring-3` plus an `after:-inset-2` hit area that makes a 12px thumb reachable by touch. Nothing here inherits your global focus style.",
    ],
  },
  pitfalls: [
    "Treating onSoloChange's stem id as the whole story. The second argument is the complete resulting solo set, and it is the only thing that expresses exclusive mode — apply it wholesale. Toggling just the pressed stem turns exclusive solo into additive solo without anyone noticing.",
    "Forking this into an ExclusiveStemMixer and an AdditiveStemMixer. They are the same markup and the same controls; only the resolution differs, which is exactly why it is a prop. Two components means two sets of accessible names to keep in sync and two places for the audibility rules to drift.",
    "Feeding level from a requestAnimationFrame loop straight into React state. Every lane re-renders on every frame while none of the sliders or toggles change; sample at 10–20 Hz, which is already faster than anyone can read a meter.",
    "Expecting the mixer to apply mute and solo to audio. It computes audibility for display and emits your changes; the gain staging is yours. A stem is audible when it is not muted and either nothing is soloed or it is one of the soloed — mirror that rule in your audio graph, or the lanes will lie.",
    "Dropping lineage from stems the user uploaded themselves because it feels redundant. It stops being redundant the moment a generated stem sits in the same mixer: a lane with no lineage line reads as unknown provenance, not as safe.",
  ],
};
