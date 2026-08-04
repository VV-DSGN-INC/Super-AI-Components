import type { ComponentDocs } from "@/lib/component-docs";
import {
  FilledActiveRow,
  LeftBorderActiveState,
  SmallSectionHeader,
  TierGatedRowHiddenByOpacity,
  UsableTierBadgeRow,
} from "./sidebar-nav.examples";

/**
 * Seeded from docs/design-system/component-specs.md#b3-sidebar-nav.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx). Live examples that need interactivity
 * live in the ./sidebar-nav.examples client sidecar and get referenced here
 * as zero-prop elements — see that file for why.
 */

export const SidebarNavDocs: ComponentDocs = {
  whatItIs:
    "A sectioned nav for the primary sidebar: a flat list of icon+label rows grouped under section headers, with a trailing slot per row for a count, a tier badge, an unread dot, a running spinner, or an external-link glyph. A separate pinned group can sit above every section, outside the grouping entirely.",
  whyItMatters:
    "It's the load-bearing list in every settings and app-shell sidebar on the reference board — Lovable's settings nav, Spline, Descript, and Manus all group their primary navigation this way, with badges doing double duty as status and as the shell's cheapest upgrade prompt. Because the trailing slot is shared across five different signals (count, tier, unread, running, external), one row shape carries the whole sidebar instead of five bespoke row components.",
  evidence: ["Lovable", "Spline", "Descript", "Manus"],
  anatomy: [
    { slot: "sidebar-nav", note: "Root nav wrapper around the pinned group and every section." },
    { slot: "sidebar-nav-pinned", note: "Rows pinned above the sections, outside the grouping entirely." },
    { slot: "sidebar-nav-section", note: "One labeled group of rows." },
    { slot: "section-header", note: "The section label, rendered at its smallest size — never a bespoke caption." },
    { slot: "sidebar-nav-item", note: "One row. `data-active` reflects selection; filled background, never a border." },
    { slot: "sidebar-nav-count", note: "Trailing numeric badge, e.g. an unseen-item count." },
    { slot: "sidebar-nav-tier", note: "Trailing tier badge (e.g. \"Pro\"). The row stays visible either way." },
    { slot: "sidebar-nav-unread", note: "Trailing unread dot; carries an accessible label, not color alone." },
    { slot: "sidebar-nav-running", note: "Trailing spinner for a row tied to a background job." },
  ],
  usage:
    "Reach for it for the primary, always-visible list in a sidebar — the set of destinations a user returns to constantly, as opposed to a one-off menu or a search result list. Group related destinations under a section, and reserve the pinned group for the handful of rows that should survive any amount of scrolling or reordering below them. Pass `activeId` and handle `onSelect` yourself — the component is controlled, the same as the switcher and the thread list.",
  dos: [
    {
      text: "Mark the active row with a filled background. A background survives when the rail collapses to icons; a border does not.",
      example: <FilledActiveRow />,
    },
    {
      text: "Let a tier badge sit on the row and leave the row exactly as usable as any other — it's a signal, not a lock.",
      example: <UsableTierBadgeRow />,
    },
    {
      text: "Render section labels through section-header at its smallest size, so the sidebar never grows a second caption style of its own.",
      example: <SmallSectionHeader />,
    },
  ],
  donts: [
    {
      text: "Don't mark active state with a left border. It's the first thing that disappears when the rail collapses to icon-only width, leaving no active indicator at all.",
      example: <LeftBorderActiveState />,
    },
    {
      text: "Don't hide a tier-gated row behind opacity or remove it from the list to \"protect\" a paywall — the trailing tier badge is the gate; the row itself stays legible.",
      example: <TierGatedRowHiddenByOpacity />,
    },
  ],
  pitfalls: [
    "Treating the tier badge as a hide mechanism instead of a disclosure one. Sidebar tier badges are the cheapest paywall in the shell precisely because they show what exists rather than concealing it — hiding the row entirely removes the upsell along with the feature.",
    "Giving the unread dot or the running spinner color or motion as their only signal. Both convey state by shape and color alone, so each needs its own accessible label (`aria-label=\"Unread\"`, `aria-label=\"Running\"`) or a screen-reader user gets nothing.",
    "Forgetting the nav is controlled: selecting a row calls `onSelect` with the row's `id`, but `activeId` doesn't update itself. The consuming app owns the active id and must feed it back in.",
  ],
};