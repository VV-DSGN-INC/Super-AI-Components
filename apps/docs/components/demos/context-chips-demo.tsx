"use client";
import { useState } from "react";

import { ContextChip, ContextChipOverflow, ContextChips } from "@/registry/super-ai/context-chips";

export default function ContextChipsDemo() {
  const [chips, setChips] = useState([
    { id: "1", kind: "file" as const, label: "design.fig" },
    { id: "2", kind: "selection" as const, label: "lines 12-40" },
    { id: "3", kind: "url" as const, label: "vercel.com/docs" },
    { id: "4", kind: "mention" as const, label: "@teammate" },
    { id: "5", kind: "file" as const, label: "brief.pdf", unresolved: true },
  ]);

  return (
    <ContextChips>
      {chips.map((chip) => (
        <ContextChip
          key={chip.id}
          kind={chip.kind}
          label={chip.label}
          unresolved={chip.unresolved}
          onRemove={() => setChips((prev) => prev.filter((c) => c.id !== chip.id))}
        />
      ))}
      <ContextChipOverflow count={3} onClick={() => {}} />
    </ContextChips>
  );
}
