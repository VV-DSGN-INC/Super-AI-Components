"use client";

import { useState } from "react";

import { PreviewTile } from "@/registry/super-ai/preview-tile";

/**
 * Live examples for preview-tile.docs.tsx.
 *
 * Client sidecar, kept separate on purpose: component-docs.tsx is a Server
 * Component that reads `docs.whatItIs`, `docs.anatomy` and so on directly, so
 * the docs module has to stay plain server-evaluable data and cannot carry
 * "use client" itself. Both examples below hang on `onSelect`, which is the
 * one prop that decides whether a tile is a control at all — so they have to
 * live here and cross into the docs module as zero-prop elements.
 */

const PRESETS = [
  { id: "neon-noir", label: "Neon noir", fill: "bg-primary" },
  { id: "pastel", label: "Pastel", fill: "bg-secondary" },
  { id: "mono", label: "Mono", fill: "bg-accent" },
];

/**
 * The right way: `onSelect` only on the tiles that are actually the control.
 * The first two are pickable, so they render as buttons and take focus; the
 * third is a reference thumbnail beside them and stays an inert div, out of
 * the tab order entirely.
 */
export function PickableAndInertTiles() {
  const [selected, setSelected] = useState("neon-noir");

  return (
    <div className="grid w-full max-w-sm grid-cols-3 gap-3">
      {PRESETS.slice(0, 2).map((preset) => (
        <PreviewTile
          key={preset.id}
          label={preset.label}
          selected={selected === preset.id}
          onSelect={() => setSelected(preset.id)}
        >
          <div className={`h-full w-full ${preset.fill}`} />
        </PreviewTile>
      ))}
      <PreviewTile label="Reference">
        <div className="bg-muted-foreground/20 h-full w-full" />
      </PreviewTile>
    </div>
  );
}

/**
 * The right way to move a label: change `labelPlacement`, don't render your
 * own text under the tile. Both cells here hold the same 80-character prompt
 * excerpt — overlaid on the left, below on the right — and the tile truncates
 * it in both places, so neither cell can grow taller than its neighbour.
 */
export function LabelPlacementOverlayAndBelow() {
  const prompt = "Overhead drone shot of a harbour at dawn, long exposure, fog over the breakwater";

  return (
    <div className="grid w-full max-w-sm grid-cols-2 gap-3">
      <PreviewTile aspect="video" label={prompt} labelPlacement="overlay" onSelect={() => {}}>
        <div className="bg-primary h-full w-full" />
      </PreviewTile>
      <PreviewTile aspect="video" label={prompt} labelPlacement="below" onSelect={() => {}}>
        <div className="bg-primary h-full w-full" />
      </PreviewTile>
    </div>
  );
}
