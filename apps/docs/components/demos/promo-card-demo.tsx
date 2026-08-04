"use client";
import { useState } from "react";

import { PromoCard, type PromoCardFlavour } from "@/registry/super-ai/promo-card";

const CARDS: {
  id: string;
  flavour: PromoCardFlavour;
  title: string;
  description: string;
  ctaLabel: string;
}[] = [
  {
    id: "upgrade",
    flavour: "upgrade",
    title: "Upgrade to Pro",
    description: "Unlock unlimited generations and priority rendering.",
    ctaLabel: "Upgrade",
  },
  {
    id: "invite",
    flavour: "invite",
    title: "Invite your team",
    description: "Projects are better with collaborators. Invite is free.",
    ctaLabel: "Invite teammates",
  },
  {
    id: "update-available",
    flavour: "update-available",
    title: "Update available",
    description: "Version 2.4 adds faster exports and a new brush engine.",
    ctaLabel: "Update now",
  },
  {
    id: "quota-warning",
    flavour: "quota-warning",
    title: "You're near your limit",
    description: "You've used 90% of this month's generation credits.",
    ctaLabel: "Manage usage",
  },
];

// Local state stands in for whatever the consumer actually persists
// (localStorage, a user preference, a query param). The component only
// knows what `dismissed` says right now.
export default function PromoCardDemo() {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {CARDS.map((card) => (
        <PromoCard
          key={card.id}
          flavour={card.flavour}
          title={card.title}
          description={card.description}
          ctaLabel={card.ctaLabel}
          onCtaClick={() => console.log(`${card.id}: cta clicked`)}
          dismissed={dismissedIds.includes(card.id)}
          onDismiss={() => setDismissedIds((ids) => [...ids, card.id])}
        />
      ))}
      {dismissedIds.length === CARDS.length ? (
        <p className="text-muted-foreground text-xs">All promos dismissed.</p>
      ) : null}
    </div>
  );
}
