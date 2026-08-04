"use client";

import { Copy, Pencil, Shuffle } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCost, type Cost } from "@/registry/super-ai/cost";
import { StatReadout } from "@/registry/super-ai/stat-readout";

/**
 * Asset Detail — one result, full size, with everything that made it.
 *
 * Spec: docs/design-system/component-specs.md#f3-asset-detail
 * States: highlighted-spans · params-grid · handoff-verbs · more-like-this
 *
 * "The highlighted span is the point: prompts are editable material, not a
 * caption." A lightbox that shows the prompt as a caption treats the sentence
 * that produced the image as trivia; highlighting a phrase and feeding it
 * straight into Remix treats it as the material it actually is.
 *
 * Params render through A10 `stat-readout` — "the same grid N5
 * `run-inspector` uses" — so provenance looks identical wherever it appears,
 * and A10's em-dash for a missing value comes along with it. Seed and sampler
 * are what make a result reproducible, which is why they are copyable.
 */

interface PromptSpan {
  start: number;
  end: number;
}

interface AssetDetailParam {
  label: React.ReactNode;
  value?: React.ReactNode;
  copyable?: boolean;
}

interface AssetDetailProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  media: React.ReactNode;
  prompt?: string;
  /** Character ranges within `prompt` that are selectable material. */
  highlightedSpans?: PromptSpan[];
  /** Fires with the exact text of the span, which is what feeds Remix. */
  onSpanSelect?: (text: string, span: PromptSpan) => void;
  /** A10's `items` shape verbatim, so this grid and N5's are the same grid. */
  params?: AssetDetailParam[];
  onCopyPrompt?: () => void;
  /** Carries prompt and params into D1 `media-prompt-bar`. */
  onRemix?: (payload: { prompt?: string; span?: string }) => void;
  onEdit?: () => void;
  moreLikeThis?: React.ReactNode;
  cost?: Cost;
}

/**
 * Splits the prompt into plain and highlighted runs.
 *
 * Sorted and clamped rather than trusted: overlapping or reversed ranges would
 * otherwise duplicate or drop text, and the whole point is that what the user
 * clicks is exactly what Remix receives.
 */
function segmentPrompt(prompt: string, spans: PromptSpan[]) {
  const clean = spans
    .map((s) => ({ start: Math.max(0, s.start), end: Math.min(prompt.length, s.end) }))
    .filter((s) => s.end > s.start)
    .sort((a, b) => a.start - b.start);

  const segments: { text: string; span?: PromptSpan }[] = [];
  let cursor = 0;
  for (const span of clean) {
    if (span.start < cursor) continue; // overlaps one already emitted
    if (span.start > cursor) segments.push({ text: prompt.slice(cursor, span.start) });
    segments.push({ text: prompt.slice(span.start, span.end), span });
    cursor = span.end;
  }
  if (cursor < prompt.length) segments.push({ text: prompt.slice(cursor) });
  return segments;
}

function AssetDetail({
  open,
  onOpenChange,
  media,
  prompt,
  highlightedSpans = [],
  onSpanSelect,
  params,
  onCopyPrompt,
  onRemix,
  onEdit,
  moreLikeThis,
  cost,
}: AssetDetailProps) {
  const segments = prompt ? segmentPrompt(prompt, highlightedSpans) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="asset-detail" className="sm:max-w-4xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Result detail</DialogTitle>
          <DialogDescription>
            The generated result at full size, with the prompt and parameters that produced it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div data-slot="asset-detail-media" className="overflow-hidden rounded-lg">
            {media}
          </div>

          <div data-slot="asset-detail-rail" className="flex min-w-0 flex-col gap-4">
            {prompt ? (
              <div className="flex flex-col gap-2">
                <h3 className="text-foreground text-xs font-medium">Prompt</h3>
                <p data-slot="asset-detail-prompt" className="text-foreground text-sm">
                  {segments.map((segment, i) =>
                    segment.span && onSpanSelect ? (
                      <button
                        key={i}
                        type="button"
                        data-slot="asset-detail-span"
                        // The button's text is its accessible name, so what a
                        // screen reader announces is exactly what gets remixed.
                        onClick={() => onSpanSelect(segment.text, segment.span!)}
                        className="bg-foreground/10 text-foreground focus-visible:ring-ring hover:bg-foreground/20 rounded px-0.5 focus-visible:ring-2 focus-visible:outline-none"
                      >
                        {segment.text}
                      </button>
                    ) : segment.span ? (
                      // Highlighted but inert: still marked, because the
                      // highlight is information even without a handler.
                      <mark
                        key={i}
                        data-slot="asset-detail-span"
                        className="bg-foreground/10 text-foreground rounded px-0.5"
                      >
                        {segment.text}
                      </mark>
                    ) : (
                      <React.Fragment key={i}>{segment.text}</React.Fragment>
                    ),
                  )}
                </p>
              </div>
            ) : null}

            {/* The three handoff verbs, always in this order. */}
            <div
              data-slot="asset-detail-verbs"
              role="group"
              aria-label="Result actions"
              className="flex flex-wrap gap-2"
            >
              <Button
                data-slot="asset-detail-copy"
                type="button"
                size="sm"
                variant="outline"
                onClick={onCopyPrompt}
                disabled={!onCopyPrompt}
              >
                <Copy aria-hidden />
                Copy prompt
              </Button>
              <Button
                data-slot="asset-detail-remix"
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onRemix?.({ prompt })}
                disabled={!onRemix}
              >
                <Shuffle aria-hidden />
                Remix
              </Button>
              <Button
                data-slot="asset-detail-edit"
                type="button"
                size="sm"
                variant="outline"
                onClick={onEdit}
                disabled={!onEdit}
              >
                <Pencil aria-hidden />
                Edit
              </Button>
            </div>

            {params && params.length > 0 ? (
              <div className="flex flex-col gap-2">
                <h3 className="text-foreground text-xs font-medium">Parameters</h3>
                {/* A10 verbatim — including its em-dash for a missing value.
                    No data-slot override: A10 spreads `...props` after its own
                    attributes, so one would erase `stat-readout` and hide that
                    this is the same grid N5 renders. */}
                <StatReadout items={params} />
              </div>
            ) : null}

            {cost ? (
              <p data-slot="asset-detail-cost" className="text-foreground text-xs">
                {formatCost(cost)}
              </p>
            ) : null}

            {moreLikeThis ? (
              <div className="flex flex-col gap-2">
                <h3 className="text-foreground text-xs font-medium">More like this</h3>
                <div data-slot="asset-detail-more">{moreLikeThis}</div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { AssetDetail };
export type { AssetDetailParam, AssetDetailProps, PromptSpan };
