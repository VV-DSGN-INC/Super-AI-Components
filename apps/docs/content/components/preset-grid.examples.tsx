"use client";

import { PresetGrid, type PresetGridItem } from "@/registry/super-ai/preset-grid";

/**
 * Live examples for preset-grid.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.dos`, `docs.donts`,
 * etc. directly, so preset-grid.docs.tsx has to stay plain server-evaluable
 * data — it cannot carry "use client" itself. Every example lives here
 * instead and crosses into the docs module as a zero-prop element (e.g.
 * `<NamedPaletteSwatches />`), so props like `onValueChange` never have to
 * be serialized across the server/client boundary. See
 * workspace-switcher.docs.tsx + workspace-switcher.examples.tsx for the
 * pattern this follows.
 */

// Light/mid-tone on purpose: preset-grid always overlays its label on
// `bg-background/80`, so the blended contrast stays wide regardless of the
// swatch underneath — chosen here so the "do" example reads unambiguously
// well rather than riding the edge of the ratio.
const PALETTE_ITEMS: PresetGridItem[] = [
  { id: "sunset", label: "Sunset orange", color: "#fb923c" },
  { id: "ocean", label: "Ocean blue", color: "#38bdf8" },
  { id: "sage", label: "Sage green", color: "#86efac" },
];

const ENVIRONMENT_ITEMS: PresetGridItem[] = [
  { id: "studio", label: "Studio" },
  { id: "outdoor", label: "Outdoor" },
  { id: "night", label: "Night" },
];

const MANY_STYLE_ITEMS: PresetGridItem[] = [
  { id: "anime", label: "Anime" },
  { id: "photoreal", label: "Photoreal" },
  { id: "sketch", label: "Sketch" },
  { id: "watercolor", label: "Watercolor" },
  { id: "claymation", label: "Claymation" },
  { id: "pixel-art", label: "Pixel art" },
];

export function NamedPaletteSwatches() {
  return (
    <PresetGrid items={PALETTE_ITEMS} content="palette" aria-label="Colour presets" defaultValue="ocean" />
  );
}

export function MultiSelectEnvironments() {
  return (
    <PresetGrid
      items={ENVIRONMENT_ITEMS}
      content="environment"
      aria-label="Environment presets"
      multiple
      defaultValue={["studio"]}
    />
  );
}

export function SeeMoreTileInGrid() {
  return <PresetGrid items={MANY_STYLE_ITEMS} content="style" aria-label="Style presets" visibleCount={3} />;
}

/**
 * Anti-pattern: colour is the only cue — no visible or accessible name says
 * what any of these actually are. Not the real component, on purpose (real
 * `preset-grid` items require a `label`).
 */
export function ColorOnlyPaletteSwatches() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {["#fb923c", "#38bdf8", "#86efac"].map((color) => (
        <div
          key={color}
          aria-hidden
          className="bg-muted aspect-square rounded-lg"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

/**
 * Anti-pattern: a "Show more" link sitting below the grid instead of a tile
 * inside it — a separate element outside the grid's own layout, so
 * expanding it shifts everything below rather than just adding cells.
 */
export function ShowMoreLinkBelowGrid() {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="grid grid-cols-3 gap-3">
        {MANY_STYLE_ITEMS.slice(0, 3).map((item) => (
          <div key={item.id} className="bg-muted relative aspect-square overflow-hidden rounded-lg">
            <span className="bg-background/80 text-foreground absolute inset-x-0 bottom-0 truncate px-2 py-1 text-xs">
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <button type="button" className="text-foreground text-xs underline underline-offset-2">
        Show 3 more
      </button>
    </div>
  );
}
