import type { Meta, StoryObj } from "@storybook/react-vite";

import { UsageDashboard } from "@/registry/super-ai/usage-dashboard";
import { UsageDashboardDocs } from "@/content/components/usage-dashboard.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof UsageDashboard> = {
  title: "Super AI/Usage Dashboard",
  component: UsageDashboard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(UsageDashboardDocs) } },
};

export default meta;
type Story = StoryObj<typeof UsageDashboard>;

export const PeriodSelect: Story = {};
export const SummaryCards: Story = {};
export const ModelBreakdown: Story = {};
