"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CostChip } from "@/registry/super-ai/cost-chip";
import { TtsComposer, type TtsComposerSegment } from "@/registry/super-ai/tts-composer";

/**
 * Live examples for tts-composer.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so tts-composer.docs.tsx has to stay
 * plain server-evaluable data — it cannot carry "use client" itself. Every
 * example lives here instead and crosses into the docs module as a
 * zero-prop element (e.g. `<PerSegmentRegenerateCost />`), so a prop like
 * `onRegenerateSegment` never has to be serialized across the
 * server/client boundary — it's created and consumed entirely inside this
 * client module.
 */

const TWO_SEGMENTS: TtsComposerSegment[] = [
  {
    id: "a",
    text: "Welcome back to the show.",
    voice: "Bella",
    status: "ready",
    durationLabel: "0:03",
    regenerateCost: 2,
  },
  {
    id: "b",
    text: "Today's guest wrote the book on this.",
    voice: "Bella",
    status: "ready",
    regenerateCost: 2,
  },
];

export function PerSegmentRegenerateCost() {
  return <TtsComposer segments={TWO_SEGMENTS} onRegenerateSegment={() => {}} onSelectSegment={() => {}} />;
}

export function PlayAndRegenerateAreSeparate() {
  const segments: TtsComposerSegment[] = [
    {
      id: "a",
      text: "First take, kept.",
      voice: "Bella",
      status: "ready",
      durationLabel: "0:02",
      regenerateCost: 2,
    },
  ];
  return (
    <TtsComposer
      segments={segments}
      playingSegmentId="a"
      onPlaySegment={() => {}}
      onPauseSegment={() => {}}
      onRegenerateSegment={() => {}}
      onSelectSegment={() => {}}
    />
  );
}

export function RegenerateAllButtonBoltedOn() {
  return (
    <div className="flex w-full max-w-md items-center justify-between rounded-lg border p-3">
      <span className="text-sm font-medium">Script (3 segments)</span>
      <Button type="button" variant="outline" size="sm">
        <RefreshCw aria-hidden />
        Regenerate all
        <CostChip amount={9} />
      </Button>
    </div>
  );
}

export function SelectionByColorOnly() {
  return (
    <div className="flex w-full max-w-md flex-col gap-1.5 text-sm">
      <div className="bg-accent/40 rounded-lg border px-3 py-2">Segment 1 — Welcome back to the show.</div>
      <div className="rounded-lg border px-3 py-2">
        Segment 2 — Today&apos;s guest wrote the book on this.
      </div>
    </div>
  );
}
