import type { Meta, StoryObj } from "@storybook/react-vite";

import { QuoteReply } from "@/registry/super-ai/quote-reply";
import { QuoteReplyDocs } from "@/content/components/quote-reply.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof QuoteReply> = {
  title: "Super AI/Quote Reply",
  component: QuoteReply,
  parameters: { layout: "centered", docs: { page: componentDocsPage(QuoteReplyDocs) } },
};

export default meta;
type Story = StoryObj<typeof QuoteReply>;

export const TextRange: Story = {
  args: {
    source: "text-range",
    excerpt: "the negative prompt should stay in sync with the reference strip",
    anchor: "¶4",
    onRemove: () => {},
  },
};

export const ImageRegion: Story = {
  args: {
    source: "image-region",
    excerpt: "the torn edge of the poster",
    anchor: "212,88 · 160×120",
    thumbnail: <div className="bg-accent size-full" aria-hidden />,
    onRemove: () => {},
  },
};

export const TableCell: Story = {
  args: {
    source: "table-cell",
    excerpt: "$42,300",
    anchor: "Q3 Budget!C12",
    onRemove: () => {},
  },
};

export const TimelineRange: Story = {
  args: {
    source: "timeline-range",
    excerpt: "so that's the part we want to cut",
    anchor: "0:42–0:51",
    onRemove: () => {},
  },
};
