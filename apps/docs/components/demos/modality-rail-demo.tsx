"use client";

import * as React from "react";
import { Layers, Music, Pencil, Settings, Sparkles, Square, Type, Wand2 } from "lucide-react";

import { ModalityRail } from "@/registry/super-ai/modality-rail";

const TOOLS = [
  { id: "select", label: "Select", icon: <Square /> },
  { id: "draw", label: "Draw", icon: <Pencil /> },
  { id: "text", label: "Text", icon: <Type /> },
  { id: "layers", label: "Layers", icon: <Layers /> },
  { id: "audio", label: "Audio", icon: <Music />, badge: "new" as const },
  { id: "effects", label: "Effects", icon: <Wand2 /> },
  { id: "upscale", label: "Upscale", icon: <Sparkles />, badge: "pro" as const },
];

const PINNED = [
  { id: "plugins", label: "Plugins", icon: <Wand2 /> },
  { id: "settings", label: "Settings", icon: <Settings /> },
];

export default function ModalityRailDemo() {
  const [activeId, setActiveId] = React.useState("draw");

  return (
    <div className="h-96 overflow-hidden rounded-lg border">
      <ModalityRail
        items={TOOLS}
        pinned={PINNED}
        activeId={activeId}
        onSelect={setActiveId}
        maxVisible={5}
        className="h-full border-r-0"
      />
    </div>
  );
}
