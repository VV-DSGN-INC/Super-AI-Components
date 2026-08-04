import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, within } from "storybook/test";

import { WorkspaceSwitcher } from "@/registry/super-ai/workspace-switcher";
import { WorkspaceSwitcherDocs } from "@/content/components/workspace-switcher.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const WORKSPACE_LIST = [
  { id: "acme", name: "Acme", plan: "Pro" },
  { id: "personal", name: "Personal", plan: "Free" },
];

const MULTI_PRODUCT = [
  { id: "acme-video", name: "Acme Video", plan: "Pro", description: "Video generation workspace" },
  { id: "acme-copy", name: "Acme Copy", plan: "Pro", description: "Marketing copy workspace" },
  { id: "personal", name: "Personal", plan: "Free", description: "Solo experiments" },
];

const meta: Meta<typeof WorkspaceSwitcher> = {
  title: "Super AI/Workspace Switcher",
  component: WorkspaceSwitcher,
  parameters: { layout: "centered", docs: { page: componentDocsPage(WorkspaceSwitcherDocs) } },
};

export default meta;
type Story = StoryObj<typeof WorkspaceSwitcher>;

export const WorkspaceList: Story = {
  args: {
    workspaces: WORKSPACE_LIST,
    currentId: "acme",
    onSelect: () => {},
    onCreate: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Acme/ }));

    // The menu popup renders in a portal outside canvasElement, so assert
    // against the document via `screen` rather than the scoped canvas.
    const current = await screen.findByRole("menuitemradio", { name: /Acme/ });
    await expect(current).toHaveAttribute("aria-checked", "true");
  },
};

export const MultiProduct: Story = {
  args: {
    workspaces: MULTI_PRODUCT,
    currentId: "acme-video",
    onSelect: () => {},
    onCreate: () => {},
  },
};

export const WithPlanBadge: Story = {
  args: {
    workspaces: WORKSPACE_LIST,
    currentId: "acme",
    onSelect: () => {},
  },
};
