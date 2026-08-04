import type { Meta, StoryObj } from "@storybook/react-vite";
import { ImagePlus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { GenerationGrid } from "@/registry/super-ai/generation-grid";
import { EmptyStateDocs } from "@/content/components/empty-state.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

/** Decorative stand-in for one half of a transformation. */
function Swatch({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <div
      aria-hidden
      className={`flex aspect-video items-center justify-center text-xs text-foreground ${
        dim ? "bg-foreground/5" : "bg-foreground/15"
      }`}
    >
      {label}
    </div>
  );
}

const meta: Meta<typeof EmptyState> = {
  title: "Super AI/Empty State",
  component: EmptyState,
  parameters: { layout: "centered", docs: { page: componentDocsPage(EmptyStateDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[44rem] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

/** A whole route with nothing in it. The heading keeps document structure intact. */
export const Page: Story = {
  args: {
    size: "page",
    icon: <ImagePlus />,
    title: <h2 className="text-lg font-medium tracking-tight">No renders yet</h2>,
    description: "Describe a shot and every result lands here.",
    action: (
      <Button>
        <Sparkles aria-hidden />
        Generate a render
      </Button>
    ),
    secondaryAction: <Button variant="ghost">Browse presets</Button>,
  },
};

/** A sidebar or pane. Same slots as the page state — only the frame changes. */
export const Panel: Story = {
  args: {
    size: "panel",
    icon: <ImagePlus />,
    title: "Nothing pinned",
    description: "Pin a render to keep it beside your work.",
    action: (
      <Button size="sm" variant="outline">
        Pin a render
      </Button>
    ),
  },
};

/**
 * A tile in the grid&apos;s first cell. The grid keeps its columns; the empty
 * state never becomes a page takeover.
 */
export const InGrid: Story = {
  render: () => (
    <GenerationGrid
      density="comfortable"
      items={[] as { id: string }[]}
      getItemId={(item) => item.id}
      renderItem={() => null}
      empty={
        <EmptyState
          size="in-grid"
          icon={<ImagePlus />}
          title="No renders yet"
          description="Your results appear here."
          action={
            <Button size="sm" variant="outline">
              Generate a render
            </Button>
          }
        />
      }
    />
  ),
};

/** Before to after — the strongest form for a generation tool. */
export const ExamplePair: Story = {
  args: {
    size: "panel",
    title: "Try a relight",
    description: "Upload a shot and change the lighting without reshooting.",
    examplePair: {
      before: { content: <Swatch label="source photo" dim />, label: "Your photo" },
      after: { content: <Swatch label="relit render" />, label: "Relit" },
      caption: "Prompt: warm rim light, dusk",
    },
    action: (
      <Button size="sm">
        <Sparkles aria-hidden />
        Upload a photo
      </Button>
    ),
  },
};
