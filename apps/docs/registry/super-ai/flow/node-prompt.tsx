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

/**
 * NodePrompt — fully controlled prompt textarea with reference chips.
 *
 * Host responsibilities:
 *  - Maintain `value` and `references` in state; pass `onChange` / `onRemoveReference`.
 *  - Set `collapsed={true}` once an output exists (Flora pattern). Clicking the
 *    collapsed summary fires `onExpand`; the host switches collapsed back to false.
 *
 * Prop surface:
 *  - `className` styles the **wrapper** div (not the textarea).
 *  - All other native textarea props (aria-label, disabled, maxLength, onKeyDown, ref …)
 *    are forwarded to the `<textarea>` element via rest-props spread.
 *  - `rows` defaults to 3.
 */
export interface NodePromptProps extends Omit<React.ComponentProps<"textarea">, "value" | "onChange"> {
  value: string;
  onChange: (v: string) => void;
  references?: Array<{ id: string; label: string; dataType: string; thumbnailUrl?: string }>;
  onRemoveReference?: (id: string) => void;
  collapsed?: boolean;
  onExpand?: () => void;
}

const NodePrompt = React.forwardRef<HTMLTextAreaElement, NodePromptProps>(function NodePrompt(
  {
    value,
    onChange,
    references,
    onRemoveReference,
    collapsed = false,
    onExpand,
    rows = 3,
    className,
    ...rest
  },
  forwardedRef,
) {
  /** Refs for focus management on chip removal. */
  const chipButtonRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  /** Callback ref that maintains both the internal ref and the forwarded ref. */
  const setTextareaRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      textareaRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef],
  );

  function handleRemove(id: string) {
    if (!references) return;
    const idx = references.findIndex((r) => r.id === id);
    // Pick focus target: next chip → prev chip → textarea
    let targetId: string | null = null;
    if (idx < references.length - 1) {
      targetId = references[idx + 1].id;
    } else if (idx > 0) {
      targetId = references[idx - 1].id;
    }
    onRemoveReference?.(id);
    requestAnimationFrame(() => {
      if (targetId) {
        chipButtonRefs.current.get(targetId)?.focus();
      } else {
        textareaRef.current?.focus();
      }
    });
  }

  if (collapsed) {
    return (
      <div data-slot="node-prompt" className={cn("w-full", className)}>
        <button
          type="button"
          data-slot="node-prompt-summary"
          onClick={() => onExpand?.()}
          aria-label={value ? `Edit prompt: ${value}` : "Edit prompt"}
          aria-expanded={false}
          title={value}
          className="min-h-6 w-full truncate text-left text-xs text-muted-foreground"
        >
          {value || <span className="sr-only">Edit prompt</span>}
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
            const dotColor = `var(${typeDef?.cssVar ?? "--flow-text"}, var(--muted-foreground))`;
            return (
              <span
                key={ref.id}
                data-slot="node-prompt-reference"
                className="inline-flex max-w-full items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 text-[10px]"
              >
                {ref.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- registry items must not depend on next/image
                  <img src={ref.thumbnailUrl} alt="" className="h-4 w-4 rounded object-cover" />
                )}
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="min-w-0 truncate text-muted-foreground">{ref.label}</span>
                <button
                  type="button"
                  aria-label={`Remove ${ref.label}`}
                  ref={(el) => {
                    if (el) {
                      chipButtonRefs.current.set(ref.id, el);
                    } else {
                      chipButtonRefs.current.delete(ref.id);
                    }
                  }}
                  onClick={() => handleRemove(ref.id)}
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
        {...rest}
        ref={setTextareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={cn(
          "w-full resize-none rounded-md border bg-transparent px-2 py-1.5 text-xs outline-none",
          "placeholder:text-muted-foreground",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        )}
      />
    </div>
  );
});

export { NodePrompt };
export type { NodePromptReference };
