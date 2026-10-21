import type { Meta, StoryObj } from "@storybook/react-vite";

import { PrivateSessionNotice } from "@/registry/super-ai/private-session-notice";
import { PrivateSessionNoticeDocs } from "@/content/components/private-session-notice.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof PrivateSessionNotice> = {
  title: "Super AI/Private Session Notice",
  component: PrivateSessionNotice,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PrivateSessionNoticeDocs) } },
};

export default meta;
type Story = StoryObj<typeof PrivateSessionNotice>;

export const Entering: Story = {};
export const Active: Story = {};
export const ConnectorsReduced: Story = {};
export const Exiting: Story = {};
export const Unavailable: Story = {};
