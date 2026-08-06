"use client";

import { Button } from "@/components/ui/button";
import { ArtifactGrid, type ArtifactGridSession } from "@/registry/super-ai/artifact-grid";

const SESSIONS: ArtifactGridSession[] = [
  {
    id: "pricing",
    label: "Pricing page rewrite",
    action: (
      <Button variant="link" size="sm" className="h-auto p-0">
        Open session
      </Button>
    ),
    items: [
      {
        id: "a1",
        type: "document",
        title: "Untitled document",
        excerpt:
          "Three tiers, and the middle one is the default. Everything above it exists to make it look reasonable, and everything below it exists to make it look generous.",
        editedAgo: "Edited 2 hours ago",
        viewCount: 1204,
        visibility: "public",
        href: "#pricing-brief",
      },
      {
        id: "a2",
        type: "react",
        excerpt:
          "export function PricingTable({ plans }: PricingTableProps) { return <table aria-label=\"Plan comparison\">…</table> }",
        editedAgo: "Edited yesterday",
        viewCount: 38,
        visibility: "shared",
        href: "#pricing-table",
      },
      {
        id: "a3",
        type: "data-table",
        excerpt: "Plan · Seats · Monthly · Annual · Support SLA — the comparison grid, 5 columns by 4 rows.",
        editedAgo: "Edited yesterday",
        viewCount: 6,
        visibility: "private",
        href: "#pricing-matrix",
      },
    ],
  },
  {
    id: "churn",
    label: "Churn analysis",
    items: [
      {
        id: "b1",
        type: "chart",
        excerpt: "Cohort retention by signup month, 2024 Q1 through Q4. Month-3 is where the cliff is.",
        editedAgo: "Edited 3 days ago",
        viewCount: 91,
        visibility: "shared",
        href: "#churn-chart",
      },
      {
        id: "b2",
        type: "document",
        title: "Summary of findings",
        excerpt:
          "Self-serve accounts that never invite a second seat churn at four times the rate of those that do. The invite step is the retention lever.",
        editedAgo: "Edited 3 days ago",
        viewCount: 1,
        visibility: "private",
        href: "#churn-summary",
      },
    ],
  },
];

export default function ArtifactGridDemo() {
  return (
    <div className="w-full max-w-4xl">
      <ArtifactGrid sessions={SESSIONS} collapsibleSessions />
    </div>
  );
}
