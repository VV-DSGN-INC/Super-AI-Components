import type { Meta, StoryObj } from "@storybook/react-vite";

import { SummaryCard } from "@/registry/super-ai/summary-card";
import { SummaryCardDocs } from "@/content/components/summary-card.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof SummaryCard> = {
  title: "Super AI/Summary Card",
  component: SummaryCard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SummaryCardDocs) } },
};

export default meta;
type Story = StoryObj<typeof SummaryCard>;

export const Generating: Story = {};
export const Ready: Story = {};
export const Attributed: Story = {};
export const QuoteAndCondense: Story = {};
export const Collapsed: Story = {};
export const TurnedOff: Story = {};
