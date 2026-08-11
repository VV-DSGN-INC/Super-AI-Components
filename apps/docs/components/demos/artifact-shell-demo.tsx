"use client";

import { ArtifactShell, type ArtifactShellGroup } from "@/registry/super-ai/artifact-shell";
import { SidebarNav } from "@/registry/super-ai/sidebar-nav";

const GROUPS: ArtifactShellGroup[] = [
  {
    id: "today",
    label: "Today",
    sessions: [
      {
        id: "brand-audit",
        label: "Brand audit for Northwind",
        items: [
          {
            id: "a1",
            excerpt:
              "Northwind is the only voice in the set that opens on reassurance. Competitors open on speed, which leaves the calm position uncontested.",
            type: "markdown",
            editedAgo: "Edited 4 minutes ago",
            visibility: "private",
          },
          {
            id: "a2",
            excerpt:
              "const TONE = ['reassuring', 'plain', 'unhurried'] // extracted from 41 sampled pages",
            type: "code",
            editedAgo: "Edited 9 minutes ago",
            viewCount: 3,
            visibility: "shared",
          },
        ],
      },
      {
        id: "pricing",
        label: "Pricing page copy",
        items: [
          {
            id: "a3",
            excerpt:
              "Three tiers. The middle one is the one we want people to pick, so it carries the annual saving and the word most people search for.",
            type: "markdown",
            editedAgo: "Edited 40 minutes ago",
            visibility: "private",
          },
        ],
      },
    ],
  },
  {
    id: "earlier",
    label: "Last 7 days",
    sessions: [
      {
        id: "onboarding",
        label: "Onboarding email rewrite",
        items: [
          {
            id: "a4",
            excerpt:
              "Welcome — you are three minutes from your first render. Everything below is optional; the one thing that matters is picking a starting point.",
            type: "html",
            editedAgo: "Edited Tuesday",
            viewCount: 128,
            visibility: "public",
          },
          {
            id: "a5",
            excerpt:
              "export function WelcomeCard({ name }: { name: string }) { return <Card>Hello {name}</Card> }",
            type: "react",
            editedAgo: "Edited Tuesday",
            visibility: "shared",
          },
          {
            id: "a6",
            excerpt:
              "Drop-off is concentrated in the second step, where we ask for a workspace name before showing anything worth naming.",
            type: "markdown",
            editedAgo: "Edited Monday",
            viewCount: 12,
            visibility: "private",
          },
        ],
      },
    ],
  },
];

export default function ArtifactShellDemo() {
  return (
    <ArtifactShell
      className="h-[42rem]"
      title="Artifacts"
      switcher={<div className="px-2 text-sm font-medium">Northwind</div>}
      nav={
        <SidebarNav
          aria-label="Library"
          activeId="all"
          sections={[
            {
              label: "Library",
              items: [
                { id: "all", label: "All artifacts", count: 6 },
                { id: "shared", label: "Shared with me" },
                { id: "public", label: "Published" },
              ],
            },
          ]}
        />
      }
      groups={GROUPS}
      onOpenFilters={() => {}}
    />
  );
}
