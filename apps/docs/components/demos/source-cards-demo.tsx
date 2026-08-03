"use client";
import { SourceCards } from "@/registry/super-ai/source-cards";

export default function SourceCardsDemo() {
  return (
    <div className="w-full max-w-md">
      <SourceCards
        permissionFilteredCount={2}
        sources={[
          {
            id: "a",
            title: "Benefits policy 2026",
            snippet: "Imaging performed outside the network requires prior authorization…",
            relevance: "high",
            used: true,
            onOpen: () => {},
          },
          {
            id: "b",
            title: "Plan summary — PPO Gold",
            snippet: "Deductible and coinsurance schedule for the 2026 plan year.",
            relevance: "medium",
            used: true,
            onOpen: () => {},
          },
          {
            id: "c",
            title: "Vendor handbook (2023)",
            snippet: "Superseded guidance on external imaging vendors.",
            relevance: "low",
            used: false,
            onOpen: () => {},
          },
        ]}
      />
    </div>
  );
}
