import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { ImageIcon, SparklesIcon } from "lucide-react";

const meta: Meta<typeof Empty> = {
  title: "shadcn/ui/Empty",
  component: Empty,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Empty>;

export const Default: Story = {
  render: () => (
    <Empty className="w-96 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ImageIcon />
        </EmptyMedia>
        <EmptyTitle>No renders yet</EmptyTitle>
        <EmptyDescription>
          Start a prompt to generate your first image. Your renders will appear
          here.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>
          <SparklesIcon data-icon="inline-start" />
          New prompt
        </Button>
      </EmptyContent>
    </Empty>
  ),
};

export const NoSearchResults: Story = {
  render: () => (
    <Empty className="w-96 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SparklesIcon />
        </EmptyMedia>
        <EmptyTitle>No matching threads</EmptyTitle>
        <EmptyDescription>
          We couldn&apos;t find any threads for &ldquo;volcano&rdquo;. Try a
          different keyword or <a href="#">browse all threads</a>.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};
