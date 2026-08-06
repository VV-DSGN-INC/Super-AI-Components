"use client";

import { Lock } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArtifactGrid, type ArtifactGridSession } from "@/registry/super-ai/artifact-grid";

/**
 * Live examples for artifact-grid.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so artifact-grid.docs.tsx has to stay plain
 * server-evaluable data — it cannot carry "use client" itself, because
 * Next.js turns "use client" exports into opaque client references, and a
 * plain object read through one of those comes back with every field
 * undefined. Every example lives here instead and crosses into the docs
 * module as a zero-prop element.
 */

const SESSION: ArtifactGridSession[] = [
  {
    id: "s",
    label: "Pricing page rewrite",
    items: [
      {
        id: "a1",
        type: "document",
        title: "Untitled document",
        excerpt:
          "Three tiers, and the middle one is the default. Everything above it exists to make it look reasonable.",
        editedAgo: "Edited 2 hours ago",
        viewCount: 1204,
        visibility: "public",
        href: "#excerpt-first",
      },
      {
        id: "a2",
        type: "react",
        excerpt: "export function PricingTable({ plans }: PricingTableProps) { … }",
        editedAgo: "Edited yesterday",
        viewCount: 38,
        visibility: "private",
        href: "#excerpt-first-2",
      },
    ],
  },
];

/** The excerpt carries the card: largest text, and the link's accessible name. */
export function ExcerptCarriesTheCard() {
  return <ArtifactGrid sessions={SESSION} filterable={false} />;
}

/** One `type` value renders the badge and builds the facet row. */
export function TypeDrivesBadgeAndFacet() {
  return <ArtifactGrid sessions={SESSION} />;
}

/** Privacy and reach read as one thought in the footer. */
export function PrivacyAndReachTogether() {
  return (
    <ArtifactGrid
      sessions={[
        {
          id: "s",
          label: "Churn analysis",
          items: [
            {
              id: "b1",
              type: "chart",
              excerpt: "Cohort retention by signup month. Month-3 is where the cliff is.",
              viewCount: 91,
              visibility: "shared",
              href: "#footer-pair",
            },
          ],
        },
      ]}
      filterable={false}
    />
  );
}

/**
 * The anti-pattern: an auto-generated title takes the headline slot and the
 * excerpt is demoted to grey supporting text. "Untitled document" is
 * what the model called it, not what it says — the card now identifies four
 * artifacts as the same thing.
 */
export function TitleFirstExcerptDemoted() {
  return (
    <Card size="sm" className="w-full max-w-xs">
      <CardHeader>
        <p className="font-heading text-base leading-snug font-medium">Untitled document</p>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-2 text-xs">
          Three tiers, and the middle one is the default. Everything above it exists to make it look reasonable.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * The anti-pattern: a bare padlock with no accessible name, distinguished from
 * "public" only by its colour. A screen reader announces nothing, and
 * a colour-blind user sees two identical cards.
 */
export function IconOnlyPrivacy() {
  return (
    <Card size="sm" className="w-full max-w-xs">
      <CardHeader>
        <Badge variant="secondary">Document</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-foreground text-sm leading-relaxed font-medium">
          Three tiers, and the middle one is the default.
        </p>
      </CardContent>
      <CardFooter className="text-foreground justify-between text-xs">
        <Lock className="text-primary size-3.5" />
        <span>1,204</span>
      </CardFooter>
    </Card>
  );
}
