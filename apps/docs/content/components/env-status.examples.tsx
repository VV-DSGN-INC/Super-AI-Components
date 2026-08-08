"use client";

import { EnvStatus } from "@/registry/super-ai/env-status";

/**
 * Live examples for env-status.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs`,
 * `docs.evidence` and friends directly, so the docs module has to stay plain
 * server-evaluable data.
 *
 * The two "don't" examples are hand-rolled markup on purpose — the component
 * cannot be made to do either of those things, which is the point.
 */

export function FourRemedies() {
  return (
    <EnvStatus
      label="Model providers"
      providers={[
        { id: "openai", name: "OpenAI", state: "ok" },
        { id: "anthropic", name: "Anthropic", state: "degraded" },
        { id: "replicate", name: "Replicate", state: "key-invalid" },
        { id: "llama", name: "Llama 3.1 8B (local)", state: "not-running" },
      ]}
    />
  );
}

export function SharedProviderIdentity() {
  // Same `id` and `name` a host would pass to M7 connection-manager for its
  // own OpenAI row — the two surfaces read off one shared list of providers
  // rather than each inventing its own labels for the same connection.
  return (
    <EnvStatus
      label="Model providers"
      providers={[{ id: "openai", name: "OpenAI", state: "key-invalid", checkedAt: "Checked just now" }]}
    />
  );
}

export function OneGenericError() {
  return (
    <div className="w-full max-w-sm rounded-xl bg-card p-4 text-sm text-card-foreground ring-1 ring-foreground/10">
      <p className="font-medium">OpenAI</p>
      <p className="text-muted-foreground mt-1 text-xs">Error</p>
    </div>
  );
}

export function ColouredDotsOnly() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center gap-2 text-sm">
        <span aria-hidden className="bg-primary size-2 rounded-full" />
        OpenAI
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span aria-hidden className="bg-warning size-2 rounded-full" />
        Anthropic
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span aria-hidden className="bg-destructive size-2 rounded-full" />
        Replicate
      </div>
    </div>
  );
}
