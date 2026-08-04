"use client";

import { AlertTriangle, Ban, CheckCircle2, Loader2, RotateCcw, X } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EntityRow } from "@/registry/super-ai/entity-row";

/**
 * Generation Queue — Pending slots with progress
 *
 * Spec: docs/design-system/component-specs.md#e6-generation-queue
 * States: queued · running · done · failed · cancel
 *
 * Rows compose A9 `entity-row` for icon/title/description/trailing chrome
 * rather than a restyled row — `entity-row` is rendered without `onSelect`
 * so it stays a plain, non-interactive wrapper (the skill-menu convention):
 * Cancel/Retry are real `<button>`s living in its `trailing` slot, and since
 * the row itself is never a button there is no nested-interactive violation.
 *
 * Per-slot progress (E5/E6: "batch progress and per-slot progress are
 * different numbers and both are needed") renders through the vendored
 * `progress` primitive, whose root already provides `role="progressbar"`,
 * `aria-valuenow`/`min`/`max` and a formatted `aria-valuetext` ("42%") for
 * free — a percentage is never conveyed by bar width alone. A `queued` slot
 * has nothing to measure yet, so its icon is a `skeleton` placeholder
 * instead of a static icon: the reserved-slot idea from the spec, applied to
 * a list row rather than a media tile.
 *
 * `done` and `failed` differ by icon shape *and* a text badge, never colour
 * alone. Each row also carries a visually-hidden `role="status"` summary so
 * a queued → running → done/failed transition is announced, matching the
 * convention N1 `feedback` established for state changes.
 */

type GenerationQueueItemState = "queued" | "running" | "done" | "failed" | "cancel";

interface GenerationQueueItem {
  id: string;
  title: string;
  /** Shown as the row description; overridden by `errorMessage` while `failed`. */
  description?: string;
  /** Overrides the default per-state icon (skeleton/spinner/check/warning/ban). */
  icon?: React.ReactNode;
  state: GenerationQueueItemState;
  /** 0–100. Omit while `running` to render an indeterminate bar. */
  progress?: number;
  /** Shown in place of `description`, and announced, while `failed`. */
  errorMessage?: string;
}

interface GenerationQueueProps extends Omit<React.ComponentProps<"div">, "title"> {
  items?: GenerationQueueItem[];
  /** Heading above the list, e.g. "Generating 4 images". */
  heading?: React.ReactNode;
  /**
   * Aggregate percentage across the whole batch — a distinct number from any
   * one slot's `progress`. Defaults to the share of slots that have resolved
   * (done, failed or cancelled) when omitted.
   */
  batchProgress?: number;
  batchLabel?: string;
  /**
   * Cancelling a batch must not orphan completed slots: only queued/running
   * ids are ever passed here, and the button itself is hidden once nothing
   * is left to cancel.
   */
  onCancelAll?: (ids: string[]) => void;
  cancelAllLabel?: string;
  onCancelItem?: (id: string) => void;
  onRetryItem?: (id: string) => void;
  /** Per-row accessible name for Cancel — a bare icon is never enough. */
  cancelItemLabel?: (item: GenerationQueueItem) => string;
  retryItemLabel?: (item: GenerationQueueItem) => string;
  emptyMessage?: string;
}

const STATE_ICON: Record<Exclude<GenerationQueueItemState, "queued" | "running">, React.ReactNode> = {
  done: <CheckCircle2 aria-hidden className="size-4" />,
  failed: <AlertTriangle aria-hidden className="text-destructive size-4" />,
  cancel: <Ban aria-hidden className="size-4" />,
};

const STATE_TEXT: Record<GenerationQueueItemState, string> = {
  queued: "Queued",
  running: "Running",
  done: "Done",
  failed: "Failed",
  cancel: "Cancelled",
};

function GenerationQueueItemRow({
  item,
  onCancel,
  onRetry,
  cancelLabel,
  retryLabel,
}: {
  item: GenerationQueueItem;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  cancelLabel: (item: GenerationQueueItem) => string;
  retryLabel: (item: GenerationQueueItem) => string;
}) {
  const { id, title, description, icon, state, progress, errorMessage } = item;
  const pct = progress != null ? Math.max(0, Math.min(100, Math.round(progress))) : null;

  const stateIcon =
    icon ??
    (state === "queued" ? (
      <Skeleton aria-hidden data-slot="generation-queue-icon-queued" className="size-4 rounded-full" />
    ) : state === "running" ? (
      <Loader2 aria-hidden className="size-4 animate-spin" />
    ) : (
      STATE_ICON[state]
    ));

  const stateBadge =
    state === "queued" ? (
      <Badge variant="outline">{STATE_TEXT.queued}</Badge>
    ) : state === "done" ? (
      <Badge variant="secondary">{STATE_TEXT.done}</Badge>
    ) : state === "failed" ? (
      // Badge's own destructive variant (bg-destructive/10 text-destructive)
      // is 4.0:1 against a 4.5:1 minimum — vendored shadcn primitive, fixed
      // at the call site rather than in components/ui/badge.tsx. Going solid
      // (bg-destructive text-background, the same substitution promo-card's
      // quota-warning CTA uses) clears 4.5:1 and reads as more urgent, not
      // less. See docs/design-system/a11y-baseline.md.
      <Badge variant="destructive" className="bg-destructive text-background">
        {STATE_TEXT.failed}
      </Badge>
    ) : state === "cancel" ? (
      <Badge variant="outline">{STATE_TEXT.cancel}</Badge>
    ) : null;

  const statusText =
    state === "running"
      ? `${title}: ${STATE_TEXT.running}${pct != null ? `, ${pct}%` : ""}`
      : state === "failed"
        ? `${title}: ${STATE_TEXT.failed}${errorMessage ? `, ${errorMessage}` : ""}`
        : `${title}: ${STATE_TEXT[state]}`;

  const trailing = (
    <div className="flex shrink-0 items-center gap-2">
      {state === "running" && pct != null ? (
        <span data-slot="generation-queue-percent" className="text-muted-foreground text-xs tabular-nums">
          {pct}%
        </span>
      ) : null}
      {stateBadge}
      {(state === "queued" || state === "running") && onCancel ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={cancelLabel(item)}
          data-slot="generation-queue-cancel"
          onClick={() => onCancel(id)}
        >
          <X aria-hidden />
        </Button>
      ) : null}
      {state === "failed" && onRetry ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={retryLabel(item)}
          data-slot="generation-queue-retry"
          onClick={() => onRetry(id)}
        >
          <RotateCcw aria-hidden />
        </Button>
      ) : null}
    </div>
  );

  return (
    <li data-slot="generation-queue-item" data-state={state} className="flex flex-col">
      <EntityRow
        icon={stateIcon}
        title={title}
        description={state === "failed" && errorMessage ? errorMessage : description}
        trailing={trailing}
      />
      {state === "running" ? (
        <div className="px-3 pb-2">
          <Progress data-slot="generation-queue-item-progress" value={pct}>
            <ProgressLabel className="sr-only">{`${title} progress`}</ProgressLabel>
          </Progress>
        </div>
      ) : null}
      {/* Announces queued → running → done/failed/cancel transitions even
          though the badge and icon above already make the state visible. */}
      <span data-slot="generation-queue-item-status" role="status" className="sr-only">
        {statusText}
      </span>
    </li>
  );
}

function GenerationQueue({
  items = [],
  heading,
  batchProgress,
  batchLabel = "Batch progress",
  onCancelAll,
  cancelAllLabel = "Cancel all",
  onCancelItem,
  onRetryItem,
  cancelItemLabel = (item) => `Cancel ${item.title}`,
  retryItemLabel = (item) => `Retry ${item.title}`,
  emptyMessage = "No generations queued.",
  className,
  ...props
}: GenerationQueueProps) {
  const total = items.length;
  const cancellableIds = items
    .filter((item) => item.state === "queued" || item.state === "running")
    .map((item) => item.id);
  const resolvedCount = items.filter(
    (item) => item.state === "done" || item.state === "failed" || item.state === "cancel",
  ).length;

  // Falls back to "share of slots resolved" so the bar always has something
  // meaningful to show — but a real batchProgress (e.g. summed per-slot
  // percentages) always wins, since it's a genuinely different number from
  // a simple resolved/total ratio.
  const effectiveBatchProgress = batchProgress ?? (total > 0 ? Math.round((resolvedCount / total) * 100) : null);

  const showCancelAll = cancellableIds.length > 0 && Boolean(onCancelAll);
  const showHeader = Boolean(heading) || effectiveBatchProgress != null || showCancelAll;

  return (
    <div
      data-slot="generation-queue"
      className={cn("flex w-full max-w-md flex-col gap-3", className)}
      {...props}
    >
      {showHeader ? (
        <div data-slot="generation-queue-header" className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            {heading ? (
              <p data-slot="generation-queue-heading" className="text-sm font-medium">
                {heading}
              </p>
            ) : null}
            {showCancelAll ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-slot="generation-queue-cancel-all"
                className="ml-auto"
                onClick={() => onCancelAll?.(cancellableIds)}
              >
                {cancelAllLabel}
              </Button>
            ) : null}
          </div>
          {effectiveBatchProgress != null ? (
            <Progress data-slot="generation-queue-batch-progress" value={effectiveBatchProgress}>
              <div className="flex items-center justify-between gap-2">
                <ProgressLabel className="text-muted-foreground text-xs">{batchLabel}</ProgressLabel>
                <span aria-hidden className="text-muted-foreground text-xs tabular-nums">
                  {resolvedCount}/{total}
                </span>
              </div>
            </Progress>
          ) : null}
        </div>
      ) : null}

      {total === 0 ? (
        <p data-slot="generation-queue-empty" className="text-muted-foreground text-sm">
          {emptyMessage}
        </p>
      ) : (
        <ul data-slot="generation-queue-items" className="flex flex-col gap-1">
          {items.map((item) => (
            <GenerationQueueItemRow
              key={item.id}
              item={item}
              onCancel={onCancelItem}
              onRetry={onRetryItem}
              cancelLabel={cancelItemLabel}
              retryLabel={retryItemLabel}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export { GenerationQueue };
export type { GenerationQueueItem, GenerationQueueItemState, GenerationQueueProps };
