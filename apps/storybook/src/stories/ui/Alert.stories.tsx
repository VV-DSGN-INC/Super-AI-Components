import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SparklesIcon, TriangleAlertIcon, ZapIcon } from "lucide-react";

const meta: Meta<typeof Alert> = {
  title: "shadcn/ui/Alert",
  component: Alert,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: () => (
    <Alert className="w-96">
      <SparklesIcon />
      <AlertTitle>Aurora-XL 2.0 is live</AlertTitle>
      <AlertDescription>
        The new checkpoint produces sharper hands and better text rendering.
        Select it from the model picker to try it on your next prompt.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive" className="w-96">
      <TriangleAlertIcon />
      <AlertTitle>Generation failed</AlertTitle>
      <AlertDescription>
        Your prompt was flagged by the safety filter and no credits were
        charged. Edit the prompt and try again, or <a href="#">contact support</a>.
      </AlertDescription>
    </Alert>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Alert className="w-96">
      <ZapIcon />
      <AlertTitle>You&apos;re low on credits</AlertTitle>
      <AlertDescription>
        Only 120 credits left this month. Top up to keep rendering without
        interruptions.
      </AlertDescription>
      <AlertAction>
        <Button size="sm">Top up</Button>
      </AlertAction>
    </Alert>
  ),
};
