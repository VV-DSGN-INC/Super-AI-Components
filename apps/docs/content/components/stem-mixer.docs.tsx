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
  pitfalls: [
    "Treating onSoloChange's stem id as the whole story. The second argument is the complete resulting solo set, and it is the only thing that expresses exclusive mode — apply it wholesale. Toggling just the pressed stem turns exclusive solo into additive solo without anyone noticing.",
    "Forking this into an ExclusiveStemMixer and an AdditiveStemMixer. They are the same markup and the same controls; only the resolution differs, which is exactly why it is a prop. Two components means two sets of accessible names to keep in sync and two places for the audibility rules to drift.",
    "Feeding level from a requestAnimationFrame loop straight into React state. Every lane re-renders on every frame while none of the sliders or toggles change; sample at 10–20 Hz, which is already faster than anyone can read a meter.",
    "Expecting the mixer to apply mute and solo to audio. It computes audibility for display and emits your changes; the gain staging is yours. A stem is audible when it is not muted and either nothing is soloed or it is one of the soloed — mirror that rule in your audio graph, or the lanes will lie.",
    "Dropping lineage from stems the user uploaded themselves because it feels redundant. It stops being redundant the moment a generated stem sits in the same mixer: a lane with no lineage line reads as unknown provenance, not as safe.",
  ],
};
