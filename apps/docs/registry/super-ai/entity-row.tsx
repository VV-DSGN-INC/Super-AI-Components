"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface EntityRowProps extends Omit<React.ComponentProps<"div">, "onSelect" | "title"> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  trailing?: React.ReactNode;
  /**
   * Pass this — either `true` or `false` — only when the row is a toggle.
   * Passing it is what makes the row report `aria-pressed`; leaving it off
   * means the row acts or navigates and announces as a plain button.
   */
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

function EntityRow({
  icon,
  title,
  description,
  trailing,
  selected,
  disabled = false,
  onSelect,
  className,
  ...props
}: EntityRowProps) {
  const interactive = typeof onSelect === "function";
  // `selected` deliberately has no default. It used to default to `false`,
  // which meant every interactive row emitted `aria-pressed="false"` and a
  // navigation row ("Fine-tune a model ›") announced as an unpressed toggle it
  // does not have. Presence of the prop is now the signal: pass it, even as
  // `false`, and the row is a toggle; omit it and the row simply acts.
  //
  // This was a recorded deferral rather than an oversight — EntityRow.stories
  // called it "an API change to a primitive seventeen components compose".
  // It is source-compatible: every consumer that passes `selected` keeps the
  // behaviour it had, and only rows that never passed it change.
  const isToggle = selected !== undefined;

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
        aria-pressed={isToggle ? selected : undefined}
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
  //
  // `inert` is what makes the keyboard agree with the eye. `pointer-events-none`
  // stops the mouse and nothing else, so a Switch or button handed to `trailing`
  // on a row that reads as disabled stayed tabbable and operable by Space —
  // `aria-disabled` on a wrapper does not inherit to descendants. `inert` does,
  // and it is the only declarative way to reach markup this component did not
  // write. The trade is real and worth stating: an inert subtree leaves the
  // accessibility tree, so the row stops being announced as present-but-disabled
  // rather than being announced correctly. A live control inside a dead-looking
  // row is the worse of the two.
  return (
    <div
      data-slot="entity-row"
      data-state={selected ? "on" : "off"}
      aria-disabled={disabled || undefined}
      inert={disabled || undefined}
      className={rowClassName}
      {...props}
    >
      {content}
    </div>
  );
}

export { EntityRow };
export type { EntityRowProps };
