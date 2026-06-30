import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import {
  NativeSelect,
  NativeSelectOption,
  NativeSelectOptGroup,
} from "@/components/ui/native-select";

const meta: Meta<typeof NativeSelect> = {
  title: "shadcn/ui/Native Select",
  component: NativeSelect,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof NativeSelect>;

export const Default: Story = {
  render: () => {
    const [model, setModel] = React.useState("flux-pro");
    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Image model</label>
        <NativeSelect
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-56"
        >
          <NativeSelectOption value="gpt-image-1">GPT Image 1</NativeSelectOption>
          <NativeSelectOption value="dalle-3">DALL-E 3</NativeSelectOption>
          <NativeSelectOption value="flux-pro">Flux Pro</NativeSelectOption>
          <NativeSelectOption value="sdxl">Stable Diffusion XL</NativeSelectOption>
          <NativeSelectOption value="recraft-v3">Recraft V3</NativeSelectOption>
        </NativeSelect>
        <p className="text-xs text-muted-foreground">Selected: {model}</p>
      </div>
    );
  },
};

export const Small: Story = {
  render: () => {
    const [ratio, setRatio] = React.useState("16:9");
    return (
      <NativeSelect
        size="sm"
        value={ratio}
        onChange={(e) => setRatio(e.target.value)}
      >
        <NativeSelectOption value="1:1">Square 1:1</NativeSelectOption>
        <NativeSelectOption value="16:9">Wide 16:9</NativeSelectOption>
        <NativeSelectOption value="9:16">Portrait 9:16</NativeSelectOption>
        <NativeSelectOption value="4:3">Classic 4:3</NativeSelectOption>
      </NativeSelect>
    );
  },
};

export const Grouped: Story = {
  render: () => {
    const [model, setModel] = React.useState("kling-1.6");
    return (
      <NativeSelect
        value={model}
        onChange={(e) => setModel(e.target.value)}
        className="w-60"
      >
        <NativeSelectOptGroup label="Image">
          <NativeSelectOption value="flux-pro">Flux Pro</NativeSelectOption>
          <NativeSelectOption value="dalle-3">DALL-E 3</NativeSelectOption>
          <NativeSelectOption value="recraft-v3">Recraft V3</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Video">
          <NativeSelectOption value="sora-turbo">Sora Turbo</NativeSelectOption>
          <NativeSelectOption value="kling-1.6">Kling 1.6</NativeSelectOption>
          <NativeSelectOption value="runway-gen3">Runway Gen-3</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Audio">
          <NativeSelectOption value="suno-v4">Suno v4</NativeSelectOption>
          <NativeSelectOption value="elevenlabs">ElevenLabs TTS</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <NativeSelect disabled defaultValue="flux-pro" className="w-56">
      <NativeSelectOption value="flux-pro">Flux Pro (Pro plan)</NativeSelectOption>
    </NativeSelect>
  ),
};
