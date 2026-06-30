import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const meta: Meta<typeof RadioGroup> = {
  title: "shadcn/ui/Radio Group",
  component: RadioGroup,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof RadioGroup>;

const presets = [
  {
    value: "draft",
    title: "Draft",
    desc: "512px · 12 steps · ~3s · 1 credit",
  },
  {
    value: "standard",
    title: "Standard",
    desc: "1024px · 32 steps · ~12s · 4 credits",
  },
  {
    value: "ultra",
    title: "Ultra",
    desc: "2048px · 64 steps · ~40s · 12 credits",
  },
];

export const Default: Story = {
  render: () => {
    function QualityPicker() {
      const [value, setValue] = React.useState("standard");
      return (
        <RadioGroup
          value={value}
          onValueChange={(v) => setValue(v as string)}
          className="w-80"
        >
          {presets.map((preset) => (
            <Label
              key={preset.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-input p-3 has-data-checked:border-primary has-data-checked:bg-accent/40"
            >
              <RadioGroupItem value={preset.value} className="mt-0.5" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{preset.title}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {preset.desc}
                </span>
              </span>
            </Label>
          ))}
        </RadioGroup>
      );
    }
    return <QualityPicker />;
  },
};

export const Inline: Story = {
  render: () => {
    function InlinePicker() {
      const [value, setValue] = React.useState("ultra");
      return (
        <div className="flex flex-col gap-3">
          <RadioGroup
            value={value}
            onValueChange={(v) => setValue(v as string)}
            className="grid-flow-col"
          >
            {presets.map((preset) => (
              <Label
                key={preset.value}
                className="flex cursor-pointer items-center gap-2 text-sm font-normal"
              >
                <RadioGroupItem value={preset.value} />
                {preset.title}
              </Label>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            Selected quality: <span className="font-medium">{value}</span>
          </p>
        </div>
      );
    }
    return <InlinePicker />;
  },
};
