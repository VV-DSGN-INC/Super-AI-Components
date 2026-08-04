"use client";

import { Bookmark, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RecommendationCard } from "@/registry/super-ai/recommendation-card";

/**
 * Live examples for recommendation-card.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so recommendation-card.docs.tsx has to
 * stay plain server-evaluable data — it cannot carry "use client" itself.
 * Every example lives here instead and crosses into the docs module as a
 * zero-prop element (e.g. `<GoodBalancedActions />`), so handlers like
 * `onDismiss` never have to be serialized across the server/client
 * boundary — they're created and consumed entirely inside this module.
 */

// --- Do -----------------------------------------------------------------

export function GoodBalancedActions() {
  return (
    <RecommendationCard
      title="Automate your weekly report"
      description="Zapier can pull last week's numbers into Sheets and post a summary to Slack."
      apps={["Sheets", "Slack"]}
      steps={[
        "Connect your Sheets and Slack accounts",
        "Pick which sheet holds this week's numbers",
        "Review the summary format and turn it on",
      ]}
      onTry={() => {}}
      onSaveForLater={() => {}}
      onDismiss={() => {}}
    />
  );
}

export function GoodNumberedStepsInModal() {
  return (
    <RecommendationCard
      title="Try background removal"
      description="This skill strips the background from any upload in one pass."
      apps={["Freepik"]}
      steps={["Upload an image", "Confirm the subject to keep", "Download the cutout"]}
      defaultOpen
      onTry={() => {}}
      onSaveForLater={() => {}}
      onDismiss={() => {}}
    />
  );
}

// --- Don't ----------------------------------------------------------------

// Hand-rolled mockup, not the real component: shows what happens when
// Dismiss is the only way off the card. There's nothing wrong with the
// markup — it's the missing middle option that's the anti-pattern.
export function DismissOnlyNoMiddleOption() {
  return (
    <Card className="relative w-full max-w-sm border">
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Dismiss"
        className="text-muted-foreground hover:text-foreground absolute top-2 right-2"
      >
        <X aria-hidden className="size-3.5" />
      </Button>
      <CardContent className="flex flex-col gap-3 pr-6">
        <p className="text-sm leading-snug font-medium">Automate your weekly report</p>
        <Button size="sm" className="self-start">
          Try it
        </Button>
      </CardContent>
    </Card>
  );
}

// Hand-rolled mockup of the modal body: "How it works" as a paragraph
// instead of a numbered list. It reads as marketing copy, not a set of
// steps you can check off before you commit.
export function StepsAsProseParagraph() {
  return (
    <Card className="w-full max-w-sm border">
      <CardContent className="flex flex-col gap-2">
        <p className="text-sm leading-snug font-medium">How it works</p>
        <p className="text-muted-foreground text-sm leading-snug">
          Once connected, this workflow will read your latest sheet, summarize the key numbers, and post the
          result to your team&apos;s Slack channel every Monday morning so nobody has to build the report by
          hand.
        </p>
        <Button size="sm" className="self-start">
          <Bookmark aria-hidden className="size-3.5" /> Save for later
        </Button>
      </CardContent>
    </Card>
  );
}
