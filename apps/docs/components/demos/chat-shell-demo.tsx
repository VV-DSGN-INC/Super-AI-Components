"use client";

import { Keyboard } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { DemoNotifications } from "@/components/demos/demo-notifications";
import { AccountMenu } from "@/registry/super-ai/account-menu";
import { ChatShell } from "@/registry/super-ai/chat-shell";
import { PromoCard } from "@/registry/super-ai/promo-card";
import { ShortcutsSheet } from "@/registry/super-ai/shortcuts-sheet";
import { WorkspaceSwitcher } from "@/registry/super-ai/workspace-switcher";

const THREAD_GROUPS = [
  {
    id: "today",
    label: "Today",
    threads: [
      { id: "brand-audit", title: "Brand audit for Northwind" },
      { id: "deck-export", title: "Export the Q3 deck", running: true, runningLabel: "Rendering slides" },
    ],
  },
  {
    id: "earlier",
    label: "Last 7 days",
    threads: [
      { id: "onboarding", title: "Onboarding email rewrite", pinned: true },
      { id: "pricing", title: "Pricing page copy", unread: true },
    ],
  },
];

const MESSAGES = [
  {
    id: "m1",
    role: "user" as const,
    content: "Audit Northwind's brand voice against the three competitors in the deck.",
  },
  {
    id: "m2",
    role: "assistant" as const,
    content:
      "I read all four voice guides and pulled the overlap. Northwind is the only one that leads with reassurance rather than speed — that is the position worth defending. I have written the summary up as an artifact below.",
    feedback: { state: "idle" as const },
  },
];

const ARTIFACTS = [
  {
    id: "brand-audit",
    label: "Brand audit for Northwind",
    items: [
      {
        id: "a1",
        excerpt:
          "Northwind is the only voice in the set that opens on reassurance. Competitors open on speed, which leaves the calm position uncontested.",
        type: "markdown",
        editedAgo: "Edited 4 minutes ago",
        visibility: "private" as const,
      },
      {
        id: "a2",
        excerpt: "const TONE = ['reassuring', 'plain', 'unhurried'] // extracted from 41 sampled pages",
        type: "code",
        editedAgo: "Edited 9 minutes ago",
        viewCount: 3,
        visibility: "shared" as const,
      },
    ],
  },
];

const WORKSPACES = [
  { id: "northwind", name: "Northwind" },
  { id: "acme", name: "Acme Labs" },
];

// Only shortcuts this shell really binds: D1 sends on Enter and breaks a line
// on Shift+Enter, and the vendored sidebar toggles on Cmd/Ctrl+B.
const SHORTCUTS = [
  {
    title: "Conversation",
    shortcuts: [
      { label: "Send the message", keys: ["Enter"] },
      { label: "Start a new line", keys: ["⇧", "Enter"] },
    ],
  },
  { title: "Workspace", shortcuts: [{ label: "Show or hide the sidebar", keys: ["⌘", "B"] }] },
];

export default function ChatShellDemo() {
  const [currentWorkspaceId, setCurrentWorkspaceId] = React.useState("northwind");
  const [promoDismissed, setPromoDismissed] = React.useState(false);

  return (
    <ChatShell
      className="h-[42rem]"
      title="Brand audit for Northwind"
      topbar={{
        privacy: { label: "Private" },
        savedLabel: "Saved just now",
        actions: (
          <ShortcutsSheet
            sections={SHORTCUTS}
            trigger={
              <Button type="button" variant="ghost" size="sm">
                <Keyboard aria-hidden />
                Shortcuts
              </Button>
            }
          />
        ),
      }}
      switcher={
        <WorkspaceSwitcher
          workspaces={WORKSPACES}
          currentId={currentWorkspaceId}
          onSelect={setCurrentWorkspaceId}
        />
      }
      threadGroups={THREAD_GROUPS}
      activeThreadId="brand-audit"
      messages={MESSAGES}
      artifacts={ARTIFACTS}
      contextChips={[{ id: "c1", kind: "file", label: "brand-guide.pdf" }]}
      modes={[
        { value: "ask", label: "Ask" },
        { value: "build", label: "Build" },
      ]}
      mode="ask"
      sidebarPromo={
        <PromoCard
          flavour="invite"
          title="Bring a teammate into this thread"
          description="Share Northwind's brand audit with the rest of the team."
          ctaLabel="Invite a teammate"
          onCtaClick={() => {}}
          dismissed={promoDismissed}
          onDismiss={() => setPromoDismissed(true)}
        />
      }
      sidebarFooter={
        <div className="flex items-center justify-between gap-1 group-data-[collapsible=icon]:flex-col">
          <AccountMenu
            user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
            theme="system"
            onThemeChange={() => {}}
            background="default"
            onBackgroundChange={() => {}}
            onSignOut={() => {}}
          />
          <DemoNotifications />
        </div>
      }
    />
  );
}
