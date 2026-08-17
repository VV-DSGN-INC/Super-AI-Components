"use client";

import { SourceCards, type RetrievedSource } from "@/registry/super-ai/source-cards";

/**
 * Live examples for source-cards.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence` and friends directly, so source-cards.docs.tsx has to stay
 * plain server-evaluable data and cannot carry "use client" itself. Every
 * source below carries an `onOpen` handler — the component's one interactive
 * prop — which is a function and therefore cannot cross the server/client
 * boundary from the docs module. Hence this file, and hence every export being
 * zero-prop.
 */

const noop = () => {};

/** The full retrieved set: two the answer used, two it did not. */
const RETRIEVED: RetrievedSource[] = [
  {
    id: "handbook",
    title: "Engineering handbook — On-call rotation",
    snippet: "Primary on-call carries the pager for seven days, starting Monday 10:00 UTC.",
    relevance: "high",
    used: true,
    onOpen: noop,
  },
  {
    id: "runbook",
    title: "Incident runbook v4",
    snippet: "Page the secondary only after fifteen minutes with no acknowledgement.",
    relevance: "high",
    used: true,
    onOpen: noop,
  },
  {
    id: "retro",
    title: "Retro: the March pager storm",
    snippet: "We agreed to revisit the escalation window, but no change was made.",
    relevance: "medium",
    onOpen: noop,
  },
  {
    id: "onboarding",
    title: "New joiner onboarding checklist",
    snippet: "Add yourself to the rotation once you have shadowed two shifts.",
    relevance: "low",
    onOpen: noop,
  },
];

export function WholeRetrievedSet() {
  return <SourceCards className="w-full max-w-md" sources={RETRIEVED} />;
}

export function UntouchedPanelSaysSo() {
  // `hasRun={false}` is the difference between "we looked and found nothing"
  // and "we have not looked yet". Both render an empty panel; only one of them
  // is a claim about the corpus.
  return (
    <div className="flex flex-col gap-4">
      <SourceCards className="w-full max-w-md" sources={[]} hasRun={false} />
      <SourceCards className="w-full max-w-md" sources={[]} />
    </div>
  );
}

export function WithheldDocumentsAreCounted() {
  return (
    <SourceCards
      className="w-full max-w-md"
      sources={RETRIEVED.slice(0, 2)}
      permissionFilteredCount={3}
    />
  );
}

export function CitedOnlyLooksThorough() {
  // The wrong way: the array filtered down to `used` before it arrives. Every
  // card reads Cited, the list looks like a well-grounded answer, and the two
  // documents retrieval returned and the answer could not use — the actual
  // signal — have been edited out.
  return <SourceCards className="w-full max-w-md" sources={RETRIEVED.filter((s) => s.used)} />;
}

export function RawScoreInTheTitle() {
  // The wrong way: a similarity score pasted into the title and the snippet in
  // place of the band. 0.7412 is four digits of precision the retriever does
  // not have, and readers will rank on it anyway.
  return (
    <SourceCards
      className="w-full max-w-md"
      sources={[
        {
          id: "handbook",
          title: "Engineering handbook — On-call rotation (0.7412)",
          snippet: "score 0.7412 · cosine · index v3",
          used: true,
          onOpen: noop,
        },
        {
          id: "retro",
          title: "Retro: the March pager storm (0.6908)",
          snippet: "score 0.6908 · cosine · index v3",
          onOpen: noop,
        },
      ]}
    />
  );
}

export function WithheldLineDropped() {
  // The wrong way: the same three withheld documents, with the count left off
  // to keep the panel tidy. The list below is now indistinguishable from an
  // answer that simply had little to work with.
  return <SourceCards className="w-full max-w-md" sources={RETRIEVED.slice(0, 2)} />;
}
