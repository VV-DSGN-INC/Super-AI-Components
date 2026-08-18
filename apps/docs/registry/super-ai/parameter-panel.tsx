"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FieldRow, UnitInput } from "@/registry/super-ai/field-row";
import { ResetAffordance } from "@/registry/super-ai/reset-affordance";
import { cn } from "@/lib/utils";

/**
 * Parameter Panel — Generation params with plain-language ends
 *
 * Spec: docs/design-system/component-specs.md#e3-parameter-panel
 * States: slider-unit · segmented · tabbed · reset-all · inline-education
 *
 * This is the component A6 `field-row` exists for — every row below composes
 * `FieldRow` for its label/control/hint/reset grid rather than restyling it.
 * "reset-all" is A11 `reset-affordance` at `scope="group"`, wired to the
 * panel header (D13: the retrofit that gave `field-row` its `reset` slot).
 */

interface ParameterPanelProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** Panel heading. Omit for a bare stack of rows nested inside something else's heading. */
  title?: React.ReactNode;
  /**
   * Whether any parameter in the panel differs from its default. Drives the
   * group-scope reset affordance's `modified` vs `at-default` state — same
   * contract as a row-level reset, just clearing every row underneath at once.
   */
  modified?: boolean;
  /** Present only when the panel offers a group-level reset (the "reset-all" state). */
  onResetAll?: () => void;
  resetAllLabel?: string;
}

function ParameterPanel({
  title,
  modified = false,
  onResetAll,
  resetAllLabel = "Reset all",
  className,
  children,
  ...props
}: ParameterPanelProps) {
  const hasHeader = title !== undefined || onResetAll !== undefined;
  return (
    <div data-slot="parameter-panel" className={cn("w-full space-y-4", className)} {...props}>
      {hasHeader ? (
        <div data-slot="parameter-panel-header" className="flex items-center justify-between gap-2">
          {title !== undefined ? (
            <h3 data-slot="parameter-panel-title" className="text-foreground text-sm font-semibold">
              {title}
            </h3>
          ) : (
            <span />
          )}
          {onResetAll ? (
            <ResetAffordance
              scope="group"
              state={modified ? "modified" : "default"}
              onReset={onResetAll}
              label={resetAllLabel}
            />
          ) : null}
        </div>
      ) : null}
      <div data-slot="parameter-panel-rows" className="space-y-4">
        {children}
      </div>
    </div>
  );
}

interface ParameterSliderProps extends Omit<React.ComponentProps<"div">, "onChange" | "defaultValue"> {
  label: string;
  value: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  /** Suffix shown in the numeric field — %, s, ×, px. Never separate label text (A6). */
  unit?: string;
  /**
   * Human-language ends, e.g. `["More variable", "More literal"]`. Never the
   * raw `min`/`max` numbers — those stay visible in the number field instead.
   */
  endpoints?: readonly [string, string];
  /**
   * One-line explanation of what the parameter does. Spec: "a slot, not a
   * tooltip" — a tooltip hides the explanation that makes the control
   * usable. Rendered as `FieldRow`'s `hint`, so it's always-visible text
   * wired to the slider via `aria-describedby`, reachable without hover.
   * This is the "inline-education" state.
   */
  description?: string;
  onValueChange?: (value: number) => void;
  /** Row-scope reset (A11), typically a `<ResetAffordance />`. */
  reset?: React.ReactNode;
  disabled?: boolean;
}

function ParameterSlider({
  label,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  endpoints,
  description,
  onValueChange,
  reset,
  disabled,
  className,
  ...props
}: ParameterSliderProps) {
  const valueText = `${value}${unit}`;

  return (
    <FieldRow label={label} hint={description} reset={reset} className={className} {...props}>
      {(_controlId, describedBy) => (
        <div data-slot="parameter-slider" className="flex-1 space-y-1.5">
          <div className="flex items-center gap-3">
            {/*
              Composed directly from the Base UI `Slider` primitive rather
              than the vendored `components/ui/slider.tsx` wrapper: that
              wrapper doesn't forward `getAriaLabel` / `getAriaValueText` to
              its `Thumb`, and those are exactly what give a slider a real
              accessible name and a spoken value ("70%", not "70") — see
              component-build-brief.md's a11y gate. `FieldRow`'s own
              `<label for>` can't reach this nested control (its target
              isn't a labelable element), so the label text is duplicated
              onto the thumb via `getAriaLabel` instead.
            */}
            <SliderPrimitive.Root
              value={value}
              defaultValue={defaultValue}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              onValueChange={(next) => onValueChange?.(next as number)}
              className="w-full"
            >
              <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50">
                <SliderPrimitive.Track
                  data-slot="parameter-slider-track"
                  className="bg-muted relative h-1 w-full grow overflow-hidden rounded-full select-none"
                >
                  <SliderPrimitive.Indicator
                    data-slot="parameter-slider-range"
                    className="bg-primary h-full select-none"
                  />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb
                  data-slot="parameter-slider-thumb"
                  aria-describedby={describedBy}
                  getAriaLabel={() => label}
                  getAriaValueText={() => valueText}
                  className="border-ring bg-background ring-ring/50 relative block size-3 shrink-0 rounded-full border shadow-sm transition-[box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
                />
              </SliderPrimitive.Control>
            </SliderPrimitive.Root>
            <UnitInput
              aria-label={`${label} value`}
              aria-describedby={describedBy}
              unit={unit}
              value={value}
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              onValueChange={onValueChange}
              className="shrink-0"
            />
          </div>
          {endpoints ? (
            <div
              data-slot="parameter-slider-endpoints"
              aria-hidden="true"
              className="text-muted-foreground flex justify-between text-xs"
            >
              <span>{endpoints[0]}</span>
              <span>{endpoints[1]}</span>
            </div>
          ) : null}
        </div>
      )}
    </FieldRow>
  );
}

interface ParameterSegmentedOption {
  value: string;
  label: string;
}

interface ParameterSegmentedProps extends Omit<React.ComponentProps<"div">, "onChange" | "defaultValue"> {
  label: string;
  options: ParameterSegmentedOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Row-scope reset (A11), typically a `<ResetAffordance />`. */
  reset?: React.ReactNode;
  disabled?: boolean;
}

function ParameterSegmented({
  label,
  options,
  value: valueProp,
  defaultValue,
  onValueChange,
  reset,
  disabled,
  className,
  ...props
}: ParameterSegmentedProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const value = valueProp ?? internal;
  const groupValue = React.useMemo(() => (value ? [value] : []), [value]);

  // Base UI's ToggleGroup is a multi-select toggle set, not a radio group —
  // it reports an empty array when the already-active item is pressed again.
  // A parameter always holds a value, so ignore empty commits and only
  // forward genuine changes (same enforcement as mode-tabs.tsx / D4).
  const handleValueChange = React.useCallback(
    (next: string[]) => {
      const [nextValue] = next;
      if (!nextValue) return;
      setInternal(nextValue);
      onValueChange?.(nextValue);
    },
    [onValueChange],
  );

  return (
    <FieldRow label={label} reset={reset} className={className} {...props}>
      {() => (
        <ToggleGroup
          data-slot="parameter-segmented"
          value={groupValue}
          onValueChange={handleValueChange}
          disabled={disabled}
          aria-label={label}
          // role="group" (what the underlying primitive renders) doesn't
          // support aria-orientation per the ARIA attribute-allowance
          // table — same axe `aria-allowed-attr` fix already applied at
          // modality-rail.tsx and mode-tabs.tsx call sites; see
          // docs/design-system/a11y-baseline.md.
          aria-orientation={undefined}
          className="w-fit"
        >
          {options.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value} data-slot="parameter-segmented-item">
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
    </FieldRow>
  );
}

interface ParameterTabsGroup {
  value: string;
  label: string;
  content: React.ReactNode;
}

interface ParameterTabsProps extends Omit<React.ComponentProps<"div">, "onChange" | "defaultValue"> {
  groups: ParameterTabsGroup[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

function ParameterTabs({ groups, value, defaultValue, onValueChange, className, ...props }: ParameterTabsProps) {
  return (
    <Tabs
      data-slot="parameter-tabs"
      value={value}
      defaultValue={defaultValue ?? groups[0]?.value}
      onValueChange={(next) => {
        if (typeof next === "string") onValueChange?.(next);
      }}
      className={cn("w-full", className)}
      {...props}
    >
      {/* tabsListVariants' `default` variant pairs text-muted-foreground
          (its cva base) with bg-muted (its default variant value) — 4.34:1
          in this token set, under the 4.5:1 minimum. Rebinding the variable
          rather than restyling the trigger slots: composed children carry
          their own muted classes and a slot-level override can't reach
          them. See docs/design-system/a11y-baseline.md. */}
      <TabsList
        data-slot="parameter-tabs-list"
        className="[--muted-foreground:var(--accent-foreground)]"
      >
        {groups.map((group) => (
          <TabsTrigger key={group.value} value={group.value}>
            {group.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {groups.map((group) => (
        <TabsContent key={group.value} value={group.value} data-slot="parameter-tabs-panel" className="space-y-4 pt-3">
          {group.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export { ParameterPanel, ParameterSlider, ParameterSegmented, ParameterTabs };
export type {
  ParameterPanelProps,
  ParameterSliderProps,
  ParameterSegmentedProps,
  ParameterSegmentedOption,
  ParameterTabsProps,
  ParameterTabsGroup,
};
