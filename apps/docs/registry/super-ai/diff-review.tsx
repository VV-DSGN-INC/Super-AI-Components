"use client";

import { Check, CheckCheck, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * Diff Review — track changes on prose, with a rationale on every change.
 *
 * Spec: docs/design-system/component-specs.md#k3-diff-review
 * States: word-level · per-change-verbs · bulk-verbs
 *
 * Three rules carry the weight, and each is pinned by a test:
 *
 * 1. **Rationale is a required slot, not a tooltip.** `DiffChange.rationale`
 *    is non-optional in the type and always rendered. Seven unexplained edits
 *    take longer to review than they took to write, so a change that cannot
 *    say why it exists cannot be constructed.
 * 2. **Word-level, not line-level.** A paragraph is a single ordered run of
 *    segments — unchanged, inserted, deleted — rendered inside one `<p>`. A
 *    line diff on prose makes you re-read the whole paragraph twice to find
 *    the one word that moved.
 * 3. **Bulk verbs sit apart from the per-change verbs.** Accept-all and
 *    reject-all live in their own region (`diff-review-bulk`), below a
 *    separator and outside the change list, so a stray click next to one
 *    change cannot resolve the whole document.
 *
 * Accessibility: insertion and deletion are never signalled by colour. They
 * are real `<ins>` and `<del>` elements (which carry the semantics), they are
 * shape-distinguished on screen (underline vs. strike-through, not hue), and
 * each is introduced by visually-hidden text naming what it is. Every
 * per-change button is named for the change it resolves — "Accept: replace
 * 'utilise' with 'use'" — rather than being the Nth identical "Accept".
 */

type DiffChangeStatus = "pending" | "accepted" | "rejected";

/**
 * One run inside a paragraph. `changeId` is required on the two changed kinds
 * (a discriminated union, so it cannot be forgotten) — that is the link back
 * to the rationale.
 */
type DiffSegment =
  | { kind: "unchanged"; text: string }
  | { kind: "inserted"; text: string; changeId: string }
  | { kind: "deleted"; text: string; changeId: string };

interface DiffChange {
  id: string;
  /**
   * Why this edit was made. **Required** — the one thing that separates this
   * component from a generic diff viewer.
   */
  rationale: React.ReactNode;
  /** Overrides the description derived from the change's own segments. */
  summary?: string;
  /** Defaults to `"pending"`. */
  status?: DiffChangeStatus;
}

interface DiffParagraph {
  id: string;
  /** Ordered run. A replacement is a deleted segment plus an inserted one
   *  sharing a `changeId`, not a replaced line. */
  segments: DiffSegment[];
}

interface DiffReviewProps extends Omit<React.ComponentProps<"div">, "children"> {
  paragraphs: DiffParagraph[];
  /** Review order. A change absent from this list has no rationale and is a bug. */
  changes: DiffChange[];
  /** Names the thing being reviewed. */
  label?: React.ReactNode;
  onAccept?: (changeId: string) => void;
  onReject?: (changeId: string) => void;
  /** Supplying either one renders the separate bulk region. */
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
}

/**
 * The accessible name of a change, in words. Derived from the segments rather
 * than authored, so it cannot drift from what is actually on screen — and so a
 * caller cannot ship eight buttons all called "Accept".
 */
function describeChange(changeId: string, paragraphs: DiffParagraph[]): string {
  let deleted = "";
  let inserted = "";
  for (const paragraph of paragraphs) {
    for (const segment of paragraph.segments) {
      if (segment.kind === "unchanged" || segment.changeId !== changeId) continue;
      if (segment.kind === "deleted") deleted += segment.text;
      else inserted += segment.text;
    }
  }
  const from = deleted.trim();
  const to = inserted.trim();
  if (from && to) return `replace “${from}” with “${to}”`;
  if (to) return `insert “${to}”`;
  if (from) return `delete “${from}”`;
  return "change";
}

const RESOLUTION_TEXT: Record<Exclude<DiffChangeStatus, "pending">, string> = {
  accepted: "Accepted",
  rejected: "Rejected",
};

function DiffReview({
  paragraphs,
  changes,
  label = "Suggested edits",
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
  className,
  ...props
}: DiffReviewProps) {
  const statusOf = React.useCallback(
    (changeId: string): DiffChangeStatus =>
      changes.find((change) => change.id === changeId)?.status ?? "pending",
    [changes],
  );

  const pending = changes.filter((change) => (change.status ?? "pending") === "pending");
  const hasPerChangeVerbs = Boolean(onAccept || onReject);
  const hasBulkVerbs = Boolean(onAcceptAll || onRejectAll);

  return (
    <div
      data-slot="diff-review"
      className={cn(
        "bg-card text-card-foreground flex w-full flex-col gap-4 rounded-xl border p-4",
        className,
      )}
      {...props}
    >
      <div data-slot="diff-review-header" className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-foreground text-sm font-medium">{label}</span>
        {/* Announced, not merely recounted: resolving a change moves this
            number, and a keyboard user gets told without leaving the list. */}
        <span
          data-slot="diff-review-status"
          role="status"
          aria-live="polite"
          className="text-foreground text-xs"
        >
          {changes.length === 0
            ? "No changes to review"
            : pending.length === 0
              ? `All ${changes.length} changes resolved`
              : `${pending.length} of ${changes.length} changes awaiting review`}
        </span>
      </div>

      {/* The prose. Nothing in here is interactive — the verbs live in the
          change list below, so a change can never be a button containing
          buttons. */}
      <div data-slot="diff-review-document" className="text-foreground flex flex-col gap-3 text-sm">
        {paragraphs.map((paragraph) => (
          <p
            key={paragraph.id}
            data-slot="diff-review-paragraph"
            data-paragraph-id={paragraph.id}
            className="leading-relaxed"
          >
            {paragraph.segments.map((segment, index) => (
              <DiffSegmentView
                key={`${paragraph.id}-${index}`}
                segment={segment}
                status={segment.kind === "unchanged" ? "pending" : statusOf(segment.changeId)}
              />
            ))}
          </p>
        ))}
      </div>

      {changes.length > 0 ? (
        <>
          <Separator />
          <ol data-slot="diff-review-changes" className="flex flex-col gap-2">
            {changes.map((change) => {
              const status = change.status ?? "pending";
              const description = change.summary ?? describeChange(change.id, paragraphs);
              return (
                <li
                  key={change.id}
                  data-slot="diff-review-change"
                  data-change-id={change.id}
                  data-status={status}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span
                      data-slot="diff-review-change-summary"
                      className="text-foreground text-sm font-medium first-letter:uppercase"
                    >
                      {description}
                    </span>
                    {/* Full-contrast, always present. The rationale is the
                        content of this component, not a secondary annotation. */}
                    <span data-slot="diff-review-rationale" className="text-foreground text-sm">
                      {change.rationale}
                    </span>
                  </div>

                  {status !== "pending" ? (
                    <span
                      data-slot="diff-review-resolution"
                      className="text-foreground shrink-0 text-xs"
                    >
                      {RESOLUTION_TEXT[status]}
                    </span>
                  ) : hasPerChangeVerbs ? (
                    <span
                      data-slot="diff-review-change-verbs"
                      className="flex shrink-0 items-center gap-1"
                    >
                      {onAccept ? (
                        <Button
                          data-slot="diff-review-accept"
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onAccept(change.id)}
                        >
                          <Check aria-hidden />
                          Accept
                          {/* The visible word stays "Accept"; the accessible
                              name says which one. */}
                          <span className="sr-only">: {description}</span>
                        </Button>
                      ) : null}
                      {onReject ? (
                        <Button
                          data-slot="diff-review-reject"
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onReject(change.id)}
                        >
                          <X aria-hidden />
                          Reject
                          <span className="sr-only">: {description}</span>
                        </Button>
                      ) : null}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </>
      ) : null}

      {hasBulkVerbs ? (
        <>
          <Separator />
          {/* Deliberately its own region, below the separator and outside the
              change list: whole-document verbs are not the eighth item in a
              column of per-change verbs. */}
          <div
            data-slot="diff-review-bulk"
            role="group"
            aria-label="Whole document"
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <span className="text-foreground text-xs">Whole document</span>
            <span className="flex items-center gap-2">
              {onAcceptAll ? (
                <Button
                  data-slot="diff-review-accept-all"
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending.length === 0}
                  onClick={onAcceptAll}
                >
                  <CheckCheck aria-hidden />
                  Accept all changes
                </Button>
              ) : null}
              {onRejectAll ? (
                <Button
                  data-slot="diff-review-reject-all"
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending.length === 0}
                  onClick={onRejectAll}
                >
                  <X aria-hidden />
                  Reject all changes
                </Button>
              ) : null}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * One segment of prose.
 *
 * A resolved change is *applied*, not annotated: accepting drops the deleted
 * run and demotes the inserted run to ordinary text, rejecting does the
 * reverse. That is what makes the remaining marks the remaining work.
 *
 * Colour is never the signal. `<ins>` and `<del>` carry the semantics for
 * assistive technology, the visually-hidden lead-in names the kind in words,
 * and on screen they differ by decoration shape — underline vs. strike-through
 * — so the distinction survives greyscale.
 */
function DiffSegmentView({
  segment,
  status,
}: {
  segment: DiffSegment;
  status: DiffChangeStatus;
}) {
  if (segment.kind === "unchanged") {
    return (
      <span data-slot="diff-review-segment" data-kind="unchanged">
        {segment.text}
      </span>
    );
  }

  const applied =
    (status === "accepted" && segment.kind === "inserted") ||
    (status === "rejected" && segment.kind === "deleted");
  const discarded = status !== "pending" && !applied;

  if (discarded) return null;

  if (applied) {
    return (
      <span
        data-slot="diff-review-segment"
        data-kind="unchanged"
        data-change-id={segment.changeId}
        data-resolved={status}
      >
        {segment.text}
      </span>
    );
  }

  if (segment.kind === "inserted") {
    return (
      <ins
        data-slot="diff-review-segment"
        data-kind="inserted"
        data-change-id={segment.changeId}
        className="bg-primary/10 text-foreground rounded-sm px-0.5 underline decoration-2 underline-offset-2"
      >
        <span className="sr-only">insertion start </span>
        {segment.text}
        <span className="sr-only"> insertion end</span>
      </ins>
    );
  }

  return (
    <del
      data-slot="diff-review-segment"
      data-kind="deleted"
      data-change-id={segment.changeId}
      className="bg-muted text-foreground rounded-sm px-0.5 line-through decoration-2"
    >
      <span className="sr-only">deletion start </span>
      {segment.text}
      <span className="sr-only"> deletion end</span>
    </del>
  );
}

export { DiffReview };
export type { DiffChange, DiffChangeStatus, DiffParagraph, DiffReviewProps, DiffSegment };
