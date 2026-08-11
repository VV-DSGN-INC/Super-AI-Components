import type { ComponentDocs } from "@/lib/component-docs";
import {
  AnnouncedMeterWithText,
  ColorOnlyRecordingIndicator,
  GateBehindCheckbox,
  SkipStraightToClone,
} from "./voice-clone-recorder.examples";

/**
 * Seeded from docs/design-system/catalog.md (row E10) and
 * docs/design-system/decisions.md §D12 / gaps.md R7 — component-specs.md has
 * no prose section for this component (only E1–E8 do). Translate the
 * catalog's internal voice into consumer-facing guidance — do not ship the
 * seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx). Live examples that need interactivity
 * live in the ./voice-clone-recorder.examples client sidecar and get
 * referenced here as zero-prop elements — see that file for why.
 */
export const VoiceCloneRecorderDocs: ComponentDocs = {
  whatItIs:
    "A guided flow for recording the voice samples a clone is trained on: read a script aloud while a live level meter confirms the mic is actually picking up sound, review the take and retake it if needed, then give explicit, recorded consent before the sample can be used for anything.",
  whyItMatters:
    "This was in the original approved spec, cut as a stretch item, and restored as one of eight components D12 brought back after an audit found they'd been dropped without real justification. The restoration note is specific about why: consent capture belongs in the recording flow itself, not tucked into a settings page the speaker never sees. A voice clone made without that person's knowledge is not a UI bug — it's the exact failure this component exists to make structurally hard to reach. The consent step is built as a gate for that reason: the callback that can actually kick off cloning only fires from inside it, never from an earlier 'happy path' step.",
  evidence: [],
  anatomy: [
    { slot: "voice-clone-recorder", note: "Root wrapper; carries the current state as data-state." },
    { slot: "voice-clone-recorder-script", note: "The line(s) to read aloud — always real text, never an image." },
    { slot: "voice-clone-recorder-start", note: "Begins recording from the prompt-script state." },
    {
      slot: "voice-clone-recorder-status",
      note: "Announced 'Recording' text (role=status) — the actual signal, not the dot beside it.",
    },
    { slot: "voice-clone-recorder-meter", note: "The level meter: a progressbar plus its own numeric text label." },
    { slot: "voice-clone-recorder-stop", note: "Ends recording and moves to retake." },
    { slot: "voice-clone-recorder-playback", note: "Take review: an audio player and/or a text summary." },
    { slot: "voice-clone-recorder-retake", note: "Discards the take and returns to recording. Text-labelled, not icon-only." },
    { slot: "voice-clone-recorder-accept", note: "Moves from retake into the consent gate. Carries no clone payload." },
    { slot: "voice-clone-recorder-consent", note: "The consent dialog itself — an AlertDialog, not inline content." },
    {
      slot: "voice-clone-recorder-consent-checkbox",
      note: "Starts unchecked every time; there is no prop to pre-check it.",
    },
    {
      slot: "voice-clone-recorder-consent-confirm",
      note: "The only control that can fire onConsent, and only once the checkbox is checked.",
    },
    { slot: "disclaimer-note", note: "A composed N3 disclaimer-note (its own slot, not renamed) — the permanent risk footnote, left unrestyled." },
  ],
  usage:
    "Reach for it anywhere a product records a voice sample for cloning — never build a bare mic-and-upload widget for this instead, since that's exactly the shape that lets consent get skipped. Drive `state` from the consumer the same way `feedback` and `promo-card` do: this component only renders the state it's given, and never calls getUserMedia itself. Feed it `level` (0–100) and `elapsedLabel` from your own audio analysis while state is \"level-metering\"; hand it `takeUrl`/`takeSummary` once you have a take for \"retake\". Wire `onAcceptTake` to move into \"consent-capture\" — never to a save or clone call directly — and treat `onConsent` as the only trigger for anything that actually creates or updates a voice model.",
  dos: [
    {
      text: "Leave the confirm button gated behind the checkbox — it starts disabled and unchecked on every visit to consent-capture, with no prop that pre-checks it.",
      example: <GateBehindCheckbox />,
    },
    {
      text: "Pair the recording indicator with visible, announced text and a numeric meter readout — never colour alone.",
      example: <AnnouncedMeterWithText />,
    },
  ],
  donts: [
    {
      text: "Don't wire \"Use this take\" straight into a clone/save call — route it through consent-capture, every time, with no bypass for trusted users or internal tools.",
      example: <SkipStraightToClone />,
    },
    {
      text: "Don't rely on a blinking coloured dot as the only recording indicator.",
      example: <ColorOnlyRecordingIndicator />,
    },
  ],
  pitfalls: [
    "Treating `onAcceptTake` as a green light to clone. It only means the speaker liked their take — it carries no payload and is not a substitute for `onConsent`, which is the one callback tied to an explicit, checked box.",
    "Building a settings-page or admin toggle that marks a voice as 'pre-consented' so the recording flow can skip straight past consent-capture next time. That's the exact pattern D12 restored this component to prevent — consent belongs to the recording, not to a flag on an account.",
    "Forgetting that `onStopRecording` has to hand a real take back via `takeUrl` or `takeSummary` before moving to \"retake\" — otherwise the review screen has nothing to play or describe.",
    "Writing generic consent copy ('I agree to the terms') instead of naming the speaker and the specific action. The default checkbox label names both on purpose; a vague override defeats the reason this is a dialog and not a terms link.",
  ],
};
