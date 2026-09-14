import type { Meta, StoryObj } from "@storybook/react-vite";

import { TypedEdge } from "@/registry/super-ai/typed-edge";
import { TypedEdgeDocs } from "@/content/components/typed-edge.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof TypedEdge> = {
  title: "Super AI/Typed Edge",
  component: TypedEdge,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TypedEdgeDocs) } },
};

export default meta;
type Story = StoryObj<typeof TypedEdge>;

export const TypeColoured: Story = {};
export const Selected: Story = {};
export const Streaming: Story = {};
