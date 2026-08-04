import type { Meta, StoryObj } from "@storybook/react-vite";
import { MessageSquare, PenLine, Sparkles, Users } from "lucide-react";

import { ModeTabs } from "@/registry/super-ai/mode-tabs";
import { ModeTabsDocs } from "@/content/components/mode-tabs.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ModeTabs> = {
  title: "Super AI/Mode Tabs",
  component: ModeTabs,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ModeTabsDocs) } },
};

export default meta;
type Story = StoryObj<typeof ModeTabs>;

export const TextOnly: Story = {
  args: {
    modes: [
      { value: "chat", label: "Chat" },
      { value: "cowork", label: "Cowork" },
    ],
    defaultValue: "chat",
  },
};

export const WithIcon: Story = {
  args: {
    modes: [
      { value: "ask", label: "Ask", icon: <MessageSquare /> },
      { value: "design", label: "Design", icon: <PenLine /> },
      { value: "build", label: "Build", icon: <Sparkles /> },
    ],
    variant: "with-icon",
    defaultValue: "design",
  },
};

export const WithTooltip: Story = {
  args: {
    modes: [
      { value: "chat", label: "Chat", icon: <MessageSquare /> },
      { value: "cowork", label: "Cowork", icon: <Users /> },
    ],
    variant: "with-tooltip",
    defaultValue: "chat",
  },
};
