import type { Meta, StoryObj } from "@storybook/react-vite";

import { ContextChip, ContextChipOverflow, ContextChips } from "@/registry/super-ai/context-chips";
import { ContextChipsDocs } from "@/content/components/context-chips.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ContextChips> = {
  title: "Super AI/Context Chips",
  component: ContextChips,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ContextChipsDocs) } },
};

export default meta;
type Story = StoryObj<typeof ContextChips>;

export const File: Story = {
  render: (args) => (
    <ContextChips {...args}>
      <ContextChip kind="file" label="design.fig" onRemove={() => {}} />
    </ContextChips>
  ),
};

export const Selection: Story = {
  render: (args) => (
    <ContextChips {...args}>
      <ContextChip kind="selection" label="lines 12-40" onRemove={() => {}} />
    </ContextChips>
  ),
};

export const Url: Story = {
  render: (args) => (
    <ContextChips {...args}>
      <ContextChip kind="url" label="vercel.com/docs" onRemove={() => {}} />
    </ContextChips>
  ),
};

export const Mention: Story = {
  render: (args) => (
    <ContextChips {...args}>
      <ContextChip kind="mention" label="@teammate" onRemove={() => {}} />
    </ContextChips>
  ),
};

export const Overflow: Story = {
  render: (args) => (
    <ContextChips {...args}>
      <ContextChip kind="file" label="design.fig" onRemove={() => {}} />
      <ContextChip kind="selection" label="lines 12-40" onRemove={() => {}} />
      <ContextChip kind="url" label="vercel.com/docs" onRemove={() => {}} />
      <ContextChipOverflow count={4} onClick={() => {}} />
    </ContextChips>
  ),
};

export const Unresolved: Story = {
  render: (args) => (
    <ContextChips {...args}>
      <ContextChip kind="file" label="brief.pdf" unresolved onRemove={() => {}} />
    </ContextChips>
  ),
};
