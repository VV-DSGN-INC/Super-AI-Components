import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "@/components/ui/checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "shadcn/ui/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  render: () => {
    const [checked, setChecked] = React.useState(true);
    return (
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={checked} onCheckedChange={setChecked} />
        Upscale to 4K automatically
      </label>
    );
  },
};

export const RenderOptions: Story = {
  render: () => {
    const [options, setOptions] = React.useState({
      faceFix: true,
      hiresFix: false,
      seedLock: true,
      nsfwFilter: true,
    });
    const toggle = (key: keyof typeof options) => (value: boolean) =>
      setOptions((prev) => ({ ...prev, [key]: value }));

    return (
      <div className="flex flex-col gap-3 text-sm">
        <label className="flex items-center gap-2">
          <Checkbox checked={options.faceFix} onCheckedChange={toggle("faceFix")} />
          Face restoration
        </label>
        <label className="flex items-center gap-2">
          <Checkbox checked={options.hiresFix} onCheckedChange={toggle("hiresFix")} />
          Hi-res fix
        </label>
        <label className="flex items-center gap-2">
          <Checkbox checked={options.seedLock} onCheckedChange={toggle("seedLock")} />
          Lock seed across variations
        </label>
        <label className="flex items-center gap-2">
          <Checkbox checked={options.nsfwFilter} onCheckedChange={toggle("nsfwFilter")} />
          Safety filter
        </label>
      </div>
    );
  },
};

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-6 text-sm">
      <label className="flex items-center gap-2">
        <Checkbox defaultChecked />
        Checked
      </label>
      <label className="flex items-center gap-2">
        <Checkbox />
        Unchecked
      </label>
      <label className="flex items-center gap-2 opacity-50">
        <Checkbox disabled defaultChecked />
        Disabled
      </label>
    </div>
  ),
};
