"use client";

import { Plus, SlidersHorizontal, X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

function FilterBar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="filter-bar" className={cn("flex flex-wrap items-center gap-2", className)} {...props} />
  );
}

interface FilterChipProps extends React.ComponentProps<"button"> {
  active?: boolean;
  onRemove?: () => void;
}

function FilterChip({ active = false, onRemove, className, children, ...props }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      data-slot="filter-chip"
      data-state={active ? "on" : "off"}
      className={cn(
        "hover:bg-accent inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
        active && "bg-secondary text-secondary-foreground",
        className,
      )}
      {...props}
    >
      {children}
      {onRemove ? (
        <span
          role="button"
          tabIndex={0}
          aria-label={`Remove ${typeof children === "string" ? children : ""} filter`
            .replace(/\s+/g, " ")
            .trim()}
          data-slot="filter-chip-remove"
          className="hover:text-foreground text-muted-foreground -mr-1 rounded-full p-0.5"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }
          }}
        >
          <X aria-hidden className="size-3" />
        </span>
      ) : null}
    </button>
  );
}

function AddFilterChip({ className, children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={`Add ${typeof children === "string" ? children : "filter"}`}
      data-slot="add-filter-chip"
      className={cn(
        "text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1 text-sm transition-colors",
        className,
      )}
      {...props}
    >
      <Plus aria-hidden className="size-3" />
      {children}
    </button>
  );
}

function FiltersButton({ className, children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="filters-button"
      className={cn(
        "hover:bg-accent inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-sm transition-colors",
        className,
      )}
      {...props}
    >
      <SlidersHorizontal aria-hidden className="size-3.5" />
      {children ?? "Filters"}
    </button>
  );
}

export { AddFilterChip, FilterBar, FilterChip, FiltersButton };
