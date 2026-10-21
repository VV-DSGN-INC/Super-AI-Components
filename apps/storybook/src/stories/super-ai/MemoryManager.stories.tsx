import type { Meta, StoryObj } from "@storybook/react-vite";

import { MemoryManager } from "@/registry/super-ai/memory-manager";
import { MemoryManagerDocs } from "@/content/components/memory-manager.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof MemoryManager> = {
  title: "Super AI/Memory Manager",
  component: MemoryManager,
  parameters: { layout: "centered", docs: { page: componentDocsPage(MemoryManagerDocs) } },
};

export default meta;
type Story = StoryObj<typeof MemoryManager>;

export const Empty: Story = {};
export const Populated: Story = {};
export const Scoped: Story = {};
export const JustSaved: Story = {};
export const Editing: Story = {};
export const MemoryOff: Story = {};
export const ResetConfirm: Story = {};
