"use client";

import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  Loader2,
  RefreshCw,
  Wrench,
  Workflow,
} from "lucide-react";
import * as React from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/**
 * Trace Timeline — Waterfall of steps / tool calls / LLM calls
 *
 * Spec: docs/design-system/component-specs.md#n4-trace-timeline
 * States: collapsed · expanded · errored · retry-siblings
 *
 * Base: Collapsible (components/ui/collapsible, Base UI). Each span is its
 * own row and its own Collapsible; this component owns one `expandedId` and
 * opens at most one row's detail at a time, closing whichever was open
 * before — a waterfall with every row's detail open at once stops reading as
 * a waterfall.
 *
 * Two rules from the spec are load-bearing and pinned by tests:
 *
 * 1. **Bars are positioned by start time, not stacked.** `traceTimelineLayout`
 *    is a pure function — no component state, following time-ruler's
 *    convention of exporting its coordinate math standalone — that turns
 *    `startMs`/`durationMs` into a shared 0–100% axis. Two spans whose time
 *    windows intersect end up with intersecting `[left, left+width)` ranges
 *    on that axis; nothing here nudges a span sideways or onto a second
 *    track to dodge a visual collision, because hiding the collision is
 *    exactly the failure mode a waterfall exists to prevent.
 * 2. **A retry is a new row, never a replacement.** `retryOf` links a span to
 *    the attempt it retried; both render as siblings in
 *    `data-slot="trace-timeline-row"`, each keeping its own status and, for
 *    a failed one, its own error text. The component never removes or
 *    overwrites a span because another span retried it — it only adds an
 *    "Attempt N" badge once more than one span shares a retry lineage, so
 *    the record can say "the first try failed, the second succeeded"
 *    without losing the first try.
 *
 * Each row's trigger carries an explicit `aria-label` built from its own
 * name/attempt/status/duration rather than letting the browser compute a
 * name from its child spans — two adjacent `<span>`s with no literal space
 * text node between them fuse into one run-on word in the accessible name
 * (`"Attempt 2Succeeded"`), the same class of bug `filter-panel.tsx`'s facet
 * label/count spans guard against with an explicit `{" "}`. An `aria-label`
 * sidesteps it entirely rather than relying on exact whitespace placement
 * between five conditionally-rendered spans.
 *
 * Rows expand in place into whatever `renderDetail` returns — the seam N5
 * `run-inspector` is meant to fill. This component never imports N5: when a
 * row opens it calls `renderDetail(span, retriedBy)` with exactly that row's
 * own `TraceSpan` (id, name, kind, status, timing, retryOf, error) and
 * renders whatever comes back inside `data-slot="trace-timeline-row-detail"`.
 * A host that wants the real inspector looks up its own richer per-run
 * record (I/O, tokens, cost, cache hit/miss — N5's job, not this
 * component's) by `span.id` and renders `<RunInspector .../>` from that
 * lookup. Omitting `renderDetail` falls back to a minimal built-in summary,
 * so the component still demonstrates the `expanded` state on its own.
 *
 * `retryOf` only points backward (a span records what it retried); N5's spec
 * requires the opposite direction too — "the error tab explains what was
 * retried and whether it worked". Rather than document a convention for a
 * host to independently reason out (scanning `spans` for `s.retryOf ===
 * span.id`), `computeRetriedBy` derives the forward pointer once, here, and
 * `renderDetail`'s second argument hands it straight to whichever component
 * fills the seam: `{ id, name, status }` of the span that retried this one,
 * or `undefined` when nothing did. N5's implementer never has to know the
 * convention exists.
 */

type TraceSpanStatus = "ok" | "error" | "running";
type TraceSpanKind = "llm" | "tool" | "chain" | "step";

interface TraceSpan {
  id: string;
  /**
   * Plain string, not ReactNode: it doubles as the row trigger's `aria-label`
   * source (see rule below), which needs real text to concatenate.
   */
  name: string;
  /** Drives the row's leading icon only — never the only signal of anything. */
  kind?: TraceSpanKind;
  status: TraceSpanStatus;
  /** Milliseconds from the start of the trace. */
  startMs: number;
  /** Milliseconds. */
  durationMs: number;
  /**
   * The id of the span this attempt retried. When set, this span renders as
   * its own row alongside — never in place of — that span. See rule 2 above.
   */
  retryOf?: string;
  /** Shown in visible text for `status: "error"` — never colour alone. */
  error?: string;
}

/**
 * The forward half of a retry relationship — handed to `renderDetail` for
 * the span that `id` retried. See rule 2 and the `computeRetriedBy` doc
 * comment below for why this exists instead of a documented lookup
 * convention.
 */
interface TraceSpanRetryOutcome {
  id: string;
  name: string;
  status: TraceSpanStatus;
}

interface TraceTimelineBar {
  id: string;
  /** 0–100, percent of the shared axis. */
  leftPct: number;
  /** 0–100, percent of the shared axis. Floored so a near-instant span stays visible and clickable. */
  widthPct: number;
}

/** A bar never renders narrower than this, even for a near-instant span. */
const MIN_BAR_WIDTH_PCT = 1.5;

/**
 * Positions every span by start time on a shared 0–100% axis — see rule 1 in
 * the file-header comment. The axis spans from 0 to the latest `startMs +
 * durationMs` across the given spans, so a call that starts after an earlier
 * one has already finished still lands in the right place; nothing here
 * infers the span from array order or count.
 */
function traceTimelineLayout(spans: Pick<TraceSpan, "id" | "startMs" | "durationMs">[]): TraceTimelineBar[] {
  if (spans.length === 0) return [];
  const end = Math.max(...spans.map((span) => span.startMs + Math.max(span.durationMs, 0)));
  const total = end > 0 ? end : 1;
  return spans.map((span) => ({
    id: span.id,
    leftPct: (span.startMs / total) * 100,
    widthPct: Math.max((Math.max(span.durationMs, 0) / total) * 100, MIN_BAR_WIDTH_PCT),
  }));
}

/** `380ms`, `2.4s`, `1m 04s`. Never a bare millisecond count past one second. */
function formatDurationMs(ms: number): string {
  const safe = Number.isFinite(ms) && ms > 0 ? ms : 0;
  if (safe < 1000) return `${Math.round(safe)}ms`;
  const totalSeconds = safe / 1000;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(totalSeconds < 10 ? 2 : 1)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds - minutes * 60);
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

/**
 * Groups spans by shared retry lineage (walking `retryOf` back to its root)
 * and numbers every span in a group of more than one — see rule 2 above. A
 * span with no retry relationship gets no entry, so its row carries no badge.
 */
function computeAttemptNumbers(spans: TraceSpan[]): Map<string, number> {
  const byId = new Map(spans.map((span) => [span.id, span]));
  const rootOf = (id: string): string => {
    const seen = new Set<string>();
    let current = id;
    while (true) {
      const next = byId.get(current)?.retryOf;
      if (!next || seen.has(current)) return current;
      seen.add(current);
      current = next;
    }
  };

  const groups = new Map<string, TraceSpan[]>();
  for (const span of spans) {
    const root = rootOf(span.id);
    const list = groups.get(root);
    if (list) list.push(span);
    else groups.set(root, [span]);
  }

  const attempts = new Map<string, number>();
  for (const group of groups.values()) {
    if (group.length <= 1) continue;
    [...group]
      .sort((a, b) => a.startMs - b.startMs)
      .forEach((span, index) => attempts.set(span.id, index + 1));
  }
  return attempts;
}

/**
 * The forward half `retryOf` doesn't give you: for every span that *was*
 * retried, who retried it and how that attempt turned out. N5's spec needs
 * this ("what was retried and whether it worked") and `TraceSpan` has no
 * field for it — deriving it here, once, means `renderDetail` can hand it
 * straight over instead of documenting a scan-`spans`-yourself convention.
 * If more than one span retries the same original (concurrent retries,
 * unusual but not disallowed), the earliest-starting one wins — it's the
 * immediate next attempt, which is what "whether it worked" is asking about.
 */
function computeRetriedBy(spans: TraceSpan[]): Map<string, TraceSpanRetryOutcome> {
  const retries = spans.filter((span) => span.retryOf).sort((a, b) => a.startMs - b.startMs);
  const retriedBy = new Map<string, TraceSpanRetryOutcome>();
  for (const span of retries) {
    if (!retriedBy.has(span.retryOf!)) {
      retriedBy.set(span.retryOf!, { id: span.id, name: span.name, status: span.status });
    }
  }
  return retriedBy;
}

const STATUS_LABEL: Record<TraceSpanStatus, string> = {
  ok: "Succeeded",
  error: "Failed",
  running: "Running",
};

const KIND_ICON: Record<TraceSpanKind, React.ReactNode> = {
  llm: <Bot aria-hidden className="size-3.5" />,
  tool: <Wrench aria-hidden className="size-3.5" />,
  chain: <Workflow aria-hidden className="size-3.5" />,
  step: <Workflow aria-hidden className="size-3.5" />,
};

function statusIcon(status: TraceSpanStatus) {
  if (status === "error") return <AlertCircle aria-hidden className="size-4" />;
  if (status === "running")
    return <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />;
  return <CheckCircle2 aria-hidden className="size-4" />;
}

function TraceTimelineDefaultDetail({
  span,
  retriedBy,
}: {
  span: TraceSpan;
  retriedBy?: TraceSpanRetryOutcome;
}) {
  return (
    <dl
      data-slot="trace-timeline-row-detail-fallback"
      className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-foreground"
    >
      <dt className="font-medium">Status</dt>
      <dd>{STATUS_LABEL[span.status]}</dd>
      <dt className="font-medium">Started at</dt>
      <dd className="tabular-nums">{formatDurationMs(span.startMs)}</dd>
      <dt className="font-medium">Duration</dt>
      <dd className="tabular-nums">{formatDurationMs(span.durationMs)}</dd>
      {span.error ? (
        <>
          <dt className="text-destructive font-medium">Error</dt>
          <dd className="text-destructive">{span.error}</dd>
        </>
      ) : null}
      {retriedBy ? (
        <>
          <dt className="font-medium">Retried by</dt>
          <dd data-slot="trace-timeline-row-detail-retried-by">
            {`${retriedBy.name} — ${STATUS_LABEL[retriedBy.status]}`}
          </dd>
        </>
      ) : null}
    </dl>
  );
}

interface TraceTimelineRowProps {
  span: TraceSpan;
  bar: TraceTimelineBar;
  attempt?: number;
  retriedBy?: TraceSpanRetryOutcome;
  expanded: boolean;
  onOpenChange: (open: boolean) => void;
  renderDetail?: (span: TraceSpan, retriedBy?: TraceSpanRetryOutcome) => React.ReactNode;
}

function TraceTimelineRow({
  span,
  bar,
  attempt,
  retriedBy,
  expanded,
  onOpenChange,
  renderDetail,
}: TraceTimelineRowProps) {
  const detailHeadingId = React.useId();
  const barClass =
    span.status === "error" ? "bg-destructive" : span.status === "running" ? "bg-primary/60" : "bg-primary";

  const statusText =
    span.status === "error"
      ? `Failed${span.error ? `: ${span.error}` : ""}`
      : span.status === "running"
        ? STATUS_LABEL.running
        : STATUS_LABEL.ok;

  // Built explicitly rather than left to child-content concatenation — see
  // the file-header comment for why.
  const accessibleName = [
    span.name,
    attempt ? `Attempt ${attempt}` : null,
    statusText,
    formatDurationMs(span.durationMs),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <li
      data-slot="trace-timeline-row"
      data-status={span.status}
      data-retry-of={span.retryOf}
      className="border-b last:border-b-0"
    >
      <Collapsible open={expanded} onOpenChange={onOpenChange}>
        <CollapsibleTrigger
          data-slot="trace-timeline-row-trigger"
          aria-label={accessibleName}
          className="group hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex w-full items-start gap-3 px-3 py-2.5 text-left focus-visible:ring-2 focus-visible:outline-none"
        >
          <span aria-hidden className={cn("mt-0.5 shrink-0", span.status === "error" && "text-destructive")}>
            {statusIcon(span.status)}
          </span>
          <span className="min-w-0 flex-1">
            <span aria-hidden className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              {span.kind ? <span>{KIND_ICON[span.kind]}</span> : null}
              <span data-slot="trace-timeline-row-name" className="truncate text-sm font-medium">
                {span.name}
              </span>
              {attempt ? (
                <span
                  data-slot="trace-timeline-row-attempt"
                  className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium"
                >
                  <RefreshCw className="size-2.5" />
                  {`Attempt ${attempt}`}
                </span>
              ) : null}
              {span.status !== "ok" ? (
                <span
                  data-slot="trace-timeline-row-status-text"
                  className={cn("text-xs font-medium", span.status === "error" && "text-destructive")}
                >
                  {statusText}
                </span>
              ) : null}
            </span>
            <span
              data-slot="trace-timeline-row-track"
              aria-hidden="true"
              className="bg-muted relative mt-1.5 block h-1.5 w-full overflow-hidden rounded-full"
            >
              <span
                data-slot="trace-timeline-row-bar"
                data-span-id={span.id}
                data-status={span.status}
                className={cn("absolute inset-y-0 rounded-full", barClass)}
                style={{ left: `${bar.leftPct}%`, width: `${bar.widthPct}%` }}
              />
            </span>
          </span>
          <span
            data-slot="trace-timeline-row-duration"
            aria-hidden
            className="shrink-0 pt-0.5 text-xs tabular-nums"
          >
            {formatDurationMs(span.durationMs)}
          </span>
          <ChevronDown
            aria-hidden
            className="group-data-[panel-open]:rotate-180 mt-0.5 size-4 shrink-0 transition-transform"
          />
        </CollapsibleTrigger>
        <CollapsibleContent data-slot="trace-timeline-row-detail">
          <div role="group" aria-labelledby={detailHeadingId} className="bg-card border-t px-3 py-3 text-sm">
            <h4 id={detailHeadingId} className="sr-only">
              {span.name} detail
            </h4>
            {renderDetail ? (
              renderDetail(span, retriedBy)
            ) : (
              <TraceTimelineDefaultDetail span={span} retriedBy={retriedBy} />
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

interface TraceTimelineProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  spans?: TraceSpan[];
  /** Row id currently expanded. Optionally controlled — omit for an uncontrolled single-open list. */
  expandedId?: string | null;
  defaultExpandedId?: string | null;
  onExpandedChange?: (id: string | null) => void;
  /**
   * Renders the body of the expanded row — the seam N5 `run-inspector` fills.
   * The second argument is who (if anyone) retried this span and how that
   * attempt turned out — see `computeRetriedBy` and the file-header comment.
   * Falls back to a minimal built-in summary when omitted.
   */
  renderDetail?: (span: TraceSpan, retriedBy?: TraceSpanRetryOutcome) => React.ReactNode;
}

function TraceTimeline({
  spans = [],
  expandedId,
  defaultExpandedId = null,
  onExpandedChange,
  renderDetail,
  className,
  ...props
}: TraceTimelineProps) {
  const [uncontrolledExpandedId, setUncontrolledExpandedId] = React.useState<string | null>(
    defaultExpandedId,
  );
  const resolvedExpandedId = expandedId !== undefined ? expandedId : uncontrolledExpandedId;

  const handleOpenChange = (id: string, open: boolean) => {
    const next = open ? id : null;
    if (expandedId === undefined) setUncontrolledExpandedId(next);
    onExpandedChange?.(next);
  };

  // Sorted by start time — the list itself reads top-to-bottom in the order
  // things began, which is what a waterfall's row order should mean.
  const ordered = React.useMemo(
    () =>
      spans
        .map((span, index) => ({ span, index }))
        .sort((a, b) => a.span.startMs - b.span.startMs || a.index - b.index)
        .map((entry) => entry.span),
    [spans],
  );

  const bars = React.useMemo(() => {
    const layout = traceTimelineLayout(ordered);
    return new Map(layout.map((bar) => [bar.id, bar]));
  }, [ordered]);

  const attempts = React.useMemo(() => computeAttemptNumbers(spans), [spans]);
  const retriedBy = React.useMemo(() => computeRetriedBy(spans), [spans]);

  return (
    <div
      data-slot="trace-timeline"
      className={cn("bg-background w-full rounded-lg border", className)}
      {...props}
    >
      {ordered.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm">No spans recorded for this run yet.</p>
      ) : (
        <ul data-slot="trace-timeline-rows" className="flex flex-col">
          {ordered.map((span) => (
            <TraceTimelineRow
              key={span.id}
              span={span}
              bar={bars.get(span.id)!}
              attempt={attempts.get(span.id)}
              retriedBy={retriedBy.get(span.id)}
              expanded={resolvedExpandedId === span.id}
              onOpenChange={(open) => handleOpenChange(span.id, open)}
              renderDetail={renderDetail}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export { TraceTimeline, computeRetriedBy, formatDurationMs, traceTimelineLayout };
export type {
  TraceSpan,
  TraceSpanKind,
  TraceSpanRetryOutcome,
  TraceSpanStatus,
  TraceTimelineBar,
  TraceTimelineProps,
};
