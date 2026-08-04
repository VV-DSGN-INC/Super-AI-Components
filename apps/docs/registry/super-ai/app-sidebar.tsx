"use client";

import * as React from "react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/**
 * App Sidebar — Assembled product sidebar
 *
 * Spec: docs/design-system/component-specs.md#b1-app-sidebar
 * States: expanded · icon-rail · mobile-drawer
 *
 * This component owns ARRANGEMENT only — switcher, nav, promo, and footer
 * stacked in that order. The three declared widths are the vendored shadcn
 * `Sidebar`'s own mechanics (offcanvas/icon collapse on desktop, a Sheet
 * drawer under the mobile breakpoint) reacting to a `SidebarProvider`
 * ancestor supplied by the consumer's shell — this component never
 * reimplements that state machine, it just renders inside it. That mirrors
 * how `sidebar-nav` and `thread-list` already assume they're mounted inside
 * an app shell rather than owning their own layout root.
 *
 * Every slot is optional and takes a plain ReactNode, so a consumer can pass
 * `workspace-switcher` + `sidebar-nav` (the docs shell), swap `sidebar-nav`
 * for `thread-list`, or drop any slot entirely.
 */

interface AppSidebarProps extends Omit<React.ComponentProps<typeof Sidebar>, "children"> {
  /** Workspace/product switcher slot — typically `<WorkspaceSwitcher />`. */
  switcher?: React.ReactNode;
  /** Primary navigation slot — `<SidebarNav />` or an alternative like `<ThreadList />`. */
  nav?: React.ReactNode;
  /** Ambient upgrade/invite/quota slot — typically `<PromoCard />`. Hidden at icon-rail width. */
  promo?: React.ReactNode;
  /** Footer slot — account menu, settings link, etc. */
  footer?: React.ReactNode;
}

function AppSidebar({ switcher, nav, promo, footer, collapsible = "icon", className, ...props }: AppSidebarProps) {
  return (
    <Sidebar data-slot="app-sidebar" collapsible={collapsible} className={cn(className)} {...props}>
      {switcher ? (
        <SidebarHeader data-slot="app-sidebar-switcher" className="gap-2">
          {switcher}
        </SidebarHeader>
      ) : null}

      <SidebarContent data-slot="app-sidebar-nav">{nav}</SidebarContent>

      {promo ? (
        // Ambient placement, not attached to any action — sits above the
        // footer rather than scrolling with nav. Collapses away at icon-rail
        // width: a full promo card has no useful rendering at 3rem.
        <div data-slot="app-sidebar-promo" className="group-data-[collapsible=icon]:hidden p-2">
          {promo}
        </div>
      ) : null}

      {footer ? <SidebarFooter data-slot="app-sidebar-footer">{footer}</SidebarFooter> : null}

      <SidebarRail data-slot="app-sidebar-rail" />
    </Sidebar>
  );
}

export { AppSidebar };
export type { AppSidebarProps };
