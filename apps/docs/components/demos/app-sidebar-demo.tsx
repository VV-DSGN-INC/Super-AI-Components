"use client";

import * as React from "react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/registry/super-ai/app-sidebar";
import { SidebarNav } from "@/registry/super-ai/sidebar-nav";
import { WorkspaceSwitcher } from "@/registry/super-ai/workspace-switcher";

const WORKSPACES = [
  { id: "acme", name: "Acme", plan: "Pro" },
  { id: "personal", name: "Personal", plan: "Free" },
];

const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { id: "chat", label: "Chat", count: 3 },
      { id: "library", label: "Library", tier: "Pro" },
      { id: "inbox", label: "Inbox", unread: true },
    ],
  },
];

// The docs shell uses switcher + nav only — see docs/design-system/component-specs.md#b1-app-sidebar.
// Both slots are the real, shipped registry components, proving AppSidebar composes rather than
// reimplements them.
export default function AppSidebarDemo() {
  const [currentId, setCurrentId] = React.useState("acme");
  const [activeId, setActiveId] = React.useState("chat");

  return (
    <div className="h-96 w-full max-w-md overflow-hidden rounded-lg border">
      <SidebarProvider defaultOpen>
        <AppSidebar
          switcher={<WorkspaceSwitcher workspaces={WORKSPACES} currentId={currentId} onSelect={setCurrentId} />}
          nav={<SidebarNav sections={NAV_SECTIONS} activeId={activeId} onSelect={setActiveId} />}
        />
        <SidebarInset className="flex items-center gap-2 p-3">
          <SidebarTrigger />
          <p className="text-muted-foreground text-sm">Docs shell preview</p>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
