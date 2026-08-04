"use client";

import { EyeOff, FileText } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Three bands, never a raw score — the retrieval's calibration does not support
 * two decimal places. Duplicated deliberately across D7/K7/K8 until the
 * extraction slice is sampled and `confidence-badge` can be promoted (D17).
 */
type RelevanceBand = "high" | "medium" | "low";

interface RetrievedSource {
  id: string;
  title: React.ReactNode;
  snippet?: React.ReactNode;
  relevance?: RelevanceBand;
  /** Whether the answer actually cited it. The used/unused split is the component. */
  used?: boolean;
  onOpen?: () => void;
}

interface SourceCardsProps extends React.ComponentProps<"div"> {
  sources: RetrievedSource[];
  /**
   * Sources excluded because the reader lacks access. Names that this exists;
   * must never leak titles.
   */
  permissionFilteredCount?: number;
  /** Distinguishes "retrieval ran and found nothing" from "retrieval hasn't run". */
  hasRun?: boolean;
}

const BAND_LABEL: Record<RelevanceBand, string> = {
  high: "Strong match",
  medium: "Partial match",
  low: "Weak match",
};

function SourceCards({
  sources,
  permissionFilteredCount = 0,
  hasRun = true,
  className,
  ...props
}: SourceCardsProps) {
  // Ranked order is the relevance signal. Used first within that, because the
  // question "what is this answer actually built on" comes before "what else
  // was nearby".
  const ordered = React.useMemo(
    () => [...sources].sort((a, b) => Number(b.used ?? false) - Number(a.used ?? false)),
    [sources],
  );

  return (
    <div data-slot="source-cards" className={cn("flex flex-col gap-2", className)} {...props}>
      {ordered.length === 0 ? (
        <p data-slot="source-cards-empty" className="text-muted-foreground text-sm">
          {hasRun
            ? "No sources matched. This answer isn't grounded in a document."
            : "Sources will appear here once a search runs."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ordered.map((source, i) => (
            <li key={source.id}>
              <Card
                data-slot="source-cards-item"
                data-used={source.used ? "" : undefined}
                // Unused sources are visibly quieter but never hidden. Showing
                // only cited sources conceals the retrieval failure mode;
                // showing them undifferentiated conceals the answer's basis.
                className={cn("py-3", !source.used && "opacity-60")}
              >
                <CardContent className="flex items-start gap-2 px-3">
                  <FileText className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs tabular-nums">{i + 1}</span>
                      {source.onOpen ? (
                        <button
                          type="button"
                          onClick={source.onOpen}
                          className="focus-visible:ring-ring truncate text-left text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
                        >
                          {source.title}
                        </button>
                      ) : (
                        <span className="truncate text-sm font-medium">{source.title}</span>
                      )}
                    </div>
                    {source.snippet ? (
                      <p className="text-muted-foreground line-clamp-2 text-xs">{source.snippet}</p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge variant={source.used ? "secondary" : "outline"} className="text-[0.6875rem]">
                        {source.used ? "Cited" : "Retrieved, not used"}
                      </Badge>
                      {source.relevance ? (
                        <Badge variant="ghost" className="text-muted-foreground text-[0.6875rem]">
                          {BAND_LABEL[source.relevance]}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {/* A visible state, not a silent omission. "3 sources you can't see were
          excluded" is the difference between a trustworthy answer and an
          inexplicably thin one — and it names that they exist without leaking
          what they are. */}
      {permissionFilteredCount > 0 ? (
        <p
          data-slot="source-cards-permission-filtered"
          className="text-muted-foreground flex items-center gap-1.5 text-xs"
        >
          <EyeOff className="size-3 shrink-0" />
          {/* Built as one string rather than interleaved JSX text and
              expressions. When Prettier reflows a mixed line, JSX whitespace
              handling can silently drop the space between an expression and the
              text after it — "2 sourcesexcluded". A single string cannot. */}
          <span>
            {`${permissionFilteredCount} ${
              permissionFilteredCount === 1 ? "source" : "sources"
            } excluded — you don't have access.`}
          </span>
        </p>
      ) : null}
    </div>
  );
}

export { SourceCards };
export type { RelevanceBand, RetrievedSource, SourceCardsProps };
