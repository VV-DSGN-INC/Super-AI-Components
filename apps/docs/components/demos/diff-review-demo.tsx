"use client";

import * as React from "react";

import {
  DiffReview,
  type DiffChange,
  type DiffChangeStatus,
  type DiffParagraph,
} from "@/registry/super-ai/diff-review";

const PARAGRAPHS: DiffParagraph[] = [
  {
    id: "p1",
    segments: [
      { kind: "unchanged", text: "Teams can now " },
      { kind: "deleted", text: "utilise", changeId: "c1" },
      { kind: "inserted", text: "use", changeId: "c1" },
      { kind: "unchanged", text: " the export API to pull their own usage data" },
      { kind: "inserted", text: ", starting Monday", changeId: "c2" },
      { kind: "unchanged", text: "." },
    ],
  },
  {
    id: "p2",
    segments: [
      { kind: "unchanged", text: "It is " },
      { kind: "deleted", text: "very ", changeId: "c3" },
      { kind: "unchanged", text: "fast, and rate limits are documented " },
      { kind: "deleted", text: "in the appendix", changeId: "c4" },
      { kind: "inserted", text: "on the pricing page", changeId: "c4" },
      { kind: "unchanged", text: "." },
    ],
  },
];

const RATIONALES: Record<string, string> = {
  c1: "Plain English. Release notes are read in a hurry.",
  c2: "The launch date was missing, so every reader had to go and ask for it.",
  c3: "Intensifiers weaken a claim we can back with a number instead.",
  c4: "The appendix was retired last quarter; this link would have 404'd.",
};

export default function DiffReviewDemo() {
  const [statuses, setStatuses] = React.useState<Record<string, DiffChangeStatus>>({});

  const changes: DiffChange[] = Object.entries(RATIONALES).map(([id, rationale]) => ({
    id,
    rationale,
    status: statuses[id] ?? "pending",
  }));

  const resolveAll = (status: DiffChangeStatus) =>
    setStatuses(Object.fromEntries(Object.keys(RATIONALES).map((id) => [id, status])));

  return (
    <div className="w-full max-w-2xl">
      <DiffReview
        label="Changelog entry · 4 suggested edits"
        paragraphs={PARAGRAPHS}
        changes={changes}
        onAccept={(id) => setStatuses((prev) => ({ ...prev, [id]: "accepted" }))}
        onReject={(id) => setStatuses((prev) => ({ ...prev, [id]: "rejected" }))}
        onAcceptAll={() => resolveAll("accepted")}
        onRejectAll={() => resolveAll("rejected")}
      />
    </div>
  );
}
