"use client";

import * as React from "react";

import { CitationRef } from "@/registry/super-ai/citation-ref";

/**
 * Live examples for citation-ref.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence` and friends directly, so citation-ref.docs.tsx has to stay
 * plain server-evaluable data and cannot carry "use client" itself. Anything
 * with an `onJumpToSource` handler therefore lives here and crosses into the
 * docs module as a zero-prop element.
 *
 * `label` is the marker's text — the component renders it as the button's
 * children itself, so these examples pass `label` and nothing else.
 */

const CLAIM =
  "Retrieval-augmented generation cut unsupported citations by roughly a third in the 2024 evaluation";

export function QuoteCarriesThePassage() {
  const [jumped, setJumped] = React.useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-foreground text-sm">
        {CLAIM}
        <CitationRef
          label="1"
          source="Evaluation report, §4.2"
          quote="Across 1,200 sampled answers, unsupported citations fell from 31% to 21% once passages were retrieved before drafting."
          onJumpToSource={() => setJumped("Evaluation report, §4.2")}
        />
        . The card holds the passage itself, so the claim can be checked without leaving the answer.
      </p>
      <p className="text-foreground text-xs">
        Source panel scrolled to:{" "}
        <span className="font-medium">{jumped ?? "(open the marker, then activate it)"}</span>
      </p>
    </div>
  );
}

export function UnresolvedStaysVisible() {
  return (
    <p className="text-foreground text-sm">
      Two of the three sources resolved
      <CitationRef
        label="1"
        source="Evaluation report, §4.2"
        quote="Unsupported citations fell from 31% to 21%."
        onJumpToSource={() => {}}
      />
      <CitationRef
        label="2"
        source="Evaluation report, §4.3"
        quote="The remaining failures clustered in questions with no matching passage."
        onJumpToSource={() => {}}
      />
      , and the third could not be found — so it still renders, and still says so
      <CitationRef label="3" state="unresolved" />. Dropping it would leave a confident unsourced sentence
      behind.
    </p>
  );
}

export function MarkersCollectedIntoABar() {
  // The wrong way: the markers are swept into a bar under the paragraph. The
  // reader is told the paragraph came from somewhere without being told which
  // sentence came from which source — which is the whole job of a marker's
  // inline position.
  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground text-sm">
        {CLAIM}. The remaining failures clustered in questions with no matching passage, and reviewers flagged
        three answers as unverifiable.
      </p>
      <div className="flex items-center gap-1 border-t pt-2">
        <span className="text-foreground text-xs">Sources:</span>
        <CitationRef
          label="1"
          source="Evaluation report, §4.2"
          quote="Unsupported citations fell from 31% to 21%."
          onJumpToSource={() => {}}
        />
        <CitationRef
          label="2"
          source="Evaluation report, §4.3"
          quote="The remaining failures clustered in questions with no matching passage."
          onJumpToSource={() => {}}
        />
        <CitationRef
          label="3"
          source="Reviewer notes"
          quote="Three answers were marked unverifiable at review."
          onJumpToSource={() => {}}
        />
      </div>
    </div>
  );
}

export function EmptyCardOverTheClaim() {
  // The wrong way: a resolved citation always builds a card, so passing neither
  // `source` nor `quote` ships an empty popup over the claim. Hover or focus the
  // marker below and the card opens with nothing in it.
  return (
    <p className="text-foreground text-sm">
      {CLAIM}
      <CitationRef label="1" onJumpToSource={() => {}} />. Nothing was passed to the card, so opening it
      proves nothing.
    </p>
  );
}
