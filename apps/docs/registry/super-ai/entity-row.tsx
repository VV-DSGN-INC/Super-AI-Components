"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface EntityRowProps extends Omit<React.ComponentProps<"div">, "onSelect" | "title"> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  trailing?: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

function EntityRow({
  icon,
  title,
  description,
  trailing,
  selected = false,
  disabled = false,
  onSelect,
  className,
  ...props
}: EntityRowProps) {
  const interactive = typeof onSelect === "function";
  const Row = interactive ? "button" : "div";

  return (
    <Row
      {...(interactive
        ? {
            type: "button" as const,
            onClick: disabled ? undefined : onSelect,
            disabled,
            "aria-pressed": selected,
          }
        : {})}
      data-slot="entity-row"
      data-state={selected ? "on" : "off"}
      // min-h keeps a description-less row the same height as one with a
      // description, so a menu of mixed rows never looks ragged.
      className={cn(
        "flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
        interactive && "hover:bg-accent hover:text-accent-foreground transition-colors",
        interactive && "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        selected && "bg-accent text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span data-slot="entity-row-icon" className="text-muted-foreground shrink-0">
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span data-slot="entity-row-title" className="truncate text-sm font-medium">
          {title}
        </span>
        {description ? (
          <span
            data-slot="entity-row-description"
            className="text-muted-foreground truncate text-xs"
          >
            {description}
          </span>
        ) : null}
      </span>
      {trailing ? (
        <span data-slot="entity-row-trailing" className="shrink-0">
          {trailing}
        </span>
      ) : null}
    </Row>
  );
}

export { EntityRow };
export type { EntityRowProps };
