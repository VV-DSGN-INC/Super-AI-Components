"use client";

import { CheckCircle2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GenerationQueue, type GenerationQueueItem } from "@/registry/super-ai/generation-queue";

/**
 * Live examples for generation-queue.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so generation-queue.docs.tsx has to stay
 * plain server-evaluable data — it cannot carry "use client" itself. Every
 * example lives here instead and crosses into the docs module as a
 * zero-prop element (e.g. `<ReservedRowThroughItsLifecycle />`), so a prop
 * like `onCancelItem` never has to be serialized across the server/client
 * boundary — it's created and consumed entirely inside this client module.
 */

const LIFECYCLE_ITEMS: GenerationQueueItem[] = [
  { id: "a", title: "Portrait, soft studio light", state: "done" },
  { id: "b", title: "Neon alley, rain reflections", state: "running", progress: 68 },
  { id: "c", title: "Rooftop garden, golden hour", state: "queued" },
];

export function ReservedRowThroughItsLifecycle() {
  return <GenerationQueue items={LIFECYCLE_ITEMS} onCancelItem={() => {}} />;
}

const BATCH_AND_SLOT_ITEMS: GenerationQueueItem[] = [
  { id: "a", title: "Take one", state: "done" },
  { id: "b", title: "Take two", state: "running", progress: 85 },
  { id: "c", title: "Take three", state: "queued" },
  { id: "d", title: "Take four", state: "queued" },
];

export function BatchAndPerSlotProgress() {
  return (
    <GenerationQueue
      items={BATCH_AND_SLOT_ITEMS}
      heading="Generating 4 variations"
      batchProgress={35}
      onCancelItem={() => {}}
    />
  );
}

export function ColorOnlyDoneFailed() {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="flex items-center gap-2">
        <span aria-hidden className="bg-primary size-2.5 rounded-full" />
        Take one
      </span>
      <span className="flex items-center gap-2">
        <span aria-hidden className="bg-destructive size-2.5 rounded-full" />
        Take two
      </span>
    </div>
  );
}

export function CancelReachesFinishedSlot() {
  return (
    <div className="flex w-full max-w-sm items-center justify-between gap-3 rounded-lg border px-3 py-2 opacity-80">
      <span className="flex items-center gap-3 text-sm">
        <CheckCircle2 aria-hidden className="size-4" />
        Finished portrait
      </span>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Cancel Finished portrait" disabled>
        <X aria-hidden />
      </Button>
    </div>
  );
}
