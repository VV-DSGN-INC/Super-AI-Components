"use client";

import { AtSign, File, Link, TextSelect, TriangleAlert, X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Context Chips — Removable entity/range/file references
 *
 * Spec: docs/design-system/component-specs.md#d3-context-chips
 * States: file · selection · url · mention · overflow · unresolved
 *
 * Chips are references, not text — removing one removes the context the
 * composer sends, which is why every chip (bar the overflow summary) carries
 * its own remove control. `unresolved` is a real, load-bearing state: a chip
 * whose target moved or was deleted must say so rather than rendering as if
 * everything is fine, so it is signalled with an icon swap, a dashed border,
 * struck-through label text AND a literal "unresolved" word — never colour
 * alone.
 */
function ContextChips({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="context-chips"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      {...props}
    />
  );
}

type ContextChipKind = "file" | "selection" | "url" | "mention";

const KIND_ICON: Record<ContextChipKind, typeof File> = {
  file: File,
  selection: TextSelect,
  url: Link,
  mention: AtSign,
};

interface ContextChipProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** Reference type — chooses the icon. Independent of `unresolved`. */
  kind: ContextChipKind;
  /** Display label. Keep it short; long values are truncated. */
  label: string;
  /** The reference's target no longer resolves (moved, deleted, expired). */
  unresolved?: boolean;
  /** Omit to render a chip with no remove control. */
  onRemove?: () => void;
}

function ContextChip({
  kind,
  label,
  unresolved = false,
  onRemove,
  className,
  ...props
}: ContextChipProps) {
  const Icon = unresolved ? TriangleAlert : KIND_ICON[kind];
  return (
    <span
      data-slot="context-chip"
      data-kind={kind}
      data-state={unresolved ? "unresolved" : "resolved"}
      className={cn(
        "border-border inline-flex max-w-full items-center gap-1 rounded-md border py-1 pl-2 text-xs",
        onRemove ? "pr-1" : "pr-2",
        unresolved && "border-destructive/60 text-destructive border-dashed",
        className,
      )}
      {...props}
    >
      <Icon aria-hidden className="size-3 shrink-0" />
      <span className={cn("max-w-40 truncate", unresolved && "line-through")}>{label}</span>
      {unresolved ? <span className="shrink-0 font-medium">· unresolved</span> : null}
      {onRemove ? (
        <button
          type="button"
          aria-label={unresolved ? `Remove unresolved reference ${label}` : `Remove ${label}`}
          data-slot="context-chip-remove"
          onClick={onRemove}
          className={cn(
            "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring ml-0.5 shrink-0 rounded-sm p-0.5 transition-colors focus-visible:ring-2 focus-visible:outline-none",
            unresolved ? "text-destructive" : "text-foreground",
          )}
        >
          <X aria-hidden className="size-3" />
        </button>
      ) : null}
    </span>
  );
}

interface ContextChipOverflowProps extends React.ComponentProps<"button"> {
  /** Count of references hidden behind this chip. */
  count: number;
}

function ContextChipOverflow({ count, className, ...props }: ContextChipOverflowProps) {
  return (
    <button
      type="button"
      data-slot="context-chip-overflow"
      aria-label={`${count} more reference${count === 1 ? "" : "s"}`}
      className={cn(
        "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring border-border inline-flex shrink-0 items-center rounded-md border px-2 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
      {...props}
    >
      +{count}
    </button>
  );
}

export { ContextChip, ContextChipOverflow, ContextChips };
export type { ContextChipKind };
