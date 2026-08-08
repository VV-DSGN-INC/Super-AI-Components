import type { Meta, StoryObj } from "@storybook/react-vite";

import { SuggestionChips } from "@/registry/super-ai/suggestion-chips";
import { SuggestionChipsDocs } from "@/content/components/suggestion-chips.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof SuggestionChips> = {
  title: "Super AI/Suggestion Chips",
  component: SuggestionChips,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SuggestionChipsDocs) } },
};

export default meta;
type Story = StoryObj<typeof SuggestionChips>;

export const Plain: Story = {};
export const WithIcon: Story = {};
export const WithThumbnail: Story = {};
export const OverflowLink: Story = {};
