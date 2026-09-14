import type { Meta, StoryObj } from "@storybook/react-vite";

import { ConnectionHint } from "@/registry/super-ai/connection-hint";
import { ConnectionHintDocs } from "@/content/components/connection-hint.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ConnectionHint> = {
  title: "Super AI/Connection Hint",
  component: ConnectionHint,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ConnectionHintDocs) } },
};

export default meta;
type Story = StoryObj<typeof ConnectionHint>;

export const WithMatches: Story = {};
export const NoMatches: Story = {};
export const Chips: Story = {};
