import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "@/components/ui/input";

const meta: Meta<typeof Input> = {
  title: "shadcn/ui/Input",
  component: Input,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState("cyberpunk alley at night");
    return (
      <Input
        className="w-80"
        placeholder="Describe your image..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  },
};

export const Types: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <Input placeholder="Thread name" />
      <Input type="email" placeholder="you@studio.com" />
      <Input type="password" placeholder="API key" defaultValue="sk-aurora-••••" />
      <Input type="number" placeholder="Seed" defaultValue={48213} />
      <Input type="file" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <Input placeholder="Default" />
      <Input placeholder="Disabled" disabled />
      <Input placeholder="Invalid seed" aria-invalid defaultValue="not-a-number" />
      <Input readOnly value="https://aurora.studio/r/48213" />
    </div>
  ),
};
