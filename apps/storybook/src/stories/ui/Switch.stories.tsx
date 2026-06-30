import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof Switch> = {
  title: "shadcn/ui/Switch",
  component: Switch,
  parameters: { layout: "centered" },
};

export default meta;

type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  render: () => {
    const [checked, setChecked] = React.useState(true);

    return (
      <div className="flex items-center gap-3">
        <Switch
          id="enhance-prompt"
          checked={checked}
          onCheckedChange={setChecked}
        />
        <Label htmlFor="enhance-prompt">Enhance prompt</Label>
      </div>
    );
  },
};

export const SettingsPanel: Story = {
  render: () => {
    const [settings, setSettings] = React.useState({
      enhance: true,
      nsfw: true,
      upscale: false,
    });

    const toggle = (key: keyof typeof settings) => (value: boolean) =>
      setSettings((prev) => ({ ...prev, [key]: value }));

    return (
      <div className="w-80 space-y-5 rounded-lg border p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="enhance">Enhance prompt</Label>
            <p className="text-xs text-muted-foreground">
              Auto-expand short prompts with descriptive detail.
            </p>
          </div>
          <Switch
            id="enhance"
            checked={settings.enhance}
            onCheckedChange={toggle("enhance")}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="nsfw">NSFW filter</Label>
            <p className="text-xs text-muted-foreground">
              Block unsafe outputs before they are shown.
            </p>
          </div>
          <Switch
            id="nsfw"
            checked={settings.nsfw}
            onCheckedChange={toggle("nsfw")}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="upscale">Auto-upscale</Label>
            <p className="text-xs text-muted-foreground">
              Render every result at 4K (uses more credits).
            </p>
          </div>
          <Switch
            id="upscale"
            checked={settings.upscale}
            onCheckedChange={toggle("upscale")}
          />
        </div>
      </div>
    );
  },
};

export const Sizes: Story = {
  render: () => {
    const [sm, setSm] = React.useState(true);
    const [def, setDef] = React.useState(true);

    return (
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch size="sm" checked={sm} onCheckedChange={setSm} />
          <span className="text-sm text-muted-foreground">sm</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch size="default" checked={def} onCheckedChange={setDef} />
          <span className="text-sm text-muted-foreground">default</span>
        </div>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="beta" disabled />
      <Label htmlFor="beta" className="opacity-50">
        Video diffusion (coming soon)
      </Label>
    </div>
  ),
};
