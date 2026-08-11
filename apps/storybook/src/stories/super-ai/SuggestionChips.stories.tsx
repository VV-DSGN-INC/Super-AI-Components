import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileText, Sparkles } from "lucide-react";

import { SuggestionChip, SuggestionChips, SuggestionChipsOverflow } from "@/registry/super-ai/suggestion-chips";
import { SuggestionChipsDocs } from "@/content/components/suggestion-chips.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof SuggestionChips> = {
  title: "Super AI/Suggestion Chips",
  component: SuggestionChips,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SuggestionChipsDocs) } },
};

export default meta;
type Story = StoryObj<typeof SuggestionChips>;

export const Plain: Story = {
  render: (args) => (
    <SuggestionChips {...args}>
      <SuggestionChip suggestion="Summarize this document" onSelect={() => {}} />
      <SuggestionChip suggestion="Find action items" onSelect={() => {}} />
      <SuggestionChip suggestion="Draft a reply" onSelect={() => {}} />
    </SuggestionChips>
  ),
};

export const WithIcon: Story = {
  render: (args) => (
    <SuggestionChips {...args}>
      <SuggestionChip suggestion="Draft a reply" icon={<Sparkles />} onSelect={() => {}} />
      <SuggestionChip suggestion="Summarize this document" icon={<Sparkles />} onSelect={() => {}} />
    </SuggestionChips>
  ),
};

export const WithThumbnail: Story = {
  render: (args) => (
    <SuggestionChips {...args}>
      <SuggestionChip
        suggestion="Continue from last template"
        thumbnail={
          <div className="bg-primary/15 flex size-full items-center justify-center">
            <FileText className="text-primary size-3" />
          </div>
        }
        onSelect={() => {}}
      />
      <SuggestionChip
        suggestion="Resume the Q3 report"
        thumbnail={
          <div className="bg-primary/15 flex size-full items-center justify-center">
            <FileText className="text-primary size-3" />
          </div>
        }
        onSelect={() => {}}
      />
    </SuggestionChips>
  ),
};

export const OverflowLink: Story = {
  render: (args) => (
    <SuggestionChips {...args}>
      <SuggestionChip suggestion="Summarize this document" onSelect={() => {}} />
      <SuggestionChip suggestion="Find action items" onSelect={() => {}} />
      <SuggestionChip suggestion="Draft a reply" onSelect={() => {}} />
      <SuggestionChipsOverflow count={6} href="#" />
    </SuggestionChips>
  ),
};
