"use client";

import { TriangleAlert } from "lucide-react";

import { ConnectionManager } from "@/registry/super-ai/connection-manager";

/**
 * Live examples for connection-manager.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs`,
 * `docs.evidence` and friends directly, so the docs module has to stay plain
 * server-evaluable data. Every callback below (`onTest`, `onSaveKey`,
 * `onDownload`) is created and consumed entirely inside this client module and
 * never has to serialize across the boundary.
 *
 * The two "don't" examples are hand-rolled markup on purpose — the component
 * cannot be made to do either of those things, which is the point.
 */

export function SeparateFailures() {
  return (
    <ConnectionManager
      label="Two failures, two remedies"
      providers={[
        { id: "openai", name: "OpenAI", status: "invalid", fingerprint: "sk-live ···· 4f2a" },
        { id: "replicate", name: "Replicate", status: "unreachable", fingerprint: "r8 ···· 0c17" },
      ]}
      onTest={() => {}}
      onSaveKey={() => {}}
    />
  );
}

export function RequirementsBeforeDownload() {
  return (
    <ConnectionManager
      label="Local models"
      providers={[
        {
          id: "llama",
          name: "Llama 3.1 8B",
          status: "not-set",
          local: {
            size: "4.7 GB",
            requirements: [
              { label: "Memory", value: "16 GB RAM", met: true },
              { label: "Disk", value: "12 GB free", met: true },
              { label: "Accelerator", value: "Apple silicon or CUDA GPU", met: false },
            ],
          },
        },
      ]}
      onDownload={() => {}}
    />
  );
}

export function OneGenericError() {
  return (
    <div className="w-full max-w-sm rounded-xl bg-card p-4 text-sm text-card-foreground ring-1 ring-foreground/10">
      <p className="font-medium">OpenAI</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs">
        <TriangleAlert className="size-3.5" aria-hidden />
        Connection error
      </p>
      <p className="text-muted-foreground mt-1 text-xs">
        Something went wrong. Check your API key and try again.
      </p>
    </div>
  );
}

export function KeyRenderedBack() {
  return (
    <div className="w-full max-w-sm rounded-xl bg-card p-4 text-sm text-card-foreground ring-1 ring-foreground/10">
      <p className="font-medium">OpenAI</p>
      <p className="text-muted-foreground mt-1 text-xs">Saved key</p>
      <input
        readOnly
        value="sk-live-9q7w3e1r5t8yu2i4o6p8"
        aria-label="Saved key, rendered back to the page"
        className="border-input mt-1 h-8 w-full rounded-lg border bg-transparent px-2.5 font-mono text-xs"
      />
    </div>
  );
}
