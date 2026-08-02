"use client";
import { useState } from "react";

import { EntityRow } from "@/registry/super-ai/entity-row";

const SKILLS = [
  { id: "summarize", title: "Summarize", description: "Condense a long document" },
  { id: "translate", title: "Translate", description: "Convert between languages" },
  { id: "extract", title: "Extract fields" },
];

export default function EntityRowDemo() {
  const [selected, setSelected] = useState("summarize");
  return (
    <div className="w-full max-w-sm">
      {SKILLS.map((skill) => (
        <EntityRow
          key={skill.id}
          title={skill.title}
          description={skill.description}
          selected={selected === skill.id}
          onSelect={() => setSelected(skill.id)}
          trailing={<span className="text-muted-foreground text-xs">4 credits</span>}
        />
      ))}
      <EntityRow title="Fine-tune a model" description="Requires a Pro plan" disabled />
    </div>
  );
}
