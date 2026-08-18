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

  const ref = React.useRef<HTMLDivElement>(null);
  const chipsOf = (root: HTMLElement | null) =>
    Array.from(root?.querySelectorAll<HTMLElement>('[role="radio"]:not([disabled])') ?? []);

  // Roving tabindex lives on the group rather than on each chip, because a chip
  // cannot know whether it is the first one — and with nothing selected the
  // group still needs exactly one tab stop, or it drops out of the tab order
  // entirely. Reconciled on every render (no dependency array) so it stays
  // correct when chips are added, removed or reordered. This is what the
  // standing TODO asked for: the component announced `role="radiogroup"` and
  // shipped one tab stop per chip with inert arrow keys, advertising a pattern
  // it did not implement.
  React.useLayoutEffect(() => {
    const chips = chipsOf(ref.current);
    if (!chips.length) return;
    const checked = chips.findIndex((c) => c.getAttribute("aria-checked") === "true");
    const stop = checked === -1 ? 0 : checked;
    chips.forEach((c, i) => {
      c.tabIndex = i === stop ? 0 : -1;
    });
  });

  // In the ARIA radio pattern an arrow key moves focus *and* selects, which is
  // why this calls setValue rather than only focusing. It reads the chip's own
  // `data-value` instead of firing a synthetic click, so a consumer's per-chip
  // `onClick` is not invoked for a keyboard traversal it never saw.
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const NAV = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!NAV.includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    const chips = chipsOf(ref.current);
    const current = chips.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return;
    event.preventDefault();
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? chips.length - 1
          : (current + (forward ? 1 : -1) + chips.length) % chips.length;
    const target = chips[next];
    target.focus();
    const nextValue = target.dataset.value;
    if (nextValue !== undefined) setValue(nextValue);
  };

  return (
    <ChoiceChipsContext.Provider value={{ value, setValue }}>
      <div
        ref={ref}
        role="radiogroup"
        onKeyDown={onKeyDown}
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

function ChoiceChip({ value, className, onClick, ...props }: ChoiceChipProps) {
  const ctx = React.useContext(ChoiceChipsContext);
  if (!ctx) throw new Error("ChoiceChip must be used within ChoiceChips");
  const selected = ctx.value === value;
  // No `tabIndex` here on purpose — ChoiceChips owns it (see the layout effect
  // there). `data-value` is what lets the group's arrow handler select a chip
  // without reaching back through React.
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected ? "true" : "false"}
      data-slot="choice-chip"
      data-value={value}
      data-state={selected ? "on" : "off"}
      onClick={(e) => {
        ctx.setValue(value);
        onClick?.(e);
      }}
      className={cn(
        // `motion-reduce:transition-none` is the same one-class branch the registry
        // already uses beside `transition-*` and `animate-*` (pricing-table,
        // trace-timeline, task-tray, citation-ref). Without it the hover/selection
        // colour fade has no reduced-motion path at all.
        "hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none rounded-lg border px-3 py-1.5 text-sm transition-colors motion-reduce:transition-none",
        selected && "ring-ring border-ring ring-2",
        className,
      )}
      {...props}
    />
  );
}

export { ChoiceChip, ChoiceChips };
