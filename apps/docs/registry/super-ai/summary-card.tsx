"use client";

import * as React from "react";

import { AiLabel } from "./ai-label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type SummaryDepth = "short" | "detailed" | "key-points";

type SummaryCardState =
  | "generating"
  | "ready"
  | "attributed"
  | "quote-and-condense"
  | "collapsed"
  | "turned-off";

type SummaryScopeKind = "document" | "thread" | "section" | "selection";

/** What was summarized. Always stated in text; linked back when `href` is given. */
interface SummaryScope {
  kind: SummaryScopeKind;
  title: string;
  href?: string;
}

interface SummaryPoint {
  id: string;
  text: React.ReactNode;
  /** Source indices this point rests on. Read only in the `attributed` state. */
  citations?: number[];
}

interface SummaryQuote {
  id: string;
  /** Verbatim from the source. The card never rewords it. */
  text: string;
  /** Where in the source it sits: "Section 4.2", "Page 12". */
  locator?: string;
}

interface SummaryCardProps extends Omit<React.ComponentProps<"div">, "children"> {
  scope: SummaryScope;
  /** Which of the three presets the summary was generated at. Default "short". */
  depth?: SummaryDepth;
  /** The reader picked another depth. The host regenerates and passes new points. */
  onDepthChange?: (depth: SummaryDepth) => void;
  /** Default "ready". */
  state?: SummaryCardState;
  /** The summary. `key-points` renders them as a list, the other depths as paragraphs. */
  points?: SummaryPoint[];
  /** Key passages for `quote-and-condense`. */
  quotes?: SummaryQuote[];
  /**
   * Fills a citation marker slot in the `attributed` state. The card decides where
   * the marker sits (at the end of its point); the host decides what it is.
   */
  renderCitation?: (index: number, point: SummaryPoint) => React.ReactNode;
  /** Reports the collapsed card opening or closing. The card tracks the toggle itself. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Shows a "Turn off" action in the footer when given. */
  onTurnOff?: () => void;
  /** The action in the `turned-off` state. */
  onTurnOn?: () => void;
}

const DEPTHS: { value: SummaryDepth; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "detailed", label: "Detailed" },
  { value: "key-points", label: "Key points" },
];

function SummaryCard({
  scope,
  depth = "short",
  onDepthChange,
  state = "ready",
  points = [],
  quotes = [],
  renderCitation,
  onExpandedChange,
  onTurnOff,
  onTurnOn,
  className,
  ...props
}: SummaryCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const scopeId = React.useId();
  const bodyId = React.useId();

  const collapsible = state === "collapsed";
  const collapsedNow = collapsible && !expanded;
  const off = state === "turned-off";
  const generating = state === "generating";

  function toggleExpanded() {
    const next = !expanded;
    setExpanded(next);
    onExpandedChange?.(next);
  }

  const shown = collapsedNow ? points.slice(0, 1) : points;
  const showCitations = state === "attributed";

  const pointNodes = shown.map((point) => {
    const markers = showCitations
      ? (point.citations ?? []).map((index) => (
          <React.Fragment key={index}>
            {renderCitation ? (
              renderCitation(index, point)
            ) : (
              <sup data-slot="summary-card-marker" className="ms-0.5 text-xs">{`[${index}]`}</sup>
            )}
          </React.Fragment>
        ))
      : null;
    const content = (
      <>
        {point.text}
        {markers && markers.length > 0 ? <span data-slot="summary-card-citations">{markers}</span> : null}
      </>
    );
    return depth === "key-points" && !collapsedNow ? (
      <li key={point.id} data-slot="summary-card-point">
        {content}
      </li>
    ) : (
      <p key={point.id} data-slot="summary-card-point">
        {content}
      </p>
    );
  });

  return (
    <Card
      data-slot="summary-card"
      data-state={state}
      data-depth={depth}
      role="group"
      aria-labelledby={scopeId}
      className={cn("w-full max-w-md", className)}
      {...props}
    >
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          {off ? null : <AiLabel variant="summarized" />}
          <p id={scopeId} data-slot="summary-card-scope" className="text-sm break-words">
            {off ? (
              "Automatic summaries are off"
            ) : (
              <>
                {`Summary of the ${scope.kind} `}
                <ScopeTitle scope={scope} />
              </>
            )}
          </p>
        </div>
        {off || collapsedNow ? null : (
          <ToggleGroup
            aria-label="Summary depth"
            // The primitive renders role="group" with an aria-orientation that
            // role does not support (axe aria-allowed-attr); same suppression
            // as asset-library and compare-viewer.
            aria-orientation={undefined}
            value={[depth]}
            onValueChange={(next) => {
              // A single-select group lets the pressed item be pressed off. A
              // summary always has a depth, so that gesture is ignored.
              const picked = next[0] as SummaryDepth | undefined;
              if (picked && picked !== depth) onDepthChange?.(picked);
            }}
            variant="outline"
            size="sm"
            spacing={1}
            className="mt-2 flex-wrap"
          >
            {DEPTHS.map((d) => (
              <ToggleGroupItem key={d.value} value={d.value} className="aria-pressed:border-ring">
                {d.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </CardHeader>

      <CardContent id={bodyId} aria-busy={generating || undefined} className="flex flex-col gap-2 text-sm">
        {off ? (
          <p data-slot="summary-card-off-note">
            Nothing is summarized until you turn them on. You can still ask for one yourself.
          </p>
        ) : generating ? (
          <div data-slot="summary-card-pending" role="status" className="flex flex-col gap-2">
            <p>Summarizing the {scope.kind}…</p>
            <Skeleton className="h-3 w-full motion-reduce:animate-none" aria-hidden />
            <Skeleton className="h-3 w-4/5 motion-reduce:animate-none" aria-hidden />
          </div>
        ) : state === "quote-and-condense" ? (
          <>
            <p data-slot="summary-card-framing" className="text-foreground">
              Key passages, quoted word for word. Nothing below is reworded.
            </p>
            <div className="flex flex-col gap-3">
              {quotes.map((quote) => (
                <figure key={quote.id} data-slot="summary-card-quote" className="flex flex-col gap-1">
                  <blockquote className="break-words">{`“${quote.text}”`}</blockquote>
                  {quote.locator ? (
                    <figcaption className="text-muted-foreground text-xs">{quote.locator}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </>
        ) : depth === "key-points" && !collapsedNow ? (
          <ul className="flex list-disc flex-col gap-1.5 ps-5 break-words">{pointNodes}</ul>
        ) : (
          <div className="flex flex-col gap-2 break-words">{pointNodes}</div>
        )}
      </CardContent>

      {off ? (
        <CardFooter>
          <Button size="sm" variant="outline" onClick={onTurnOn}>
            Turn on summaries
          </Button>
        </CardFooter>
      ) : collapsible || onTurnOff ? (
        <CardFooter className="gap-2">
          {collapsible ? (
            <Button
              size="sm"
              variant="ghost"
              aria-expanded={expanded}
              aria-controls={bodyId}
              onClick={toggleExpanded}
            >
              {expanded ? "Show less" : "Show full summary"}
            </Button>
          ) : null}
          {onTurnOff ? (
            <Button size="sm" variant="ghost" onClick={onTurnOff}>
              Turn off summaries
            </Button>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}

function ScopeTitle({ scope }: { scope: SummaryScope }) {
  if (!scope.href) return <span data-slot="summary-card-scope-title">{scope.title}</span>;
  return (
    <a
      data-slot="summary-card-scope-title"
      href={scope.href}
      className="text-foreground focus-visible:ring-ring rounded-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:outline-none"
    >
      {scope.title}
    </a>
  );
}

export { SummaryCard };
export type {
  SummaryCardProps,
  SummaryCardState,
  SummaryDepth,
  SummaryPoint,
  SummaryQuote,
  SummaryScope,
  SummaryScopeKind,
};
