"use client";

import { Wand2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import { AppTopbar, type AppTopbarProps } from "@/registry/super-ai/app-topbar";
import { CostChip } from "@/registry/super-ai/cost-chip";
import { CreditsIndicator, type CreditsIndicatorProps } from "@/registry/super-ai/credits-indicator";
import { EmptyState, type EmptyStateExamplePair } from "@/registry/super-ai/empty-state";
import {
  GenerationGrid,
  type GenerationGridDensity,
  type GenerationGroup,
} from "@/registry/super-ai/generation-grid";
import { GenerationPanel, type GenerationPanelProps } from "@/registry/super-ai/generation-panel";
import { ModelPicker, type ModelPickerModel, type ModelPickerPresentation } from "@/registry/super-ai/model-picker";
import { ParameterPanel } from "@/registry/super-ai/parameter-panel";
import { PresetGrid, type PresetGridContent, type PresetGridItem } from "@/registry/super-ai/preset-grid";
import { ResultCard, type ResultCardProps } from "@/registry/super-ai/result-card";
import { RunButton, type RunButtonProps } from "@/registry/super-ai/run-button";

/**
 * Generation Shell — single-purpose tool app
 *
 * Spec: docs/design-system/block-specs.md#o6-generation-shell
 * Regions: config-panel · cost-generate · topbar · result-canvas
 *
 * The cheapest shell in the catalog and the one most products ship first:
 * config left, result right, and one button that spends money. It owns
 * arrangement and nothing else — E1 owns the panel's vertical order, E2/E3/E4
 * own the controls inside it, E5 owns the run lifecycle, F1/F2 own the result
 * geometry, L1 owns the empty pane and M2 owns the balance.
 *
 * Three sentences from the spec drive every structural decision:
 *
 * 1. "Config left, result right, Generate pinned to the bottom of the panel so
 *    it never requires scrolling." `cost-generate` is therefore a region
 *    *inside* `config-panel`, handed to E1's own `generate` slot — E1 renders
 *    that slot in a `CardFooter` that sits outside its scrolling body, so the
 *    pinning is structural rather than a class this shell reapplies. The panel
 *    is height-bounded at every viewport (half the shell when stacked, full
 *    height beside the canvas) precisely so that guarantee survives narrow
 *    layouts too.
 * 2. "The empty right pane carries an L1 example pair (before → after). It
 *    teaches the tool faster than any description." So the result canvas'
 *    empty affordance is a page-size L1 with `examplePair`, not a caption.
 * 3. "The cost number here and in E1 / D1 come from one source" (E5's spec).
 *    This shell is that source: `cost`, `costUnit` and `balance` are shell
 *    props, and they feed A2's chip, E5's shortfall line and M2's balance from
 *    one place. Nothing recomputes a price locally.
 *
 * `E1 vs. E5 + A2` — the judgment call. E1 already ships a cost + Generate
 * footer of its own (`cost` / `costUnit` / `generate`). This shell composes E1
 * **whole** and fills only its `generate` slot, with a single element carrying
 * `data-region="cost-generate"` that holds both A2 and E5. E1's `cost` prop is
 * deliberately left unset: were it used, A2 would render outside the region
 * marker and the region would contain Generate but not the price it is asking
 * you to spend, which is the one thing the spec says they must never be
 * separated by.
 */

/**
 * E5 renders an A2 chip of its own whenever it is given a `cost` and is idle,
 * done or failed — and this shell renders A2 directly, because O6 names both
 * A2 and E5 in `Filled by:` and they are two different jobs (A2 is the
 * per-action price, E5 the pre-commit control). So E5 is never given `cost`;
 * it is given a pre-formatted `insufficientMessage` built from the same
 * numbers instead, which is E5's own documented override for exactly this.
 *
 * RECOMMENDED SOURCE FIX: E5 has no way to say "show the control, not the
 * chip". A `showCost?: boolean` (or accepting `cost` purely for the shortfall
 * wording) would let a composing shell own the chip without this workaround.
 */
function shortfallMessage(cost: number | string | undefined, unit: string, balance: number | undefined) {
  if (cost === undefined || balance === undefined) return undefined;
  return `Need ${cost} ${unit}, you have ${balance}`;
}

/**
 * E1's `generate` slot lands in shadcn `CardFooter`, which paints
 * `bg-muted/50`. Everything this shell puts in that row is a composed
 * component with its own `text-muted-foreground` spans — E5's shortfall line
 * and its locked reason, both of which are inside E5 and unreachable from a
 * `className` here. Rebinding the variable on the row repaints every
 * descendant at once, composed or not; restyling slots cannot reach them. Same
 * shape as `entity-row`'s selected-row fix (a11y-baseline.md, "Retrofit
 * 2026-08-11").
 */
const COST_ROW_ON_MUTED = "[--muted-foreground:var(--foreground)]";

/**
 * F2 puts its empty affordance in the first cell of a grid it keeps columned,
 * which is right in a library and wrong here: O6 says the *pane* carries the
 * example pair, and a before → after pair crushed into a quarter-width cell
 * teaches nothing. `col-span-full` widens only the empty cell — the columns
 * themselves are untouched, so a resolved grid is unaffected. The cell lives
 * on an inner slot `className` cannot reach, hence the descendant variant.
 * Delete this if F2 grows a full-width empty mode.
 */
const EMPTY_SPANS_THE_CANVAS = "[&_[data-slot=generation-grid-empty]]:col-span-full";

interface GenerationShellResult
  extends Omit<ResultCardProps, "children" | "selectable" | "selected" | "onSelect"> {
  id: string;
  /** The media itself. F1 treats it as opaque, and so does this shell. */
  media?: React.ReactNode;
}

interface GenerationShellProps extends Omit<React.ComponentProps<"div">, "title" | "results"> {
  // ── topbar ──────────────────────────────────────────────────────────────
  /** The tool's name. A single-purpose app has one, and it never changes. */
  title?: string;
  /** The rest of B7 — breadcrumb, privacy chip, saved label, trailing actions. */
  topbar?: Omit<AppTopbarProps, "context" | "title">;
  /** M2. Omit to drop the credits indicator; the region still renders. */
  balance?: number;
  /** Plan allowance, so M2 can draw its ring rather than a bare counter. */
  creditsTotal?: number;
  /** Forwarded to M2 — `form`, `lowAt`, `onManage`, `onTopUp`. */
  credits?: Omit<CreditsIndicatorProps, "balance" | "total" | "unit">;

  // ── config panel (E1) ───────────────────────────────────────────────────
  /**
   * E1 whole: dropzone, directions, section titles, default open sections.
   * `presets`, `settings`, `generate`, `cost` and `costUnit` are the shell's —
   * it fills them from the props below so E2–E5 are genuinely composed here
   * rather than left to the caller.
   */
  panel?: Omit<GenerationPanelProps, "presets" | "settings" | "generate" | "cost" | "costUnit">;
  /** E4 tiles. Empty hides the presets stage — E1 already treats a missing slot that way. */
  presets?: PresetGridItem[];
  presetContent?: PresetGridContent;
  presetValue?: string | string[];
  onPresetChange?: (value: string | string[]) => void;
  /** Presets past this count collapse behind E4's in-grid see-more tile. */
  presetVisibleCount?: number;
  /** E2 models. Empty hides the picker; the settings stage still renders if `parameters` is set. */
  models?: ModelPickerModel[];
  modelId?: string;
  onModelChange?: (id: string) => void;
  modelPickerPresentation?: ModelPickerPresentation;
  /**
   * E3 rows — `<ParameterSlider />`, `<ParameterSegmented />`, `<ParameterTabs />`.
   * The shell owns the `ParameterPanel` around them; the rows are yours,
   * because only you know which parameters this tool has.
   */
  parameters?: React.ReactNode;
  parametersModified?: boolean;
  onResetParameters?: () => void;

  // ── cost + Generate (A2 + E5) ───────────────────────────────────────────
  /** The one price. Feeds A2's chip, E5's shortfall line and nothing else. */
  cost?: number | string;
  costUnit?: string;
  /** E5 whole, minus the three numbers the shell is the single source of. */
  run?: Omit<RunButtonProps, "cost" | "unit" | "balance">;

  // ── result canvas (F1 · F2 · L1) ────────────────────────────────────────
  /** Ungrouped results, newest first. Ignored when `resultGroups` is set. */
  results?: GenerationShellResult[];
  /** Grouped results — F2 renders one A3 date-section per group. */
  resultGroups?: GenerationGroup<GenerationShellResult>[];
  /** F2 density. `comfortable` (four-up) is the generation-panel default from F2's spec. */
  density?: GenerationGridDensity;
  selectMode?: boolean;
  selectedResultIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: React.ReactNode;
  /** Opens a result into its own surface. Suppressed while select mode is live. */
  onOpenResult?: (id: string) => void;
  /** Accessible name for the scrolling canvas. */
  resultsLabel?: string;
  /** Before → after. The strongest empty state a generation tool has (O6, L1). */
  examplePair?: EmptyStateExamplePair;
  emptyTitle?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  /** Replaces the default L1 shown when nothing has been generated yet. */
  empty?: React.ReactNode;
}

function GenerationShell({
  title = "Generate",
  topbar,
  balance,
  creditsTotal,
  credits,

  panel,
  presets = [],
  presetContent,
  presetValue,
  onPresetChange,
  presetVisibleCount,
  models = [],
  modelId,
  onModelChange,
  modelPickerPresentation = "dropdown",
  parameters,
  parametersModified,
  onResetParameters,

  cost,
  costUnit = "credits",
  run,

  results = [],
  resultGroups,
  density = "comfortable",
  selectMode = false,
  selectedResultIds,
  onSelectionChange,
  bulkActions,
  onOpenResult,
  resultsLabel = "Results",
  examplePair,
  emptyTitle = "Nothing generated yet",
  // Deliberately not "…on the left": the panel is above the canvas, not beside
  // it, below the `md` breakpoint.
  emptyDescription = "Set it up, then press Generate. Results collect here.",
  empty,

  className,
  ...props
}: GenerationShellProps) {
  const hasSettings = models.length > 0 || parameters !== undefined;

  return (
    <div
      data-slot="generation-shell"
      className={cn(
        "bg-background text-foreground flex h-full min-h-0 w-full flex-col overflow-hidden",
        className,
      )}
      {...props}
    >
      {/* B7, not a hand-rolled header. O6's `Filled by:` does not name it —
          but it declares a topbar region, and the alternative to composing the
          shipped title bar is reimplementing one, which is the single thing a
          block is not allowed to do. M2 rides in its trailing slot because the
          spec says the balance is always visible, and this shell has no
          sidebar to put it in. */}
      <AppTopbar
        data-region="topbar"
        context="document"
        title={title}
        {...topbar}
        // Composed after the spread so a caller's own actions survive rather
        // than being replaced by the credits indicator.
        actions={
          <>
            {topbar?.actions}
            {balance !== undefined ? (
              <CreditsIndicator
                balance={balance}
                total={creditsTotal}
                unit={costUnit}
                form={creditsTotal !== undefined ? "ring" : "counter"}
                {...credits}
              />
            ) : null}
          </>
        }
        className={cn("shrink-0", topbar?.className)}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 md:flex-row">
        {/* Config left. Height-bounded at every width — stacked it takes half
            the shell, beside the canvas it takes the full height — because E1
            only keeps the Generate row out of its scrolling body while it has
            a height to scroll within. */}
        <GenerationPanel
          data-region="config-panel"
          presets={
            presets.length > 0 ? (
              <PresetGrid
                items={presets}
                content={presetContent}
                value={presetValue}
                onValueChange={onPresetChange}
                visibleCount={presetVisibleCount}
              />
            ) : undefined
          }
          settings={
            hasSettings ? (
              <div className="flex flex-col gap-4">
                {models.length > 0 ? (
                  <ModelPicker
                    presentation={modelPickerPresentation}
                    models={models}
                    selectedId={modelId}
                    onSelect={onModelChange}
                    label="Model"
                  />
                ) : null}
                {parameters !== undefined ? (
                  <ParameterPanel modified={parametersModified} onResetAll={onResetParameters}>
                    {parameters}
                  </ParameterPanel>
                ) : null}
              </div>
            ) : undefined
          }
          generate={
            // The region, not a wrapper around one: A2 and E5 are one row, and
            // it is E1 that pins the row above its own scroll. Always passed,
            // so the region is mounted even for a tool that quotes no price.
            <div
              data-region="cost-generate"
              // `flex-1`, not `w-full`: E1's footer is a `justify-between`
              // flex row with a `gap-2`, so a 100%-wide child overflows it by
              // exactly the gap.
              className={cn(
                "flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2",
                COST_ROW_ON_MUTED,
              )}
            >
              {cost !== undefined ? (
                <CostChip amount={cost} unit={costUnit} />
              ) : (
                <span data-slot="generation-shell-no-cost" />
              )}
              <RunButton
                unit={costUnit}
                balance={balance}
                insufficientMessage={shortfallMessage(cost, costUnit, balance)}
                {...run}
                className={cn("shrink-0", run?.className)}
              />
            </div>
          }
          {...panel}
          // `basis-1/2` stacked, `md:w-96` beside the canvas — and `h-auto`
          // on top of E1's own `h-full`, so the stacked panel's main size
          // comes from the basis alone rather than from two competing
          // declarations.
          className={cn(
            "h-auto min-h-0 shrink-0 basis-1/2 md:h-full md:w-96 md:basis-auto",
            panel?.className,
          )}
        />

        {/* Result right. It scrolls, so it carries its own tab stop and name
            (axe scrollable-region-focusable) — on day one it holds nothing but
            an empty state, which is exactly the case that rule exists for. */}
        <section
          data-region="result-canvas"
          aria-label={resultsLabel}
          tabIndex={0}
          className="min-h-0 min-w-0 flex-1 overflow-y-auto"
        >
          <GenerationGrid<GenerationShellResult>
            items={results}
            groups={resultGroups}
            getItemId={(result) => result.id}
            density={density}
            selectMode={selectMode}
            selectedIds={selectedResultIds}
            onSelectionChange={onSelectionChange}
            bulkActions={bulkActions}
            renderItem={(result, ctx) => {
              const { id, media, ...card } = result;
              return (
                <ResultCard
                  data-result-id={id}
                  {...card}
                  selectable={ctx.selectMode}
                  selected={ctx.selected}
                  onSelect={
                    ctx.selectMode ? ctx.toggleSelected : onOpenResult ? () => onOpenResult(id) : undefined
                  }
                >
                  {media}
                </ResultCard>
              );
            }}
            empty={
              empty ?? (
                <EmptyState
                  size="page"
                  title={emptyTitle}
                  description={emptyDescription}
                  icon={<Wand2 />}
                  examplePair={examplePair}
                />
              )
            }
            className={EMPTY_SPANS_THE_CANVAS}
          />
        </section>
      </div>
    </div>
  );
}

export { GenerationShell };
export type { GenerationShellProps, GenerationShellResult };
