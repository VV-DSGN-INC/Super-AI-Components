"use client";
import { useState } from "react";

import { RecommendationCard } from "@/registry/super-ai/recommendation-card";

const CARDS = [
  {
    id: "weekly-report",
    title: "Automate your weekly report",
    description: "Zapier can pull last week's numbers into Sheets and post a summary to Slack.",
    apps: ["Sheets", "Slack"],
    steps: [
      "Connect your Sheets and Slack accounts",
      "Pick which sheet holds this week's numbers",
      "Review the summary format and turn it on",
    ],
  },
  {
    id: "background-removal",
    title: "Try background removal",
    description: "This skill strips the background from any upload in one pass.",
    apps: ["Freepik"],
    steps: ["Upload an image", "Confirm the subject to keep", "Download the cutout"],
  },
];

// Local state stands in for whatever the consumer actually persists
// (localStorage, a user preference, a query param). The component only
// knows what `dismissed`/`saved` say right now.
export default function RecommendationCardDemo() {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const visible = CARDS.filter((card) => !dismissedIds.includes(card.id));

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {visible.map((card) => (
        <RecommendationCard
          key={card.id}
          title={card.title}
          description={card.description}
          apps={card.apps}
          steps={card.steps}
          onTry={() => console.log(`${card.id}: try it`)}
          saved={savedIds.includes(card.id)}
          onSaveForLater={() => setSavedIds((ids) => [...ids, card.id])}
          dismissed={false}
          onDismiss={() => setDismissedIds((ids) => [...ids, card.id])}
        />
      ))}
      {visible.length === 0 ? <p className="text-muted-foreground text-xs">No recommendations right now.</p> : null}
    </div>
  );
}
