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
  pitfalls: [
    "Relying on the tooltip as the only place an item's name appears. The label under the icon already carries it — the tooltip on hover is a supplement for the collapsed/tight case, never the sole source.",
    "Marking the active tool with colour alone. `modality-rail-item` sets `aria-pressed` from the toggle-group's own state, so the active tool is programmatically discoverable even if a custom theme changes the colour treatment entirely.",
    "Reaching for the badge slot to hide features instead of advertising them — like sidebar-nav's tier badge, a 'New' dot or crown mark on a rail item is the cheapest upsell the shell has precisely because the row stays fully usable underneath it.",
  ],
};
