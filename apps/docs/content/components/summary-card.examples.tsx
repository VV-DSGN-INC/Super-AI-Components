"use client";

import { SummaryCard, type SummaryPoint, type SummaryScope } from "@/registry/super-ai/summary-card";

/**
 * Live examples for summary-card.docs.tsx. A client sidecar because the
 * attributed example passes a render prop, which cannot cross the server
 * boundary from the docs module.
 */

const SCOPE: SummaryScope = {
  kind: "document",
  title: "leave-policy-emea.docx",
  href: "/files/leave-policy-emea",
};

const POINTS: SummaryPoint[] = [
  { id: "length", text: "Parental leave is 16 weeks at full pay.", citations: [1] },
  { id: "block", text: "The first four weeks must be taken in one block.", citations: [2] },
];

function Marker({ index }: { index: number }) {
  return (
    <button
      type="button"
      className="focus-visible:ring-ring ms-0.5 rounded-sm px-1 text-xs underline focus-visible:ring-2 focus-visible:outline-none"
    >
      {`Source ${index}`}
    </button>
  );
}

export function ScopeStatedAndLinked() {
  return (
    <SummaryCard
      scope={SCOPE}
      depth="short"
      onDepthChange={() => {}}
      points={[
        { id: "one", text: "Parental leave is 16 weeks at full pay, taken in blocks of at least one week." },
      ]}
    />
  );
}

export function PointsWithMarkers() {
  return (
    <SummaryCard
      scope={SCOPE}
      state="attributed"
      depth="key-points"
      onDepthChange={() => {}}
      points={POINTS}
      renderCitation={(index) => <Marker index={index} />}
    />
  );
}

export function QuotedClause() {
  return (
    <SummaryCard
      scope={{ kind: "section", title: "4.2 Termination", href: "/files/msa#4-2" }}
      state="quote-and-condense"
      depth="short"
      onDepthChange={() => {}}
      quotes={[
        {
          id: "notice",
          text: "Either party may terminate this Agreement on ninety (90) days written notice.",
          locator: "Section 4.2(a)",
        },
      ]}
    />
  );
}

export function OffWithAWayBack() {
  return <SummaryCard scope={SCOPE} state="turned-off" onTurnOn={() => {}} />;
}

export function ParaphrasedClause() {
  return (
    <SummaryCard
      scope={{ kind: "section", title: "4.2 Termination", href: "/files/msa#4-2" }}
      depth="short"
      onDepthChange={() => {}}
      points={[{ id: "one", text: "Either side can walk away with about three months of warning." }]}
    />
  );
}

export function SentencesAsKeyPoints() {
  return (
    <SummaryCard
      scope={SCOPE}
      depth="key-points"
      onDepthChange={() => {}}
      points={[
        {
          id: "one",
          text: "Employees in the EMEA entities receive sixteen weeks of parental leave at their full base salary, and that entitlement applies from the first day of employment.",
        },
        {
          id: "two",
          text: "The first four weeks must be taken as a single block which has to begin within twelve months of the birth or placement of the child.",
        },
      ]}
    />
  );
}
