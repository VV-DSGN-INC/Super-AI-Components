"use client";

import * as React from "react";

import { MemoryManager, MemorySavedChip, type MemoryItem } from "@/registry/super-ai/memory-manager";

const INITIAL: MemoryItem[] = [
  {
    id: "p1",
    text: "Keep answers short and lead with the conclusion.",
    kind: "preference",
    addedAt: "2026-09-14",
    source: "Chat: Release notes draft",
    scope: "global",
  },
  {
    id: "p2",
    text: "Use British spelling in documents.",
    kind: "preference",
    addedAt: "2026-08-30",
    source: "Added by you",
    scope: "global",
  },
  {
    id: "f1",
    text: "Works as a product designer on a design systems team.",
    kind: "fact",
    addedAt: "2026-09-02",
    source: "Chat: Portfolio review",
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
  {
    id: "f3",
    text: "Planning a trip to Lisbon in March.",
    kind: "fact",
    addedAt: "2026-10-03",
    source: "Chat: Trip planning",
    scope: { workspace: "Personal" },
  },
];

export default function MemoryManagerDemo() {
  const [memories, setMemories] = React.useState(INITIAL);
  const [enabled, setEnabled] = React.useState(true);
  const [saved, setSaved] = React.useState(false);

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      {saved ? <MemorySavedChip onReview={() => setSaved(false)} /> : null}
      <MemoryManager
        memories={memories}
        enabled={enabled}
        onEnabledChange={setEnabled}
        activeWorkspace="Work"
        justSavedId={saved ? "f3" : undefined}
        description="What the assistant has saved about you, and where each memory applies."
        onEdit={(id, text) => {
          setMemories((all) => all.map((m) => (m.id === id ? { ...m, text } : m)));
          setSaved(true);
        }}
        onDelete={(id) => setMemories((all) => all.filter((m) => m.id !== id))}
        onReset={() => setMemories([])}
      />
    </div>
  );
}
