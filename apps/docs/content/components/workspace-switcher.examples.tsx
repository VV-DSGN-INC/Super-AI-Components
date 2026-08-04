"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceSwitcher } from "@/registry/super-ai/workspace-switcher";

/**
 * Live examples for workspace-switcher.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so workspace-switcher.docs.tsx has to stay
 * plain server-evaluable data — it cannot carry "use client" itself, because
 * Next.js turns "use client" exports into opaque client references, and a
 * plain object read through one of those comes back with every field
 * undefined. Every example lives here instead and crosses into the docs
 * module as a zero-prop element (e.g. `<PlanOnTrigger />`), so a prop like
 * `onSelect` never has to be serialized across the server/client boundary —
 * it's created and consumed entirely inside this client module.
 */

const SAMPLE_WORKSPACES = [
  { id: "acme", name: "Acme", plan: "Pro" },
  { id: "personal", name: "Personal", plan: "Free" },
];

export function PlanOnTrigger() {
  return <WorkspaceSwitcher workspaces={SAMPLE_WORKSPACES} currentId="acme" onSelect={() => {}} />;
}

export function CreateLastBelowSeparator() {
  return (
    <div className="w-64 rounded-lg border bg-popover p-1 text-sm">
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
        <span className="bg-muted flex size-6 items-center justify-center rounded-full text-xs">A</span>
        Acme
      </div>
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
        <span className="bg-muted flex size-6 items-center justify-center rounded-full text-xs">P</span>
        Personal
      </div>
      <div className="-mx-1 my-1 h-px bg-border" />
      <div className="text-muted-foreground flex items-center gap-2 rounded-md px-2 py-1.5">
        <Plus className="size-4" aria-hidden /> Create workspace
      </div>
    </div>
  );
}

export function PlusButtonBoltedOn() {
  return (
    <div className="flex items-center gap-1">
      <WorkspaceSwitcher workspaces={SAMPLE_WORKSPACES} currentId="acme" onSelect={() => {}} />
      <Button variant="outline" size="icon" aria-label="Add workspace">
        <Plus />
      </Button>
    </div>
  );
}

export function PlanHiddenInMenuOnly() {
  return (
    <Button variant="outline" className="h-auto justify-start gap-2 px-2 py-1.5">
      <span className="bg-muted flex size-6 items-center justify-center rounded-full text-xs">A</span>
      <span className="text-sm font-medium">Acme</span>
    </Button>
  );
}
