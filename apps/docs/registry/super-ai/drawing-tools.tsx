"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ParameterSlider } from "@/registry/super-ai/parameter-panel";
import { cn } from "@/lib/utils";

/**
 * Drawing Tools — Tool + shape flyouts
 *
 * Spec: docs/design-system/component-specs.md#i5-drawing-tools
 * States: tool-rail · shape-rail · brush-controls · swatch-grid · mask-mode
 *
 * Three decisions from the spec are load-bearing and are enforced here rather
 * than merely described:
 *
 * 1. **Rails are toggle-groups with flyouts, not nested menus.** A rail button
 *    commits its tool on a single click. A tool that has alternates gets a
 *    *sibling* flyout trigger — never a button inside a button — and the flyout
 *    holds one flat list of alternates with no further trigger inside it.
 *    Choosing an alternate makes the rail button *become* that alternate, so
 *    coming back to it later is one click and never re-opens the flyout.
 * 2. **Size, hardness and opacity are A6 `field-row` instances.** They compose
 *    E3's `ParameterSlider`, which is A6 with a named slider thumb — so the
 *    brush and the property inspector are literally the same grid, not two
 *    grids that look alike.
 * 3. **Mask mode connects this to generation.** Brushing a region is how
 *    inpainting gets its input, so mask mode names what consumes the mask and
 *    reports coverage in a live region. Colour is meaningless to a mask, so the
 *    swatch grid stands down while mask mode is on.
 */

type DrawingMode = "draw" | "mask";

interface DrawingToolVariant {
  id: string;
  /**
   * The real accessible name. Rail buttons are icon-only, so this ships as
   * button content (visually hidden) rather than as a tooltip — a tooltip is
   * never the only source of a name.
   */
  label: string;
  icon?: React.ReactNode;
}

interface DrawingToolOption extends DrawingToolVariant {
  /**
   * Alternates for this tool, shown in a flyout. One level only: a flyout never
   * contains another flyout trigger, because that is the nested menu the spec
   * rules out.
   */
  variants?: DrawingToolVariant[];
}

interface DrawingSwatch {
  id: string;
  /**
   * Names the colour — "Coral", "Ink", "Brand primary". A swatch identified only
   * by its fill conveys its meaning by colour alone and is invisible to anyone
   * who cannot see it.
   */
  name: string;
  /** Any CSS colour. This is caller data — a user palette — not chrome. */
  value: string;
}

interface DrawingBrush {
  /** Diameter in px. */
  size: number;
  /** Edge falloff, 0–100. */
  hardness: number;
  /** 0–100. */
  opacity: number;
}

interface DrawingToolsProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  /** The tool rail. Icon-only buttons, so every option needs a real `label`. */
  tools: DrawingToolOption[];
  activeToolId?: string;
  onToolChange?: (id: string) => void;
  toolRailLabel?: string;
  /** The shape rail. Same rail, different axis — present only when the surface draws shapes. */
  shapes?: DrawingToolOption[];
  activeShapeId?: string;
  onShapeChange?: (id: string) => void;
  shapeRailLabel?: string;
  /** Brush controls. Rendered as three A6 rows; omit to hide the section entirely. */
  brush?: DrawingBrush;
  onBrushChange?: (next: DrawingBrush) => void;
  /** The palette. Suppressed in mask mode, where a colour has nothing to mean. */
  swatches?: DrawingSwatch[];
  activeSwatchId?: string;
  onSwatchChange?: (id: string) => void;
  swatchGridLabel?: string;
  /** "mask" turns the brush into an inpaint region selector. */
  mode?: DrawingMode;
  /** Supply this to render the draw/mask switch. Without it the mode is caller-fixed. */
  onModeChange?: (mode: DrawingMode) => void;
  /** Share of the canvas currently masked, 0–100. Reported in a live region. */
  maskCoverage?: number;
  /** Names what the mask is input to — the whole point of mask mode. */
  maskTargetLabel?: string;
  onClearMask?: () => void;
}

function useSingleSelect(onSelect?: (id: string) => void) {
  // Base UI's toggle group is a multi-select toggle set, not a radio group: it
  // reports an empty array when the already-active item is pressed again. A
  // rail always holds a tool, so ignore empty commits and forward only genuine
  // changes (same enforcement as mode-tabs.tsx and parameter-panel.tsx).
  return React.useCallback(
    (next: string[]) => {
      const [id] = next;
      if (id) onSelect?.(id);
    },
    [onSelect],
  );
}

function DrawingRailItem({
  item,
  activeId,
  onSelect,
}: {
  item: DrawingToolOption;
  activeId?: string;
  onSelect?: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const variants = item.variants ?? [];
  const activeVariant = variants.find((variant) => variant.id === activeId);

  // The rail button *is* whichever alternate was last chosen, and it stays that
  // way after you switch to another tool and back. That is what keeps tool
  // switching one click deep: the flyout is how you *change* the alternate,
  // never how you re-select it. Remembering is render-phase derived state (the
  // documented React "adjust state while rendering" pattern) so the face never
  // flashes back to the parent tool for a frame.
  const [remembered, setRemembered] = React.useState<string | undefined>(
    () => variants.find((variant) => variant.id === activeId)?.id,
  );
  if (activeVariant && activeVariant.id !== remembered) setRemembered(activeVariant.id);
  const current: DrawingToolVariant =
    activeVariant ?? variants.find((variant) => variant.id === remembered) ?? item;

  const button = (
    <ToggleGroupItem
      value={current.id}
      data-slot="drawing-tools-tool"
      data-tool={item.id}
      className="text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring size-8 rounded-md p-0 focus-visible:ring-2 focus-visible:outline-none"
    >
      <span aria-hidden="true" className="flex size-4 items-center justify-center [&_svg]:size-full">
        {current.icon}
      </span>
      <span className="sr-only">{current.label}</span>
    </ToggleGroupItem>
  );

  if (variants.length === 0) return button;

  return (
    // A span, not a button: the rail button and the flyout trigger are siblings.
    // Putting the trigger inside the tool button would be a nested interactive.
    <span data-slot="drawing-tools-tool-group" className="flex items-center">
      {button}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              data-slot="drawing-tools-flyout-trigger"
              aria-label={`Show ${item.label} alternates`}
              className="text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex h-8 w-4 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
            />
          }
        >
          <ChevronDown aria-hidden="true" className="size-3" />
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-48 gap-1 p-1">
          <ToggleGroup
            data-slot="drawing-tools-flyout"
            // The vendored wrapper does not forward `orientation` to the Base UI
            // primitive — it only writes `data-orientation` for styling — so the
            // column layout is set explicitly in `className` below rather than
            // being inferred from this prop (same as modality-rail.tsx).
            orientation="vertical"
            // role="group" — what the primitive renders — does not support
            // aria-orientation per the ARIA attribute-allowance table, and axe
            // fails it as `aria-allowed-attr`. Same suppression as
            // modality-rail.tsx, mode-tabs.tsx and parameter-panel.tsx.
            aria-orientation={undefined}
            aria-label={`${item.label} alternates`}
            value={activeVariant ? [activeVariant.id] : []}
            onValueChange={(next) => {
              const [id] = next;
              if (!id) return;
              onSelect?.(id);
              setOpen(false);
            }}
            className="flex w-full flex-col gap-0.5"
          >
            {variants.map((variant) => (
              <ToggleGroupItem
                key={variant.id}
                value={variant.id}
                data-slot="drawing-tools-flyout-item"
                className="text-foreground hover:bg-accent hover:text-accent-foreground w-full items-center justify-start gap-2 px-2 py-1.5 text-left"
              >
                <span
                  aria-hidden="true"
                  className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-full"
                >
                  {variant.icon}
                </span>
                <span className="flex-1 text-sm">{variant.label}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </PopoverContent>
      </Popover>
    </span>
  );
}

function DrawingRail({
  slot,
  label,
  items,
  activeId,
  onSelect,
}: {
  slot: string;
  label: string;
  items: DrawingToolOption[];
  activeId?: string;
  onSelect?: (id: string) => void;
}) {
  const value = React.useMemo(() => (activeId ? [activeId] : []), [activeId]);
  const handleValueChange = useSingleSelect(onSelect);

  return (
    <ToggleGroup
      data-slot={slot}
      aria-label={label}
      // See the note on the flyout group above — role="group" cannot carry
      // aria-orientation, and the vendored wrapper sets it by default.
      aria-orientation={undefined}
      value={value}
      onValueChange={handleValueChange}
      className="w-full flex-wrap"
    >
      {items.map((item) => (
        <DrawingRailItem key={item.id} item={item} activeId={activeId} onSelect={onSelect} />
      ))}
    </ToggleGroup>
  );
}

function DrawingTools({
  tools,
  activeToolId,
  onToolChange,
  toolRailLabel = "Tool",
  shapes,
  activeShapeId,
  onShapeChange,
  shapeRailLabel = "Shape",
  brush,
  onBrushChange,
  swatches,
  activeSwatchId,
  onSwatchChange,
  swatchGridLabel = "Colour",
  mode = "draw",
  onModeChange,
  maskCoverage = 0,
  maskTargetLabel = "Inpaint",
  onClearMask,
  className,
  ...props
}: DrawingToolsProps) {
  const handleModeChange = useSingleSelect((next) => onModeChange?.(next as DrawingMode));
  const isMask = mode === "mask";
  // Colour is meaningless to a mask — a mask is a region, not a stroke — so the
  // palette stands down rather than sitting there inert.
  const showSwatches = !isMask && swatches !== undefined && swatches.length > 0;

  return (
    <div
      data-slot="drawing-tools"
      data-mode={mode}
      className={cn("bg-background flex w-full flex-col gap-3 rounded-lg border p-3", className)}
      {...props}
    >
      {onModeChange ? (
        <ToggleGroup
          data-slot="drawing-tools-modes"
          aria-label="Canvas mode"
          aria-orientation={undefined}
          value={[mode]}
          onValueChange={handleModeChange}
          className="w-fit"
        >
          <ToggleGroupItem value="draw" data-slot="drawing-tools-mode">
            Draw
          </ToggleGroupItem>
          <ToggleGroupItem value="mask" data-slot="drawing-tools-mode">
            Mask
          </ToggleGroupItem>
        </ToggleGroup>
      ) : null}

      <DrawingRail
        slot="drawing-tools-tool-rail"
        label={toolRailLabel}
        items={tools}
        activeId={activeToolId}
        onSelect={onToolChange}
      />

      {shapes && shapes.length > 0 ? (
        <DrawingRail
          slot="drawing-tools-shape-rail"
          label={shapeRailLabel}
          items={shapes}
          activeId={activeShapeId}
          onSelect={onShapeChange}
        />
      ) : null}

      {brush ? (
        <div data-slot="drawing-tools-brush" className="flex flex-col gap-3">
          {/*
            A6 `field-row` instances by way of E3's `ParameterSlider`, which is
            A6 plus a slider whose thumb actually has an accessible name. The
            brush and the property inspector therefore share one grid rather
            than two that resemble each other. Note we never pass `data-slot`
            down — that would replace `field-row`'s own slot and hide the
            composition.
          */}
          <ParameterSlider
            label="Size"
            value={brush.size}
            min={1}
            max={200}
            unit="px"
            onValueChange={(size) => onBrushChange?.({ ...brush, size })}
          />
          <ParameterSlider
            label="Hardness"
            value={brush.hardness}
            min={0}
            max={100}
            unit="%"
            endpoints={["Soft edge", "Hard edge"]}
            onValueChange={(hardness) => onBrushChange?.({ ...brush, hardness })}
          />
          <ParameterSlider
            label="Opacity"
            value={brush.opacity}
            min={0}
            max={100}
            unit="%"
            onValueChange={(opacity) => onBrushChange?.({ ...brush, opacity })}
          />
        </div>
      ) : null}

      {showSwatches ? (
        <div
          data-slot="drawing-tools-swatch-grid"
          role="group"
          aria-label={swatchGridLabel}
          className="grid grid-cols-8 gap-1.5"
        >
          {swatches.map((swatch) => {
            const selected = swatch.id === activeSwatchId;
            return (
              <button
                key={swatch.id}
                type="button"
                data-slot="drawing-tools-swatch"
                // Selection is programmatic *and* marked with a check — never
                // by the ring alone, which would be state carried by colour.
                aria-pressed={selected}
                onClick={() => onSwatchChange?.(swatch.id)}
                style={{ backgroundColor: swatch.value }}
                className={cn(
                  "border-border ring-ring focus-visible:ring-ring flex size-6 items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:outline-none",
                  selected && "ring-2",
                )}
              >
                <span className="sr-only">{swatch.name}</span>
                {selected ? (
                  <span
                    aria-hidden="true"
                    className="bg-background text-foreground flex size-3.5 items-center justify-center rounded-full"
                  >
                    <Check className="size-2.5" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {isMask ? (
        <div data-slot="drawing-tools-mask" className="flex flex-col gap-1.5 border-t pt-3">
          <div className="flex items-center justify-between gap-2">
            <p data-slot="drawing-tools-mask-target" className="text-foreground text-sm font-medium">
              Masked region feeds {maskTargetLabel}
            </p>
            {onClearMask ? (
              <button
                type="button"
                data-slot="drawing-tools-mask-clear"
                onClick={onClearMask}
                className="text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring rounded-md px-2 py-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
              >
                Clear mask
              </button>
            ) : null}
          </div>
          <p
            data-slot="drawing-tools-mask-status"
            role="status"
            className="text-muted-foreground text-xs"
          >
            {maskCoverage > 0
              ? `Mask covers ${maskCoverage}% of the canvas. ${maskTargetLabel} regenerates only that region.`
              : `Nothing masked yet. Brush a region — that region is the input ${maskTargetLabel} receives.`}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export { DrawingTools };
export type {
  DrawingToolsProps,
  DrawingToolOption,
  DrawingToolVariant,
  DrawingSwatch,
  DrawingBrush,
  DrawingMode,
};
