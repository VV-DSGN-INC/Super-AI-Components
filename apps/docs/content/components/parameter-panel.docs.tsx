import type { ComponentDocs } from "@/lib/component-docs";
import { BadRawEndpoints, BadTooltipOnly, GoodEndpoints, GoodInlineEducation } from "./parameter-panel.examples";

/**
 * Seeded from docs/design-system/component-specs.md#e3-parameter-panel.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples live in the sibling
 * "parameter-panel.examples.tsx" client module and get referenced here as
 * zero-prop elements.
 */
export const ParameterPanelDocs: ComponentDocs = {
  whatItIs:
    "The stack of rows a generation surface uses to expose the knobs behind a run — sliders with a live number, single-select segmented controls, and grouped tabs for basic vs. advanced settings. It's built entirely out of `field-row` (A6): every row lines up on the same label / control / unit / reset grid as every other inspector in the system.",
  whyItMatters:
    "Every reference product with tunable generation settings — Playground, Freepik, Tripo, CapCut — ships some version of this panel, and they converge on the same two decisions: a slider's ends are described in plain language, never as the raw min/max, and the explanation of what a parameter does sits inline as text rather than behind a hover-only tooltip. Both are load-bearing enough that this component enforces them structurally instead of leaving them to each call site.",
  evidence: ["Playground", "Freepik", "Tripo", "CapCut"],
  anatomy: [
    { slot: "parameter-panel", note: "Root wrapper around the optional header and the row stack." },
    { slot: "parameter-panel-header", note: "Title plus the group-scope reset; only renders when either is given." },
    { slot: "parameter-panel-title", note: "The panel's own heading, e.g. 'Sampling'." },
    { slot: "parameter-panel-rows", note: "The vertical stack of field rows." },
    { slot: "parameter-slider", note: "A `field-row` composing a slider, its live number field, and optional endpoint labels." },
    { slot: "parameter-slider-endpoints", note: "The plain-language low/high labels under the track — never the raw min/max." },
    { slot: "parameter-segmented", note: "A `field-row` composing a single-select segmented control." },
    { slot: "parameter-tabs", note: "Groups of rows behind named tabs, e.g. Basic / Advanced." },
  ],
  usage:
    "Reach for it for any generation surface with more than one or two tunable settings — a lone toggle can stay a plain `field-row`, but once a panel has a slider with real endpoints, or enough settings to split into basic/advanced, this is the component. Give a slider row `endpoints` in the user's language, not its numbers — the number itself still shows, live, in the field next to the track. Reach for `tabbed` once a panel outgrows a single screenful; reach for the panel-level `onResetAll` once more than one row in a group can drift from its default.",
  dos: [
    {
      text: "Describe a slider's ends in the language of the effect — \"More creative ↔ More literal\" — and keep the raw number visible in its own field alongside the track.",
      example: <GoodEndpoints />,
    },
    {
      text: "Put a parameter's explanation inline, as text that's always there, when the control's effect isn't obvious from its label alone.",
      example: <GoodInlineEducation />,
    },
  ],
  donts: [
    {
      text: "Don't label a slider's ends with its raw min/max — \"0.0 ↔ 20.0\" tells the user nothing about what changes.",
      example: <BadRawEndpoints />,
    },
    {
      text: "Don't hide a parameter's explanation behind a hover-only tooltip — it's the thing that makes an unfamiliar control usable, not a footnote for the curious.",
      example: <BadTooltipOnly />,
    },
  ],
  accessibility: {
    keyboard: [
      'A `ParameterSlider` is two tab stops, not one: the slider thumb, then the number field beside it. Pass `reset` and it is three — but only while that reset is enabled, because `ResetAffordance` renders `disabled` at `state="default"` and leaves the tab order there. A panel\'s tab-stop count grows as the user drifts values off their defaults.',
      "The thumb is a native range input underneath, so Left/Right/Up/Down step by `step`, Home and End jump to `min` and `max`, and Page Up / Page Down take a larger stride. The number field takes typing and its own arrow keys.",
      "`ParameterSegmented` is a single tab stop with a roving tabindex: arrows move between options and select as they go, Home and End reach the ends, and the focus wraps. Pressing the already-active option is swallowed on purpose — a parameter always holds a value — so there is no keyboard path to an empty segmented row.",
      "`ParameterTabs` moves focus with the arrow keys but does not activate on focus. Arrowing along the tab list highlights a tab and leaves the panel below unchanged until Space or Enter, which is a deliberate difference from a tab set that switches as you arrow.",
      "`disabled` reaches the slider, its number field, and the segmented group. It does not reach the `reset` node you pass in, nor the panel's `Reset all` — a disabled row with a live reset button is yours to prevent.",
    ],
    screenReader: [
      'The slider\'s label is duplicated rather than linked. `FieldRow` renders a `<label for>` pointing at the id it hands your render function, and `ParameterSlider` never applies that id to anything, so the visible label is orphaned — clicking it focuses nothing — and the thumb gets the same text again via `getAriaLabel`. The number field is named `"<label> value"` for the same reason.',
      '`getAriaValueText` makes the thumb speak its unit: "70%", not "70". Without it a percentage, a count and a multiplier all announce identically.',
      'The plain-language endpoints are `aria-hidden`. "More variable ↔ More literal" — the pair of words this component exists to put on a slider — is not announced at all, so a row with `endpoints` and no `description` tells an assistive-tech user nothing about which direction is which. Pass `description` too: it renders as `FieldRow`\'s hint and is wired to both the thumb and the number field with `aria-describedby`.',
      '`ParameterSegmented` announces as a group of toggle buttons reporting `aria-pressed`, not as a radio group — right for "which of these is on", looser than the single-select its appearance implies. Its `aria-label` repeats the visible label, so the row is named twice over.',
      "`ParameterTabs` is a real tablist with `aria-selected` and panel association, but the list itself has no accessible name and this component exposes no way to give it one — props you spread land on the `Tabs` root, not on the list. Two tabbed panels on a page announce as two unnamed tab lists.",
      '`Reset all` is `ResetAffordance` at group scope: an icon button named by `resetAllLabel` ("Reset all" by default) with its glyph `aria-hidden`. At `modified={false}` it is `disabled` rather than removed, so it announces as a dimmed button instead of disappearing.',
    ],
    focus: [
      "Nothing here opens or reorders, so nothing moves focus deliberately. One thing moves it by accident: a reset becomes `disabled` in the same render that returns its row to default, and a button disabled while focused is blurred by the browser — so pressing a row reset, or `Reset all`, drops focus to `<body>` and the next Tab restarts from the top of the page.",
      "Switching tabs unmounts the previous panel. That is safe from the keyboard, because activating a tab means focus is on the tab list rather than inside the panel being replaced — but a click on a tab while focus sits in the outgoing panel loses it.",
      "Every control draws its own ring: the thumb `focus-visible:ring-3`, the segmented items and tab triggers from the vendored primitives, and the resets `focus-visible:ring-2`. The number field is the odd one — its ring is `focus-within` on the wrapper, so it encloses the unit suffix as well as the input.",
    ],
  },
  pitfalls: [
    "Reaching for a fresh label + slider + number row instead of `parameter-slider` — every row in this system, including this one, is `field-row` underneath, so a hand-rolled row drifts from the shared label/control/unit/reset grid immediately.",
    "Wiring a segmented control's selected state as a background-colour change alone. `parameter-segmented` sets real `aria-pressed` state under the hood; a custom one that only recolours a div fails the moment someone can't see colour.",
    "Adding a group-level reset without tracking whether anything underneath actually changed — `onResetAll` should pair with a `modified` flag the caller derives from its own state, the same way each row's own reset does.",
  ],
};
