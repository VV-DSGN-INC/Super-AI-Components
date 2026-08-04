"use client";

import * as React from "react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/registry/super-ai/app-sidebar";
import { PromoCard } from "@/registry/super-ai/promo-card";
import { SidebarNav } from "@/registry/super-ai/sidebar-nav";
import { WorkspaceSwitcher } from "@/registry/super-ai/workspace-switcher";

/**
 * Live examples for app-sidebar.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so app-sidebar.docs.tsx has to stay plain
 * server-evaluable data — it cannot carry "use client" itself. Every example
 * lives here instead and crosses into the docs module as a zero-prop element
 * (e.g. `<OneComponentAcrossWidths />`), so `onSelect`/`onOpenChange`
 * handlers never have to be serialized across the server/client boundary —
 * they're created and consumed entirely inside this client module.
 *
 * Every example below wraps AppSidebar in its own `SidebarProvider` — that
 * provider is mechanics the consumer's shell owns, not something AppSidebar
 * bundles itself, matching the "arrangement, not mechanics" split in the
 * docs module's `usage` field.
 */

const WORKSPACES = [{ id: "acme", name: "Acme", plan: "Pro" }];

const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { id: "chat", label: "Chat", count: 3 },
      { id: "library", label: "Library", tier: "Pro" },
    ],
  },
];

function DemoFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex h-72 w-full max-w-xs overflow-hidden rounded-lg border">
      {children}
    </div>
  );
}

export function OneComponentAcrossWidths() {
  // Expanded and icon-rail below share the exact same switcher/nav props —
  // only the provider's `defaultOpen` differs. Nothing about the slot
  // content changes between widths.
  return (
    <div className="flex gap-4">
      <DemoFrame>
        <SidebarProvider defaultOpen>
          <AppSidebar
            switcher={<WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={() => {}} />}
            nav={<SidebarNav sections={NAV_SECTIONS} activeId="chat" />}
          />
        </SidebarProvider>
      </DemoFrame>
      <DemoFrame>
        <SidebarProvider defaultOpen={false}>
          <AppSidebar
            switcher={<WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={() => {}} />}
            nav={<SidebarNav sections={NAV_SECTIONS} activeId="chat" />}
          />
        </SidebarProvider>
      </DemoFrame>
    </div>
  );
}

export function SwitcherAndNavOnly() {
  // The docs shell's actual configuration: promo and footer simply aren't
  // passed, rather than passed-but-empty.
  return (
    <DemoFrame>
      <SidebarProvider defaultOpen>
        <AppSidebar
          switcher={<WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={() => {}} />}
          nav={<SidebarNav sections={NAV_SECTIONS} activeId="chat" />}
        />
      </SidebarProvider>
    </DemoFrame>
  );
}

export function EveryShellSlotFilled() {
  return (
    <DemoFrame>
      <SidebarProvider defaultOpen>
        <AppSidebar
          switcher={<WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={() => {}} />}
          nav={<SidebarNav sections={NAV_SECTIONS} activeId="chat" />}
          promo={
            <PromoCard
              flavour="upgrade"
              title="Upgrade to Pro"
              ctaLabel="Upgrade"
              onCtaClick={() => {}}
              onDismiss={() => {}}
            />
          }
          footer={<div className="text-muted-foreground px-2 text-xs">nick@acme.com</div>}
        />
        <SidebarInset className="flex items-center p-2">
          <SidebarTrigger />
        </SidebarInset>
      </SidebarProvider>
    </DemoFrame>
  );
}

// --- donts ---

export function BespokeWidthToggle() {
  // Reimplements the collapse mechanics AppSidebar deliberately doesn't own:
  // a hand-rolled width + local boolean instead of the vendored Sidebar's
  // data-state/collapsible machinery. It drifts the moment the real
  // component's breakpoints or transitions change.
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <div
      className="bg-sidebar text-sidebar-foreground flex flex-col gap-2 rounded-lg border p-2 transition-[width]"
      style={{ width: collapsed ? 56 : 220 }}
    >
      <button type="button" className="text-xs underline" onClick={() => setCollapsed((c) => !c)}>
        toggle
      </button>
      {!collapsed ? <span className="text-sm">Acme Workspace</span> : null}
    </div>
  );
}

export function EmptyPromoPlaceholder() {
  // Renders a permanent "nothing to show" placeholder instead of omitting
  // the promo slot outright.
  return (
    <DemoFrame>
      <SidebarProvider defaultOpen>
        <AppSidebar
          switcher={<WorkspaceSwitcher workspaces={WORKSPACES} currentId="acme" onSelect={() => {}} />}
          nav={<SidebarNav sections={NAV_SECTIONS} activeId="chat" />}
          promo={
            <div className="text-muted-foreground rounded-md border border-dashed p-3 text-xs">
              Nothing to promote right now.
            </div>
          }
        />
      </SidebarProvider>
    </DemoFrame>
  );
}
