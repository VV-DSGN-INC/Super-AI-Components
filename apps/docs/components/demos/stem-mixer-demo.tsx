"use client";

import * as React from "react";

import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";
import { StemMixer, type Stem, type StemSoloMode } from "@/registry/super-ai/stem-mixer";

const INITIAL_STEMS: Stem[] = [
  {
    id: "drums",
    name: "Drums",
    volume: 84,
    pan: 0,
    lineage: { origin: "separated", source: "Midnight Drive (master).wav", detail: "Demucs v4" },
  },
  {
    id: "bass",
    name: "Bass",
    volume: 71,
    pan: -12,
    lineage: { origin: "separated", source: "Midnight Drive (master).wav", detail: "Demucs v4" },
  },
  {
    id: "vocals",
    name: "Vocals",
    volume: 92,
    pan: 0,
    soloed: true,
    lineage: { origin: "separated", source: "Midnight Drive (master).wav", detail: "Demucs v4" },
  },
  {
    id: "pads",
    name: "Pads",
    volume: 58,
    pan: 34,
    lineage: { origin: "generated", source: "warm analogue pad, A minor", detail: "take 3" },
  },
];

export default function StemMixerDemo() {
  const [stems, setStems] = React.useState(INITIAL_STEMS);
  const [soloMode, setSoloMode] = React.useState<StemSoloMode>("exclusive");
  const [levels, setLevels] = React.useState<Record<string, number>>({});

  // The mixer holds no timers and owns no audio — this stands in for whatever
  // is actually playing, sampling a level per stem and handing it back down.
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLevels(
        Object.fromEntries(INITIAL_STEMS.map((stem) => [stem.id, 20 + Math.random() * 70])),
      );
    }, 700);
    return () => clearInterval(interval);
  }, []);

  const patch = (stemId: string, next: Partial<Stem>) =>
    setStems((current) =>
      current.map((stem) => (stem.id === stemId ? { ...stem, ...next } : stem)),
    );

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-foreground text-xs font-medium">Solo behaviour</span>
        <ChoiceChips
          value={soloMode}
          onValueChange={(value) => setSoloMode(value as StemSoloMode)}
          aria-label="Solo behaviour"
        >
          <ChoiceChip value="exclusive">Exclusive</ChoiceChip>
          <ChoiceChip value="additive">Additive</ChoiceChip>
        </ChoiceChips>
      </div>

      <StemMixer
        stems={stems.map((stem) => ({
          ...stem,
          level: Math.round(levels[stem.id] ?? 0),
        }))}
        soloMode={soloMode}
        label="Midnight Drive stems"
        onMuteChange={(stemId, muted) => patch(stemId, { muted })}
        // The whole resulting set arrives already resolved against soloMode —
        // applying it wholesale is the only correct way to consume it.
        onSoloChange={(_stemId, soloedIds) =>
          setStems((current) =>
            current.map((stem) => ({ ...stem, soloed: soloedIds.includes(stem.id) })),
          )
        }
        onVolumeChange={(stemId, volume) => patch(stemId, { volume })}
        onPanChange={(stemId, pan) => patch(stemId, { pan })}
      />
    </div>
  );
}
