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
    "A row of tap-to-pick chips that holds one selected value — aspect ratio, batch size, quality tier, style, artifact type. The group is a real radiogroup and each chip a real radio, so the selection is in the accessibility tree rather than implied by a colour. Selection is drawn as a fill and a border colour, never a ring, so moving it never changes any chip's size and the ring stays free to mean keyboard focus.",
  whyItMatters:
    "Visual parameters deserve visual pickers. Midjourney's style picker, CapCut's filter row and Freepik's preset row all put the options on screen instead of behind a dropdown, because a dropdown hides the very thing you are choosing between and costs two clicks to compare two options. This is the primitive that pattern collapses to, and it is reused far past the picker: filter-panel builds each facet group from it, artifact-grid and explore-gallery build their type filters from it. One selection behaviour, one keyboard story, one set of radiogroup semantics, in one place.",
  evidence: ["Midjourney", "CapCut", "Freepik"],
  anatomy: [
    {
      slot: "choice-chips",
      note: 'The group. Renders role="radiogroup" and owns the selected value — give it an aria-label or aria-labelledby, because the chips alone rarely say what they are choosing between.',
    },
    {
      slot: "choice-chip",
      note: 'One option. A native button with role="radio" and aria-checked, plus data-state="on"/"off" for styling and for tests that want to assert selection without reading ARIA.',
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
      text: 'Give "no filter" its own chip rather than trying to express it as an absent value.',
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
      "The group is one tab stop, landing on the checked chip, or on the first chip when nothing is checked. The group is built on the vendored radio-group (Base UI), so a ten-option row costs one Tab to cross, not ten.",
      "All four arrow keys move to the previous or next chip and wrap at the ends, and moving selects: arrowing changes the value as it goes, as in any radio group, so each press fires `onValueChange`. Home and End do nothing.",
      "Space selects the focused chip; each chip renders a native `<button>`, so Enter activates it too.",
      "`disabled` reaches the underlying button: the chip is drawn at half opacity, takes no pointer events, and the arrow keys step over it.",
    ],
    screenReader: [
      'The group is `role="radiogroup"` and each chip `role="radio"` with `aria-checked`, so the selection is in the accessibility tree rather than implied by the ring. That is the whole reason this is a component and not a styled div.',
      'The group has no accessible name unless you give it one. Nothing here sets `aria-label` or `aria-labelledby`, and props spread onto the group\'s div, so pass one — a row reading "1, 2, 4, 8" announces four unlabelled radios and the question they answer is nowhere in the tree.',
      'Each chip\'s name is its children. `value` is never announced, so a chip labelled "16:9" whose value is `landscape` announces "16:9" — write the label for the reader and keep the value for your code.',
      "Nothing announces the effect of a pick. There is no live region here, so if choosing a chip changes a price, a preview or a result count elsewhere, that surface has to say so itself.",
      "A `ChoiceChip` rendered outside a `ChoiceChips` throws rather than degrading, so a mis-composed group is a render crash rather than a silent semantic failure.",
    ],
    focus: [
      "Focus is the only thing drawn with the ring (`focus-visible:ring-2`); selection is a fill and a border colour. A focused chip and a selected chip are different pictures.",
      "Nothing here unmounts, so nothing moves focus. Changing the value re-renders the same buttons and focus stays exactly where it was — including on a chip that has just become disabled, if your handler disables it.",
    ],
  },
  pitfalls: [
    '`value={undefined}` does not mean "nothing is selected" — the component reads it as "this group is uncontrolled" and falls back to its own internal state. A controlled group that needs an unselected position needs a sentinel chip to point at, which is what the All chip in artifact-grid is for.',
    "Arrowing selects. A handler that does real work on `onValueChange` (fetching, re-pricing) runs once per arrow press as a keyboard user walks the row, so keep that work cheap or defer it to the control that commits the run.",
    "A disabled chip is drawn at half opacity and skipped by the arrows, which says it is unavailable but not why. When the reason matters (a plan gate, an exhausted quota), say it next to the row, or leave the option out.",
    "Chips that append a count after the label need a logical margin (`ms-*`), not a physical one (`ml-*`), or the gap lands on the wrong side of the count under an RTL locale.",
  ],
  variants: {
    none: "There is no design-decision prop here — `value`, `defaultValue` and `onValueChange` are selection state, not a variant, and the only style branch in the source (`data-state`) is driven by that same state rather than chosen by a caller. The spec (A4) describes a role switch between radio and checkbox for multi-select, but that never shipped — v1 is single-select only, one radiogroup and one ring, and a caller who needs two chips lit at once or a picture-driven grid does not get there by a variant of this component. They reach past it to the two components below.",
  },
  insteadUse: [
    {
      component: "preset-grid",
      when: "More than one option needs to be selected at once, the options are pictures rather than short labels, or there are more than about eight of them. preset-grid is the same one-of-many selection model built on the preview-tile frame, with a see-more affordance and the `multiple` prop — every tile switches to a checkbox — that this component's own spec describes but never shipped.",
    },
    {
      component: "filter-bar",
      when: "The chips are filters already applied to an existing list, not options being chosen from. filter-bar's chips carry their own remove button beside the toggle and the row can start and stay empty; choice-chips always shows every option and always has exactly one selected, with no way to remove a choice once it is made.",
    },
  ],
};
