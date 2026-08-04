import type { Meta, StoryObj } from "@storybook/react-vite";

import { SidebarNav } from "@/registry/super-ai/sidebar-nav";
import { SidebarNavDocs } from "@/content/components/sidebar-nav.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof SidebarNav> = {
  title: "Super AI/Sidebar Nav",
  component: SidebarNav,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SidebarNavDocs) } },
};

export default meta;
type Story = StoryObj<typeof SidebarNav>;

export const CountBadge: Story = {
  args: {
    activeId: "chat",
    sections: [
      {
        label: "Workspace",
        items: [
          { id: "chat", label: "Chat", count: 3 },
          { id: "library", label: "Library" },
        ],
      },
    ],
  },
};

export const TierBadge: Story = {
  args: {
    activeId: "chat",
    sections: [
      {
        label: "Workspace",
        items: [
          { id: "chat", label: "Chat" },
          { id: "library", label: "Library", tier: "Pro" },
        ],
      },
    ],
  },
};

export const UnreadDot: Story = {
  args: {
    activeId: "chat",
    sections: [
      {
        label: "Workspace",
        items: [
          { id: "chat", label: "Chat" },
          { id: "inbox", label: "Inbox", unread: true },
        ],
      },
    ],
  },
};

export const Running: Story = {
  args: {
    activeId: "chat",
    sections: [
      {
        label: "Automations",
        items: [
          { id: "chat", label: "Chat" },
          { id: "runs", label: "Runs", running: true },
        ],
      },
    ],
  },
};

export const PinnedGroup: Story = {
  args: {
    activeId: "chat",
    pinned: [{ id: "home", label: "Home" }],
    sections: [
      {
        label: "Workspace",
        items: [
          { id: "chat", label: "Chat", count: 3 },
          { id: "library", label: "Library", tier: "Pro" },
        ],
      },
    ],
  },
};
