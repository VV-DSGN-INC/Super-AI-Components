"use client";

import { ModelPicker } from "@/registry/super-ai/model-picker";

/**
 * Live examples for model-picker.docs.tsx.
 *
 * Kept separate from the docs module on purpose: component-docs.tsx (a Server
 * Component) reads `docs.dos`, `docs.donts`, etc. directly, so
 * model-picker.docs.tsx has to stay plain server-evaluable data — it cannot
 * carry "use client" itself. Every example lives here instead and crosses
 * into the docs module as a zero-prop element (e.g. `<GroupedByTaskSignature
 * />`), so an inline handler like `onSelect={() => {}}` never has to be
 * serialized across the server/client boundary.
 */

export function GroupedByTaskSignature() {
  return (
    <ModelPicker
      presentation="expanded-cards"
      selectedId="veo-3-1"
      onSelect={() => {}}
      models={[
        {
          id: "veo-3-1",
          name: "Veo 3.1",
          group: "Text → video",
          runtime: "cloud",
          price: 20,
          capabilities: ["1080p"],
        },
        {
          id: "kling-2-5",
          name: "Kling 2.5",
          group: "Image → video",
          runtime: "cloud",
          price: 15,
          capabilities: ["4K"],
        },
      ]}
    />
  );
}

export function HardwareOnTheRuntimeBadge() {
  return (
    <ModelPicker
      presentation="expanded-cards"
      selectedId="svd-local"
      onSelect={() => {}}
      models={[
        {
          id: "svd-local",
          name: "Stable Video Diffusion",
          description: "Runs entirely on your machine",
          group: "Image → video",
          runtime: "local",
          hardware: "12GB VRAM",
          price: 0,
        },
      ]}
    />
  );
}

export function ColorOnlyRuntimeDot() {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-2 text-sm">
      {/* No text, no shape difference — a colourblind or screen-reader user
          gets nothing here. This is the exact color-contrast/color-alone trap
          model-picker's runtime badge exists to avoid. */}
      <span className="bg-primary size-2 rounded-full" aria-hidden />
      Stable Video Diffusion
    </div>
  );
}

export function PriceAsDisconnectedFootnote() {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-2 text-sm">
      <div className="flex items-center justify-between">
        <span>Veo 3.1</span>
        <span className="text-muted-foreground text-xs">See pricing table below</span>
      </div>
      <p className="text-muted-foreground text-xs">* Pricing varies — see footnote 3</p>
    </div>
  );
}
