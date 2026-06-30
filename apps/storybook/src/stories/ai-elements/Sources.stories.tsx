import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";

const meta: Meta<typeof Sources> = {
  title: "AI Elements/Sources",
  component: Sources,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Sources>;

const sources = [
  {
    href: "https://buffer.com/library/short-form-video",
    title: "The Anatomy of a Short-Form Hook",
  },
  {
    href: "https://later.com/blog/video-retention",
    title: "Video Retention Benchmarks 2026",
  },
  {
    href: "https://hootsuite.com/research/social-trends",
    title: "Social Media Trends Report",
  },
];

export const Default: Story = {
  render: () => (
    <div className="w-[420px]">
      <Sources {...({ defaultOpen: true } as { defaultOpen?: boolean })}>
        <SourcesTrigger count={sources.length} />
        <SourcesContent>
          {sources.map((source) => (
            <Source href={source.href} key={source.href} title={source.title} />
          ))}
        </SourcesContent>
      </Sources>
    </div>
  ),
};
