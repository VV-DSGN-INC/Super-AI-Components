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

  // min-h keeps a description-less row the same height as one with a description,
  // so a menu of mixed rows never looks ragged.
  // Whenever the row's surface becomes `bg-accent`, it rebinds `--muted-foreground`
  // to the accent's own foreground for its whole subtree. Muted text on an accent
  // surface measures 4.34:1 (they're the same lightness in this token set) — see
  // a11y-baseline.md, "The contrast pairing, measured". Rebinding the variable
  // rather than overriding the two slots this component owns is deliberate:
  // `trailing` holds caller markup, and callers pass `text-muted-foreground` into
  // it (the demo does). A slot-level fix cannot reach that; a variable rebind
  // repaints any descendant, composed or not.
  // `text-start`, not `text-left`: a `<button>` centres its text by default, so
  // something has to override it, and the logical form compiles to the same
  // declaration in LTR while mirroring under `dir="rtl"`. Without it the title
  // and description stay pinned to the visual left while the icon moves to the
  // right, opening a gap that does not exist in LTR. Sanctioned swap class —
  // CONTINUE.md §8, "Logical properties"; A5 field-row was the first adopter.
  const rowClassName = cn(
    "flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-start",
    interactive &&
      "hover:bg-accent hover:text-accent-foreground hover:[--muted-foreground:var(--accent-foreground)] transition-colors",
    interactive && "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
    selected && "bg-accent text-accent-foreground [--muted-foreground:var(--accent-foreground)]",
    disabled && "pointer-events-none opacity-50",
    className,
  );

  const content = (
    <>
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
    </>
  );

  // Rendered as two explicit branches rather than a dynamic tag: `disabled` is
  // button-only, so a union element type cannot be checked against div props.
  if (interactive) {
    return (
      <button
        type="button"
        onClick={disabled ? undefined : onSelect}
        disabled={disabled}
        aria-pressed={selected}
        data-slot="entity-row"
        data-state={selected ? "on" : "off"}
        className={rowClassName}
        {...(props as React.ComponentProps<"button">)}
      >
        {content}
      </button>
    );
  }

  // A non-interactive row has no `disabled` attribute to carry, so `opacity-50`
  // was the only signal that it is inactive — visible to sighted users, invisible
  // to assistive tech, and read by axe as ordinary low-contrast text (1.96:1 on
  // the description). `aria-disabled` makes the state programmatic, which is the
  // actual defect; the contrast reading was its symptom.
  return (
    <div
      data-slot="entity-row"
      data-state={selected ? "on" : "off"}
      aria-disabled={disabled || undefined}
      className={rowClassName}
      {...props}
    >
      {content}
    </div>
  );
}

export { EntityRow };
export type { EntityRowProps };
