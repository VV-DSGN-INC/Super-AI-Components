import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";

const meta: Meta<typeof Label> = {
  title: "shadcn/ui/Label",
  component: Label,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => <Label htmlFor="prompt">Prompt</Label>,
};

export const WithInput: Story = {
  render: () => (
    <div className="flex w-[320px] flex-col gap-2">
      <Label htmlFor="prompt-field">Image prompt</Label>
      <Input
        id="prompt-field"
        placeholder="A neon koi swimming through a midnight city…"
        defaultValue="Cinematic portrait, golden hour, 85mm"
      />
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex w-[320px] flex-col gap-2">
      <Label htmlFor="negative-prompt">
        <Sparkles />
        Negative prompt
      </Label>
      <Input id="negative-prompt" placeholder="blurry, lowres, watermark" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="group flex w-[320px] flex-col gap-2" data-disabled="true">
      <Label htmlFor="seed-field">Seed (locked)</Label>
      <Input id="seed-field" defaultValue="84213" disabled />
    </div>
  ),
};
