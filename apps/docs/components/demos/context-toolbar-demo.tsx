"use client";

import * as React from "react";
import {
  AlignLeft,
  Bold,
  Copy,
  Highlighter,
  Italic,
  Link2,
  MessageSquare,
  Strikethrough,
  Trash2,
  Underline,
} from "lucide-react";

import { ContextToolbar, type ContextToolbarAction } from "@/registry/super-ai/context-toolbar";

const TEXT_ACTIONS: ContextToolbarAction[] = [
  { id: "bold", label: "Bold", icon: <Bold /> },
  { id: "italic", label: "Italic", icon: <Italic /> },
  { id: "underline", label: "Underline", icon: <Underline /> },
  { id: "strike", label: "Strikethrough", icon: <Strikethrough /> },
  { id: "link", label: "Link", icon: <Link2 /> },
  { id: "highlight", label: "Highlight", icon: <Highlighter /> },
  // Past the cap — these collapse into the overflow menu on their own.
  { id: "align", label: "Align left", icon: <AlignLeft /> },
  { id: "comment", label: "Comment", icon: <MessageSquare /> },
  { id: "duplicate", label: "Duplicate", icon: <Copy /> },
  { id: "delete", label: "Delete", icon: <Trash2 /> },
];

export default function ContextToolbarDemo() {
  const [last, setLast] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <ContextToolbar
        selection="text"
        placement="above"
        actions={TEXT_ACTIONS}
        onAction={setLast}
        aiMenu={
          <div className="flex flex-col gap-0.5 text-sm">
            <p className="px-2 py-1 text-xs">I4 ai-tools-menu goes here</p>
            {["Rewrite", "Shorten", "Translate"].map((item) => (
              <span key={item} className="rounded-md px-2 py-1.5">
                {item}
              </span>
            ))}
          </div>
        }
      />

      {/* The selection the bar belongs to. In a real editor the host positions
          the bar above this rectangle and flips it below when there is no room
          — the component never covers it. */}
      <p className="max-w-md rounded-md border border-dashed p-3 text-sm">
        <span className="bg-primary/20 rounded-sm px-0.5">
          The quick brown fox jumps over the lazy dog.
        </span>{" "}
        Select a phrase in a real editor and this bar follows it.
      </p>

      <p aria-live="polite" className="text-sm">
        {last ? `Last action: ${last}` : "No action yet"}
      </p>
    </div>
  );
}
