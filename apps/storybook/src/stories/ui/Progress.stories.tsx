import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";

const meta: Meta<typeof Progress> = {
  title: "shadcn/ui/Progress",
  component: Progress,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Progress value={66}>
        <ProgressLabel>Rendering frame 22 / 32</ProgressLabel>
        <ProgressValue />
      </Progress>
    </div>
  ),
};

export const Dashboard: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <Progress value={30}>
        <ProgressLabel>Monthly credits used</ProgressLabel>
        <ProgressValue />
      </Progress>

      <Progress value={66}>
        <ProgressLabel>Diffusion render</ProgressLabel>
        <ProgressValue />
      </Progress>

      <Progress value={100}>
        <ProgressLabel>Dataset upload</ProgressLabel>
        <ProgressValue />
      </Progress>

      <Progress value={null}>
        <ProgressLabel>Queuing on GPU cluster…</ProgressLabel>
      </Progress>
    </div>
  ),
};

export const Animated: Story = {
  render: () => {
    function AnimatedProgress() {
      const [value, setValue] = React.useState(8);
      React.useEffect(() => {
        const id = setInterval(() => {
          setValue((v) => (v >= 100 ? 8 : v + 6));
        }, 500);
        return () => clearInterval(id);
      }, []);
      return (
        <div className="w-80">
          <Progress value={value}>
            <ProgressLabel>Generating &ldquo;neon koi pond&rdquo;</ProgressLabel>
            <ProgressValue />
          </Progress>
        </div>
      );
    }
    return <AnimatedProgress />;
  },
};
