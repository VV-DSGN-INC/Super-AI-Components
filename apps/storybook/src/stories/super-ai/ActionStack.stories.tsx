import type { Meta, StoryObj } from "@storybook/react-vite";
import { Maximize2, Mic, Scissors, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ActionStack, type AssetAction } from "@/registry/super-ai/action-stack";
import { ActionStackDocs } from "@/content/components/action-stack.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const VIDEO_ACTIONS: AssetAction[] = [
  {
    id: "extend",
    title: "Extend",
    description: "Add 4 seconds to the end",
    icon: <Scissors aria-hidden className="size-4" />,
    cost: { amount: 55 },
  },
  {
    id: "upscale",
    title: "Upscale",
    description: "To 4K, 24 fps",
    icon: <Maximize2 aria-hidden className="size-4" />,
    cost: { amount: 900, per: "min" },
  },
  {
    id: "restyle",
    title: "Restyle",
    description: "Apply a preset look",
    icon: <Wand2 aria-hidden className="size-4" />,
    cost: { amount: 17 },
  },
];

const IMAGE_ACTIONS: AssetAction[] = [
  { id: "variations", title: "Variations", description: "Four more like this", cost: { amount: 17 } },
  { id: "inpaint", title: "Inpaint", description: "Repaint a region", cost: { amount: 12 } },
];

const meta: Meta<typeof ActionStack> = {
  title: "Super AI/Action Stack",
  component: ActionStack,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ActionStackDocs) } },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
  args: { onAction: () => {} },
};

export default meta;
type Story = StoryObj<typeof ActionStack>;

/** Hanging off a result card, behind the caller's own trigger. */
export const Menu: Story = {
  args: {
    actions: VIDEO_ACTIONS,
    presentation: "menu",
    trigger: <Button variant="outline">Use this result</Button>,
  },
};

/** As a panel in its own right. */
export const Inline: Story = {
  args: {
    actions: VIDEO_ACTIONS,
    presentation: "inline",
    className: "rounded-lg border p-1",
  },
};

/** Every row that bills carries its price — including the rate form. */
export const CostPerAction: Story = {
  args: {
    actions: IMAGE_ACTIONS,
    presentation: "inline",
    className: "rounded-lg border p-1",
  },
};

/** Locked rows stay visible with their cost, but cannot be chosen. */
export const LockedRows: Story = {
  args: {
    presentation: "inline",
    className: "rounded-lg border p-1",
    actions: [
      ...IMAGE_ACTIONS,
      {
        id: "lipsync",
        title: "Use in Lip sync",
        description: "Available on Studio",
        icon: <Mic aria-hidden className="size-4" />,
        cost: { amount: 120 },
        locked: true,
      },
    ],
  },
};
