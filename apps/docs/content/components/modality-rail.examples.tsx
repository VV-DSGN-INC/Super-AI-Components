"use client";

import { Layers, Music, Pencil, Sparkles, Square, Type, Wand2 } from "lucide-react";

import { ModalityRail } from "@/registry/super-ai/modality-rail";

/**
 * Live examples for modality-rail.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so modality-rail.docs.tsx has to stay
 * plain server-evaluable data — it cannot carry "use client" itself. Every
 * example lives here instead and crosses into the docs module as a
 * zero-prop element (e.g. `<UpsellBadgeOnTheRail />`), so `onSelect` never
 * has to be serialized across the server/client boundary.
 */

const CORE_TOOLS = [
  { id: "select", label: "Select", icon: <Square /> },
  { id: "draw", label: "Draw", icon: <Pencil /> },
  { id: "text", label: "Text", icon: <Type /> },
  { id: "layers", label: "Layers", icon: <Layers /> },
];

const PINNED = [
  { id: "settings", label: "Settings", icon: <Wand2 /> },
  { id: "help", label: "Help", icon: <Sparkles /> },
];

export function UpsellBadgeOnTheRail() {
  return (
    <ModalityRail
      items={[
        ...CORE_TOOLS,
        { id: "audio", label: "Audio", icon: <Music />, badge: "new" },
        { id: "upscale", label: "Upscale", icon: <Sparkles />, badge: "pro" },
      ]}
      activeId="draw"
      onSelect={() => {}}
    />
  );
}

export function PinnedGroupSurvivesScroll() {
  return (
    <ModalityRail items={CORE_TOOLS} pinned={PINNED} activeId="select" onSelect={() => {}} maxVisible={4} />
  );
}

export function ChevronNotScrollbar() {
  return (
    <ModalityRail
      items={[
        ...CORE_TOOLS,
        { id: "shapes", label: "Shapes", icon: <Square /> },
        { id: "audio", label: "Audio", icon: <Music /> },
        { id: "masks", label: "Masks", icon: <Layers /> },
      ]}
      maxVisible={4}
      onSelect={() => {}}
    />
  );
}

export function ScrollingColumnInsteadOfChevron() {
  return (
    <div className="h-40 w-[92px] overflow-y-auto rounded-md border p-1.5">
      <div className="flex flex-col gap-1">
        {CORE_TOOLS.concat(CORE_TOOLS.map((t) => ({ ...t, id: `${t.id}-2` }))).map((tool) => (
          <div
            key={tool.id}
            className="flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-center text-xs"
          >
            <span aria-hidden className="[&_svg]:size-5">
              {tool.icon}
            </span>
            {tool.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BadgeAsColorOnlyDot() {
  return (
    <div className="flex w-[92px] flex-col gap-1 rounded-md border p-1.5">
      <div className="relative flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-center text-xs">
        <span aria-hidden className="relative [&_svg]:size-5">
          <Music />
          <span className="bg-primary absolute -top-0.5 -right-0.5 size-2.5 rounded-full" />
        </span>
        Audio
      </div>
    </div>
  );
}
