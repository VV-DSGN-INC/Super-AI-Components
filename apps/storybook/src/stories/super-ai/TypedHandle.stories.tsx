import type { Meta, StoryObj } from "@storybook/react-vite";

import { TypedHandle } from "@/registry/super-ai/typed-handle";
import { TypedHandleDocs } from "@/content/components/typed-handle.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof TypedHandle> = {
  title: "Super AI/Typed Handle",
  component: TypedHandle,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TypedHandleDocs) } },
};

export default meta;
type Story = StoryObj<typeof TypedHandle>;

export const Input: Story = {};
export const Output: Story = {};
export const Stacked: Story = {};
export const Compatible: Story = {};
export const UnregisteredType: Story = {};
