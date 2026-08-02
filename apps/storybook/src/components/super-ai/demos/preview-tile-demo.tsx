"use client";
import { useState } from "react";

import { PreviewTile } from "@/components/super-ai/preview-tile";

const PRESETS = [
  { id: "noir", label: "Neon noir", fill: "bg-primary" },
  { id: "pastel", label: "Pastel", fill: "bg-secondary" },
  { id: "mono", label: "Mono", fill: "bg-muted-foreground" },
];

export default function PreviewTileDemo() {
  const [selected, setSelected] = useState("noir");
  return (
    <div className="grid w-full max-w-md grid-cols-3 gap-3">
      {PRESETS.map((preset) => (
        <PreviewTile
          key={preset.id}
          label={preset.label}
          selected={selected === preset.id}
          onSelect={() => setSelected(preset.id)}
        >
          <div className={`h-full w-full ${preset.fill}`} />
        </PreviewTile>
      ))}
      <PreviewTile label="Loading" state="loading" />
      <PreviewTile label="Locked" state="locked" action={<span>Upgrade</span>}>
        <div className="bg-primary h-full w-full" />
      </PreviewTile>
      <PreviewTile label="Failed" state="failed" action={<span>Retry</span>} />
    </div>
  );
}
