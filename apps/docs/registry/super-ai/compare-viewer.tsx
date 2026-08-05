"use client";

import * as React from "react";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";

/**
 * Compare Viewer — two or more renders of the same thing, side by side.
 *
 * Spec: docs/design-system/component-specs.md#f5-compare-viewer
 * Modes: side · single · wipe
 *
 * Two rules from the spec do the work:
 *
 * 1. "Panes are numbered as well as labelled. In wipe or single view the label
 *    disappears; the number persists." A wipe has no room for two captions and
 *    single view shows one pane at a time, so the label is the thing that goes
 *    — but you still have to be able to say "two is sharper than one", which
 *    is why the number is never dropped.
 * 2. "A wipe is a mode, not a component." The before/after slider people build
 *    as its own widget is this component with `mode="wipe"`, which is what
 *    stops a product growing two incompatible comparison surfaces.
 */

type CompareMode = "side" | "single" | "wipe";

interface ComparePane {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface CompareViewerProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  /** Numbered in the order given; the number is what persists across modes. */
  panes: ComparePane[];
  mode?: CompareMode;
  onModeChange?: (mode: CompareMode) => void;
  /** `single` mode. Defaults to the first pane. */
  activePaneId?: string;
  /**
   * Not in the wave-4 spec's §6.15 API, which lists `activePaneId` with no way
   * to change it — leaving `single` mode switchable only by the caller
   * re-rendering with a different id, and giving the pane numbers nothing to
   * do. Added so the numbers can be the control they visually appear to be.
   */
  onActivePaneChange?: (id: string) => void;
  /** 0–100. `wipe` mode. Preserved across mode changes. */
  wipePosition?: number;
  onWipePositionChange?: (position: number) => void;
  /**
   * Zoom/pan/playhead sync group. Rendered as `data-sync-key` rather than
   * implemented here: this component never owns the media, so it cannot drive
   * a zoom it cannot see. Give every viewer that must move together the same
   * key and let whatever owns the media read it.
   */
  syncKey?: string;
}

const MODES: { id: CompareMode; label: string }[] = [
  { id: "side", label: "Side by side" },
  { id: "single", label: "Single" },
  { id: "wipe", label: "Wipe" },
];

/** The number is the pane's identity across every mode. */
function PaneNumber({ index }: { index: number }) {
  return (
    <span
      data-slot="compare-viewer-pane-number"
      className="bg-background text-foreground inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums"
    >
      {index + 1}
    </span>
  );
}

function CompareViewer({
  panes,
  mode = "side",
  onModeChange,
  activePaneId,
  onActivePaneChange,
  wipePosition = 50,
  onWipePositionChange,
  syncKey,
  className,
  ...props
}: CompareViewerProps) {
  const activeIndex = Math.max(
    0,
    panes.findIndex((p) => p.id === activePaneId),
  );

  return (
    <div
      data-slot="compare-viewer"
      data-mode={mode}
      data-sync-key={syncKey}
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ToggleGroup
          data-slot="compare-viewer-modes"
          size="sm"
          variant="outline"
          spacing={0}
          // `multiple` defaults to false, so this is already single-select:
          // pressing one mode unpresses the others.
          value={[mode] as string[]}
          onValueChange={(value) => {
            const next = value[0] as CompareMode | undefined;
            if (next) onModeChange?.(next);
          }}
          aria-label="Comparison mode"
          // The primitive renders role="group" with an aria-orientation that
          // role does not support, so the attribute is invalid here whatever
          // its value. Suppressed explicitly, matching mode-tabs.tsx and
          // modality-rail.tsx (see docs/design-system/a11y-baseline.md).
          aria-orientation={undefined}
        >
          {MODES.map((m) => (
            <ToggleGroupItem key={m.id} value={m.id} data-slot={`compare-viewer-mode-${m.id}`}>
              {m.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {/* Single mode: the numbers become the pane switcher, because they are
            the only pane identity that survives into this mode. */}
        {mode === "single" && onActivePaneChange ? (
          <div
            data-slot="compare-viewer-pane-switcher"
            role="group"
            aria-label="Visible pane"
            className="flex items-center gap-1"
          >
            {panes.map((pane, i) => (
              <button
                key={pane.id}
                type="button"
                onClick={() => onActivePaneChange(pane.id)}
                aria-pressed={i === activeIndex}
                // Never the number alone: the accessible name carries the
                // label too, so the control is meaningful without sight of
                // which pane is currently on screen.
                aria-label={`Show pane ${i + 1}: ${pane.label}`}
                className={cn(
                  "focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:outline-none",
                  i === activeIndex && "ring-ring ring-2",
                )}
              >
                <PaneNumber index={i} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {mode === "side" ? (
        <ResizablePanelGroup
          data-slot="compare-viewer-panes"
          // react-resizable-panels calls this `orientation`, not `direction`.
          orientation="horizontal"
          className="min-h-64 overflow-hidden rounded-lg border"
        >
          {panes.map((pane, i) => (
            <React.Fragment key={pane.id}>
              {i > 0 ? <ResizableHandle withHandle /> : null}
              <ResizablePanel data-slot="compare-viewer-pane" className="relative">
                <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                  <PaneNumber index={i} />
                  {/* The label exists only in side view — there is room for it
                      here and nowhere else. */}
                  <span
                    data-slot="compare-viewer-pane-label"
                    className="bg-background text-foreground rounded-full border px-2 py-0.5 text-xs"
                  >
                    {pane.label}
                  </span>
                </div>
                {pane.content}
              </ResizablePanel>
            </React.Fragment>
          ))}
        </ResizablePanelGroup>
      ) : mode === "single" ? (
        <div
          data-slot="compare-viewer-panes"
          className="relative min-h-64 overflow-hidden rounded-lg border"
        >
          <div data-slot="compare-viewer-pane" className="relative h-full">
            <div className="absolute top-2 left-2 z-10">
              <PaneNumber index={activeIndex} />
            </div>
            {panes[activeIndex]?.content}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div
            data-slot="compare-viewer-panes"
            className="relative min-h-64 overflow-hidden rounded-lg border"
          >
            {/* The first pane fills the frame; the second is clipped to the
                wipe position on top of it. Both stay mounted, so dragging the
                handle never remounts the media and restarts playback. */}
            <div data-slot="compare-viewer-pane" className="absolute inset-0">
              {panes[0]?.content}
            </div>
            {panes[1] ? (
              <div
                data-slot="compare-viewer-pane"
                className="absolute inset-0"
                style={{ clipPath: `inset(0 0 0 ${wipePosition}%)` }}
              >
                {panes[1].content}
              </div>
            ) : null}

            <div className="absolute top-2 left-2 z-10">
              <PaneNumber index={0} />
            </div>
            {panes[1] ? (
              <div className="absolute top-2 right-2 z-10">
                <PaneNumber index={1} />
              </div>
            ) : null}
          </div>

          {/* Base UI directly, not components/ui/slider. That wrapper renders
              its thumbs with no way to name them — it forwards neither
              `getAriaLabel` nor `getAriaValueText`, and an `aria-label` on the
              wrapper lands on the root, while `role="slider"` is on the thumb.
              The result is an unnamed slider, which axe fails. The handle that
              drives the whole comparison has to be nameable, so this composes
              the primitive itself and keeps the same visual treatment. */}
          <SliderPrimitive.Root
            data-slot="compare-viewer-wipe"
            value={wipePosition}
            min={0}
            max={100}
            thumbAlignment="edge"
            onValueChange={(value) => {
              const next = Array.isArray(value) ? value[0] : value;
              onWipePositionChange?.(next);
            }}
            className="w-full"
          >
            <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none">
              <SliderPrimitive.Track className="bg-muted relative h-1 w-full grow overflow-hidden rounded-full select-none">
                <SliderPrimitive.Indicator className="bg-primary h-full select-none" />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb
                data-slot="compare-viewer-wipe-thumb"
                getAriaLabel={() => "Wipe position"}
                getAriaValueText={(formatted) => `${formatted} percent`}
                className="border-ring ring-ring/50 relative block size-3 shrink-0 rounded-full border bg-white transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3"
              />
            </SliderPrimitive.Control>
          </SliderPrimitive.Root>
        </div>
      )}
    </div>
  );
}

export { CompareViewer };
export type { CompareMode, ComparePane, CompareViewerProps };
