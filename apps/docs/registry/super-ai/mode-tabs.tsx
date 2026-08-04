"use client";

import * as React from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Mode Tabs — Ask/Design/Build · Chat/Cowork · Standard/Director
 *
 * Spec: docs/design-system/component-specs.md#d4-mode-tabs
 * States: default · with-icon · with-tooltip
 */

interface ModeTabsOption {
  value: string;
  label: string;
  /** Rendered for "with-icon" and "with-tooltip"; ignored by "default". */
  icon?: React.ReactNode;
}

interface ModeTabsProps extends Omit<React.ComponentProps<"div">, "onChange" | "defaultValue"> {
  /** 2–5 mode options. Past five, reach for a select instead (spec range). */
  modes: ModeTabsOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * "default" renders text-only triggers. "with-icon" pairs an icon with a
   * visible label. "with-tooltip" renders icon-only triggers — the label
   * still ships as real (sr-only) button content, so the tooltip is a
   * sighted-user hint layered on top rather than the only source of the
   * accessible name (the same failure mode fixed for badges in
   * modality-rail.tsx's `ModalityRailBadge`).
   */
  variant?: "default" | "with-icon" | "with-tooltip";
  /** Group label read by assistive tech. Visually hidden — the visible UI is the modes themselves. */
  label?: string;
  /** Disables the whole group — e.g. while the surface consuming it is busy or gated. */
  disabled?: boolean;
}

function ModeTabs({
  modes,
  value: valueProp,
  defaultValue,
  onValueChange,
  variant = "default",
  label = "Mode",
  disabled = false,
  className,
  ...props
}: ModeTabsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const value = valueProp ?? internal;
  const groupValue = React.useMemo(() => (value ? [value] : []), [value]);

  // Base UI's ToggleGroup is a multi-select toggle set, not a radio group —
  // it reports an empty array when the already-active item is pressed again.
  // A mode is a working context (spec: "must survive a reload"), so it can
  // never end up unset from a click; ignore empty commits and only forward
  // genuine changes (same pattern as modality-rail.tsx's handleValueChange).
  const handleValueChange = React.useCallback(
    (next: string[]) => {
      const [nextValue] = next;
      if (!nextValue) return;
      setInternal(nextValue);
      onValueChange?.(nextValue);
    },
    [onValueChange],
  );

  const items = modes.map((mode) => {
    const showIcon = variant !== "default" && mode.icon;
    const trigger = (
      <ToggleGroupItem
        key={variant === "with-tooltip" ? undefined : mode.value}
        value={mode.value}
        data-slot="mode-tabs-item"
        className="gap-1.5"
      >
        {showIcon ? (
          <span aria-hidden="true" className="flex size-4 items-center justify-center [&_svg]:size-full">
            {mode.icon}
          </span>
        ) : null}
        <span className={variant === "with-tooltip" ? "sr-only" : undefined}>{mode.label}</span>
      </ToggleGroupItem>
    );

    if (variant !== "with-tooltip") return trigger;

    return (
      <Tooltip key={mode.value}>
        <TooltipTrigger render={trigger} />
        <TooltipContent side="bottom">{mode.label}</TooltipContent>
      </Tooltip>
    );
  });

  const list = (
    <ToggleGroup
      data-slot="mode-tabs-list"
      value={groupValue}
      onValueChange={handleValueChange}
      disabled={disabled}
      aria-label={label}
      // The underlying primitive renders role="group" with an aria-orientation
      // attribute computed from its own default orientation regardless of what
      // this wrapper is asked for — role="group" doesn't support
      // aria-orientation at all per the ARIA attribute-allowance table, so the
      // attribute is invalid here independent of its value. Suppress it
      // explicitly, matching the fix already applied at modality-rail.tsx's
      // three call sites (see docs/design-system/a11y-baseline.md).
      aria-orientation={undefined}
      className="w-fit"
    >
      {items}
    </ToggleGroup>
  );

  return (
    <div data-slot="mode-tabs" data-variant={variant} className={cn(className)} {...props}>
      {variant === "with-tooltip" ? <TooltipProvider>{list}</TooltipProvider> : list}
    </div>
  );
}

export { ModeTabs };
export type { ModeTabsOption, ModeTabsProps };
