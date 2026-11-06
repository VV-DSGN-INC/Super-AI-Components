"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { MemoryManager, MemorySavedChip, type MemoryItem } from "@/registry/super-ai/memory-manager";

/**
 * Live examples for memory-manager.docs.tsx.
 *
 * A client sidecar on purpose: the docs module is read by a Server Component
 * and cannot carry handlers, so every example that owns state lives here and
 * crosses over as a zero-prop element.
 */

const ITEMS: MemoryItem[] = [
  {
    id: "p1",
    text: "Keep answers short and lead with the conclusion.",
    kind: "preference",
    addedAt: "2026-09-14",
    source: "Chat: Release notes draft",
    scope: "global",
  },
  {
    id: "f1",
    text: "Works as a product designer on a design systems team.",
    kind: "fact",
    addedAt: "2026-09-02",
    source: "Added by you",
    scope: "global",
  },
  {
    id: "f2",
    text: "The team reviews designs on Thursdays.",
    kind: "fact",
    addedAt: "2026-10-01",
    source: "Chat: Sprint planning",
    scope: { workspace: "Work" },
  },
];

function Stateful({ initialEditing, workspace }: { initialEditing?: string; workspace?: string }) {
  const [memories, setMemories] = React.useState(ITEMS);
  const [enabled, setEnabled] = React.useState(true);
  return (
    <MemoryManager
      memories={memories}
      enabled={enabled}
      onEnabledChange={setEnabled}
      activeWorkspace={workspace}
      defaultEditingId={initialEditing}
      onEdit={(id, text) => setMemories((all) => all.map((m) => (m.id === id ? { ...m, text } : m)))}
      onDelete={(id) => setMemories((all) => all.filter((m) => m.id !== id))}
      onReset={() => setMemories([])}
    />
  );
}

export function EveryRowSaysWhereItCameFrom() {
  return <Stateful workspace="Work" />;
}

export function EditInPlaceWithALabelledField() {
  return <Stateful initialEditing="p1" />;
}

export function ChipInTheConversation() {
  const [open, setOpen] = React.useState(true);
  return open ? (
    <MemorySavedChip onReview={() => setOpen(false)} />
  ) : (
    <p className="text-foreground text-sm">The host opens the manager from the review action.</p>
  );
}

export function ResetBehindAConfirm() {
  return <Stateful />;
}

/** The wrong shape: a flat list. Nothing says when, where or how a line got there. */
export function FlatListWithNoProvenance() {
  return (
    <ul className="text-foreground flex w-full max-w-xl list-disc flex-col gap-1 ps-5 text-sm">
      {ITEMS.map((memory) => (
        <li key={memory.id}>{memory.text}</li>
      ))}
    </ul>
  );
}

/** The wrong shape: one click wipes everything, and the button does not say what goes. */
export function ClearButtonWithNoConfirm() {
  const [cleared, setCleared] = React.useState(false);
  return (
    <div className="flex w-full max-w-xl flex-col gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => setCleared(true)}>
        Clear
      </Button>
      <p className="text-foreground text-sm">
        {cleared ? "Everything is gone, and nothing said so first." : "Nothing here says what Clear removes."}
      </p>
    </div>
  );
}

/** The wrong shape: facts and preferences in one pile, so tone rules and biography are reviewed together. */
export function OnePileOfEverything() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-1">
      <p className="text-foreground text-sm font-semibold">Memories ({ITEMS.length})</p>
      {ITEMS.map((memory) => (
        <p key={memory.id} className="text-foreground text-sm">
          {memory.text}
        </p>
      ))}
    </div>
  );
}
