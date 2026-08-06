"use client";

import { AlertTriangle, CheckCircle2, FileSearch, Library, RotateCcw, Scissors, Waypoints } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { EntityRow } from "@/registry/super-ai/entity-row";
import { StatReadout, type StatReadoutItem } from "@/registry/super-ai/stat-readout";

/**
 * Source Panel — Ingested sources with pipeline status
 *
 * Spec: docs/design-system/component-specs.md#k5-source-panel
 * States: parsing · chunking · embedding · ready · failed · empty
 *
 * Three sentences from the spec drive the whole API:
 *
 * 1. "The pipeline is the status: parsing → chunking → embedding → ready. A
 *    generic spinner hides which stage failed." So `stage` is a named value,
 *    not a boolean `loading`, and the stage name is rendered as *visible
 *    text* in the same place on every row (the trailing badge) in all five
 *    states. The bar underneath an in-flight row is decoration on top of that
 *    text, never a substitute for it — a bare spinner with no stage label is
 *    the exact failure this component exists to prevent.
 * 2. "Chunk counts belong on ready sources — retrieval quality is otherwise
 *    invisible." A ready row carries A10 `stat-readout` with its chunk count
 *    (plus any extra key→value metadata the caller supplies), so the thing
 *    that determines retrieval quality is on the surface rather than in a
 *    detail view nobody opens.
 * 3. "Failures are per-source and retryable in place." Retry lives inside the
 *    failed row and is named after that row's source. There is deliberately
 *    no panel-level retry prop: one source failing to embed says nothing
 *    about the other four, and a panel-wide retry re-ingests all of them.
 *
 * Rows compose A9 `entity-row` for the icon/title/description/trailing
 * chrome. `entity-row` is rendered without `onSelect`, so it stays a plain
 * non-interactive wrapper (the generation-queue / skill-menu convention) and
 * the per-row Retry button in its `trailing` slot is not a button inside a
 * button. That does mean a row is not itself clickable — see the docs module.
 *
 * a11y: the three in-flight stages are genuinely indeterminate, so each gets
 * a real `role="progressbar"` with no `aria-valuenow`, named for the source
 * *and* the stage ("Q3-report.pdf: Chunking") rather than a bare "Loading"
 * repeated once per row. Every row also carries a visually-hidden
 * `role="status"` summary so a parsing → chunking → ready/failed transition
 * is announced, matching the convention N1 `feedback` established. `ready`
 * and `failed` differ by icon shape and by text, never by colour alone.
 */

type SourcePanelStage = "parsing" | "chunking" | "embedding" | "ready" | "failed";

/** The stages a source moves *through*. `ready` and `failed` are terminal. */
const PIPELINE_STAGES = ["parsing", "chunking", "embedding"] as const;

const STAGE_LABEL: Record<SourcePanelStage, string> = {
  parsing: "Parsing",
  chunking: "Chunking",
  embedding: "Embedding",
  ready: "Ready",
  failed: "Failed",
};

/**
 * One shape per stage, so the pipeline position survives grayscale, a
 * screenshot, and a user who cannot distinguish the badge colours.
 */
const STAGE_ICON: Record<SourcePanelStage, React.ReactNode> = {
  parsing: <FileSearch aria-hidden className="size-4" />,
  chunking: <Scissors aria-hidden className="size-4" />,
  embedding: <Waypoints aria-hidden className="size-4" />,
  ready: <CheckCircle2 aria-hidden className="size-4" />,
  failed: <AlertTriangle aria-hidden className="text-destructive size-4" />,
};

/**
 * The vendored `progress` wrapper appends its own Track/Indicator after
 * `children` and exposes no handle on either, so the indicator cannot be
 * styled by passing it a className. It has to be styled from the root, and
 * it has to be styled: Base UI gives an indeterminate indicator no width at
 * all, which renders as an empty track that reads as "broken" rather than
 * "working". Same arbitrary-descendant-variant idiom as model-picker's
 * ENTITY_ROW_SELECTED_DESCRIPTION_FIX — a call-site override for a child a
 * plain `className` cannot reach.
 */
const INDETERMINATE_INDICATOR_FIX =
  "[&_[data-slot=progress-indicator]]:w-full [&_[data-slot=progress-indicator]]:animate-pulse";

/**
 * A failed row's description *is* the error message, so it must not be the
 * quietest text in the row. `entity-row` doesn't forward a className to its
 * description span, hence the descendant override rather than a plain class.
 */
const FAILED_DESCRIPTION_FIX = "[&_[data-slot=entity-row-description]]:text-foreground";

/** Fixed locale so a chunk count renders identically on server and client. */
const CHUNK_FORMAT = new Intl.NumberFormat("en-US");

interface SourcePanelSource {
  id: string;
  /** File, URL or transcript name. Used to name this row's controls. */
  name: string;
  /** The quiet second line — "PDF · 2.4 MB", "Web page", "Transcript". */
  meta?: React.ReactNode;
  stage: SourcePanelStage;
  /** Overrides the per-stage icon. Rarely what you want: the stage shape is the signal. */
  icon?: React.ReactNode;
  /** `ready` only. Retrieval quality is invisible without it. */
  chunkCount?: number;
  /** `ready` only. Extra key→value metadata rendered beside the chunk count. */
  stats?: StatReadoutItem[];
  /** `failed` only. Shown in place of `meta`, and announced. */
  errorMessage?: string;
}

interface SourcePanelProps extends Omit<React.ComponentProps<"div">, "title"> {
  sources?: SourcePanelSource[];
  /** Heading above the list, e.g. "Sources". */
  heading?: React.ReactNode;
  /** Caller-supplied panel action — usually the Add-source control. */
  action?: React.ReactNode;
  /** Re-ingest one source. Per-source on purpose; there is no panel-level retry. */
  onRetrySource?: (id: string) => void;
  /** Visible text on the per-row Retry control. */
  retryText?: string;
  /** Accessible name for the per-row Retry control — must name the source. */
  retryLabel?: (source: SourcePanelSource) => string;
  emptyTitle?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  emptyIcon?: React.ReactNode;
  /** The empty-state CTA. Caller-supplied so it repeats this surface's own verb. */
  emptyAction?: React.ReactNode;
}

function SourcePanelRow({
  source,
  onRetry,
  retryText,
  retryLabel,
}: {
  source: SourcePanelSource;
  onRetry?: (id: string) => void;
  retryText: string;
  retryLabel: (source: SourcePanelSource) => string;
}) {
  const { id, name, meta, stage, icon, chunkCount, stats, errorMessage } = source;

  const stageIndex = (PIPELINE_STAGES as readonly string[]).indexOf(stage);
  const inFlight = stageIndex !== -1;
  const stageLabel = STAGE_LABEL[stage];

  const readyStats: StatReadoutItem[] =
    stage === "ready"
      ? [
          ...(chunkCount != null ? [{ label: "Chunks", value: CHUNK_FORMAT.format(chunkCount) }] : []),
          ...(stats ?? []),
        ]
      : [];

  const statusText = inFlight
    ? `${name}: ${stageLabel}, step ${stageIndex + 1} of ${PIPELINE_STAGES.length}`
    : stage === "failed"
      ? `${name}: ${stageLabel}${errorMessage ? `, ${errorMessage}` : ""}`
      : `${name}: ${stageLabel}${chunkCount != null ? `, ${CHUNK_FORMAT.format(chunkCount)} chunks` : ""}`;

  const trailing = (
    <div className="flex shrink-0 items-center gap-2">
      <Badge
        data-slot="source-panel-stage"
        // Solid rather than Badge's own destructive variant (bg-destructive/10
        // text-destructive is 4.0:1 against a 4.5:1 minimum) — the same
        // substitution generation-queue's failed badge makes. See
        // docs/design-system/a11y-baseline.md.
        variant={stage === "failed" ? "destructive" : stage === "ready" ? "secondary" : "outline"}
        className={cn(stage === "failed" && "bg-destructive text-background")}
      >
        {stageLabel}
      </Badge>
      {stage === "failed" && onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-slot="source-panel-retry"
          aria-label={retryLabel(source)}
          onClick={() => onRetry(id)}
        >
          <RotateCcw aria-hidden />
          {retryText}
        </Button>
      ) : null}
    </div>
  );

  return (
    <li data-slot="source-panel-item" data-stage={stage} className="flex flex-col">
      <EntityRow
        icon={icon ?? STAGE_ICON[stage]}
        title={name}
        description={stage === "failed" && errorMessage ? errorMessage : meta}
        trailing={trailing}
        className={cn(stage === "failed" && FAILED_DESCRIPTION_FIX)}
      />

      {inFlight ? (
        <div data-slot="source-panel-item-progress" className="flex items-center gap-3 px-3 pb-2">
          {/* No value: parsing, chunking and embedding report completion, not
              percentages, and a fabricated percentage is worse than none.
              The name carries the source *and* the stage, so a panel of four
              in-flight sources is not four identical "Loading" bars. */}
          <Progress
            value={null}
            aria-label={`${name}: ${stageLabel}`}
            className={cn("flex-1", INDETERMINATE_INDICATOR_FIX)}
          />
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            Step {stageIndex + 1} of {PIPELINE_STAGES.length}
          </span>
        </div>
      ) : null}

      {readyStats.length > 0 ? (
        <div data-slot="source-panel-item-stats" className="px-3 pb-2">
          <StatReadout items={readyStats} columns={2} className="text-xs" />
        </div>
      ) : null}

      {/* Announces parsing → chunking → embedding → ready/failed even though
          the badge and icon above already make the stage visible. */}
      <span data-slot="source-panel-item-status" role="status" className="sr-only">
        {statusText}
      </span>
    </li>
  );
}

function SourcePanel({
  sources = [],
  heading,
  action,
  onRetrySource,
  retryText = "Retry",
  retryLabel = (source) => `Retry ${source.name}`,
  emptyTitle = "No sources yet",
  emptyDescription = "Add a document, page or transcript. Each one is parsed, chunked and embedded before it can be cited.",
  emptyIcon = <Library aria-hidden />,
  emptyAction,
  className,
  ...props
}: SourcePanelProps) {
  const showHeader = Boolean(heading) || Boolean(action);

  return (
    <div
      data-slot="source-panel"
      className={cn("flex w-full max-w-md flex-col gap-3", className)}
      {...props}
    >
      {showHeader ? (
        <div data-slot="source-panel-header" className="flex items-center justify-between gap-2">
          {heading ? (
            <p data-slot="source-panel-heading" className="text-sm font-medium">
              {heading}
            </p>
          ) : null}
          {action ? <div className="ml-auto">{action}</div> : null}
        </div>
      ) : null}

      {sources.length === 0 ? (
        // L1 `empty-state` rather than a bespoke paragraph, so the panel's
        // nothing-here surface has the same rhythm as every other one.
        <div data-slot="source-panel-empty">
          <EmptyState
            size="panel"
            title={emptyTitle}
            description={emptyDescription}
            icon={emptyIcon}
            action={emptyAction}
          />
        </div>
      ) : (
        <ul data-slot="source-panel-items" className="flex flex-col gap-1">
          {sources.map((source) => (
            <SourcePanelRow
              key={source.id}
              source={source}
              onRetry={onRetrySource}
              retryText={retryText}
              retryLabel={retryLabel}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export { SourcePanel };
export type { SourcePanelProps, SourcePanelSource, SourcePanelStage };
