import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronsUpDownIcon } from "lucide-react";

const meta: Meta<typeof Collapsible> = {
  title: "shadcn/ui/Collapsible",
  component: Collapsible,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-80">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-medium">Advanced render settings</h4>
        <CollapsibleTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Toggle" />
          }
        >
          <ChevronsUpDownIcon />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="mt-2 flex flex-col gap-2">
        <div className="rounded-lg border px-3 py-2 text-sm">CFG scale: 7.5</div>
        <div className="rounded-lg border px-3 py-2 text-sm">Sampler: DPM++ 2M</div>
        <div className="rounded-lg border px-3 py-2 text-sm">Steps: 30</div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const PromptDetails: Story = {
  render: () => (
    <Collapsible className="w-80 rounded-xl border p-3">
      <CollapsibleTrigger
        render={
          <Button variant="ghost" className="w-full justify-between" />
        }
      >
        Show full prompt
        <ChevronsUpDownIcon />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 text-sm text-muted-foreground">
        cyberpunk alley at night, heavy rain, neon signs in Japanese,
        reflections in puddles, cinematic lighting, 35mm, ultra detailed,
        --ar 16:9 --seed 48213
      </CollapsibleContent>
    </Collapsible>
  ),
};
