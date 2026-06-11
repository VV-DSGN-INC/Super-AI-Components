"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { GenSettingsBar, GenSettingsItem } from "@/registry/super-ai/gen-settings-bar";

/**
 * ModelBar — node-docked presentation of the gen-settings-bar engine.
 *
 * gen-settings-bar is composition-based (GenSettingsBar container + GenSettingsItem
 * control) and exports no segment config type, so the config union lives here;
 * every segment renders through GenSettingsItem inside a GenSettingsBar toolbar pill.
 */
export type ModelBarSegment = {
  kind: "model" | "aspect" | "resolution" | "quality" | "duration" | "seed" | "toggle" | "percent";
  id: string;
  label?: string;
  value: string | number | boolean | "auto";
  options?: Array<{ value: string; label: string }> | number[];
};

export type ModelBarPatch = { id: string; value: ModelBarSegment["value"] };

interface ModelBarProps extends Omit<React.ComponentProps<"div">, "onChange" | "children"> {
  segments: ModelBarSegment[];
  onChange: (patch: ModelBarPatch) => void;
  /** Disable every segment control (set while the parent node is `streaming`). */
  disabled?: boolean;
}

/** Segments past this count collapse into the "⋯" overflow menu. */
const MAX_VISIBLE_SEGMENTS = 6;

function optionValues(segment: ModelBarSegment): Array<string | number> {
  return (segment.options ?? []).map((o) => (typeof o === "number" ? o : o.value));
}

function formatValue(segment: ModelBarSegment): string {
  const { kind, value, options } = segment;
  if (value === "auto") return "Auto";
  if (kind === "toggle") return value ? "On" : "Off";
  if (kind === "percent") return `${value}%`;
  const match = options?.find(
    (o): o is { value: string; label: string } => typeof o !== "number" && o.value === value,
  );
  if (match) return match.label;
  if (kind === "duration" && typeof value === "number") return `${value}s`;
  return String(value);
}

/** Advance a segment to its next value: toggles flip, options cycle (`"auto"` re-enters at the first option), percent steps by 10 and wraps, seed re-rolls. */
function nextValue(segment: ModelBarSegment): ModelBarSegment["value"] {
  if (segment.kind === "toggle") return !segment.value;
  const values = optionValues(segment);
  if (values.length > 0) {
    const index = values.findIndex((v) => v === segment.value);
    return values[(index + 1) % values.length];
  }
  if (segment.kind === "percent" && typeof segment.value === "number") {
    return segment.value >= 100 ? 0 : Math.min(segment.value + 10, 100);
  }
  if (segment.kind === "seed") return Math.floor(Math.random() * 1_000_000);
  return segment.value;
}

interface ModelBarSegmentControlProps {
  segment: ModelBarSegment;
  onChange: (patch: ModelBarPatch) => void;
  className?: string;
}

/** One segment, rendered through the gen-settings-bar engine's GenSettingsItem. */
function ModelBarSegmentControl({ segment, onChange, className }: ModelBarSegmentControlProps) {
  const isToggle = segment.kind === "toggle";
  return (
    <GenSettingsItem
      data-slot="model-bar-segment"
      data-kind={segment.kind}
      data-state={isToggle ? (segment.value ? "on" : "off") : undefined}
      role={isToggle ? "switch" : undefined}
      aria-checked={isToggle ? segment.value === true : undefined}
      aria-label={segment.label}
      className={className}
      onClick={() => onChange({ id: segment.id, value: nextValue(segment) })}
    >
      {segment.label ? <span data-slot="model-bar-segment-label">{segment.label}</span> : null}
      <span data-slot="model-bar-segment-value" className="text-foreground">
        {formatValue(segment)}
      </span>
    </GenSettingsItem>
  );
}

function ModelBarSeparator() {
  return <span aria-hidden data-slot="model-bar-separator" className="bg-border h-3.5 w-px shrink-0" />;
}

/**
 * Node-docked params strip: a config-driven pill of generation settings rendered
 * under a flow node. Controlled — every click emits an `onChange` patch.
 */
function ModelBar({ segments, onChange, disabled = false, className, ...props }: ModelBarProps) {
  const [overflowOpen, setOverflowOpen] = React.useState(false);
  const visible = segments.slice(0, MAX_VISIBLE_SEGMENTS);
  const overflow = segments.slice(MAX_VISIBLE_SEGMENTS);
  return (
    <GenSettingsBar
      aria-label="Model settings"
      {...props}
      data-slot="model-bar"
      aria-disabled={disabled || undefined}
      disabled={disabled}
      className={cn("bg-card relative rounded-lg", className)}
    >
      {visible.map((segment, index) => (
        <React.Fragment key={segment.id}>
          {index > 0 ? <ModelBarSeparator /> : null}
          <ModelBarSegmentControl segment={segment} onChange={onChange} />
        </React.Fragment>
      ))}
      {overflow.length > 0 ? (
        <>
          <ModelBarSeparator />
          <GenSettingsItem
            data-slot="model-bar-overflow-trigger"
            aria-label="More settings"
            aria-expanded={overflowOpen}
            onClick={() => setOverflowOpen((open) => !open)}
          >
            ⋯
          </GenSettingsItem>
          {overflowOpen ? (
            <div
              data-slot="model-bar-overflow"
              className="bg-popover text-popover-foreground absolute top-full right-0 z-10 mt-1 flex min-w-32 flex-col items-stretch gap-0.5 rounded-md border p-1 shadow-md"
            >
              {overflow.map((segment) => (
                <ModelBarSegmentControl
                  key={segment.id}
                  segment={segment}
                  onChange={onChange}
                  className="justify-between"
                />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </GenSettingsBar>
  );
}

export { ModelBar };
export type { ModelBarProps };
