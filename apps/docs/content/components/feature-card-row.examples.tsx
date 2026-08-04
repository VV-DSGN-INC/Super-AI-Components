"use client";

import { Mic, Wand2 } from "lucide-react";

import { FeatureCardRow, type FeatureCardRowItem } from "@/registry/super-ai/feature-card-row";

/**
 * Live examples for feature-card-row.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.dos`, `docs.donts`,
 * etc. directly, so feature-card-row.docs.tsx has to stay plain
 * server-evaluable data — it cannot carry "use client" itself. Every example
 * lives here instead and crosses into the docs module as a zero-prop
 * element (e.g. `<ClickableCards />`), so a prop like `onSelect` never has
 * to be serialized across the server/client boundary — it's created and
 * consumed entirely inside this client module. See workspace-switcher.docs.tsx
 * + workspace-switcher.examples.tsx for the pattern this follows.
 */

const ICON_ITEMS: FeatureCardRowItem[] = [
  {
    id: "script-to-video",
    icon: <Wand2 className="size-4" aria-hidden />,
    title: "Script to video",
    description: "Turn a written script into a rough cut.",
    onSelect: () => {},
  },
  {
    id: "voice-clone",
    icon: <Mic className="size-4" aria-hidden />,
    title: "Clone a voice",
    description: "Generate narration from a short sample.",
    onSelect: () => {},
  },
];

const MIXED_SHAPE_ITEMS: FeatureCardRowItem[] = [
  {
    id: "script-to-video",
    icon: <Wand2 className="size-4" aria-hidden />,
    title: "Script to video",
    description: "Turn a written script into a rough cut.",
  },
  {
    id: "templates",
    thumbnail: { src: "https://placehold.co/320x180?text=Templates", alt: "Grid of starter templates" },
    title: "Browse templates",
    description: "Start from a layout other teams already ship with.",
  },
];

export function ClickableCards() {
  return <FeatureCardRow items={ICON_ITEMS} />;
}

export function ConsistentIconShape() {
  return <FeatureCardRow items={ICON_ITEMS} />;
}

export function MixedIconAndThumbnailShape() {
  return <FeatureCardRow items={MIXED_SHAPE_ITEMS} />;
}

/** Anti-pattern: a hand-rolled scrolling row with no prev/next affordance and
    no keyboard-reachable region — exactly what `FeatureCardRow`'s Carousel
    base exists to avoid. Not the real component, on purpose. */
export function ScrollWithNoAffordance() {
  return (
    <div className="flex w-80 gap-3 overflow-x-auto">
      {ICON_ITEMS.map((item) => (
        <div key={item.id} className="bg-card w-48 shrink-0 rounded-xl p-4 text-sm ring-1 ring-foreground/10">
          <p className="font-medium">{item.title}</p>
          <p className="text-muted-foreground text-xs">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
