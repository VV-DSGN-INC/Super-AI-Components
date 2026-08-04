import type { ComponentDocs } from "@/lib/component-docs";
import {
  BespokeWidthToggle,
  EmptyPromoPlaceholder,
  EveryShellSlotFilled,
  OneComponentAcrossWidths,
  SwitcherAndNavOnly,
} from "./app-sidebar.examples";

/**
 * Seeded from docs/design-system/component-specs.md#b1-app-sidebar.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples live in the sibling
 * ./app-sidebar.examples client module and get referenced here as zero-prop
 * elements — see that file for why.
 */
export const AppSidebarDocs: ComponentDocs = {
  whatItIs:
    "The assembled product sidebar: a workspace switcher, a nav list, an ambient promo card, and a footer, stacked in that order inside the vendored shadcn Sidebar shell. It arranges those four slots — it doesn't reimplement the sidebar's own expand, collapse, or mobile-drawer behavior.",
  whyItMatters:
    "Six products on the reference board — Descript, Zapier, Spline, CapCut, Manus, and Midjourney — converge on this exact arrangement even though their sidebars look different at a glance. The value isn't any one slot; it's that expanded, icon-rail, and mobile-drawer are one component reacting to width, not three separate sidebars a team has to keep in sync by hand.",
  evidence: ["Descript", "Zapier", "Spline", "CapCut", "Manus", "Midjourney"],
  anatomy: [
    { slot: "app-sidebar", note: "Root — the vendored Sidebar itself, arranged with the four slots below." },
    { slot: "app-sidebar-switcher", note: "Workspace/product switcher slot, e.g. workspace-switcher." },
    { slot: "app-sidebar-nav", note: "Primary navigation slot, e.g. sidebar-nav or thread-list." },
    { slot: "app-sidebar-promo", note: "Ambient upgrade/invite/quota slot; hidden automatically at icon-rail width." },
    { slot: "app-sidebar-footer", note: "Footer slot, typically an account menu or identity row." },
    { slot: "app-sidebar-rail", note: "The drag-to-resize/collapse handle along the sidebar's edge." },
  ],
  usage:
    "Reach for it as the single sidebar component for a product shell, not as a template to copy per width. It expects a SidebarProvider ancestor — that's the consumer's shell's job, the same way a page owns its own layout, not this component — and every slot is a plain ReactNode, so the docs shell can pass just workspace-switcher and sidebar-nav while a studio shell swaps in thread-list or adds a promo card, without forking the component. Passing the same slot props into two AppSidebar instances with different provider `defaultOpen` values is the whole story for expanded vs. icon-rail; the mobile drawer follows automatically below the shell's mobile breakpoint.",
  dos: [
    {
      text: "Pass the same slots regardless of width — let the SidebarProvider's open state and the viewport decide expanded vs. icon-rail vs. mobile-drawer, not a fork in your own code.",
      example: <OneComponentAcrossWidths />,
    },
    {
      text: "Omit a slot entirely when a shell doesn't need it — the docs shell renders switcher and nav only, nothing else.",
      example: <SwitcherAndNavOnly />,
    },
    {
      text: "Fill every slot when the shell calls for it — promo and footer compose in exactly the same way as switcher and nav.",
      example: <EveryShellSlotFilled />,
    },
  ],
  donts: [
    {
      text: "Don't hand-roll a collapse toggle with local state and an inline width — the vendored Sidebar already owns that state machine; reimplementing it drifts the moment the real breakpoints change.",
      example: <BespokeWidthToggle />,
    },
    {
      text: "Don't pass a permanent placeholder into the promo slot when there's nothing to promote — omit the prop instead of rendering an empty-state card.",
      example: <EmptyPromoPlaceholder />,
    },
  ],
  pitfalls: [
    "Mounting AppSidebar without a SidebarProvider ancestor — every slot inside it (and the rail/trigger) reads sidebar state from that context and throws immediately without it.",
    "Assuming a narrow wrapping element triggers the mobile drawer. The width check reads the real browser viewport, not a parent container's width, so a cramped preview pane doesn't switch AppSidebar into mobile-drawer mode on its own.",
    "Re-adding a nav landmark or aria-label around the nav slot. sidebar-nav and thread-list already provide their own accessible nav landmark; wrapping them again produces two nested landmarks with the same name.",
  ],
};
