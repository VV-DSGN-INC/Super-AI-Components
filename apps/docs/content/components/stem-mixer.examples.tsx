"use client";

import { StemMixer, type Stem } from "@/registry/super-ai/stem-mixer";

/**
 * Live examples for stem-mixer.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence` and so on directly, so stem-mixer.docs.tsx has to stay plain
 * server-evaluable data and cannot carry "use client" itself. Every example
 * lives here and crosses into the docs module as a zero-prop element.
 *
 * The two "Don't" examples are static mockups rather than the real component
 * misused — StemMixer structurally cannot drop a lane's state text or convey
 * silence by dimming alone, so there is no prop combination that demonstrates
 * the anti-pattern. These show what it looks like when a team hand-rolls a
 * mixer instead of composing this one.
 */

const SEPARATED: Stem["lineage"] = {
  origin: "separated",
  source: "Midnight Drive (master).wav",
  detail: "Demucs v4",
};

export function StatedSilence() {
  return (
    <StemMixer
      soloMode="exclusive"
      label="Stems"
      stems={[
        { id: "drums", name: "Drums", volume: 84, pan: 0, soloed: true, level: 68 },
        { id: "bass", name: "Bass", volume: 71, pan: -12, level: 44 },
        { id: "vocals", name: "Vocals", volume: 92, pan: 0, muted: true, level: 0 },
      ]}
    />
  );
}

export function LineageOnEveryLane() {
  return (
    <StemMixer
      label="Stems"
      stems={[
        { id: "drums", name: "Drums", volume: 84, pan: 0, lineage: SEPARATED },
        {
          id: "pads",
          name: "Pads",
          volume: 58,
          pan: 34,
          lineage: { origin: "generated", source: "warm analogue pad, A minor", detail: "take 3" },
        },
      ]}
    />
  );
}

export function DimmingAsTheOnlySignal() {
  return (
    <div className="border-destructive/40 flex w-full max-w-sm flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between rounded-md border p-2 text-sm">
        <span className="text-foreground font-medium">Drums</span>
        <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs">S</span>
      </div>
      {/* Greyed with a surface token rather than `opacity`: an opacity below 1
          on a text row is itself a contrast failure, which would make this
          example fail the gate it is warning about. */}
      <div className="bg-muted flex items-center justify-between rounded-md border p-2 text-sm">
        <span className="text-foreground font-medium">Bass</span>
        <span className="text-foreground rounded border px-1.5 py-0.5 text-xs">S</span>
      </div>
      <p className="text-foreground text-xs">
        Wrong: bass is silent because drums is soloed, but the only clue is that the row went grey
        and its badge lost its fill. Nothing states it, so a screen reader — or anyone reading in
        bright sunlight — is told nothing at all.
      </p>
    </div>
  );
}

export function MeterAsTheOnlySignal() {
  return (
    <div className="border-destructive/40 flex w-full max-w-sm flex-col gap-2 rounded-lg border p-3">
      <div className="flex flex-col gap-1 rounded-md border p-2">
        <span className="text-foreground text-sm font-medium">Vocals</span>
        <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
          <div className="bg-primary h-full w-0" />
        </div>
      </div>
      <p className="text-foreground text-xs">
        Wrong: the lane is muted, and the only evidence is a meter sitting at zero. A quiet passage
        looks exactly the same. Mute is a state, not a measurement — say it.
      </p>
    </div>
  );
}
