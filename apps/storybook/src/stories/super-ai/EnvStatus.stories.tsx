import type { Meta, StoryObj } from "@storybook/react-vite";

import { EnvStatus } from "@/registry/super-ai/env-status";
import { EnvStatusDocs } from "@/content/components/env-status.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof EnvStatus> = {
  title: "Super AI/Env Status",
  component: EnvStatus,
  parameters: { layout: "centered", docs: { page: componentDocsPage(EnvStatusDocs) } },
};

export default meta;
type Story = StoryObj<typeof EnvStatus>;

export const Ok: Story = {};
export const Degraded: Story = {};
export const KeyInvalid: Story = {};
export const NotRunning: Story = {};
