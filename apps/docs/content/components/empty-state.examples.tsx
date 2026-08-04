"use client";

import { ImagePlus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { GenerationGrid } from "@/registry/super-ai/generation-grid";

/**
 * Live examples for empty-state.docs.tsx.
 *
 * A client sidecar, kept separate on purpose: component-docs.tsx is a Server
 * Component that reads `docs.whatItIs`, `docs.evidence` and friends as plain
 * data, so the docs module itself cannot carry "use client" — Next.js turns a
 * "use client" export into an opaque client reference and every field comes
 * back undefined. Every example lives here and crosses into the docs module as
 * a zero-prop element, so nothing has to serialize across the boundary.
 */

const ROWS = [] as { id: string }[];

/** Decorative stand-in for one half of a transformation. */
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

/** DO — the CTA repeats the verb of the panel it stands in for. */
export function CtaMatchesSurfaceVerb() {
  return (
    <EmptyState
      size="panel"
      icon={<ImagePlus />}
      title="No renders yet"
      description="Describe a shot and the results land here."
      action={
        <Button size="sm">
          <Sparkles aria-hidden />
          Generate a render
        </Button>
      }
    />
  );
}

/** DO — before and after, each captioned, for a generation surface. */
export function ExamplePairShowsTheTransformation() {
  return (
    <EmptyState
      size="panel"
      title="Try a relight"
      description="Upload a shot and change the lighting without reshooting."
      examplePair={{
        before: { content: <Swatch label="source photo" dim />, label: "Your photo" },
        after: { content: <Swatch label="relit render" />, label: "Relit" },
        caption: "Prompt: warm rim light, dusk",
      }}
      action={<Button size="sm">Upload a photo</Button>}
    />
  );
}

/** AVOID — a generic verb that belongs to no surface in particular. */
export function GenericGetStartedCta() {
  return (
    <EmptyState
      size="panel"
      icon={<ImagePlus />}
      title="Nothing here yet"
      description="This panel is empty."
      action={
        <Button size="sm" variant="outline">
          Get started
        </Button>
      }
    />
  );
}

/** AVOID — a page-sized takeover where the grid should have kept its shape. */
export function PageSizedStateInsideAGrid() {
  return (
    <GenerationGrid
      density="comfortable"
      items={ROWS}
      getItemId={(item) => item.id}
      renderItem={() => null}
      empty={
        <EmptyState
          size="page"
          icon={<ImagePlus />}
          title="No renders yet"
          description="Describe a shot and the results land here."
          action={<Button size="sm">Generate a render</Button>}
        />
      }
    />
  );
}
