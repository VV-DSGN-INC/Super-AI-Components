"use client";

import { Clock, FileText, Image as ImageIcon, type LucideIcon, Table2, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PreviewTile } from "@/registry/super-ai/preview-tile";

/**
 * Quote Reply — Select content → quoted block in composer
 *
 * Spec: docs/design-system/component-specs.md#d5-quote-reply
 * States: text-range · image-region · table-cell · timeline-range
 *
 * The four sources are not four components: every quote carries the same
 * anatomy — a source-kind glyph, a readable excerpt, a `<cite>` anchor that
 * names where the excerpt came from, and a dismiss control. Only the excerpt
 * itself branches (thumbnail vs. text); the anchor, the icon and the removal
 * affordance are identical across all four, which is the point — the quote's
 * stable anchor (not the excerpt text) is what survives if the source is
 * later edited.
 */

type QuoteReplySource = "text-range" | "image-region" | "table-cell" | "timeline-range";

const SOURCE_META: Record<QuoteReplySource, { icon: LucideIcon; label: string }> = {
  "text-range": { icon: FileText, label: "Text" },
  "image-region": { icon: ImageIcon, label: "Image" },
  "table-cell": { icon: Table2, label: "Table cell" },
  "timeline-range": { icon: Clock, label: "Timeline" },
};

interface QuoteReplyProps extends Omit<React.ComponentProps<"div">, "onRemove"> {
  /** Which kind of selection this quote was captured from. */
  source: QuoteReplySource;
  /**
   * The quoted content, verbatim, for text-range / table-cell / timeline-range —
   * rendered inside the blockquote. For image-region this becomes the
   * thumbnail's visible caption (and its accessible description when no
   * `thumbnail` is supplied yet), never the alt text alone — a quote has to
   * be readable, not just labelled.
   */
  excerpt: string;
  /**
   * The stable anchor the quote resolves to — a paragraph offset, a cell
   * reference, a time range, or region bounds. Kept independent of
   * `excerpt` on purpose: if the source is edited after the quote is taken,
   * the anchor is what the quote still has to resolve against, not the text.
   */
  anchor: React.ReactNode;
  /** image-region only — the selected region's thumbnail, handed straight to preview-tile's children slot. */
  thumbnail?: React.ReactNode;
  /** Removes the quote. Independent of any typed message state — the caller owns that separately. */
  onRemove?: () => void;
  removeLabel?: string;
}

function QuoteReply({
  source,
  excerpt,
  anchor,
  thumbnail,
  onRemove,
  removeLabel = "Remove quote",
  className,
  ...props
}: QuoteReplyProps) {
  const { icon: Icon, label } = SOURCE_META[source];

  return (
    <div
      data-slot="quote-reply"
      data-source={source}
      className={cn(
        "bg-card border-border flex w-full max-w-sm items-start gap-2 rounded-lg border p-2",
        className,
      )}
      {...props}
    >
      <Icon aria-hidden data-slot="quote-reply-icon" className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <blockquote data-slot="quote-reply-excerpt" className="min-w-0 flex-1">
        {source === "image-region" && thumbnail ? (
          <PreviewTile aspect="square" label={excerpt} labelPlacement="below" className="w-20">
            {thumbnail}
          </PreviewTile>
        ) : (
          <p data-slot="quote-reply-text" className="text-foreground line-clamp-2 text-sm">
            {excerpt}
          </p>
        )}
        <cite data-slot="quote-reply-anchor" className="text-muted-foreground mt-1 block text-xs not-italic">
          {label} · {anchor}
        </cite>
      </blockquote>
      {onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={removeLabel}
          onClick={onRemove}
          data-slot="quote-reply-remove"
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X aria-hidden className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}

export { QuoteReply };
export type { QuoteReplyProps, QuoteReplySource };
