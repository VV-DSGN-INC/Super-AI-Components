"use client";

import { AudioLines, Network } from "lucide-react";

import { AnswerBlock } from "@/registry/super-ai/answer-block";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { FeatureCardRow } from "@/registry/super-ai/feature-card-row";
import { ResultCard } from "@/registry/super-ai/result-card";

/**
 * Live examples for notebook-shell.docs.tsx.
 *
 * A client sidecar, kept separate on purpose: component-docs.tsx is a Server
 * Component and reads the docs module as plain data, so anything carrying an
 * event handler has to live here and arrive there as a zero-prop element.
 *
 * These are fragments of two of the three panes, not whole shells — four page
 * shells stacked down a docs page would teach nothing the live preview at the
 * top does not already teach.
 */

const OUTPUT_TYPES = [
  {
    id: "audio",
    icon: <AudioLines aria-hidden />,
    title: "Audio Overview",
    description: "Two hosts talk through your sources.",
  },
  {
    id: "mind-map",
    icon: <Network aria-hidden />,
    title: "Mind Map",
    description: "How the sources connect.",
  },
];

function PaneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card flex w-full max-w-xs flex-col gap-3 rounded-lg border p-3">
      <h4 className="text-sm font-medium">Studio</h4>
      {children}
    </div>
  );
}

/** Do — the marker names its document, quotes the passage, and jumps to it. */
export function CitationResolvesToItsSource() {
  return (
    <div className="w-full max-w-lg rounded-lg border p-4">
      <AnswerBlock
        claims={[
          {
            id: "c1",
            text: "Per-seat pricing is held flat for the first twelve months.",
            citations: [
              {
                id: "x1",
                label: "1",
                source: "Q3-report.pdf",
                quote: "Per-seat pricing is fixed for the first four quarters of any new contract.",
                onJumpToSource: () => {},
              },
            ],
          },
        ]}
      />
    </div>
  );
}

/** Don&apos;t — a superscript that is not a control and names nothing. */
export function CitationIsDecoration() {
  return (
    <div className="w-full max-w-lg rounded-lg border p-4">
      <p className="text-sm">
        Per-seat pricing is held flat for the first twelve months.
        <span className="bg-muted text-foreground ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded px-1 align-super text-[0.625rem] font-medium">
          1
        </span>
      </p>
    </div>
  );
}

/** Do — the output lands under the menu that made it, beside its sources. */
export function OutputsLandInTheStudioPane() {
  return (
    <PaneFrame>
      <FeatureCardRow aria-label="Create (example)" items={OUTPUT_TYPES} />
      <ResultCard
        state="done"
        aspect="video"
        label="Audio Overview · 11 min"
        badge="Audio"
        footer={<span>Generated from 3 sources</span>}
      />
    </PaneFrame>
  );
}

/** Don&apos;t — the pane sends its own result somewhere else and empties out. */
export function OutputsOpenSomewhereElse() {
  return (
    <PaneFrame>
      <FeatureCardRow aria-label="Create (anti-example)" items={OUTPUT_TYPES} />
      <EmptyState
        size="panel"
        title="Opened in a new tab"
        description="Your Audio Overview is somewhere else now."
      />
    </PaneFrame>
  );
}
