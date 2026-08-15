"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";

/**
 * Live examples for choice-chips.docs.tsx.
 *
 * Client sidecar, kept separate on purpose: component-docs.tsx is a Server
 * Component that reads `docs.whatItIs`, `docs.dos` and so on directly, so
 * choice-chips.docs.tsx has to stay plain server-evaluable data and cannot
 * carry "use client" itself. Every example that owns state or an
 * `onValueChange` handler lives here and crosses into the docs module as a
 * zero-prop element, so no function is ever serialised across the boundary.
 */

const RATIOS = ["1:1", "4:5", "16:9"] as const;

export function NamedGroup() {
  // The group's name is a real visible label, wired with aria-labelledby —
  // the same shape J2 filter-panel uses for each of its facet groups.
  const labelId = useId();
  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-foreground text-xs font-medium">
        Aspect ratio
      </span>
      <ChoiceChips aria-labelledby={labelId} defaultValue="16:9">
        {RATIOS.map((ratio) => (
          <ChoiceChip key={ratio} value={ratio}>
            {ratio}
          </ChoiceChip>
        ))}
      </ChoiceChips>
    </div>
  );
}

export function SetsTheNextRun() {
  const [ratio, setRatio] = useState("16:9");
  const [lastRun, setLastRun] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <ChoiceChips aria-label="Aspect ratio" value={ratio} onValueChange={setRatio}>
        {RATIOS.map((r) => (
          <ChoiceChip key={r} value={r}>
            {r}
          </ChoiceChip>
        ))}
      </ChoiceChips>
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={() => setLastRun(ratio)}>
          Generate
        </Button>
        <span className="text-muted-foreground text-xs">
          {lastRun ? `Last run: 1 image at ${lastRun}` : "Nothing generated yet"}
        </span>
      </div>
    </div>
  );
}

export function SentinelAllChip() {
  // "Nothing selected" is a chip, not `value={undefined}`. J4 artifact-grid
  // ships exactly this: `value={activeType ?? ALL}`.
  const ALL = "__all__";
  const [type, setType] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <ChoiceChips
        aria-label="Artifact type"
        value={type ?? ALL}
        onValueChange={(next) => setType(next === ALL ? null : next)}
      >
        <ChoiceChip value={ALL}>All</ChoiceChip>
        <ChoiceChip value="document">Documents</ChoiceChip>
        <ChoiceChip value="image">Images</ChoiceChip>
        <ChoiceChip value="code">Code</ChoiceChip>
      </ChoiceChips>
      <span className="text-muted-foreground text-xs">
        Filter: {type ?? "none — showing everything"}
      </span>
    </div>
  );
}

export function SelectionRunsImmediately() {
  // The wrong way: onValueChange kicks off the work. Picking a parameter and
  // committing to it become the same gesture, so there is no way to set two
  // parameters before spending anything, and no way to change your mind.
  const [status, setStatus] = useState("Idle");
  return (
    <div className="flex flex-col gap-3">
      <ChoiceChips
        aria-label="Aspect ratio"
        defaultValue="16:9"
        onValueChange={(next) => setStatus(`Generating at ${next}…`)}
      >
        {RATIOS.map((r) => (
          <ChoiceChip key={r} value={r}>
            {r}
          </ChoiceChip>
        ))}
      </ChoiceChips>
      <span className="text-muted-foreground text-xs">{status}</span>
    </div>
  );
}

export function UnnamedNumericGroup() {
  // The wrong way: no group name and nothing but digits on the chips. A
  // screen reader announces "4, radio button, selected" — four of what is
  // nowhere in the accessibility tree, because the surrounding paragraph is
  // not associated with the group.
  return (
    <div className="flex flex-col gap-2">
      <span className="text-muted-foreground text-xs">How many images should I make?</span>
      <ChoiceChips defaultValue="4">
        {["1", "2", "3", "4"].map((n) => (
          <ChoiceChip key={n} value={n}>
            {n}
          </ChoiceChip>
        ))}
      </ChoiceChips>
    </div>
  );
}
