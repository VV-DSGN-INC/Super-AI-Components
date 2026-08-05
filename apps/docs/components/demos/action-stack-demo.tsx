"use client";

import { Maximize2, Mic, Scissors, Wand2 } from "lucide-react";
import * as React from "react";

import { ActionStack, type AssetAction } from "@/registry/super-ai/action-stack";

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
    id: "lipsync",
    title: "Use in Lip sync",
    description: "Available on Studio",
    icon: <Mic aria-hidden className="size-4" />,
    cost: { amount: 120 },
    locked: true,
  },
  {
    id: "restyle",
    title: "Restyle",
    description: "Apply a preset look",
    icon: <Wand2 aria-hidden className="size-4" />,
    cost: { amount: 17 },
  },
];

export default function ActionStackDemo() {
  const [chosen, setChosen] = React.useState<string>();

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ActionStack
        presentation="inline"
        actions={VIDEO_ACTIONS}
        onAction={setChosen}
        className="rounded-lg border p-1"
      />
      <p className="text-foreground text-xs">
        {chosen ? `Handing off to: ${chosen}` : "Pick where this result goes next."}
      </p>
    </div>
  );
}
