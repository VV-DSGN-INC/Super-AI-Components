"use client";

import * as React from "react";

import { HeroOmnibox } from "@/registry/super-ai/hero-omnibox";
import { RecentGrid } from "@/registry/super-ai/recent-grid";
import { SectionHeader } from "@/registry/super-ai/section-header";
import { SuggestionChip, SuggestionChips } from "@/registry/super-ai/suggestion-chips";

/**
 * Live examples for home-shell.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs`,
 * `docs.evidence` and the rest straight off the exported object, so the docs
 * module has to stay plain server-evaluable data. Every example here is a
 * zero-prop component, so a handler like `onSelect` never crosses the
 * server/client boundary.
 *
 * These are fragments of the shell, not whole shells — four page shells
 * stacked down a documentation page would teach nothing the live preview at
 * the top of the page does not already teach.
 */

const STARTERS = ["Draft a launch announcement", "Turn the Q3 deck into a video"];

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full max-w-lg flex-col gap-3 rounded-lg border p-4">{children}</div>;
}

/** Do — the chip writes into the composer and stops there. */
export function StarterFillsTheComposer() {
  const [prompt, setPrompt] = React.useState("");

  return (
    <Frame>
      <HeroOmnibox
        value={prompt}
        onValueChange={setPrompt}
        label="What can I help you with? (example)"
      />
      <SuggestionChips>
        {STARTERS.map((starter) => (
          <SuggestionChip key={starter} suggestion={starter} onSelect={setPrompt} />
        ))}
      </SuggestionChips>
    </Frame>
  );
}

/** Don&apos;t — the chip is wired to submit, so the run starts before anyone has read it. */
export function StarterStartsTheRun() {
  const [generating, setGenerating] = React.useState(false);

  return (
    <Frame>
      <HeroOmnibox
        state={generating ? "generating" : "idle"}
        value={generating ? "Draft a launch announcement" : ""}
        label="What can I help you with? (anti-example)"
      />
      <SuggestionChips>
        {STARTERS.map((starter) => (
          <SuggestionChip key={starter} suggestion={starter} onSelect={() => setGenerating(true)} />
        ))}
      </SuggestionChips>
    </Frame>
  );
}

/** Do — the band stays, and C4&apos;s own tile explains the nothing. */
export function RecentsKeepTheirEmptyTile() {
  return (
    <Frame>
      <SectionHeader size="sm" title="Recents" />
      <RecentGrid items={[]} />
    </Frame>
  );
}

/** Don&apos;t — the band is gone, so nothing on the page says recents exist. */
export function RecentsDisappearWhenEmpty() {
  return (
    <Frame>
      <SectionHeader size="sm" title="Popular features" />
      <p className="text-sm">Generate images · Edit video · Clone a voice</p>
      {/* The recents band renders nothing at all when the list is empty, so a
          new user never learns the shell has one. */}
    </Frame>
  );
}
