"use client";
import { useState } from "react";

import { SidebarNav } from "@/registry/super-ai/sidebar-nav";

const SECTIONS = [
  {
    label: "Workspace",
    items: [
      { id: "chat", label: "Chat", count: 3 },
      { id: "library", label: "Library", tier: "Pro" },
      { id: "inbox", label: "Inbox", unread: true },
      { id: "docs", label: "Docs", href: "https://example.com/docs", external: true },
    ],
  },
  {
    label: "Automations",
    items: [{ id: "runs", label: "Runs", running: true }],
  },
];

export default function SidebarNavDemo() {
  const [activeId, setActiveId] = useState("chat");
  return (
    <div className="w-64 rounded-lg border p-2">
      <SidebarNav
        sections={SECTIONS}
        pinned={[{ id: "home", label: "Home" }]}
        activeId={activeId}
        onSelect={setActiveId}
      />
    </div>
  );
}
