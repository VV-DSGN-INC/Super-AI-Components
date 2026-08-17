import type { ComponentDocs } from "@/lib/component-docs";
import {
  BadgeAsColorOnlyDot,
  ChevronNotScrollbar,
  PinnedGroupSurvivesScroll,
  ScrollingColumnInsteadOfChevron,
  UpsellBadgeOnTheRail,
} from "./modality-rail.examples";

/**
 * Seeded from docs/design-system/component-specs.md#b4-modality-rail.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx). Live examples that need interactivity
 * live in the ./modality-rail.examples client sidecar and get referenced
 * here as zero-prop elements — see that file for why.
 */

export const ModalityRailDocs: ComponentDocs = {
  whatItIs:
    "The vertical, fixed-width tool switcher that runs down the left edge of an editor shell: one icon-over-label button per mode, a chevron that reveals whatever doesn't fit, and a settings/help group pinned below that never scrolls away.",
  whyItMatters:
    "It's the defining chrome of a studio shell — CapCut, Canva, Fotor, Simplified, Tripo, and Spline all build their editor around this exact column. Because the column is a fixed 92px, it can't grow taller to fit more tools, so overflow and pinning aren't edge cases — they're the two problems the component exists to solve.",
  evidence: ["CapCut", "Canva", "Fotor", "Simplified", "Tripo", "Spline"],
  anatomy: [
    { slot: "modality-rail", note: "Root column, fixed at 92px, split into a scrollable middle and a pinned footer." },
    { slot: "modality-rail-scroll", note: "The middle group of tool buttons. Never grows scroll styling of its own." },
    { slot: "modality-rail-item", note: "One icon-over-label button. `aria-pressed` carries the active state." },
    { slot: "modality-rail-badge", note: "The 'New' dot or crown/Pro mark riding on an item's icon." },
    { slot: "modality-rail-overflow", note: "The chevron affordance that reveals items past `maxVisible`, not a scrollbar." },
    { slot: "modality-rail-pinned", note: "Settings, plugins, help — a separate group below the middle, never inside it." },
  ],
  usage:
    "Reach for it as the primary tool switcher in an editor shell, not a generic sidebar (that's sidebar-nav). Pass a flat `items` array for the scrollable middle and a separate `pinned` array for the handful of rows — settings, plugins, help — that must survive no matter how many tools the middle grows to. `maxVisible` controls how many items show before the rest collapse behind the overflow chevron; the component is controlled, so feed `activeId` back from `onSelect` the same way the switcher and sidebar-nav expect.",
  dos: [
    {
      text: "Collapse extra tools behind the overflow chevron once the column runs out of room — the 92px width is fixed, not a scroll container.",
      example: <ChevronNotScrollbar />,
    },
    {
      text: "Keep settings, plugins, and help in `pinned`, separate from `items` — they stay put no matter how the tool list grows.",
      example: <PinnedGroupSurvivesScroll />,
    },
    {
      text: "Use the badge slot to advertise a feature the user hasn't bought — a 'New' dot or a Pro crown — and leave the row exactly as usable as any other.",
      example: <UpsellBadgeOnTheRail />,
    },
  ],
  donts: [
    {
      text: "Don't let the middle column scroll instead of using the chevron — a scrollbar in a 92px rail hides tools behind a sliver of a drag handle.",
      example: <ScrollingColumnInsteadOfChevron />,
    },
    {
      text: "Don't render a badge as a bare colour dot with no accessible name — 'New' and 'Pro' both need to survive for screen-reader users, not just sighted ones.",
      example: <BadgeAsColorOnlyDot />,
    },
  ],
  accessibility: {
    keyboard: [
      "Each toggle group in the rail is a single tab stop with its own roving tabindex, so a rail with overflow and a pinned group is four stops in total: the visible tools, the chevron, the tools inside the popover once it is open, and the pinned group. Up and Down move within a group and wrap; they never carry you from the middle group into the pinned one.",
      "Enter and Space activate a tool. Arrows only move the highlight, so someone can travel the whole column without switching tools.",
      "The chevron is a plain button. Enter or Space opens the overflow popover, Escape closes it, and the list inside is navigated with Up and Down like any other group.",
      "There is no `disabled` anywhere in this component. Every entry in `items` and `pinned` is always focusable and always activatable — gating a tool means leaving it out of the array, not marking it unavailable.",
      "Activating the already-active tool reports an empty selection, which is discarded. The rail can never land on no tool at all.",
    ],
    screenReader: [
      "All three toggle groups render as `role=\"group\"` with `aria-orientation` explicitly suppressed — the attribute is not allowed on that role, so the value the primitive computes is an axe `aria-allowed-attr` failure whatever it says. None of the three groups carries a name of its own, so a screen reader meets three unlabelled groups: the tools announce fine, but the split between the scrolling middle and the pinned footer does not.",
      "An item is a toggle button carrying `aria-pressed`, so the active tool is programmatic rather than a colour treatment. Its accessible name is the visible label plus, when `badge` is set, an sr-only \" Pro\" or \" New\" — the crown and the dot themselves live inside an `aria-hidden` span and contribute nothing.",
      "The visible label is truncated to fit 92px, but the full string stays in the accessibility tree. A tool that renders as \"Backgro…\" is still announced in full.",
      "The tooltip repeats the label rather than supplying it. Every item already has a real text name, so nothing is lost on the many occasions the tooltip never opens.",
      "The overflow popup is `role=\"dialog\"` named by `overflowLabel` — the same string the chevron announces, because the list has no heading to borrow a name from. Without it the popup would be an unnamed dialog, which fails outright.",
      "Switching tools announces nothing beyond the pressed state of the button that was pressed. The canvas that just changed mode has to say so itself; the rail owns no live region.",
    ],
    focus: [
      "Opening the overflow popover moves focus into the popup, and closing it returns focus to the chevron. Choosing a tool from that list closes the popover — so focus lands back on the chevron rather than on the tool that is now active, and that tool is inside a collapsed list where nothing shows it as pressed.",
      "Items and the chevron both ship an explicit `focus-visible:ring-2`, so the rail is one of the few components here that does not depend on whatever global focus style you happen to have.",
    ],
  },
  pitfalls: [
    "Relying on the tooltip as the only place an item's name appears. The label under the icon already carries it — the tooltip on hover is a supplement for the collapsed/tight case, never the sole source.",
    "Marking the active tool with colour alone. `modality-rail-item` sets `aria-pressed` from the toggle-group's own state, so the active tool is programmatically discoverable even if a custom theme changes the colour treatment entirely.",
    "Reaching for the badge slot to hide features instead of advertising them — like sidebar-nav's tier badge, a 'New' dot or crown mark on a rail item is the cheapest upsell the shell has precisely because the row stays fully usable underneath it.",
  ],
};
