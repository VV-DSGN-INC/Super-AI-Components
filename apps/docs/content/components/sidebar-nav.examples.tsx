"use client";

import { SidebarNav } from "@/registry/super-ai/sidebar-nav";

/**
 * Live examples for sidebar-nav.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so sidebar-nav.docs.tsx has to stay plain
 * server-evaluable data — it cannot carry "use client" itself, because
 * Next.js turns "use client" exports into opaque client references, and a
 * plain object read through one of those comes back with every field
 * undefined. Every example lives here instead and crosses into the docs
 * module as a zero-prop element (e.g. `<FilledActiveRow />`), so a future
 * example that grows an `onSelect` handler never has to be serialized
 * across the server/client boundary — it's created and consumed entirely
 * inside this client module.
 */

const SAMPLE_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { id: "chat", label: "Chat", count: 3 },
      { id: "library", label: "Library", tier: "Pro" },
      { id: "inbox", label: "Inbox", unread: true },
      { id: "runs", label: "Runs", running: true },
    ],
  },
];

export function FilledActiveRow() {
  return <SidebarNav sections={SAMPLE_SECTIONS} activeId="chat" />;
}

export function UsableTierBadgeRow() {
  return <SidebarNav sections={[{ label: "Workspace", items: [{ id: "library", label: "Library", tier: "Pro" }] }]} />;
}

export function SmallSectionHeader() {
  return <SidebarNav sections={[{ label: "Automations", items: [{ id: "runs", label: "Runs", running: true }] }]} />;
}

export function LeftBorderActiveState() {
  return (
    <div className="w-56 rounded-lg border p-2">
      <div className="flex flex-col gap-0.5">
        <div className="border-primary text-foreground flex items-center gap-2 rounded-md border-l-2 py-1.5 pr-2 pl-1.5 text-sm">
          Chat
        </div>
        <div className="text-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">Library</div>
      </div>
    </div>
  );
}

export function TierGatedRowHiddenByOpacity() {
  return (
    <div className="w-56 rounded-lg border p-2">
      <div className="flex flex-col gap-0.5">
        <div className="text-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm opacity-40">
          Library
        </div>
      </div>
    </div>
  );
}
