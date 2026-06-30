import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { Slider } from "@/components/ui/slider";

const meta: Meta<typeof Slider> = {
  title: "shadcn/ui/Slider",
  component: Slider,
  parameters: { layout: "centered" },
};

export default meta;

type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  render: () => {
    const [guidance, setGuidance] = React.useState(7.5);

    return (
      <div className="w-80 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Guidance scale (CFG)</label>
          <span className="text-sm tabular-nums text-muted-foreground">
            {guidance.toFixed(1)}
          </span>
        </div>
        <Slider
          value={guidance}
          onValueChange={(value) =>
            setGuidance(Array.isArray(value) ? value[0] : value)
          }
          min={1}
          max={20}
          step={0.5}
        />
        <p className="text-xs text-muted-foreground">
          Higher values follow the prompt more strictly.
        </p>
      </div>
    );
  },
};

export const Steps: Story = {
  render: () => {
    const [steps, setSteps] = React.useState(30);

    return (
      <div className="w-80 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Sampling steps</label>
          <span className="text-sm tabular-nums text-muted-foreground">
            {steps}
          </span>
        </div>
        <Slider
          value={steps}
          onValueChange={(value) =>
            setSteps(Array.isArray(value) ? value[0] : value)
          }
          min={10}
          max={150}
          step={1}
        />
        <p className="text-xs text-muted-foreground">
          More steps = sharper detail, slower render.
        </p>
      </div>
    );
  },
};

export const Temperature: Story = {
  render: () => {
    const [temp, setTemp] = React.useState(0.8);

    return (
      <div className="w-80 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Creativity / temperature</label>
          <span className="text-sm tabular-nums text-muted-foreground">
            {temp.toFixed(2)}
          </span>
        </div>
        <Slider
          value={temp}
          onValueChange={(value) =>
            setTemp(Array.isArray(value) ? value[0] : value)
          }
          min={0}
          max={2}
          step={0.05}
        />
        <p className="text-xs text-muted-foreground">
          Lower is deterministic, higher is more experimental.
        </p>
      </div>
    );
  },
};

export const Range: Story = {
  render: () => {
    const [range, setRange] = React.useState<number[]>([512, 1024]);

    return (
      <div className="w-80 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Output resolution range</label>
          <span className="text-sm tabular-nums text-muted-foreground">
            {range[0]}px – {range[1]}px
          </span>
        </div>
        <Slider
          value={range}
          onValueChange={(value) =>
            setRange(Array.isArray(value) ? value : [value])
          }
          min={256}
          max={2048}
          step={64}
        />
        <p className="text-xs text-muted-foreground">
          Constrain the longest edge of generated images.
        </p>
      </div>
    );
  },
};
