"use client";

import * as React from "react";

import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { GenSettingsBar, GenSettingsItem } from "@/registry/super-ai/gen-settings-bar";

/**
 * ModelBar — node-docked presentation of the gen-settings-bar engine.
 *
 * gen-settings-bar is composition-based (GenSettingsBar container + GenSettingsItem
 * control) and exports no segment config type, so the config union lives here;
 * every segment renders through GenSettingsItem inside a GenSettingsBar toolbar pill.
 */
export type ModelBarSegment =
  | { kind: "toggle"; id: string; label: string; value: boolean; disabled?: boolean }
  | { kind: "percent"; id: string; label: string; value: number | "auto"; disabled?: boolean }
  | { kind: "seed"; id: string; label?: string; value: number | "auto"; disabled?: boolean }
  | {
      kind: "model" | "aspect" | "resolution" | "quality" | "duration";
      id: string;
      label?: string;
      /** Current option value; `number` initial values match `number[]` options via `String()`. */
      value: string | number | "auto";
      options: Array<{ value: string; label: string }> | string[] | number[];
      disabled?: boolean;
    };

export interface ModelBarPatch {
  id: string;
  kind: ModelBarSegment["kind"];
  value: string | number | boolean | "auto";
}

interface ModelBarProps extends Omit<React.ComponentProps<"div">, "onChange" | "children"> {
  segments: ModelBarSegment[];
  onChange: (patch: ModelBarPatch) => void;
  /** Disable every segment control (set while the parent node is `streaming`). */
  disabled?: boolean;
}

/** Segments past this count collapse into the "⋯" overflow menu. */
const MAX_VISIBLE_SEGMENTS = 6;

type ModelBarOptionSegment = Extract<ModelBarSegment, { options: unknown }>;
type ModelBarOption = { value: string; label: string };

/** Normalize the `options` shorthands: `string[]`/`number[]` become `{ value, label }` via `String(v)`. */
function normalizeOptions(segment: ModelBarOptionSegment): ModelBarOption[] {
  return (segment.options as Array<ModelBarOption | string | number>).map((option) =>
    typeof option === "object" ? option : { value: String(option), label: String(option) },
  );
}

function formatValue(segment: ModelBarSegment): string {
  if (segment.kind === "toggle") return segment.value ? "On" : "Off";
  if (segment.value === "auto") return "Auto";
  if (segment.kind === "percent") return `${segment.value}%`;
  if (segment.kind === "seed") return String(segment.value);
  const current = String(segment.value);
  return normalizeOptions(segment).find((option) => option.value === current)?.label ?? current;
}

/**
 * Advance a segment to its next value: toggles flip, percent steps by 10 with a live
 * `"auto"` stop (auto → 0 → 10 … → 100 → auto), seed re-rolls, option kinds cycle.
 * Duration rings end with a trailing `"auto"` stop (option1 → … → optionN → auto → option1);
 * any other option kind currently at `"auto"` re-enters the ring at the first option.
 */
function nextValue(segment: ModelBarSegment): ModelBarPatch["value"] {
  if (segment.kind === "toggle") return !segment.value;
  if (segment.kind === "percent") {
    if (segment.value === "auto") return 0;
    return segment.value >= 100 ? "auto" : Math.min(segment.value + 10, 100);
  }
  if (segment.kind === "seed") return Math.floor(Math.random() * 1_000_000);
  const ring: Array<string | "auto"> = normalizeOptions(segment).map((option) => option.value);
  if (segment.kind === "duration" && !ring.includes("auto")) ring.push("auto");
  if (ring.length === 0) return segment.value;
  const index = ring.indexOf(String(segment.value));
  return ring[(index + 1) % ring.length];
}

interface ModelBarSegmentControlProps {
  segment: ModelBarSegment;
  onChange: (patch: ModelBarPatch) => void;
  /** Resolved disabled state: bar-level `disabled` OR the segment's own flag. */
  disabled: boolean;
  className?: string;
}

/** One segment, rendered through the gen-settings-bar engine's GenSettingsItem. */
function ModelBarSegmentControl({ segment, onChange, disabled, className }: ModelBarSegmentControlProps) {
  const label = segment.label ? <span data-slot="model-bar-segment-label">{segment.label}</span> : null;
  const value = (
    <span data-slot="model-bar-segment-value" className="text-foreground">
      {formatValue(segment)}
    </span>
  );

  // data-slot spread order: GenSettingsItem spreads our props after its own, so this slot identity replaces the engine's "gen-settings-item" — intended, shadcn-style.
  if (segment.kind === "model") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <GenSettingsItem
              data-slot="model-bar-segment"
              data-kind={segment.kind}
              disabled={disabled}
              className={className}
            />
          }
        >
          {label}
          {value}
          <ChevronDown aria-hidden className="size-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {normalizeOptions(segment).map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => {
                if (option.value === String(segment.value)) return; // no-op selections emit nothing
                onChange({ id: segment.id, kind: segment.kind, value: option.value });
              }}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const isToggle = segment.kind === "toggle";
  return (
    <GenSettingsItem
      data-slot="model-bar-segment"
      data-kind={segment.kind}
      data-state={isToggle ? (segment.value ? "on" : "off") : undefined}
      role={isToggle ? "switch" : undefined}
      aria-checked={isToggle ? segment.value === true : undefined}
      // Toggles alone get an aria-label (aria-checked carries their state); every other kind
      // exposes its visible label + value text as the accessible name (e.g. "Prompt influence 30%").
      aria-label={isToggle ? segment.label : undefined}
      disabled={disabled}
      className={className}
      onClick={() => {
        const next = nextValue(segment);
        if (next === segment.value) return; // skip patches that would not change anything
        onChange({ id: segment.id, kind: segment.kind, value: next });
      }}
    >
      {label}
      {value}
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
  const visible = segments.slice(0, MAX_VISIBLE_SEGMENTS);
  const overflow = segments.slice(MAX_VISIBLE_SEGMENTS);
  return (
    <GenSettingsBar
      aria-label="Model settings"
      {...props}
      data-slot="model-bar"
      aria-disabled={disabled || undefined}
      disabled={disabled}
      className={cn("bg-card rounded-lg", className)}
    >
      {visible.map((segment, index) => (
        <React.Fragment key={segment.id}>
          {index > 0 ? <ModelBarSeparator /> : null}
          <ModelBarSegmentControl
            segment={segment}
            onChange={onChange}
            disabled={disabled || segment.disabled === true}
          />
        </React.Fragment>
      ))}
      {overflow.length > 0 ? (
        <>
          <ModelBarSeparator />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <GenSettingsItem
                  data-slot="model-bar-overflow-trigger"
                  aria-label="More settings"
                  disabled={disabled}
                />
              }
            >
              ⋯
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-slot="model-bar-overflow">
              {overflow.map((segment) => (
                // closeOnClick={false}: cycling/toggling an overflowed segment keeps the menu open.
                <DropdownMenuItem key={segment.id} closeOnClick={false} className="p-0">
                  <ModelBarSegmentControl
                    segment={segment}
                    onChange={onChange}
                    disabled={disabled || segment.disabled === true}
                    className="w-full justify-between"
                  />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : null}
    </GenSettingsBar>
  );
}

export { ModelBar };
export type { ModelBarProps };
