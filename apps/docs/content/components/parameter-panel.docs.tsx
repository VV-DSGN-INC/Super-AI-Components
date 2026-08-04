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
  pitfalls: [
    "Reaching for a fresh label + slider + number row instead of `parameter-slider` — every row in this system, including this one, is `field-row` underneath, so a hand-rolled row drifts from the shared label/control/unit/reset grid immediately.",
    "Wiring a segmented control's selected state as a background-colour change alone. `parameter-segmented` sets real `aria-pressed` state under the hood; a custom one that only recolours a div fails the moment someone can't see colour.",
    "Adding a group-level reset without tracking whether anything underneath actually changed — `onResetAll` should pair with a `modified` flag the caller derives from its own state, the same way each row's own reset does.",
  ],
};
