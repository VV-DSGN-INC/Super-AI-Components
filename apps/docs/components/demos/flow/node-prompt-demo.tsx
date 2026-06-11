"use client";

import * as React from "react";

import { NodePrompt } from "@/registry/super-ai/flow/node-prompt";

export default function NodePromptDemo() {
  const [value, setValue] = React.useState(
    "Generate a cinematic shot of the subject from @Image 1 in the style of @Image 2.",
  );
  const [refs, setRefs] = React.useState([
    { id: "r1", label: "@Image 1", dataType: "image", thumbnailUrl: "/globe.svg" },
    { id: "r2", label: "@Image 2", dataType: "image" },
  ]);

  // Collapsed round-trip: start collapsed, expand on click
  const [collapsed, setCollapsed] = React.useState(true);

  return (
    <div className="flex w-80 flex-col gap-6 p-4">
      {/* Editing state with reference chips */}
      <div className="rounded-lg border p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Editing</p>
        <NodePrompt
          value={value}
          onChange={setValue}
          placeholder="Describe what to generate…"
          references={refs}
          onRemoveReference={(id) => setRefs((prev) => prev.filter((r) => r.id !== id))}
          rows={4}
        />
      </div>

      {/* Collapsed state (output exists) — real round-trip via useState */}
      <div className="rounded-lg border p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {collapsed ? "Collapsed (click to expand)" : "Expanded"}
        </p>
        <NodePrompt
          value="Generate a cinematic shot of the subject from @Image 1 in the style of @Image 2."
          onChange={() => {}}
          collapsed={collapsed}
          onExpand={() => setCollapsed(false)}
        />
      </div>
    </div>
  );
}
