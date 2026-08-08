import type { Meta, StoryObj } from "@storybook/react-vite";

import { TraceTimeline } from "@/registry/super-ai/trace-timeline";
import { TraceTimelineDocs } from "@/content/components/trace-timeline.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof TraceTimeline> = {
  title: "Super AI/Trace Timeline",
  component: TraceTimeline,
  parameters: { layout: "centered", docs: { page: componentDocsPage(TraceTimelineDocs) } },
};

export default meta;
type Story = StoryObj<typeof TraceTimeline>;

export const Collapsed: Story = {};
export const Expanded: Story = {};
export const Errored: Story = {};
export const RetrySiblings: Story = {};
