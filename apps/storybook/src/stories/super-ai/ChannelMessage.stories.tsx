import type { Meta, StoryObj } from "@storybook/react-vite";

import { ChannelMessage } from "@/registry/super-ai/channel-message";
import { ChannelMessageDocs } from "@/content/components/channel-message.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ChannelMessage> = {
  title: "Super AI/Channel Message",
  component: ChannelMessage,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ChannelMessageDocs) } },
};

export default meta;
type Story = StoryObj<typeof ChannelMessage>;

export const Pending: Story = {};
export const Sent: Story = {};
export const Answered: Story = {};
export const Withdrawn: Story = {};
export const Expired: Story = {};
export const FailedCheck: Story = {};
export const NotRouted: Story = {};
