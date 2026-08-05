"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GenerationGrid } from "@/registry/super-ai/generation-grid";
import { ResultCard, type ResultCardState } from "@/registry/super-ai/result-card";

/**
 * Live examples for generation-grid.docs.tsx.
 *
 * A client sidecar: the docs module is plain data read by a Server Component
 * and cannot carry "use client" or any handler-bearing JSX, so every example
 * with a callback lives here and crosses over as a zero-prop element.
 */

interface Row {
  id: string;
  prompt: string;
  state: ResultCardState;
}

const MIXED: Row[] = [
  { id: "1", prompt: "Rooftop garden, golden hour", state: "done" },
  { id: "2", prompt: "Neon alley, rain reflections", state: "streaming" },
  { id: "3", prompt: "Studio portrait, soft light", state: "queued" },
  { id: "4", prompt: "Glass sculpture on marble", state: "done" },
];

function Media() {
  return (
    <div className="bg-foreground/10 flex h-full w-full items-center justify-center">
      <Sparkles aria-hidden className="text-foreground/40 size-5" />
    </div>
  );
}

const card = (item: Row, ctx: { selected: boolean; selectMode: boolean; toggleSelected: () => void }) => (
  <ResultCard
    state={item.state}
    aspect="square"
    progress={54}
    label={item.prompt}
    selectable={ctx.selectMode}
    selected={ctx.selected}
    onSelect={ctx.toggleSelected}
  >
    <Media />
  </ResultCard>
);

/** DO — group by relative date, newest bucket first. */
export function GroupedByRelativeDate() {
  return (
    <GenerationGrid
      density="comfortable"
      groups={[
        { id: "today", label: "Today", items: MIXED.slice(0, 2) },
        { id: "yesterday", label: "Yesterday", items: MIXED.slice(2) },
      ]}
      getItemId={(i) => i.id}
      renderItem={card}
    />
  );
}

/** DO — the empty state is one tile in the grid, not a replacement for it. */
export function EmptyAsATile() {
  return (
    <GenerationGrid
      density="comfortable"
      items={[] as Row[]}
      getItemId={(i) => i.id}
      renderItem={card}
      empty={
        <div className="text-foreground flex h-full flex-col items-start justify-center gap-2 rounded-lg border border-dashed p-4 text-sm">
          <p>Nothing here yet.</p>
          <Button size="sm" variant="outline">
            Generate your first result
          </Button>
        </div>
      }
    />
  );
}

/**
 * DON'T — select mode without `onSelectionChange`. The checkboxes render and
 * the bulk bar appears, but nothing can ever be checked, so the bar reports
 * zero selected forever.
 */
export function SelectModeWithoutAHandler() {
  return (
    <GenerationGrid
      density="comfortable"
      selectMode
      selectedIds={[]}
      items={MIXED.slice(0, 2)}
      getItemId={(i) => i.id}
      renderItem={card}
      bulkActions={
        <Button size="sm" variant="outline">
          Delete
        </Button>
      }
    />
  );
}

/**
 * DON'T — a different component per state. Both tiles below are in the same
 * grid, but the pending one was rendered as a bare box instead of a card, so
 * it is a different height and the row it sits in will jump when it resolves.
 */
export function MixedCellShapes() {
  return (
    <GenerationGrid
      density="comfortable"
      items={MIXED.slice(0, 2)}
      getItemId={(i) => i.id}
      renderItem={(item, ctx) =>
        item.state === "done" ? (
          card(item, ctx)
        ) : (
          <div className="text-foreground rounded-lg border p-3 text-xs">Still generating…</div>
        )
      }
    />
  );
}
