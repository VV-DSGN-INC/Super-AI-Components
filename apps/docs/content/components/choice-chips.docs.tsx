import type { ComponentDocs } from "@/lib/component-docs";
import {
  NamedGroup,
  SelectionRunsImmediately,
  SentinelAllChip,
  SetsTheNextRun,
  UnnamedNumericGroup,
} from "./choice-chips.examples";

/**
 * Seeded from docs/design-system/component-specs.md#a4-choice-chips.
 * Consumer-facing voice — the spec's internal phrasing is not shipped verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). Anything holding state or an onValueChange handler
 * lives in ./choice-chips.examples and is referenced as a zero-prop element.
 */
export const ChoiceChipsDocs: ComponentDocs = {
  whatItIs:
    "A row of tap-to-pick chips that holds one selected value — aspect ratio, batch size, quality tier, style, artifact type. The group is a real radiogroup and each chip a real radio, so the selection is in the accessibility tree rather than implied by a colour. Selection is drawn as a ring outside the chip, which means moving it never changes any chip's size and never reflows the row underneath.",
  whyItMatters:
    "Visual parameters deserve visual pickers. Midjourney's style picker, CapCut's filter row and Freepik's preset row all put the options on screen instead of behind a dropdown, because a dropdown hides the very thing you are choosing between and costs two clicks to compare two options. This is the primitive that pattern collapses to, and it is reused far past the picker: filter-panel builds each facet group from it, artifact-grid and explore-gallery build their type filters from it. One selection behaviour, one keyboard story, one set of radiogroup semantics, in one place.",
  evidence: ["Midjourney", "CapCut", "Freepik"],
  anatomy: [
    {
      slot: "choice-chips",
      note: "The group. Renders role=\"radiogroup\" and owns the selected value — give it an aria-label or aria-labelledby, because the chips alone rarely say what they are choosing between.",
    },
    {
      slot: "choice-chip",
      note: "One option. A native button with role=\"radio\" and aria-checked, plus data-state=\"on\"/\"off\" for styling and for tests that want to assert selection without reading ARIA.",
    },
  ],
  usage:
    "Reach for it when a run has a small set of named options — under about eight — and seeing them all at once is worth the row it costs. Compose it the way ContextChips and SuggestionChips compose: ChoiceChips supplies the wrapping group and the value, each ChoiceChip carries its own `value` and its own label. Uncontrolled is the short path (`defaultValue`), controlled is the honest one once anything else on screen depends on the choice (`value` + `onValueChange`). Past roughly eight options, or when the options only make sense as pictures, move up to E4 preset-grid — it is the same selection model with a grid, a see-more affordance and the multi-select this component does not have.",
  dos: [
    {
      text: "Name the group, not just the chips — a row of bare numbers is meaningless to anyone who cannot see the label sitting next to it.",
      example: <NamedGroup />,
    },
    {
      text: "Let a chip set the parameter and stop there; keep a separate control for spending the credits.",
      example: <SetsTheNextRun />,
    },
    {
      text: "Give \"no filter\" its own chip rather than trying to express it as an absent value.",
      example: <SentinelAllChip />,
    },
  ],
  donts: [
    {
      text: "Don't start the run from onValueChange — merging the pick and the commit removes the pause where someone sets two parameters, or changes their mind, before anything is charged.",
      example: <SelectionRunsImmediately />,
    },
    {
      text: "Don't ship a numeric group whose meaning lives only in nearby prose — the digits are the accessible name, so without a group label the choice is unlabelled.",
      example: <UnnamedNumericGroup />,
    },
  ],
  pitfalls: [
    "`value={undefined}` does not mean \"nothing is selected\" — the component reads it as \"this group is uncontrolled\" and falls back to its own internal state. A controlled group that needs an unselected position needs a sentinel chip to point at, which is what the All chip in artifact-grid is for.",
    "Selection and keyboard focus are drawn with the same ring, so a focused-but-unselected chip looks like a selected one. `aria-checked` keeps assistive tech correct; sighted keyboard users are the ones this can mislead, which matters most in groups of three or four visually similar chips.",
    "v1 traverses with Tab, one stop per chip, rather than the roving tabindex the ARIA radiogroup pattern specifies — arrow keys do not move the selection. A ten-chip row is ten tab stops between whatever precedes and follows it, so keep rows short and put them near the control they configure.",
    "`disabled` reaches the underlying button and does stop the click, but the chip carries no disabled styling of its own, so a disabled option is visually identical to an available one. Until that ships, pass your own disabled classes, or leave the option out and say why elsewhere.",
    "Chips that append a count after the label need a logical margin (`ms-*`), not a physical one (`ml-*`), or the gap lands on the wrong side of the count under an RTL locale.",
  ],
};
