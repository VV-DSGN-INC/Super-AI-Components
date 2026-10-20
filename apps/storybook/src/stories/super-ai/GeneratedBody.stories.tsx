import type { Meta, StoryObj } from "@storybook/react-vite";

import { GeneratedBody } from "@/registry/super-ai/generated-body";
import { GeneratedBodyDocs } from "@/content/components/generated-body.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof GeneratedBody> = {
  title: "Super AI/Generated Body",
  component: GeneratedBody,
  parameters: { layout: "centered", docs: { page: componentDocsPage(GeneratedBodyDocs) } },
};

export default meta;
type Story = StoryObj<typeof GeneratedBody>;

export const Streaming: Story = {};
export const Rendered: Story = {};
export const FailedWithFallback: Story = {};
export const FailedWithoutFallback: Story = {};
