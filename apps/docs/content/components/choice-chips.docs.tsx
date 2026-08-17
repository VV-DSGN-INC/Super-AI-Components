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
  accessibility: {
    keyboard: [
      "One tab stop per chip. v1 ships Tab-per-chip rather than the roving tabindex the ARIA radiogroup pattern specifies — there is a TODO in the source saying so — which means a ten-option group is ten stops between whatever precedes and follows it.",
      "Arrow keys do nothing. Neither do Home and End. Tab and Shift+Tab are the only way to move within the group, which is the one behavioural difference from a real radiogroup that a keyboard user will notice immediately.",
      "Space and Enter select the focused chip, because each chip is a native `<button>` with `role=\"radio\"` on it. Selection follows activation only — moving focus never changes the value, unlike a standard radio group where arrowing selects as it goes.",
      "`disabled` reaches the underlying button and removes the chip from the tab order, but changes nothing visually: the chip carries no disabled styling of its own, so a skipped option looks exactly like an available one.",
    ],
    screenReader: [
      "The group is `role=\"radiogroup\"` and each chip `role=\"radio\"` with `aria-checked`, so the selection is in the accessibility tree rather than implied by the ring. That is the whole reason this is a component and not a styled div.",
      "The group has no accessible name unless you give it one. Nothing here sets `aria-label` or `aria-labelledby`, and props spread onto the group's div, so pass one — a row reading \"1, 2, 4, 8\" announces four unlabelled radios and the question they answer is nowhere in the tree.",
      "Each chip's name is its children. `value` is never announced, so a chip labelled \"16:9\" whose value is `landscape` announces \"16:9\" — write the label for the reader and keep the value for your code.",
      "Nothing announces the effect of a pick. There is no live region here, so if choosing a chip changes a price, a preview or a result count elsewhere, that surface has to say so itself.",
      "A `ChoiceChip` rendered outside a `ChoiceChips` throws rather than degrading, so a mis-composed group is a render crash rather than a silent semantic failure.",
    ],
    focus: [
      "The selection ring and the focus ring are the same `ring-ring ring-2`, so a focused-but-unselected chip is drawn identically to the selected one. `aria-checked` keeps assistive tech correct; sighted keyboard users are the ones this misleads, and it is worst in groups of three or four visually similar chips.",
      "Nothing here unmounts, so nothing moves focus. Changing the value re-renders the same buttons and focus stays exactly where it was — including on a chip that has just become disabled, if your handler disables it.",
    ],
  },
  pitfalls: [
    "`value={undefined}` does not mean \"nothing is selected\" — the component reads it as \"this group is uncontrolled\" and falls back to its own internal state. A controlled group that needs an unselected position needs a sentinel chip to point at, which is what the All chip in artifact-grid is for.",
    "Selection and keyboard focus are drawn with the same ring, so a focused-but-unselected chip looks like a selected one. `aria-checked` keeps assistive tech correct; sighted keyboard users are the ones this can mislead, which matters most in groups of three or four visually similar chips.",
    "v1 traverses with Tab, one stop per chip, rather than the roving tabindex the ARIA radiogroup pattern specifies — arrow keys do not move the selection. A ten-chip row is ten tab stops between whatever precedes and follows it, so keep rows short and put them near the control they configure.",
    "`disabled` reaches the underlying button and does stop the click, but the chip carries no disabled styling of its own, so a disabled option is visually identical to an available one. Until that ships, pass your own disabled classes, or leave the option out and say why elsewhere.",
    "Chips that append a count after the label need a logical margin (`ms-*`), not a physical one (`ml-*`), or the gap lands on the wrong side of the count under an RTL locale.",
  ],
};
