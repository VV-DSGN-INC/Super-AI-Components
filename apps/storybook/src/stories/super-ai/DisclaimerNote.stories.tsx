import type { Meta, StoryObj } from "@storybook/react-vite";

import { DisclaimerNote } from "@/registry/super-ai/disclaimer-note";
import { DisclaimerNoteDocs } from "@/content/components/disclaimer-note.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof DisclaimerNote> = {
  title: "Super AI/Disclaimer Note",
  component: DisclaimerNote,
  parameters: { layout: "centered", docs: { page: componentDocsPage(DisclaimerNoteDocs) } },
};

export default meta;
type Story = StoryObj<typeof DisclaimerNote>;

export const UnderComposer: Story = {
  args: { variant: "under-composer" },
  render: (args) => (
    <div className="w-80 rounded-lg border">
      <div className="text-muted-foreground px-3 py-2 text-sm">Message the assistant…</div>
      <DisclaimerNote {...args} />
    </div>
  ),
};

export const InCard: Story = {
  args: {
    variant: "in-card",
    link: { label: "Learn how sources are used", href: "#" },
  },
  render: (args) => (
    <div className="w-80 rounded-lg border">
      <div className="p-3 text-sm">Generated summary of the uploaded report.</div>
      <DisclaimerNote {...args} />
    </div>
  ),
};

export const Inline: Story = {
  args: { variant: "inline", children: "May be inaccurate." },
  render: (args) => (
    <div className="flex items-center gap-2 text-sm">
      <span>Response generated 2m ago</span>
      <span aria-hidden="true">·</span>
      <DisclaimerNote {...args} />
    </div>
  ),
};
