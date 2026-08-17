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
  accessibility: {
    keyboard: [
      "The sidebar contributes no tab stops of its own — every one belongs to what you put in the four slots. The count is therefore whatever your switcher, nav, promo and footer add up to, and it does not shrink at icon-rail width: collapsed nav buttons stay focusable, only their labels stop being visible.",
      "The rail is `tabIndex={-1}`. The one collapse affordance this component renders is pointer-only, so the keyboard path to collapsing is either the provider's shortcut or a `SidebarTrigger` you place yourself — this component renders none.",
      "`SidebarProvider` installs a global Cmd/Ctrl+B listener on `window` and calls `preventDefault()` unconditionally. It fires while focus is in a text field, so it takes Cmd+B away from every rich-text editor on the page whether or not the sidebar is on screen.",
      "Under the mobile breakpoint the sidebar becomes a modal sheet: focus is trapped inside it, Escape closes it, and the nav behind it is inert until it does.",
      "There is no arrow-key navigation between slots and no shortcut into the sidebar. Reaching the footer from the page body means tabbing through the whole nav.",
    ],
    screenReader: [
      "This component adds no landmark. `SidebarContent` is a plain `div`, so whatever fills `nav` has to bring its own `<nav>` — `sidebar-nav` and `thread-list` do, which is why wrapping them in a second one produces two nested landmarks with the same name.",
      "Collapsing to the icon rail keeps every nav label in the accessible tree — the labels are clipped by width, not removed — so the rail announces exactly like the expanded sidebar.",
      "The promo slot is the exception: it is `display: none` at icon-rail width, so a quota warning or upgrade prompt leaves the accessible tree entirely and silently the moment the sidebar collapses.",
      "The mobile drawer is a dialog titled \"Sidebar\" with the description \"Displays the mobile sidebar\", both visually hidden and both fixed by the vendored primitive. Neither can be renamed through this component, so every product's drawer announces the same generic title.",
      "The rail is labelled \"Toggle Sidebar\" and carries no `aria-expanded`, so its state is never announced — and the same is true of `SidebarTrigger`. Nothing anywhere says whether the sidebar is now open or closed.",
    ],
    focus: [
      "Collapsing to the icon rail while focus is inside the promo slot drops focus to `<body>`, because that slot is removed from the layout rather than hidden. Focus inside the nav survives, since those controls stay mounted.",
      "Opening the mobile drawer moves focus into it and closing it returns focus to whatever opened it — that is the sheet primitive's behaviour, not this component's.",
      "The sidebar defines no focus ring of its own. Every visible focus style comes from the components you pass into the slots.",
    ],
  },
  pitfalls: [
    "Mounting AppSidebar without a SidebarProvider ancestor — every slot inside it (and the rail/trigger) reads sidebar state from that context and throws immediately without it.",
    "Assuming a narrow wrapping element triggers the mobile drawer. The width check reads the real browser viewport, not a parent container's width, so a cramped preview pane doesn't switch AppSidebar into mobile-drawer mode on its own.",
    "Re-adding a nav landmark or aria-label around the nav slot. sidebar-nav and thread-list already provide their own accessible nav landmark; wrapping them again produces two nested landmarks with the same name.",
  ],
};
