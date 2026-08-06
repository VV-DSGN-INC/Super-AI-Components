"use client";

import { DiffReview, type DiffParagraph } from "@/registry/super-ai/diff-review";

/**
 * Live examples for diff-review.docs.tsx.
 *
 * A client sidecar: the docs module is plain data read by a Server Component,
 * so it cannot carry "use client" or JSX with handlers. Every example with a
 * callback lives here and crosses over as a zero-prop element.
 */

const SENTENCE: DiffParagraph[] = [
  {
    id: "p1",
    segments: [
      { kind: "unchanged", text: "Teams can now " },
      { kind: "deleted", text: "utilise", changeId: "c1" },
      { kind: "inserted", text: "use", changeId: "c1" },
      { kind: "unchanged", text: " the export API" },
      { kind: "inserted", text: ", starting Monday", changeId: "c2" },
      { kind: "unchanged", text: "." },
    ],
  },
];

/** DO — a reason on every change, in the list, not behind a hover. */
export function RationalePerChange() {
  return (
    <DiffReview
      label="Changelog entry"
      paragraphs={SENTENCE}
      changes={[
        { id: "c1", rationale: "Plain English. Release notes are read in a hurry." },
        { id: "c2", rationale: "The launch date was missing, so readers had to ask for it." },
      ]}
      onAccept={() => {}}
      onReject={() => {}}
    />
  );
}

/** DO — whole-document verbs in their own region, below the per-change ones. */
export function BulkVerbsApart() {
  return (
    <DiffReview
      label="Changelog entry"
      paragraphs={SENTENCE}
      changes={[
        { id: "c1", rationale: "Plain English. Release notes are read in a hurry." },
        { id: "c2", rationale: "The launch date was missing, so readers had to ask for it." },
      ]}
      onAccept={() => {}}
      onReject={() => {}}
      onAcceptAll={() => {}}
      onRejectAll={() => {}}
    />
  );
}

/**
 * DON&apos;T — a rationale that restates the edit. &quot;Changed utilise to
 * use&quot; is already on screen; the reviewer still has no idea whether to
 * agree.
 */
export function RationaleThatRestatesTheEdit() {
  return (
    <DiffReview
      label="Changelog entry"
      paragraphs={SENTENCE}
      changes={[
        { id: "c1", rationale: "Changed utilise to use." },
        { id: "c2", rationale: "Added some words." },
      ]}
      onAccept={() => {}}
      onReject={() => {}}
    />
  );
}

/**
 * DON&apos;T — a whole paragraph swapped as one change. Word-level is the
 * point: this forces the reviewer to re-read everything to find the one word
 * that actually moved.
 */
export function ParagraphSizedChange() {
  return (
    <DiffReview
      label="Changelog entry"
      paragraphs={[
        {
          id: "p1",
          segments: [
            {
              kind: "deleted",
              text: "Teams can now utilise the export API.",
              changeId: "c1",
            },
            {
              kind: "inserted",
              text: "Teams can now use the export API, starting Monday.",
              changeId: "c1",
            },
          ],
        },
      ]}
      changes={[{ id: "c1", rationale: "Tidied the sentence." }]}
      onAccept={() => {}}
      onReject={() => {}}
    />
  );
}
