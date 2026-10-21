import type { Meta, StoryObj } from "@storybook/react-vite";

import { CheckReport } from "@/registry/super-ai/check-report";
import { CheckReportDocs } from "@/content/components/check-report.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof CheckReport> = {
  title: "Super AI/Check Report",
  component: CheckReport,
  parameters: { layout: "centered", docs: { page: componentDocsPage(CheckReportDocs) } },
};

export default meta;
type Story = StoryObj<typeof CheckReport>;

export const AllPass: Story = {};
export const SomeFail: Story = {};
