import type { Meta, StoryObj } from "@storybook/react-vite";

import { MessageLog } from "@/registry/super-ai/message-log";
import { MessageLogDocs } from "@/content/components/message-log.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof MessageLog> = {
  title: "Super AI/Message Log",
  component: MessageLog,
  parameters: { layout: "centered", docs: { page: componentDocsPage(MessageLogDocs) } },
};

export default meta;
type Story = StoryObj<typeof MessageLog>;

export const Empty: Story = {};
export const Populated: Story = {};
