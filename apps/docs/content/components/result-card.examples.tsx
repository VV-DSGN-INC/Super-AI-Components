"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ResultCard } from "@/registry/super-ai/result-card";

/**
 * Live examples for result-card.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component that reads `docs.whatItIs`,
 * `docs.evidence` and so on directly, so result-card.docs.tsx has to stay
 * plain server-evaluable data and cannot carry "use client" itself. Every
 * example lives here and crosses into the docs module as a zero-prop element,
 * so a handler like `onRetry` is never serialized across the boundary.
 */

function Media({ label }: { label: string }) {
  return (
    <div className="bg-foreground/10 flex h-full w-full items-center justify-center">
      <Sparkles aria-hidden className="text-foreground/40 size-6" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** DO — one card, one box, whatever the state. */
export function SameBoxEveryState() {
  return (
    <div className="grid w-full grid-cols-3 gap-3">
      <ResultCard state="streaming" progress={48} aspect="square" label="Rooftop garden">
        <Media label="Generating" />
      </ResultCard>
      <ResultCard state="done" aspect="square" label="Neon alley" footer={<span>17 credits</span>}>
        <Media label="Finished result" />
      </ResultCard>
      <ResultCard state="failed" aspect="square" label="Glass sculpture" onRetry={() => {}}>
        <Media label="Failed" />
      </ResultCard>
    </div>
  );
}

/** DO — locked keeps the shape of what would have been made. */
export function LockedKeepsTheShape() {
  return (
    <div className="w-40">
      <ResultCard
        state="locked"
        aspect="square"
        label="Upscaled 4K render"
        lockedAction={<Button size="sm">Upgrade to unlock</Button>}
      >
        <Media label="A blurred preview of the locked result" />
      </ResultCard>
    </div>
  );
}

/**
 * DON'T — a footer that only exists once the result resolves. Both cards are
 * `done`, but only one reserved its footer, and in a grid that difference is
 * the row below jumping as each result lands.
 */
export function FooterThatAppearsLate() {
  return (
    <div className="grid w-full grid-cols-2 gap-3">
      <ResultCard state="done" aspect="square" footer={<span>17 credits</span>}>
        <Media label="With a footer" />
      </ResultCard>
      <ResultCard
        state="done"
        aspect="square"
        // The height is still reserved by the component — this is what you
        // would be giving up by rendering your own footer conditionally
        // outside the card instead of passing it in.
        footer={null}
      >
        <Media label="Without a footer" />
      </ResultCard>
    </div>
  );
}

/**
 * DON'T — select mode with hover actions still live. Two competing
 * affordances on one tile: the checkbox says "pick me", the action button says
 * "act on me now".
 */
export function SelectModeWithHoverActions() {
  return (
    <div className="w-40">
      <ResultCard
        state="done"
        aspect="square"
        selectable
        selected
        onSelect={() => {}}
        actions={<Button size="sm">Download</Button>}
      >
        <Media label="Selected result" />
      </ResultCard>
    </div>
  );
}
