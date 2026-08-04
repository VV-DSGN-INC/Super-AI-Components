"use client";

import { Check, ChevronDown, Loader2, Pencil, RotateCcw, SkipForward, Undo2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Approval Card — a single artifact, waiting on a human decision.
 *
 * Spec: docs/design-system/component-specs.md#f7-approval-card
 * States: pending · submitting · resolved
 *
 * This is the Approval contract's only implementation in the catalog, so
 * families K and N inherit this shape rather than re-deriving it. Three rules
 * carry the weight:
 *
 * 1. "Four verbs, always in the same order" — Confirm · Edit · Regenerate ·
 *    Skip. The order is fixed by the component, never by the order a caller
 *    happens to pass the handlers in, so the muscle memory holds across every
 *    approval surface in the product.
 * 2. Detail is truncated behind an explicit expand. Approving what you could
 *    not read is exactly what this component exists to prevent, so the detail
 *    is never auto-expanded and never silently elided.
 * 3. A resolved decision keeps Undo for a window. Confirm and Skip are
 *    terminal; without the window they would be irreversible.
 */

type ApprovalState = "pending" | "submitting" | "resolved";
type ApprovalResolution = "confirmed" | "edited" | "regenerated" | "skipped";

/**
 * The canonical order. Iterated as-is when rendering, which is what makes the
 * ordering a property of the component rather than of the call site — a caller
 * who passes only `onSkip` and `onConfirm` still gets Confirm before Skip.
 *
 * `terminal` marks the two verbs that end the interaction: Edit and Regenerate
 * hand you back to the artifact, so they resolve nothing on their own.
 */
const VERBS = [
  { id: "confirm", label: "Confirm", icon: Check, terminal: true },
  { id: "edit", label: "Edit", icon: Pencil, terminal: false },
  { id: "regenerate", label: "Regenerate", icon: RotateCcw, terminal: false },
  { id: "skip", label: "Skip", icon: SkipForward, terminal: true },
] as const;

const RESOLUTION_TEXT: Record<ApprovalResolution, string> = {
  confirmed: "Confirmed",
  edited: "Sent back for editing",
  regenerated: "Sent back to regenerate",
  skipped: "Skipped",
};

interface ApprovalCardProps extends Omit<React.ComponentProps<"div">, "title"> {
  title: React.ReactNode;
  summary?: React.ReactNode;
  /** Truncated until explicitly expanded. Never auto-expands. */
  detail?: React.ReactNode;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  state?: ApprovalState;
  resolution?: ApprovalResolution;
  /** Terminal. */
  onConfirm?: () => void;
  /** Returns you to the artifact. */
  onEdit?: () => void;
  /** Returns you to the artifact. */
  onRegenerate?: () => void;
  /** Terminal. */
  onSkip?: () => void;
  onUndo?: () => void;
  /** How long Undo stays available once resolved. */
  undoWindowMs?: number;
}

function ApprovalCard({
  title,
  summary,
  detail,
  expanded,
  onExpandedChange,
  state = "pending",
  resolution,
  onConfirm,
  onEdit,
  onRegenerate,
  onSkip,
  onUndo,
  undoWindowMs = 8000,
  className,
  children,
  ...props
}: ApprovalCardProps) {
  const detailId = React.useId();
  const [uncontrolledExpanded, setUncontrolledExpanded] = React.useState(false);
  const isExpanded = expanded ?? uncontrolledExpanded;

  const handlers: Record<string, (() => void) | undefined> = {
    confirm: onConfirm,
    edit: onEdit,
    regenerate: onRegenerate,
    skip: onSkip,
  };

  // The Undo window is real time, so it has to expire on its own — a caller
  // that forgets to clear it would otherwise leave Undo on screen forever.
  //
  // The flag is raised only by the timer and lowered only by the cleanup, so
  // nothing sets state synchronously during the effect (which would cascade a
  // render). Because the cleanup runs whenever the resolution changes or the
  // card leaves `resolved`, a second decision always gets a full fresh window
  // rather than inheriting what was left of the first.
  const [undoExpired, setUndoExpired] = React.useState(false);
  React.useEffect(() => {
    if (state !== "resolved" || !onUndo) return;
    const timer = setTimeout(() => setUndoExpired(true), undoWindowMs);
    return () => {
      clearTimeout(timer);
      setUndoExpired(false);
    };
  }, [state, resolution, onUndo, undoWindowMs]);

  const showUndo = state === "resolved" && Boolean(onUndo) && !undoExpired;

  const toggleExpanded = () => {
    const next = !isExpanded;
    if (expanded === undefined) setUncontrolledExpanded(next);
    onExpandedChange?.(next);
  };

  return (
    <Card data-slot="approval-card" data-state={state} className={cn("gap-3", className)}>
      <CardHeader>
        <CardTitle data-slot="approval-card-title">{title}</CardTitle>
        {summary ? (
          // text-foreground rather than the card's muted description token:
          // this is the sentence someone approves on, so it is not secondary
          // text, and muted-on-card is the contrast pairing this system keeps
          // failing.
          <p data-slot="approval-card-summary" className="text-foreground text-sm">
            {summary}
          </p>
        ) : null}
      </CardHeader>

      {detail ? (
        <CardContent className="flex flex-col items-start gap-2">
          <Button
            data-slot="approval-card-expand"
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={isExpanded}
            aria-controls={detailId}
            onClick={toggleExpanded}
          >
            <ChevronDown
              aria-hidden
              className={cn("transition-transform", isExpanded && "rotate-180")}
            />
            {isExpanded ? "Hide detail" : "Show detail"}
          </Button>
          {/* Rendered only when expanded, not merely clipped: a visually
              truncated block is still readable by a screen reader, which would
              make "expanded" a sighted-only distinction. */}
          {isExpanded ? (
            <div data-slot="approval-card-detail" id={detailId} className="text-foreground text-sm">
              {detail}
            </div>
          ) : null}
        </CardContent>
      ) : null}

      {children ? <CardContent>{children}</CardContent> : null}

      <CardContent>
        {state === "resolved" ? (
          <div data-slot="approval-card-resolution" className="flex items-center gap-2 text-sm">
            <Check aria-hidden className="size-4" />
            <span className="text-foreground">
              {resolution ? RESOLUTION_TEXT[resolution] : "Resolved"}
            </span>
            {showUndo ? (
              <Button
                data-slot="approval-card-undo"
                type="button"
                variant="outline"
                size="sm"
                onClick={onUndo}
              >
                <Undo2 aria-hidden />
                Undo
              </Button>
            ) : null}
          </div>
        ) : (
          <ButtonGroup data-slot="approval-card-verbs" aria-label="Approval actions">
            {VERBS.filter((verb) => handlers[verb.id]).map((verb) => {
              const Icon = verb.icon;
              return (
                <Button
                  key={verb.id}
                  data-slot={`approval-card-${verb.id}`}
                  type="button"
                  size="sm"
                  variant={verb.id === "confirm" ? "default" : "outline"}
                  disabled={state === "submitting"}
                  onClick={handlers[verb.id]}
                >
                  {state === "submitting" && verb.id === "confirm" ? (
                    <Loader2 aria-hidden className="animate-spin" />
                  ) : (
                    <Icon aria-hidden />
                  )}
                  {verb.label}
                </Button>
              );
            })}
          </ButtonGroup>
        )}
      </CardContent>

      <span data-slot="approval-card-status" role="status" className="sr-only">
        {state === "submitting"
          ? "Submitting your decision"
          : state === "resolved"
            ? resolution
              ? RESOLUTION_TEXT[resolution]
              : "Resolved"
            : "Awaiting your decision"}
      </span>
    </Card>
  );
}

export { ApprovalCard };
export type { ApprovalCardProps, ApprovalResolution, ApprovalState };
