"use client";

import { Eraser, Image as ImageIcon, Maximize2, RefreshCw, Sparkles, Trash2, Wand2 } from "lucide-react";
import * as React from "react";

import { AiToolsMenu, type AiToolGroup } from "@/registry/super-ai/ai-tools-menu";

/**
 * The row set is derived from the selected object, not hard-coded: an image
 * gets Remove background and Magic expand; a text frame would get a different
 * array from the same component.
 */
const IMAGE_TOOLS: AiToolGroup[] = [
  {
    id: "edit",
    label: "Edit this image",
    actions: [
      {
        id: "remove-bg",
        title: "Remove background",
        description: "Cut the subject out",
        icon: <Eraser aria-hidden className="size-4" />,
      },
      {
        id: "expand",
        title: "Magic expand",
        description: "Paint beyond the frame",
        icon: <Maximize2 aria-hidden className="size-4" />,
        cost: { amount: 17 },
      },
    ],
  },
  {
    id: "generate",
    label: "Generate from it",
    actions: [
      {
        id: "variations",
        title: "Variations",
        description: "Four more like this",
        icon: <Sparkles aria-hidden className="size-4" />,
        cost: { amount: 55 },
      },
      {
        id: "restyle",
        title: "Restyle",
        description: "Apply a preset look",
        icon: <Wand2 aria-hidden className="size-4" />,
        cost: { amount: 120 },
        locked: true,
      },
    ],
  },
  {
    id: "careful",
    label: "Costly or irreversible",
    destructive: true,
    actions: [
      {
        id: "regenerate",
        title: "Regenerate from scratch",
        description: "Discards every edit on this layer",
        icon: <RefreshCw aria-hidden className="size-4" />,
        cost: { amount: 2400 },
      },
      {
        id: "clear",
        title: "Clear the layer",
        description: "Cannot be undone",
        icon: <Trash2 aria-hidden className="size-4" />,
      },
    ],
  },
];

export default function AiToolsMenuDemo() {
  const [chosen, setChosen] = React.useState<string>();

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <AiToolsMenu
        presentation="inline"
        selection={{
          label: "Hero shot, layer 3",
          type: "Image",
          icon: <ImageIcon aria-hidden className="size-4" />,
        }}
        groups={IMAGE_TOOLS}
        onAction={setChosen}
        className="rounded-lg border p-1"
      />
      <p className="text-foreground text-xs">
        {chosen
          ? `Running ${chosen} on the selection.`
          : "Every action here takes the selection as its input."}
      </p>
    </div>
  );
}
