"use client";

import { ImagePlus, Sparkles } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { EmptyState, type EmptyStateSize } from "@/registry/super-ai/empty-state";
import { GenerationGrid } from "@/registry/super-ai/generation-grid";

const SIZES: EmptyStateSize[] = ["page", "panel", "in-grid"];

/** Stand-ins for the two halves of a transformation. Decorative, so aria-hidden. */
function Swatch({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <div
      aria-hidden
      className={`flex aspect-video items-center justify-center text-xs text-foreground ${
        dim ? "bg-foreground/5" : "bg-foreground/15"
      }`}
    >
      {label}
    </div>
  );
}

export default function EmptyStateDemo() {
  const [size, setSize] = React.useState<EmptyStateSize>("panel");
  const [pair, setPair] = React.useState(false);

  const state = (
    <EmptyState
      size={size}
      icon={pair ? undefined : <ImagePlus />}
      title="No renders yet"
      description="Describe a shot and the results land here."
      action={
        <Button size="sm">
          <Sparkles aria-hidden />
          Generate a render
        </Button>
      }
      secondaryAction={
        <Button size="sm" variant="ghost">
          Browse presets
        </Button>
      }
      examplePair={
        pair
          ? {
              before: { content: <Swatch label="source photo" dim />, label: "Your photo" },
              after: { content: <Swatch label="relit render" />, label: "Relit" },
              caption: "Prompt: warm rim light, dusk",
            }
          : undefined
      }
    />
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {SIZES.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={size === s ? "default" : "outline"}
            onClick={() => setSize(s)}
          >
            {s}
          </Button>
        ))}
        <Button size="sm" variant={pair ? "default" : "outline"} onClick={() => setPair((p) => !p)}>
          Example pair
        </Button>
      </div>

      {size === "in-grid" ? (
        // The tile keeps the grid's columns; the surface never becomes a takeover.
        <GenerationGrid
          density="comfortable"
          items={[] as { id: string }[]}
          getItemId={(item) => item.id}
          renderItem={() => null}
          empty={state}
        />
      ) : (
        <div className="rounded-xl border">{state}</div>
      )}
    </div>
  );
}
