import type { ComponentDocs } from "@/lib/component-docs";
import {
  FloatingPresentation,
  LockedAsSeparateBanner,
  LockedInPlace,
  NodeEmbeddedWithNegativePromptAttempt,
} from "./media-prompt-bar.examples";

/**
 * Seeded from docs/design-system/component-specs.md#d1-media-prompt-bar.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. If a Do/Don't needs a live example,
 * define a zero-prop component in a sibling "media-prompt-bar.examples.tsx"
 * client module ("use client" at the top of that file, not this one) and
 * reference it here as an element with no props, e.g.:
 *
 * // import { GoodExample } from "./media-prompt-bar.examples";
 * // dos: [{ text: "...", example: <GoodExample /> }]
 *
 * An inline handler on an element created in *this* file — e.g.
 * `<MediaPromptBar onSelect={() => {}} />` passed straight into `dos`/`donts` —
 * cannot be serialized across the server/client boundary and breaks the
 * static export.
 */
export const MediaPromptBarDocs: ComponentDocs = {
  whatItIs:
    "The media-gen omnibox: a prompt bar purpose-built for image, video, and audio generation. It ships in three presentations — floating over a canvas, docked to the bottom of a workspace, or embedded inside a workflow node — and carries an optional negative-prompt field and settings strip alongside the main textarea.",
  whyItMatters:
    "Freepik, ElevenLabs Flows, CapCut, Playground, and Runway all converge on the same shape: one prompt bar that adapts to where generation happens rather than three separate composers. The settings strip (A7) lives inside it because model, aspect ratio, and resolution changes all move the price, and the cost chip next to them is the same number quoted in E1's generation panel and E5's run button — showing a different number in D1 than at the moment of spend is the specific failure mode the spec calls out.",
  evidence: ["Freepik", "ElevenLabs Flows", "CapCut", "Playground", "Runway"],
  anatomy: [
    { slot: "media-prompt-bar", note: "Root. Carries `data-presentation` (floating/docked/node-embedded) and `data-locked`." },
    { slot: "media-prompt-bar-reference", note: "Optional slot above the field for D2 reference-strip — composed by the caller, not imported here." },
    { slot: "media-prompt-bar-field", note: "Wraps the textarea and its toolbar. Absent entirely when `locked`." },
    { slot: "media-prompt-bar-chips", note: "Optional slot inline above the textarea for D3 context-chips — composed by the caller, not imported here." },
    { slot: "media-prompt-bar-textarea", note: "The prompt input. Carries the accessible name, visible or not." },
    { slot: "media-prompt-bar-negative", note: "The negative-prompt row, toggled open in place below the main prompt. Never rendered when `presentation` is node-embedded." },
    { slot: "media-prompt-bar-toolbar", note: "The row beneath the textarea: attach, negative-prompt toggle, settings, cost on the left; submit on the right." },
    { slot: "media-prompt-bar-attach", note: "Icon-only attach button, inside the field." },
    { slot: "media-prompt-bar-settings", note: "Hosts A7 gen-settings-bar. Collapsed automatically when `presentation` is floating." },
    { slot: "media-prompt-bar-cost", note: "Cost chip (M2) — credits at the point of spend, the same number quoted in E1/E5." },
    { slot: "media-prompt-bar-submit", note: "Send button. Replaced by media-prompt-bar-stop while generating." },
    { slot: "media-prompt-bar-stop", note: "Replaces submit during generation — a distinct control, not a disabled submit." },
    { slot: "media-prompt-bar-paywall", note: "Replaces media-prompt-bar-field entirely when `locked` — the gate, in place." },
    { slot: "media-prompt-bar-unlock", note: "The paywall's CTA button." },
    { slot: "media-prompt-bar-status", note: "Visually hidden live region that announces the generating state." },
  ],
  usage:
    "Reach for `presentation=\"floating\"` when the bar sits over a canvas with no other chrome competing for space, `\"docked\"` as the default anchored composer at the bottom of a generation workspace, and `\"node-embedded\"` inside a workflow node where the negative prompt has no room and is dropped automatically. Drive `locked` from a real plan/quota check, not from a disabled textarea. Pass `settings` as a composed A7 gen-settings-bar rather than reinventing model/aspect/resolution controls here, and keep the `cost` prop in sync with whatever `settings` currently selects — it should read the same number a user sees at the moment they actually spend it.",
  dos: [
    {
      text: "Swap the input row for the paywall CTA in place when locked — the composer itself stays the gate, not a redirect to a billing page.",
      example: <LockedInPlace />,
    },
    {
      text: "Collapse the settings strip in the floating presentation instead of cramming a docked-sized toolbar into a floating bar.",
      example: <FloatingPresentation />,
    },
  ],
  donts: [
    {
      text: "Don't render the paywall as a separate banner beside the bar — it reads as a dismissible ad, not a gate on the action itself.",
      example: <LockedAsSeparateBanner />,
    },
    {
      text: "Don't keep a negative-prompt toggle in the node-embedded presentation — the canvas has no room for it, so the spec drops it entirely rather than cramming it in disabled.",
      example: <NodeEmbeddedWithNegativePromptAttempt />,
    },
  ],
  accessibility: {
    keyboard: [
      "Unlocked and idle, the `docked` bar is four tab stops plus whatever `settings` contributes: the textarea, attach, the negative-prompt toggle, then submit. `node-embedded` drops the negative toggle and is three; `floating` suppresses the settings strip, so it is the same four minus the strip's own stops.",
      "Opening the negative prompt swaps the toggle for a collapse button inside the new row and adds the negative textarea, so the count stays even but the order changes — the second field and its X now sit between the prompt and the toolbar.",
      "Enter submits and Shift+Enter breaks the line, in the main prompt only. The negative-prompt textarea binds no key handler, so Enter there inserts a newline.",
      "There is no IME guard on the submit key. The handler checks only `event.key === \"Enter\" && !event.shiftKey`, so the Enter that commits a Japanese, Chinese or Korean composition submits the prompt mid-word. K2 `inline-generate-popup` guards this with `event.nativeEvent.isComposing`; this component does not.",
      "`generating` disables the textarea, attach, and both negative-prompt controls, and replaces submit with stop. Stop is the only control in the bar you can reach while a run is in flight.",
      "Submit is disabled whenever the trimmed prompt is empty, so an empty bar has one fewer reachable control than a filled one. `locked` collapses the field to two elements, only one of which — the unlock button — is focusable.",
      "Escape does nothing anywhere. It does not close the negative-prompt row and it does not stop a run.",
    ],
    screenReader: [
      "The prompt field is named twice — an sr-only `<label htmlFor>` and an `aria-label` carrying the same `label` string. `aria-label` wins, so the label element is dead weight rather than a second announcement; the two must not be allowed to drift apart.",
      "The root carries `aria-busy` while `generating`, and `media-prompt-bar-status` is a visually hidden `role=\"status\" aria-live=\"polite\"` region announcing `generatingLabel`. It is mounted in every state holding an empty string, which is what makes the first announcement actually fire.",
      "Nothing announces the end of a run. The region empties when `generating` goes false, and emptying a live region announces nothing — so \"Generating…\" is spoken and the finish is silent. Announce the result on the surface that renders it.",
      "Attach, stop and the negative-prompt collapse are icon-only and named by `attachLabel`, `stopLabel` and `negativePromptCollapseLabel`; every glyph in the bar is `aria-hidden`. Translate those props or the buttons stay in English while the placeholder does not.",
      "The negative field has a real visible `<label>` and a matching `aria-label`, but the row holding it is a plain div with no group role — so nothing announces that the second field belongs to the first. A screen reader meets two textareas with different names, not a prompt and its negation.",
      "`locked` swaps the whole field out for the paywall with no live region on the change, so a bar that locks while someone is typing in it changes shape silently.",
      "The cost chip is static text. Its number is announced when it is passed over and never when it changes.",
    ],
    focus: [
      "Starting a run disables the textarea, which is where focus almost certainly was. A disabled element cannot hold focus, so focus falls to `<body>` and the next Tab restarts from the top of the page — at exactly the moment the only useful control is the Stop button that just appeared. Move focus to `media-prompt-bar-stop` in the same handler that sets `generating`.",
      "Collapsing the negative prompt unmounts the X that had focus, with nothing restoring it. Same failure, smaller blast radius.",
      "Switching `locked` on unmounts the entire field, textarea included, and nothing catches focus on the way past.",
      "The textarea's own ring is switched off (`focus-visible:ring-0`) because the container is meant to carry the styling, but no presentation adds a focus-within treatment — so apart from the caret there is no visible indication that the prompt field holds focus. Every button in the bar uses the standard Button ring.",
    ],
  },
  pitfalls: [
    "Deriving `locked` from a disabled textarea instead of swapping in the paywall row — a greyed-out composer with no explanation reads as broken, not as an upsell.",
    "Letting the `cost` prop go stale when `settings` changes — E1, E5, and D1 are all supposed to read from one price; a stale number here is the exact two-prices failure the spec warns about.",
    "Expecting `negativePrompt` to render when `presentation` is node-embedded — it's forced closed there on purpose, so gate the toggle upstream instead of fighting the component.",
    "Building a separate reference-strip (D2) or context-chips (D3) integration instead of passing them through the `referenceStrip`/`contextChips` slots — those components may ship independently, and the slots exist precisely so D1 doesn't need to import them directly.",
  ],
};
