import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Sparkles } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";

const meta: Meta<typeof Textarea> = {
  title: "shadcn/ui/Textarea",
  component: Textarea,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Textarea>;

const MAX = 1000;

export const Default: Story = {
  render: () => {
    function PromptInput() {
      const [prompt, setPrompt] = React.useState(
        "A serene Japanese garden in early autumn, koi pond reflecting maple leaves, soft morning fog, shot on 50mm, shallow depth of field, photorealistic"
      );

      return (
        <div className="w-[440px] space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="size-4 text-muted-foreground" />
            Image prompt
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, MAX))}
            placeholder="Describe the image you want to generate…"
            className="min-h-32"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Be specific about subject, lighting, and lens.</span>
            <span className="tabular-nums">
              {prompt.length} / {MAX}
            </span>
          </div>
        </div>
      );
    }
    return <PromptInput />;
  },
};

export const NegativePrompt: Story = {
  render: () => {
    function NegativeInput() {
      const [neg, setNeg] = React.useState(
        "blurry, low resolution, extra fingers, watermark, text, oversaturated"
      );
      return (
        <div className="w-[440px] space-y-2">
          <label className="text-sm font-medium">Negative prompt</label>
          <Textarea
            value={neg}
            onChange={(e) => setNeg(e.target.value)}
            className="min-h-20"
          />
          <p className="text-xs text-muted-foreground">
            Tokens the model should actively avoid.
          </p>
        </div>
      );
    }
    return <NegativeInput />;
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[440px] space-y-2">
      <label className="text-sm font-medium">Prompt (locked while rendering)</label>
      <Textarea
        disabled
        defaultValue="A cyberpunk alleyway drenched in neon reflections after rain…"
        className="min-h-24"
      />
      <p className="text-xs text-muted-foreground">Rendering 3 of 4 variations…</p>
    </div>
  ),
};
