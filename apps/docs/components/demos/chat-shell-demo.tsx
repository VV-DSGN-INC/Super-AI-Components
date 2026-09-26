"use client";

import { ChatShell } from "@/registry/super-ai/chat-shell";
import { WorkspaceSwitcher } from "@/registry/super-ai/workspace-switcher";
import { PromoCard } from "@/registry/super-ai/promo-card";
import { AccountMenu } from "@/registry/super-ai/account-menu";

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
  { id: "northwind", name: "Northwind", plan: "Pro" },
  { id: "acme", name: "Acme Labs" },
];

export default function ChatShellDemo() {
  return (
    <ChatShell
      className="h-[42rem]"
      title="Brand audit for Northwind"
      topbar={{ privacy: { label: "Private" }, savedLabel: "Saved just now" }}
      switcher={<WorkspaceSwitcher workspaces={WORKSPACES} currentId="northwind" onSelect={() => {}} />}
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
          flavour="upgrade"
          title="Get more render minutes"
          description="Upgrade to Pro for priority queues and longer exports."
          ctaLabel="Upgrade"
          onCtaClick={() => {}}
          onDismiss={() => {}}
        />
      }
      sidebarFooter={
        <AccountMenu
          user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
          theme="system"
          onThemeChange={() => {}}
          background="default"
          onBackgroundChange={() => {}}
          onSignOut={() => {}}
        />
      }
    />
  );
}
