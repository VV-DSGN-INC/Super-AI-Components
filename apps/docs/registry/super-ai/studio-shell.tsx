"use client";

import { MousePointerSquareDashed, Shapes } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import { AppTopbar, type AppTopbarProps } from "@/registry/super-ai/app-topbar";
import {
  ContextToolbar,
  type ContextToolbarProps,
  type ContextToolbarSelection,
} from "@/registry/super-ai/context-toolbar";
import { DrawingTools, type DrawingToolsProps } from "@/registry/super-ai/drawing-tools";
import { EmptyState } from "@/registry/super-ai/empty-state";
import {
  FrameStrip,
  type FrameStripItem,
  type FrameStripKind,
  type FrameStripProps,
} from "@/registry/super-ai/frame-strip";
import { ModalityRail, type ModalityRailItemData } from "@/registry/super-ai/modality-rail";
import { PresetGrid, type PresetGridProps } from "@/registry/super-ai/preset-grid";
import { PropertyInspector, type PropertyInspectorProps } from "@/registry/super-ai/property-inspector";
import { ResultCard, type ResultCardProps } from "@/registry/super-ai/result-card";
import { ToolPanel, type ToolPanelProps, type ToolPanelSection } from "@/registry/super-ai/tool-panel";

/**
 * Studio Shell — creative studio editor
 *
 * Spec: docs/design-system/block-specs.md#o3-studio-shell
 * Regions: modality-rail · topbar · tool-panel · canvas · inspector · page-strip
 *
 * A block owns arrangement and nothing else. Every region here is filled by an
 * already-shipped registry component that keeps its own props, its own state
 * model and its own accessibility contract. Three sentences from the spec do
 * all the work:
 *
 * 1. **"Six regions, fixed positions. Rail, topbar and inspector are the
 *    invariants; the middle three — tool panel, canvas, page strip — vary by
 *    what is being edited."** The rail and the inspector are the two full-height
 *    edges and the topbar spans everything between them, so the three that vary
 *    are literally the middle of the layout. (The topbar was missing from the
 *    spec's own `Regions:` line until the 2026-08-08 wireframe reconciliation —
 *    `Filled by:` had always named B7, which has to render somewhere.)
 * 2. **"The rail selects which tool panel is shown. It never changes the
 *    canvas — that separation is what keeps the shell legible."** This is
 *    enforced by the data model rather than by prose: `toolPanels` is a record
 *    keyed by modality id, so switching the rail is a lookup, while the canvas
 *    is a single `children` and is structurally incapable of varying with it.
 *    Same idea as I2 keying its `sections` by element type.
 * 3. **"The inspector is selection-driven and must ship an empty state, because
 *    'nothing selected' is the most common state."** One `selection` object
 *    drives both I2 and I3: with nothing selected the inspector falls to its own
 *    empty affordance and the floating toolbar does not render at all, which is
 *    the shell's default — not an edge case.
 *
 * Composed: B4 `modality-rail` · B7 `app-topbar` · I1 `tool-panel` ·
 * I5 `drawing-tools` · E4 `preset-grid` · F1 `result-card` · I3 `context-toolbar` ·
 * I2 `property-inspector` · H5 `frame-strip` · L1 `empty-state`.
 */

/**
 * The canvas backdrop has to read as *not the document* — every other region in
 * this shell is `bg-background`, so without a distinct surface the artboard has
 * no edge. `bg-muted` is that surface, and rebinding `--muted-foreground` on the
 * same element is what makes it safe: L1's description, and anything else a
 * caller drops on the canvas, carries its own `text-muted-foreground`, which
 * against `bg-muted` measures 4.34:1 against a 4.5 minimum (a11y-baseline.md).
 * A slot-level `text-foreground` override cannot reach inside a composed child,
 * so the variable moves instead of the class. `--accent-foreground` is the
 * high-contrast member of the same neutral ramp and flips correctly in dark
 * mode, where `--muted` and `--accent` resolve to the same value.
 */
const CANVAS_SURFACE = "bg-muted [--muted-foreground:var(--accent-foreground)]";

/**
 * H5 composes the vendored Carousel, whose previous/next buttons are absolutely
 * positioned at `-left-12` / `-right-12` — outside the strip's own box. Without
 * gutters they are clipped by the shell's `overflow-hidden` and the strip loses
 * its only keyboard-reachable scroll control (axe
 * `scrollable-region-focusable`, which the carousel base exists to satisfy).
 * Delete this if H5 ever moves its controls inside its own bounds.
 */
const PAGE_STRIP_GUTTERS = "px-12";

const RESULT_COLUMNS: Record<1 | 2 | 3, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

/**
 * What is selected on the canvas. One object, two consumers: I2 keys its
 * per-element-type variant off `type`, I3 uses the same value to name and
 * flavour the floating toolbar.
 *
 * `type` is narrowed to I3's four-member union even though I2 accepts any
 * string element type. Sharing one selection is worth more than an open
 * inspector key here — see the docs module for the recommended source fix.
 */
interface StudioShellSelection {
  type: ContextToolbarSelection;
  /** What is selected, e.g. "Heading". Announced by I2 when the selection changes. */
  label?: string;
}

/** E4, rendered as one of the tool panel's sections. */
interface StudioShellPresets extends PresetGridProps {
  /** Section heading — "Styles", "Palettes", "Filters". */
  label?: React.ReactNode;
  /** Overrides the count A12 shows beside the heading. Defaults to `items.length`. */
  count?: number;
}

interface StudioShellResult extends ResultCardProps {
  id: string;
}

/** F1 cards for whatever the active modality just generated. */
interface StudioShellResults {
  label?: React.ReactNode;
  items: StudioShellResult[];
  columns?: 1 | 2 | 3;
}

/**
 * One modality's panel. `sections` is I1's own data model, passed through
 * untouched; `presets`, `results` and `drawing` are the three things this shell
 * composes into it so a caller never has to construct E4, F1 or I5 by hand.
 *
 * `results` is omitted from the passthrough as well as re-declared: React's div
 * props carry a legacy `results?: number` attribute (a WebKit search-input
 * relic) that would otherwise collide with the F1 list.
 */
interface StudioShellToolPanel extends Omit<ToolPanelProps, "sections" | "prompt" | "results"> {
  sections?: ToolPanelSection[];
  presets?: StudioShellPresets;
  results?: StudioShellResults;
  /**
   * I5, pinned below the panel and outside its scroll region — a brush you have
   * to scroll back to is not a brush. Belongs to the modality, not to the
   * canvas: the rail chooses it, and the canvas never notices.
   */
  drawing?: DrawingToolsProps;
  /** I1's docked-prompt slot — D1 or anything else that generates into this panel. */
  prompt?: React.ReactNode;
}

interface StudioShellProps extends Omit<React.ComponentProps<"div">, "title"> {
  /** B4 items. The rail is an invariant, so this stays mounted even when empty. */
  modalities?: ModalityRailItemData[];
  /** B4's bottom group — settings, plugins, help. Never merged into `modalities`. */
  pinnedModalities?: ModalityRailItemData[];
  activeModalityId?: string;
  onModalityChange?: (id: string) => void;

  /** The document name, shown in B7. */
  title?: string;
  /**
   * The rest of B7. `context` is fixed to `editor` — zoom and history, not a
   * breadcrumb: this shell is where you change a document, not where you find it.
   */
  topbar?: Omit<AppTopbarProps, "context" | "title">;

  /**
   * I1 content keyed by modality id. The rail is a lookup into this record and
   * nothing else, which is how "the rail never changes the canvas" is enforced
   * rather than merely documented.
   */
  toolPanels?: Record<string, StudioShellToolPanel>;
  /** Replaces the default L1 shown when the active modality has no panel. */
  toolPanelEmpty?: React.ReactNode;

  /** The artboard. One node for every modality — see `toolPanels`. */
  children?: React.ReactNode;
  /** Names the scrolling canvas. It is a scroll container, so it needs one. */
  canvasLabel?: string;
  /** Replaces the default L1 shown when there is nothing on the canvas. */
  canvasEmpty?: React.ReactNode;

  /** Drives I3 and I2 together. Undefined — nothing selected — is the default view. */
  selection?: StudioShellSelection;
  /** The rest of I3: actions, the AI entry, I4 as `aiMenu`, placement. */
  toolbar?: Omit<ContextToolbarProps, "selection">;

  /** I2. `elementType` and `selectionLabel` come from `selection`. */
  inspector?: Omit<PropertyInspectorProps, "elementType" | "selectionLabel">;
  inspectorLabel?: string;

  /** H5 items — pages, artboards or frames, depending on `frameKind`. */
  frames?: FrameStripItem[];
  frameKind?: FrameStripKind;
  activeFrameId?: string;
  onFrameChange?: (id: string) => void;
  onAddFrame?: () => void;
  onReorderFrame?: (id: string, direction: "left" | "right") => void;
  pageStrip?: Omit<FrameStripProps, "items" | "kind" | "value" | "onValueChange" | "onAdd" | "onReorder">;
  /** Replaces the default L1 shown when there are no frames and no way to add one. */
  pageStripEmpty?: React.ReactNode;
}

/**
 * Builds the active modality's I1 sections. E4 and F1 arrive through I1's
 * `render` escape hatch rather than being flattened into `items`: I1's own tiles
 * are insert-style actions, and flattening a preset grid into them would throw
 * away E4's radiogroup/checkbox semantics — the chosen-ness that is the whole
 * point of a preset. `render` is only invoked while its section is open and in
 * the active tab, so an unopened section costs nothing.
 */
function toolPanelSections({
  sections: own,
  presets,
  results,
}: Pick<StudioShellToolPanel, "sections" | "presets" | "results">): ToolPanelSection[] {
  const sections: ToolPanelSection[] = [];

  if (presets) {
    const { label = "Presets", count, ...grid } = presets;
    sections.push({
      id: "studio-presets",
      title: label,
      count: count ?? grid.items.length,
      collapsible: true,
      render: () => <PresetGrid {...grid} />,
    });
  }

  if (results) {
    const { label = "Results", items, columns = 2 } = results;
    sections.push({
      id: "studio-results",
      title: label,
      count: items.length,
      collapsible: true,
      render: () => (
        <div data-slot="studio-shell-results" className={cn("grid gap-2", RESULT_COLUMNS[columns])}>
          {items.map(({ id, ...card }) => (
            <ResultCard key={id} data-result-id={id} {...card} />
          ))}
        </div>
      ),
    });
  }

  return [...sections, ...(own ?? [])];
}

function StudioShell({
  modalities = [],
  pinnedModalities,
  activeModalityId,
  onModalityChange,

  title = "Untitled design",
  topbar,

  toolPanels,
  toolPanelEmpty,

  children,
  canvasLabel = "Canvas",
  canvasEmpty,

  selection,
  toolbar,

  inspector,
  inspectorLabel = "Properties",

  frames = [],
  frameKind = "slides",
  activeFrameId,
  onFrameChange,
  onAddFrame,
  onReorderFrame,
  pageStrip,
  pageStripEmpty,

  className,
  ...props
}: StudioShellProps) {
  const activeModality = React.useMemo(
    () => [...modalities, ...(pinnedModalities ?? [])].find((item) => item.id === activeModalityId),
    [modalities, pinnedModalities, activeModalityId],
  );
  const activePanel = activeModalityId ? toolPanels?.[activeModalityId] : undefined;
  // `sections`, `presets` and `results` are consumed by `toolPanelSections`
  // below. They are destructured out here so that everything else can spread
  // onto I1 without leaking non-DOM props onto its root element.
  const { sections, presets, results, drawing, prompt, empty, label, ...panelRest } = activePanel ?? {};
  const panelSections = toolPanelSections({ sections, presets, results });
  // The panel is named after whatever the rail last chose, so the link between
  // the two is announced rather than merely visible.
  const panelLabel = label ?? (activeModality ? `${activeModality.label} tools` : "Tools");
  const hasStrip = frames.length > 0 || typeof onAddFrame === "function";

  return (
    <div
      data-slot="studio-shell"
      className={cn("bg-background text-foreground flex h-full min-h-0 w-full overflow-hidden", className)}
      {...props}
    >
      {/* Invariant edge one. `data-region` goes straight onto B4 — passing a
          `data-slot` would erase the component's own and hide the composition,
          but a region marker is the block layer's to add. */}
      <ModalityRail
        data-region="modality-rail"
        items={modalities}
        pinned={pinnedModalities}
        activeId={activeModalityId}
        onSelect={onModalityChange}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* B7 in `editor` context: zoom and history, because a studio is where
            you change a document rather than where you navigate to one. */}
        <AppTopbar
          data-region="topbar"
          context="editor"
          title={title}
          {...topbar}
          // cn last after the spread, or a caller's topbar.className is
          // silently swallowed.
          className={cn("shrink-0", topbar?.className)}
        />

        {/* Below `md` the three middle regions stack into one scrolling column
            rather than being hidden: a region a narrow viewport cannot reach is
            worse than a tall one. Above `md` they are three columns and each
            owns its own overflow. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
          <div
            data-region="tool-panel"
            className="flex shrink-0 flex-col gap-2 border-b p-2 md:w-72 md:border-r md:border-b-0"
          >
            <ToolPanel
              sections={panelSections}
              label={panelLabel}
              empty={
                empty ??
                toolPanelEmpty ?? (
                  <EmptyState
                    size="panel"
                    icon={<Shapes />}
                    title="Nothing in this panel yet"
                    description="Pick a tool from the rail to load its content."
                  />
                )
              }
              prompt={prompt}
              {...panelRest}
              className={cn("min-h-56 rounded-none border-0 md:min-h-0 md:flex-1", panelRest.className)}
            />
            {/* Pinned outside I1's scroll region — the brush stays put however
                far the sections scroll. */}
            {drawing ? (
              <DrawingTools {...drawing} className={cn("shrink-0", drawing.className)} />
            ) : null}
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div data-region="canvas" className="relative flex min-h-0 flex-1 flex-col">
              {/* I3 is selection-driven, so with nothing selected there is no
                  toolbar at all. The shell cannot measure where the selection
                  sits on someone else's canvas, so `placement` decides which
                  end of the canvas the bar is pinned to — a host that tracks
                  selection geometry should position I3 itself instead. */}
              {selection ? (
                <div
                  data-slot="studio-shell-canvas-toolbar"
                  data-placement={toolbar?.placement ?? "above"}
                  className={cn(
                    "pointer-events-none absolute inset-x-0 z-10 flex justify-center px-3",
                    (toolbar?.placement ?? "above") === "above" ? "top-3" : "bottom-3",
                  )}
                >
                  <ContextToolbar
                    selection={selection.type}
                    label={selection.label ? `${selection.label} actions` : undefined}
                    {...toolbar}
                    className={cn("pointer-events-auto", toolbar?.className)}
                  />
                </div>
              ) : null}

              {/* The element that actually scrolls carries the tab stop and the
                  name (axe `scrollable-region-focusable`) — an empty canvas has
                  no controls of its own to reach it by. */}
              <div
                data-slot="studio-shell-canvas-surface"
                role="group"
                aria-label={canvasLabel}
                tabIndex={0}
                className={cn(
                  "focus-visible:ring-ring flex min-h-64 flex-1 items-center justify-center overflow-auto p-6 focus-visible:ring-2 focus-visible:outline-none md:min-h-0",
                  CANVAS_SURFACE,
                )}
              >
                {children ??
                  canvasEmpty ?? (
                    <EmptyState
                      size="page"
                      icon={<MousePointerSquareDashed />}
                      title="Nothing on the canvas yet"
                      description="Add something from the panel on the left, or start from a preset."
                    />
                  )}
              </div>
            </div>

            <div
              data-region="page-strip"
              className={cn("bg-background shrink-0 border-t py-2", hasStrip ? PAGE_STRIP_GUTTERS : "px-3")}
            >
              {hasStrip ? (
                <FrameStrip
                  items={frames}
                  kind={frameKind}
                  value={activeFrameId}
                  onValueChange={onFrameChange}
                  onAdd={onAddFrame}
                  onReorder={onReorderFrame}
                  {...pageStrip}
                  className={cn(pageStrip?.className)}
                />
              ) : (
                // H5's own empty affordance is its add tile, so this only shows
                // when there is nothing to show and no way to make one.
                (pageStripEmpty ?? (
                  <EmptyState size="in-grid" title="No pages yet" description="Pages you add appear here." />
                ))
              )}
            </div>
          </div>

          {/* Invariant edge two. Scrolls on its own and takes a tab stop,
              because with nothing selected it holds no controls to reach it by. */}
          <div
            data-region="inspector"
            role="group"
            aria-label={inspectorLabel}
            tabIndex={0}
            className="focus-visible:ring-ring shrink-0 overflow-y-auto border-t p-3 focus-visible:ring-2 focus-visible:outline-none md:w-72 md:border-t-0 md:border-l"
          >
            <PropertyInspector
              elementType={selection?.type ?? null}
              selectionLabel={selection?.label}
              {...inspector}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export { StudioShell };
export type {
  StudioShellPresets,
  StudioShellProps,
  StudioShellResult,
  StudioShellResults,
  StudioShellSelection,
  StudioShellToolPanel,
};
