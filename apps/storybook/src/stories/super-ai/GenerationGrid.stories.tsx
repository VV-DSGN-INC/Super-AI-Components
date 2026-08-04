import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GenerationGrid, type GenerationItemContext } from "@/registry/super-ai/generation-grid";
import { ResultCard, type ResultCardState } from "@/registry/super-ai/result-card";
import { GenerationGridDocs } from "@/content/components/generation-grid.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

interface Row {
  id: string;
  prompt: string;
  state: ResultCardState;
}

const TODAY: Row[] = [
  { id: "1", prompt: "Rooftop garden, golden hour", state: "done" },
  { id: "2", prompt: "Neon alley, rain reflections", state: "streaming" },
  { id: "3", prompt: "Studio portrait, soft light", state: "queued" },
  { id: "4", prompt: "Glass sculpture on marble", state: "failed" },
];

const YESTERDAY: Row[] = [
  { id: "5", prompt: "Coastal cliffs at dawn", state: "done" },
  { id: "6", prompt: "Paper texture close-up", state: "done" },
];

function Media() {
  return (
    <div className="bg-foreground/10 flex h-full w-full items-center justify-center">
      <Sparkles aria-hidden className="text-foreground/40 size-5" />
    </div>
  );
}

const card = (item: Row, ctx: GenerationItemContext) => (
  <ResultCard
    state={item.state}
    aspect="square"
    progress={54}
    label={item.prompt}
    selectable={ctx.selectMode}
    selected={ctx.selected}
    onSelect={ctx.toggleSelected}
    onRetry={() => {}}
    footer={item.state === "done" ? <span>17 credits</span> : null}
  >
    <Media />
  </ResultCard>
);

const meta: Meta<typeof GenerationGrid> = {
  title: "Super AI/Generation Grid",
  component: GenerationGrid,
  parameters: { layout: "centered", docs: { page: componentDocsPage(GenerationGridDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[46rem] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GenerationGrid>;

/** Grouped by relative date — one A3 `date-section` per bucket, newest first. */
export const DateSections: Story = {
  render: () => (
    <GenerationGrid
      groups={[
        { id: "today", label: "Today", items: TODAY },
        { id: "yesterday", label: "Yesterday", items: YESTERDAY },
      ]}
      getItemId={(i) => i.id}
      renderItem={card}
    />
  ),
};

/** The same cells at all three densities. Only the column count changes. */
export const Density: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["comfortable", "default", "compact"] as const).map((density) => (
        <section key={density} className="flex flex-col gap-2">
          <h3 className="text-foreground text-xs font-medium">{density}</h3>
          <GenerationGrid
            density={density}
            items={[...TODAY, ...YESTERDAY]}
            getItemId={(i) => i.id}
            renderItem={card}
          />
        </section>
      ))}
    </div>
  ),
};

/** Checkboxes and a bulk bar; every card's hover actions are suppressed. */
export const SelectMode: Story = {
  render: () => (
    <GenerationGrid
      selectMode
      selectedIds={["1", "4"]}
      onSelectionChange={() => {}}
      items={TODAY}
      getItemId={(i) => i.id}
      renderItem={card}
      bulkActions={
        <>
          <Button size="sm" variant="outline">
            Download
          </Button>
          <Button size="sm" variant="outline">
            Delete
          </Button>
        </>
      }
    />
  ),
};

/** Empty is a tile inside the grid — the surface keeps its shape. */
export const Empty: Story = {
  render: () => (
    <GenerationGrid
      density="comfortable"
      items={[] as Row[]}
      getItemId={(i) => i.id}
      renderItem={card}
      empty={
        <div className="text-foreground flex h-full flex-col items-start justify-center gap-2 rounded-lg border border-dashed p-4 text-sm">
          <p>Nothing generated yet.</p>
          <Button size="sm" variant="outline">
            Generate your first result
          </Button>
        </div>
      }
    />
  ),
};
