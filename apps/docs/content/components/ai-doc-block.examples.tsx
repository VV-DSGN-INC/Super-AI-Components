"use client";

import { Check, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { AiDocBlock } from "@/registry/super-ai/ai-doc-block";

/**
 * Live examples for ai-doc-block.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs`,
 * `docs.evidence` and the rest straight off the exported object, so the docs
 * module has to stay plain server-evaluable data. Every example that needs a
 * handler lives here instead and crosses into the docs module as a zero-prop
 * element, so nothing has to serialise across the boundary.
 */

const DRAFT =
  "Support volume rose 30% this quarter against a headcount that did not move.";

export function BlockInFlow() {
  return (
    <article className="text-foreground flex w-full max-w-md flex-col gap-2 text-sm">
      <p>The paragraph above the generated passage.</p>
      <AiDocBlock
        onKeep={() => {}}
        onEdit={() => {}}
        onRegenerate={() => {}}
        onDiscard={() => {}}
      >
        <p>{DRAFT}</p>
      </AiDocBlock>
      <p>The paragraph below it, which never moves.</p>
    </article>
  );
}

export function VerbsDisabledWhileStreaming() {
  return (
    <div className="w-full max-w-md">
      <AiDocBlock
        state="streaming"
        onKeep={() => {}}
        onEdit={() => {}}
        onRegenerate={() => {}}
        onDiscard={() => {}}
      >
        <p>Support volume rose 30% this quarter against a headcount that</p>
      </AiDocBlock>
    </div>
  );
}

/**
 * The wrong shape: chrome floating over the paragraph instead of a node in it.
 * Static markup on purpose — this is what the component exists not to be.
 */
export function OverlayOverTheDocument() {
  return (
    <div className="text-foreground relative w-full max-w-md text-sm">
      <p>
        The paragraph underneath is the only thing the document model knows
        about. The generated text sits in a layer above it, so it cannot be
        saved, reloaded or exported with the rest of the page.
      </p>
      <div className="bg-card ring-foreground/10 absolute inset-x-4 top-4 rounded-lg p-3 shadow-lg ring-1">
        <p className="text-card-foreground text-sm">{DRAFT}</p>
      </div>
    </div>
  );
}

/**
 * The wrong shape: the verb row rebuilt by hand in whatever order the call
 * site felt like. Static markup on purpose — the real component cannot be
 * made to do this.
 */
export function VerbsReordered() {
  return (
    <ButtonGroup aria-label="Reordered actions">
      <Button
        type="button"
        size="sm"
        className="bg-destructive text-background hover:bg-destructive/90"
      >
        <Trash2 aria-hidden />
        Discard
      </Button>
      <Button type="button" size="sm" variant="outline">
        <RotateCcw aria-hidden />
        Regenerate
      </Button>
      <Button type="button" size="sm" variant="outline">
        <Pencil aria-hidden />
        Edit
      </Button>
      <Button type="button" size="sm">
        <Check aria-hidden />
        Keep
      </Button>
    </ButtonGroup>
  );
}
