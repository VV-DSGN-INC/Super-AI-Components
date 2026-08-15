import type { ComponentDocs } from "@/lib/component-docs";
import {
  AppliedFacetsAreRemovable,
  ControlledFacetRow,
  DisabledChipKeepsLiveRemove,
  RowGrownPastTheLadder,
  WrappedLabelLosesRemoveName,
} from "./filter-bar.examples";

/**
 * Seeded from docs/design-system/component-specs.md#a5-filter-bar.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and so on directly. Every live example needs a handler, so all of them live
 * in the ./filter-bar.examples client sidecar and are referenced here as
 * zero-prop elements.
 */
export const FilterBarDocs: ComponentDocs = {
  whatItIs:
    "The chip-scale end of filtering: a wrapping row of facet chips, an optional add-a-facet chip, and a button that opens the full panel. A chip is a pressable toggle that reports `aria-pressed`, and giving it `onRemove` adds a second, sibling button inside the same pill so an applied facet can be dropped without going through the toggle. The bar itself is layout and nothing else — it holds no filter state, computes no overflow, and enforces no single-select rule.",
  whyItMatters:
    "Filtering has a scale ladder, and this is its first rung. CapCut, Claude Artifacts and Canva all put a handful of facets in a chip row above the content rather than behind a menu, because applied filters have to stay visible — the most expensive moment in any library is a user staring at an empty grid without seeing the facet that emptied it. Midjourney Organize is what the top of the ladder looks like: once facets need counts, groups and their own overflow, the row stops being enough and J2 `filter-panel` takes over. Choosing the rung is the design decision this component exists to make explicit.",
  evidence: ["CapCut", "Claude Artifacts", "Canva", "Midjourney Organize"],
  anatomy: [
    { slot: "filter-bar", note: "The row. A wrapping flex container with a gap — no scroll, no overflow logic." },
    {
      slot: "filter-chip",
      note: "The pill wrapper around one facet. Carries data-state on/off and takes the chip's className.",
    },
    {
      slot: "filter-chip-toggle",
      note: "The pressable half of a chip. Gets aria-pressed and every prop you pass to FilterChip.",
    },
    {
      slot: "filter-chip-remove",
      note: "The X, present only when FilterChip gets onRemove. A sibling of the toggle, never nested inside it.",
    },
    {
      slot: "add-filter-chip",
      note: "The dashed add-a-facet chip. Names itself 'Add <children>' for assistive tech.",
    },
    { slot: "filters-button", note: "The escape hatch to the full filter panel. Labelled 'Filters' by default." },
  ],
  usage:
    "Reach for it above a library, grid or list that has a handful of facets — roughly six is the ceiling, past which J2 `filter-panel` is the right answer. Compose the row yourself: place one `FilterChip` per facet, pass `active` from your own state, and treat `onClick` and `onRemove` as intent rather than as the value changing. Add `onRemove` to the facets that are currently applied and leave it off the ones that are merely on offer — that is the difference between a row of toggles and a row of applied filters, and it also decides how many tab stops the row has. Finish with an `AddFilterChip` for facets that are not on screen, and a `FiltersButton` wired to the panel.",
  dos: [
    {
      text: "Drive the bar from your own state — pass `active` in, apply the change in your handler, and let the re-render move the chip.",
      example: <ControlledFacetRow />,
    },
    {
      text: "Give every chip a plain string label, so each remove button gets its own accessible name instead of a row of identical X controls.",
      example: <AppliedFacetsAreRemovable />,
    },
  ],
  donts: [
    {
      text: "Don't wrap a chip's label in an element to style it — style the pill through className and keep the children a string, or every remove button in the row collapses to the same name.",
      example: <WrappedLabelLosesRemoveName />,
    },
    {
      text: "Don't disable a chip and assume the whole pill is inert — `disabled` reaches the toggle only, so withhold `onRemove` in the same breath or the X stays live.",
      example: <DisabledChipKeepsLiveRemove />,
    },
    {
      text: "Don't keep adding facets to the row and expect it to collapse — it wraps, growing downwards over the content it filters. Cap the list and escalate to `filter-panel`.",
      example: <RowGrownPastTheLadder />,
    },
  ],
  pitfalls: [
    "FilterChip splits your props two ways: `className` styles the outer pill, and everything else — id, onClick, disabled, aria-* — spreads onto the inner toggle button. A ref or a data attribute you expect on the pill lands on the toggle instead.",
    "The remove button's accessible name is built from `typeof children === \"string\"`. Any non-string child — a wrapped span, an icon beside the text, a number — silently degrades it to the generic \"Remove filter\", which is the one bug in this component a visual review cannot catch.",
    "`disabled` spreads onto the toggle button but never reaches the remove button, which is built from `onRemove` alone. A disabled applied chip is therefore still deletable by mouse and by keyboard.",
    "There is no overflow affordance and no maxVisible: the spec's \"+3\" collapse is not implemented, and the bar has no scroll container either. However many chips you render is how many lines the row takes, which at 375px is the whole screen — count them yourself before you hand them over.",
    "Nothing here enforces a selection rule. Each chip is an independent toggle with its own aria-pressed, so a single-select category row (the shape O2 `artifact-shell` uses) is something your handler enforces, not something the bar provides.",
  ],
};
