"use client";

import * as React from "react";
import { Radio as RadioPrimitive } from "@base-ui/react/radio";

import { RadioGroup } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const ChoiceChipsContext = React.createContext<{ value?: string } | null>(null);

interface ChoiceChipsProps extends Omit<
  React.ComponentProps<typeof RadioGroup>,
  "value" | "defaultValue" | "onValueChange"
> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

/**
 * Composes the vendored `ui/radio-group` the way `autonomy-selector` does, so
 * the ARIA radio pattern comes from Base UI rather than from this file: the
 * group is one tab stop (the checked chip, or the first when none is), and
 * the arrow keys move focus and selection together and wrap. Home and End do
 * nothing; Base UI's radio group does not bind them.
 */
function ChoiceChips({
  value: valueProp,
  defaultValue,
  onValueChange,
  className,
  ...props
}: ChoiceChipsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  // `value={undefined}` still means "uncontrolled", as it always has here, so
  // the group keeps its own state and hands Base UI a value it never owns.
  // `null` is Base UI's "nothing checked".
  const value = valueProp ?? internal;
  return (
    <ChoiceChipsContext.Provider value={{ value }}>
      <RadioGroup
        data-slot="choice-chips"
        value={value ?? null}
        onValueChange={(next: unknown) => {
          setInternal(next as string);
          onValueChange?.(next as string);
        }}
        // `w-auto` undoes the vendored group's `w-full`, so the row sizes the
        // way the plain block-level div it replaced did inside a flex parent.
        className={cn("flex w-auto flex-wrap gap-2", className)}
        {...props}
      />
    </ChoiceChipsContext.Provider>
  );
}

interface ChoiceChipProps extends Omit<
  RadioPrimitive.Root.Props<string>,
  "value" | "nativeButton" | "render"
> {
  value: string;
}

function ChoiceChip({ value, className, ...props }: ChoiceChipProps) {
  const ctx = React.useContext(ChoiceChipsContext);
  if (!ctx) throw new Error("ChoiceChip must be used within ChoiceChips");
  const selected = ctx.value === value;
  return (
    <RadioPrimitive.Root
      value={value}
      // A real `<button>` rather than Base UI's default `<span>`: the chip
      // keeps native button semantics for `disabled` and form submission.
      nativeButton
      render={<button type="button" />}
      data-slot="choice-chip"
      data-state={selected ? "on" : "off"}
      className={cn(
        // `motion-reduce:transition-none` is the same one-class branch the registry
        // already uses beside `transition-*` and `animate-*` (pricing-table,
        // trace-timeline, task-tray, citation-ref). Without it the hover/selection
        // colour fade has no reduced-motion path at all.
        "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none rounded-lg border px-3 py-1.5 text-sm transition-colors motion-reduce:transition-none",
        // Selection is a fill and a border, never the ring: the ring is the
        // focus indicator, and drawing both with it made a focused chip and a
        // selected one the same picture. The fill is A9 entity-row's selected
        // idiom, including the rebind that keeps composed muted text legible
        // on the accent surface.
        "data-checked:bg-accent data-checked:text-accent-foreground data-checked:border-ring data-checked:[--muted-foreground:var(--accent-foreground)]",
        // The registry's disabled idiom (entity-row, gen-settings-bar).
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { ChoiceChip, ChoiceChips };
