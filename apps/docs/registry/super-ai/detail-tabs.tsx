"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

export interface DetailTabItem {
  id: string;
  label: string;
  /** Shown as a badge and folded into the accessible name. */
  count?: number;
}

export interface DetailTabsProps {
  items: DetailTabItem[];
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel: string;
  className?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   DetailTabs — one tablist serving both tab levels.

   Level 1 switches panes when the container is too narrow for two columns;
   level 2 switches channels inside the conversation. They are the same control,
   so they are the same component — a second implementation would drift.

   Roving tabindex, matching ViewSwitcher and ModeSwitcher, so the shell has one
   keyboard idiom rather than a third.
   ─────────────────────────────────────────────────────────────────────────── */
export function DetailTabs({ items, activeId, onSelect, ariaLabel, className }: DetailTabsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  function onKeyDown(event: React.KeyboardEvent) {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (delta === 0) return;
    event.preventDefault();
    const index = items.findIndex((item) => item.id === activeId);
    const next = items[(index + delta + items.length) % items.length];
    onSelect(next.id);
    requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${next.id}"]`)?.focus();
    });
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      data-slot="detail-tabs"
      onKeyDown={onKeyDown}
      className={cn("flex shrink-0 items-center gap-1 border-b px-3", className)}
    >
      {items.map((item) => {
        const selected = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            data-tab={item.id}
            aria-selected={selected}
            // The count belongs in the name: a coloured badge is invisible to a
            // screen reader, and "Activity" alone hides that there are three.
            aria-label={item.count === undefined ? item.label : `${item.label}, ${item.count}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(item.id)}
            className={cn(
              "focus-visible:ring-ring -mb-px border-b-2 px-2 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
              selected
                ? "border-primary text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            <span>{item.label}</span>
            {item.count === undefined ? null : (
              <span className="bg-muted ml-1.5 rounded px-1 text-xs tabular-nums opacity-70">
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
