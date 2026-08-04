import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppTopbar } from "@/registry/super-ai/app-topbar";
import { AppTopbarDocs } from "@/content/components/app-topbar.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof AppTopbar> = {
  title: "Super AI/App Topbar",
  component: AppTopbar,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AppTopbarDocs) } },
};

export default meta;
type Story = StoryObj<typeof AppTopbar>;

export const DocumentContext: Story = {
  args: {
    context: "document",
    title: "Q3 Roadmap",
    breadcrumb: [
      { label: "Projects", href: "#" },
      { label: "Marketing", href: "#" },
      { label: "Q3 Roadmap" },
    ],
    privacy: { label: "Private" },
    savedLabel: "Last saved 5 days ago",
  },
};

export const EditorContext: Story = {
  args: {
    context: "editor",
    title: "Untitled scene",
    zoomLabel: "100%",
    canUndo: true,
    canRedo: false,
  },
};

export const PrivacyChip: Story = {
  args: {
    context: "document",
    title: "Q3 Roadmap",
    breadcrumb: [{ label: "Projects", href: "#" }, { label: "Q3 Roadmap" }],
    privacy: { label: "Team" },
  },
};

export const SavedState: Story = {
  args: {
    context: "document",
    title: "Q3 Roadmap",
    breadcrumb: [{ label: "Projects", href: "#" }, { label: "Q3 Roadmap" }],
    savedLabel: "Last saved 5 days ago",
  },
};
