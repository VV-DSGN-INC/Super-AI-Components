"use client";

import { Wand2 } from "lucide-react";

import { CostChip } from "@/registry/super-ai/cost-chip";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { RunButton } from "@/registry/super-ai/run-button";

/**
 * Live examples for generation-shell.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs`,
 * `docs.evidence` and the rest straight off the exported object, so the docs
 * module has to stay plain server-evaluable data. Every example here is a
 * zero-prop component, so a handler like `onRun` never has to cross the
 * server/client boundary.
 *
 * These are fragments of the shell rather than four more whole shells — the
 * live preview at the top of the page already shows the assembled thing.
 */

function PanelFrame({ children }: { children: React.ReactNode }) {
  return <div className="flex h-64 w-72 flex-col overflow-hidden rounded-xl border">{children}</div>;
}

function ConfigStack() {
  return (
    <>
      <p className="text-sm font-semibold">Directions</p>
      <div className="h-16 rounded-md border border-dashed" />
      <p className="text-sm font-semibold">Presets</p>
      <div className="grid grid-cols-3 gap-2">
        <div className="aspect-square rounded-md border" />
        <div className="aspect-square rounded-md border" />
        <div className="aspect-square rounded-md border" />
      </div>
      <p className="text-sm font-semibold">Settings</p>
      <div className="h-9 rounded-md border" />
      <div className="h-9 rounded-md border" />
      <div className="h-9 rounded-md border" />
    </>
  );
}

/** Do — the price and the button that spends it are one row, pinned below the scroll. */
export function CostAndGenerateAreOneRow() {
  return (
    <PanelFrame>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
        <ConfigStack />
      </div>
      <div className="bg-muted/50 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t p-3 [--muted-foreground:var(--foreground)]">
        <CostChip amount={55} unit="credits" />
        <RunButton />
      </div>
    </PanelFrame>
  );
}

/** Don&apos;t — Generate is the last thing in the scroll, and the price is nowhere near it. */
export function GenerateAtTheEndOfTheScroll() {
  return (
    <PanelFrame>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
        <p className="text-foreground text-xs">55 credits</p>
        <ConfigStack />
        <div className="pt-1">
          <RunButton />
        </div>
      </div>
    </PanelFrame>
  );
}

/** Do — the empty pane shows the transformation the tool performs. */
export function EmptyPaneTeachesTheTool() {
  return (
    <div className="w-full max-w-md rounded-xl border p-4">
      <EmptyState
        size="page"
        title="Nothing generated yet"
        description="Set it up, then press Generate."
        icon={<Wand2 />}
        examplePair={{
          before: {
            content: (
              <div className="bg-secondary text-secondary-foreground flex aspect-video items-center justify-center text-xs font-medium">
                Flat still
              </div>
            ),
            label: "Your photo",
          },
          after: {
            content: (
              <div className="bg-primary text-primary-foreground flex aspect-video items-center justify-center text-xs font-medium">
                8s of motion
              </div>
            ),
            label: "Generated clip",
          },
          caption: "A lighthouse at dusk, slow push in",
        }}
      />
    </div>
  );
}

/** Don&apos;t — an inert box that describes the emptiness instead of the tool. */
export function EmptyPaneIsAnInertBox() {
  return (
    <div className="w-full max-w-md rounded-xl border p-4">
      <div className="text-foreground flex h-48 items-center justify-center rounded-lg border border-dashed text-sm">
        No results
      </div>
    </div>
  );
}
