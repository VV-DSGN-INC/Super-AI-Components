"use client";

import { Languages } from "lucide-react";
import * as React from "react";

import { SelectionToolbar, type SelectionIntent } from "@/registry/super-ai/selection-toolbar";

const SELECTION =
  "It is our belief that the current onboarding process is not optimal and could probably be improved in a number of different ways going forward.";

/** What a host would put on screen once the intent comes back — a K3 diff. */
function describeIntent(intent: SelectionIntent): string {
  switch (intent.verb) {
    case "tone":
      return `Requested: rewrite in a ${intent.tone} tone`;
    case "custom":
      return `Requested: “${intent.prompt}”`;
    case "action":
      return `Requested: ${intent.id}`;
    default:
      return `Requested: ${intent.verb}`;
  }
}

export default function SelectionToolbarDemo() {
  const [last, setLast] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* The selection the bar belongs to. The bar reads it and never writes
          to it — notice the paragraph below never changes. */}
      <p className="max-w-md rounded-md border border-dashed p-3 text-sm leading-relaxed">
        <span className="bg-primary/20 rounded-sm px-0.5">{SELECTION}</span>
      </p>

      <SelectionToolbar
        selectionText={SELECTION}
        actions={[{ id: "translate", label: "Translate", icon: <Languages />, showLabel: true }]}
        onIntent={(intent) => setLast(describeIntent(intent))}
      />

      <p aria-live="polite" className="max-w-md text-center text-sm">
        {last ?? "Pick a verb. The toolbar asks; it never edits the paragraph."}
      </p>
    </div>
  );
}
