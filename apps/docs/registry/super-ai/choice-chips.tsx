"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface ChoiceChipsContextValue {
  value?: string;
  setValue: (value: string) => void;
}
const ChoiceChipsContext = React.createContext<ChoiceChipsContextValue | null>(null);

interface ChoiceChipsProps extends Omit<React.ComponentProps<"div">, "defaultValue"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

function ChoiceChips({
  value: valueProp,
  defaultValue,
  onValueChange,
  className,
  ...props
}: ChoiceChipsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const value = valueProp ?? internal;
  const setValue = React.useCallback(
    (next: string) => {
      setInternal(next);
      onValueChange?.(next);
    },
    [onValueChange],
  );
  return (
    <ChoiceChipsContext.Provider value={{ value, setValue }}>
      <div
        role="radiogroup"
        data-slot="choice-chips"
        className={cn("flex flex-wrap gap-2", className)}
        {...props}
      />
    </ChoiceChipsContext.Provider>
  );
}

interface ChoiceChipProps extends React.ComponentProps<"button"> {
  value: string;
}

function ChoiceChip({ value, className, ...props }: ChoiceChipProps) {
  const ctx = React.useContext(ChoiceChipsContext);
  if (!ctx) throw new Error("ChoiceChip must be used within ChoiceChips");
  const selected = ctx.value === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      data-slot="choice-chip"
      data-state={selected ? "on" : "off"}
      onClick={() => ctx.setValue(value)}
      className={cn(
        "hover:bg-accent hover:text-accent-foreground rounded-lg border px-3 py-1.5 text-sm transition-colors",
        selected && "ring-ring border-ring ring-2",
        className,
      )}
      {...props}
    />
  );
}

export { ChoiceChip, ChoiceChips };
