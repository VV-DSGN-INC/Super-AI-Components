import type { Meta, StoryObj } from "@storybook/react-vite";

import { PermissionPrompt } from "@/registry/super-ai/permission-prompt";
import { PermissionPromptDocs } from "@/content/components/permission-prompt.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof PermissionPrompt> = {
  title: "Super AI/Permission Prompt",
  component: PermissionPrompt,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PermissionPromptDocs) } },
};

export default meta;
type Story = StoryObj<typeof PermissionPrompt>;

export const AllowOnce: Story = {};
export const AlwaysAllow: Story = {};
export const Deny: Story = {};
export const EditFirst: Story = {};
