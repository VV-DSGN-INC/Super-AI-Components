import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const meta: Meta<typeof Select> = {
  title: "shadcn/ui/Select",
  component: Select,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Select>;

const models = [
  { value: "nova-3-opus", label: "Nova 3 Opus", hint: "Most capable" },
  { value: "nova-3-sonnet", label: "Nova 3 Sonnet", hint: "Balanced" },
  { value: "nova-3-haiku", label: "Nova 3 Haiku", hint: "Fastest" },
  { value: "nova-vision", label: "Nova Vision", hint: "Multimodal" },
];

export const Default: Story = {
  render: () => {
    function ModelSelect() {
      const [model, setModel] = React.useState("nova-3-sonnet");
      return (
        <div className="flex w-64 flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Chat model
          </span>
          <Select
            value={model}
            onValueChange={(value) => setModel(value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            Active: {models.find((m) => m.value === model)?.label}
          </span>
        </div>
      );
    }
    return <ModelSelect />;
  },
};

export const Grouped: Story = {
  render: () => {
    function GroupedSelect() {
      const [model, setModel] = React.useState("nova-3-opus");
      return (
        <Select value={model} onValueChange={(value) => setModel(value ?? "")}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Choose a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Nova family</SelectLabel>
              <SelectItem value="nova-3-opus">Nova 3 Opus</SelectItem>
              <SelectItem value="nova-3-sonnet">Nova 3 Sonnet</SelectItem>
              <SelectItem value="nova-3-haiku">Nova 3 Haiku</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Image models</SelectLabel>
              <SelectItem value="nova-image-xl">Nova Image XL</SelectItem>
              <SelectItem value="nova-canvas">Nova Canvas</SelectItem>
              <SelectItem value="nova-legacy" disabled>
                Nova Image 1 (deprecated)
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );
    }
    return <GroupedSelect />;
  },
};

export const SmallTrigger: Story = {
  render: () => {
    function CompactSelect() {
      const [quality, setQuality] = React.useState("balanced");
      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Quality</span>
          <Select
            value={quality}
            onValueChange={(value) => setQuality(value ?? "")}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="high">High fidelity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }
    return <CompactSelect />;
  },
};
