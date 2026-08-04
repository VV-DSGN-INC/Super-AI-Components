import type { Meta, StoryObj } from "@storybook/react-vite";

import { GenerationQueue } from "@/registry/super-ai/generation-queue";
import { GenerationQueueDocs } from "@/content/components/generation-queue.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof GenerationQueue> = {
  title: "Super AI/Generation Queue",
  component: GenerationQueue,
  parameters: { layout: "centered", docs: { page: componentDocsPage(GenerationQueueDocs) } },
};

export default meta;
type Story = StoryObj<typeof GenerationQueue>;

export const Queued: Story = {
  args: {
    heading: "Generating 3 images",
    items: [
      { id: "1", title: "Rooftop garden, golden hour", description: "Image · 4:5", state: "queued" },
      { id: "2", title: "Studio portrait, soft light", description: "Image · 1:1", state: "queued" },
      { id: "3", title: "Neon alley, rain reflections", description: "Image · 16:9", state: "queued" },
    ],
    onCancelItem: () => {},
    onCancelAll: () => {},
  },
};

export const Running: Story = {
  args: {
    heading: "Generating 3 images",
    items: [
      { id: "1", title: "Rooftop garden, golden hour", description: "Image · 4:5", state: "running", progress: 24 },
      { id: "2", title: "Studio portrait, soft light", description: "Image · 1:1", state: "running", progress: 71 },
      { id: "3", title: "Neon alley, rain reflections", description: "Image · 16:9", state: "queued" },
    ],
    onCancelItem: () => {},
    onCancelAll: () => {},
  },
};

export const Done: Story = {
  args: {
    heading: "Generation complete",
    items: [
      { id: "1", title: "Rooftop garden, golden hour", description: "Image · 4:5", state: "done" },
      { id: "2", title: "Studio portrait, soft light", description: "Image · 1:1", state: "done" },
      { id: "3", title: "Neon alley, rain reflections", description: "Image · 16:9", state: "done" },
    ],
  },
};

export const Failed: Story = {
  args: {
    heading: "Generating 3 images",
    items: [
      { id: "1", title: "Rooftop garden, golden hour", description: "Image · 4:5", state: "done" },
      {
        id: "2",
        title: "Studio portrait, soft light",
        state: "failed",
        errorMessage: "Generation timed out",
      },
      { id: "3", title: "Neon alley, rain reflections", description: "Image · 16:9", state: "running", progress: 45 },
    ],
    onCancelItem: () => {},
    onRetryItem: () => {},
    onCancelAll: () => {},
  },
};

export const Cancel: Story = {
  args: {
    heading: "Generation cancelled",
    items: [
      { id: "1", title: "Rooftop garden, golden hour", description: "Image · 4:5", state: "done" },
      { id: "2", title: "Studio portrait, soft light", state: "cancel" },
      { id: "3", title: "Neon alley, rain reflections", state: "cancel" },
    ],
  },
};
