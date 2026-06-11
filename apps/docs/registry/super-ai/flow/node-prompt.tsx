"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { getHandleType } from "./flow-types";

interface NodePromptReference {
  id: string;
  label: string;
  dataType: string;
  thumbnailUrl?: string;
}

interface NodePromptProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  references?: NodePromptReference[];
  onRemoveReference?: (id: string) => void;
  collapsed?: boolean;
  onExpand?: () => void;
  rows?: number;
  className?: string;
}

function NodePrompt({
  value,
  onChange,
  placeholder,
  references,
  onRemoveReference,
  collapsed = false,
  onExpand,
  rows = 3,
  className,
}: NodePromptProps) {
  if (collapsed) {
    return (
      <div data-slot="node-prompt" className={cn("w-full", className)}>
        <button
          type="button"
          data-slot="node-prompt-summary"
          onClick={() => onExpand?.()}
          className="w-full truncate text-left text-xs text-muted-foreground"
        >
          {value}
        </button>
      </div>
    );
  }

  return (
    <div data-slot="node-prompt" className={cn("flex flex-col gap-1", className)}>
      {references && references.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {references.map((ref) => {
            const typeDef = getHandleType(ref.dataType);
            const dotColor = `var(${typeDef?.cssVar ?? "--flow-text"})`;
            return (
              <span
                key={ref.id}
                data-slot="node-prompt-reference"
                className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 text-[10px]"
              >
                {ref.thumbnailUrl && (
                  <img
                    src={ref.thumbnailUrl}
                    alt=""
                    className="h-4 w-4 rounded object-cover"
                  />
                )}
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="text-muted-foreground">{ref.label}</span>
                <button
                  type="button"
                  aria-label={`Remove ${ref.label}`}
                  onClick={() => onRemoveReference?.(ref.id)}
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "w-full resize-none rounded-md border bg-transparent px-2 py-1.5 text-xs outline-none",
          "placeholder:text-muted-foreground",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        )}
      />
    </div>
  );
}

export { NodePrompt };
export type { NodePromptProps, NodePromptReference };
