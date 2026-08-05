import type { Meta, StoryObj } from "@storybook/react-vite";

import { RenderQueue, type RenderJob } from "@/registry/super-ai/render-queue";
import { RenderQueueDocs } from "@/content/components/render-queue.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const SPEC = { format: "MP4", codec: "H.264", resolution: "3840×2160", fps: 24 };

const JOBS: RenderJob[] = [
  {
    id: "1",
    name: "Opening titles",
    spec: { ...SPEC, resolution: "1280×720" },
    stage: "preview",
    state: "done",
    cost: { amount: 4 },
  },
  {
    id: "2",
    name: "Main cut",
    spec: SPEC,
    stage: "export",
    state: "streaming",
    progress: 62,
    cost: { amount: 900, per: "min" },
  },
  { id: "3", name: "Alt ending", spec: SPEC, stage: "export", state: "queued" },
  {
    id: "4",
    name: "Credits roll",
    spec: SPEC,
    stage: "export",
    state: "failed",
    cost: { amount: 55 },
    error: "Encoder ran out of memory",
  },
];

const meta: Meta<typeof RenderQueue> = {
  title: "Super AI/Render Queue",
  component: RenderQueue,
  parameters: { layout: "centered", docs: { page: componentDocsPage(RenderQueueDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[52rem] max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    jobs: JOBS,
    onRetry: () => {},
    onCancel: () => {},
    onDownload: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof RenderQueue>;

/** Every row carries the output spec it will be billed for. */
export const PerRowSpec: Story = {};

/** Only the rendering row has a bar; the number is per job. */
export const Progress: Story = {
  args: { jobs: JOBS.filter((j) => j.state === "streaming") },
};

/** A failed row keeps its spec and its error, and retries in place. */
export const Retry: Story = {
  args: { jobs: JOBS.filter((j) => j.state === "failed") },
};

/** Cancel reaches only work still in flight. */
export const Cancel: Story = {
  args: { jobs: JOBS.filter((j) => j.state === "queued" || j.state === "streaming") },
};

/** Download belongs to finished rows alone. */
export const Download: Story = {
  args: { jobs: JOBS.filter((j) => j.state === "done") },
};
