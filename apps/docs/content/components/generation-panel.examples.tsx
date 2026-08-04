"use client";

import { Button } from "@/components/ui/button";
import { GenSettingsBar, GenSettingsItem } from "@/registry/super-ai/gen-settings-bar";
import { GenerationPanel } from "@/registry/super-ai/generation-panel";
import { CostChip } from "@/registry/super-ai/cost-chip";

/**
 * Live examples for generation-panel.docs.tsx — see that file for why this
 * has to be a separate "use client" sidecar rather than inline JSX in the
 * docs module itself.
 */

export function CostAndGenerateTogether() {
  return (
    <GenerationPanel
      className="max-w-xs"
      directions="A neon-lit alley at night, cinematic"
      cost={8}
      generate={<Button type="button">Generate</Button>}
    />
  );
}

export function ComposedFromShippedSlots() {
  return (
    <GenerationPanel
      className="max-w-xs"
      directions="A neon-lit alley at night, cinematic"
      settings={
        <GenSettingsBar>
          <GenSettingsItem aria-pressed>16:9</GenSettingsItem>
          <GenSettingsItem>9:16</GenSettingsItem>
        </GenSettingsBar>
      }
      cost={8}
      generate={<Button type="button">Generate</Button>}
    />
  );
}

export function CostSeparatedFromGenerate() {
  // Hand-built anti-pattern — GenerationPanel's own API has no combination
  // that produces this: `cost` and `generate` always render in the same
  // footer row, together.
  return (
    <div className="flex max-w-xs flex-col gap-2 rounded-xl border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Settings</span>
        <CostChip amount={8} className="text-foreground" />
      </div>
      <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">
        Directions, presets, settings…
      </div>
      <Button type="button" className="self-end">
        Generate
      </Button>
    </div>
  );
}

export function StagesReordered() {
  // Hand-built anti-pattern — GenerationPanel always renders dropzone,
  // directions, presets, settings, then cost + Generate in that order.
  return (
    <div className="flex max-w-xs flex-col gap-2 rounded-xl border p-3 text-sm">
      <p className="font-semibold">Settings</p>
      <p className="text-muted-foreground text-xs">
        Shown first — the spec&apos;s fixed order is reversed here.
      </p>
      <p className="font-semibold">Presets</p>
      <p className="font-semibold">Directions</p>
    </div>
  );
}
