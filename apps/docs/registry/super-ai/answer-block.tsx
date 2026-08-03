"use client";

import { AlertTriangle } from "lucide-react";
import * as React from "react";

import { CitationRef, type CitationRefProps } from "./citation-ref";
import { cn } from "@/lib/utils";

type AnswerCitation = Pick<CitationRefProps, "label" | "source" | "quote" | "state" | "onJumpToSource"> & {
  id: string;
};

interface AnswerClaim {
  id: string;
  text: React.ReactNode;
  /** Citations attach to the claim, not to the answer. */
  citations?: AnswerCitation[];
}

type AnswerCoverage = "cited" | "partially-cited" | "uncited";

interface AnswerBlockProps extends React.ComponentProps<"div"> {
  claims: AnswerClaim[];
  /** While streaming, the final claim renders without citations — see below. */
  streaming?: boolean;
  /** How many retrieved sources went unused. The gap is the informative part. */
  retrievedUnused?: number;
}

function coverageOf(claims: AnswerClaim[]): AnswerCoverage {
  const cited = claims.filter((c) => c.citations && c.citations.length > 0).length;
  if (cited === 0) return "uncited";
  // `partially-cited` is its own state and must not read as `cited`. An answer
  // where two of five claims are sourced is not a cited answer.
  return cited === claims.length ? "cited" : "partially-cited";
}

function AnswerBlock({
  claims,
  streaming = false,
  retrievedUnused = 0,
  className,
  ...props
}: AnswerBlockProps) {
  const coverage = coverageOf(claims);

  return (
    <div
      data-slot="answer-block"
      data-coverage={coverage}
      data-streaming={streaming ? "" : undefined}
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      <div className="flex flex-col gap-2 text-sm">
        {claims.map((claim, i) => {
          // Streaming order is claim-then-citation, never the reverse: a
          // citation that renders before the text it supports reads as a load
          // failure. So the in-flight claim shows no markers yet.
          const settled = !streaming || i < claims.length - 1;
          return (
            <p key={claim.id} data-slot="answer-block-claim" data-settled={settled ? "" : undefined}>
              {claim.text}
              {settled
                ? claim.citations?.map((c) => (
                    <CitationRef
                      key={c.id}
                      label={c.label}
                      source={c.source}
                      quote={c.quote}
                      state={c.state}
                      onJumpToSource={c.onJumpToSource}
                    />
                  ))
                : null}
            </p>
          );
        })}
      </div>

      {!streaming && coverage !== "cited" ? (
        <p
          data-slot="answer-block-coverage-warning"
          className="text-muted-foreground flex items-start gap-1.5 text-xs"
        >
          <AlertTriangle className="text-destructive mt-0.5 size-3 shrink-0" />
          {coverage === "uncited"
            ? "Nothing in this answer is sourced. Verify before relying on it."
            : "Some claims here aren't sourced. The unmarked ones aren't backed by a document."}
        </p>
      ) : null}

      {/* The gap between retrieved and used is the most informative thing on the
          surface — it is how a user notices the model ignored the relevant
          document. Hiding it makes a thin answer look complete. */}
      {!streaming && retrievedUnused > 0 ? (
        <p data-slot="answer-block-unused" className="text-muted-foreground text-xs">
          {/* One string, not interleaved text and expressions — see source-cards. */}
          {`${retrievedUnused} retrieved ${
            retrievedUnused === 1 ? "source was" : "sources were"
          } not used in this answer.`}
        </p>
      ) : null}
    </div>
  );
}

export { AnswerBlock, coverageOf };
export type { AnswerBlockProps, AnswerCitation, AnswerClaim, AnswerCoverage };
