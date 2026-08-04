"use client";

import { useState } from "react";

import { PresetGrid, type PresetGridItem } from "@/registry/super-ai/preset-grid";

const STYLE_ITEMS: PresetGridItem[] = [
  { id: "anime", label: "Anime" },
  { id: "photoreal", label: "Photoreal" },
  { id: "sketch", label: "Sketch" },
  { id: "watercolor", label: "Watercolor" },
  { id: "claymation", label: "Claymation" },
  { id: "pixel-art", label: "Pixel art" },
  { id: "vaporwave", label: "Vaporwave" },
  { id: "noir", label: "Noir" },
];

// Light/mid-tone swatches on purpose: the overlay label sits on top of
// `bg-background/80`, so a dark swatch would still stay legible, but a
// lighter one keeps the blended contrast comfortably wide rather than
// riding the edge — see preset-grid.docs.tsx's palette guidance.
const PALETTE_ITEMS: PresetGridItem[] = [
  { id: "sunset", label: "Sunset orange", color: "#fb923c" },
  { id: "ocean", label: "Ocean blue", color: "#38bdf8" },
  { id: "sage", label: "Sage green", color: "#86efac" },
  { id: "blush", label: "Blush pink", color: "#f9a8d4" },
];

const FILTER_ITEMS: PresetGridItem[] = [
  { id: "vivid", label: "Vivid" },
  { id: "mono", label: "Mono" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
  { id: "faded", label: "Faded" },
];

const ENVIRONMENT_ITEMS: PresetGridItem[] = [
  { id: "studio", label: "Studio" },
  { id: "outdoor", label: "Outdoor" },
  { id: "night", label: "Night" },
  { id: "golden-hour", label: "Golden hour" },
];

export default function PresetGridDemo() {
  const [style, setStyle] = useState<string | string[] | undefined>("photoreal");
  const [palette, setPalette] = useState<string | string[] | undefined>();
  const [filter, setFilter] = useState<string | string[] | undefined>();
  const [environments, setEnvironments] = useState<string | string[] | undefined>(["studio"]);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Style</p>
        <PresetGrid
          items={STYLE_ITEMS}
          content="style"
          aria-label="Style presets"
          value={style}
          onValueChange={setStyle}
          visibleCount={4}
        />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Palette</p>
        <PresetGrid
          items={PALETTE_ITEMS}
          content="palette"
          aria-label="Colour presets"
          value={palette}
          onValueChange={setPalette}
        />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Filter</p>
        <PresetGrid
          items={FILTER_ITEMS}
          content="filter"
          aria-label="Filter presets"
          value={filter}
          onValueChange={setFilter}
        />
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">Environment (multi-select)</p>
        <PresetGrid
          items={ENVIRONMENT_ITEMS}
          content="environment"
          aria-label="Environment presets"
          multiple
          value={environments}
          onValueChange={setEnvironments}
        />
      </div>
    </div>
  );
}
