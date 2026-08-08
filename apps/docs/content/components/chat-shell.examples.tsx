"use client";

import { LoaderCircle } from "lucide-react";

import { ArtifactGrid } from "@/registry/super-ai/artifact-grid";
import { ThreadList, ThreadListItem, ThreadListSection } from "@/registry/super-ai/thread-list";

/**
 * Live examples for chat-shell.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.whatItIs`,
 * `docs.evidence` and the rest straight off the exported object, so the docs
 * module has to stay plain server-evaluable data. Every example here is a
 * zero-prop component, so a handler like `onSelect` never has to cross the
 * server/client boundary.
 *
 * These are fragments of the shell, not whole shells: four full page shells
 * stacked down a documentation page would teach nothing that the live preview
 * at the top of the page does not already teach.
 */

const SESSION = [
  {
    id: "brand-audit",
    label: "Brand audit for Northwind",
    items: [
      {
        id: "a1",
        excerpt:
          "Northwind is the only voice in the set that opens on reassurance. Competitors open on speed.",
        type: "markdown",
        editedAgo: "Edited 4 minutes ago",
        visibility: "private" as const,
      },
    ],
  },
];

function SidebarFrame({ children }: { children: React.ReactNode }) {
  return <div className="bg-sidebar w-64 rounded-lg border p-2">{children}</div>;
}

/** Do — the job queue says what it is doing, in words. */
export function RunningJobCarriesAWord() {
  return (
    <SidebarFrame>
      <ThreadList aria-label="Conversations (example)">
        <ThreadListSection label="Today">
          <ThreadListItem id="brand-audit" title="Brand audit for Northwind" active />
          <div>
            <ThreadListItem id="deck" title="Export the Q3 deck" />
            <p role="status" className="text-foreground flex items-center gap-1.5 px-2 pb-1 text-xs">
              <LoaderCircle aria-hidden className="size-3 shrink-0 animate-spin" />
              Rendering slides
            </p>
          </div>
        </ThreadListSection>
      </ThreadList>
    </SidebarFrame>
  );
}

/** Don&apos;t — motion is the only signal, and it never reaches a screen reader. */
export function RunningJobIsOnlyASpinner() {
  return (
    <SidebarFrame>
      <ThreadList aria-label="Conversations (anti-example)">
        <ThreadListSection label="Today">
          <ThreadListItem id="brand-audit" title="Brand audit for Northwind" active />
          <div className="flex items-center gap-2">
            <ThreadListItem id="deck" title="Export the Q3 deck" className="flex-1" />
            <LoaderCircle aria-hidden className="text-foreground size-3 shrink-0 animate-spin" />
          </div>
        </ThreadListSection>
      </ThreadList>
    </SidebarFrame>
  );
}

/** Do — the artifact is a card in the conversation that produced it. */
export function ArtifactsInsideTheStream() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4 rounded-lg border p-4">
      <p className="max-w-prose text-sm leading-relaxed">
        I read all four voice guides and wrote the overlap up below.
      </p>
      <div className="flex flex-col gap-3 border-t pt-4">
        <h4 className="text-sm font-medium">Artifacts</h4>
        <ArtifactGrid
          sessions={SESSION}
          filterable={false}
          className="[&_[data-slot=artifact-grid-items]]:grid-cols-1"
        />
      </div>
    </div>
  );
}

/** Don&apos;t — artifacts exiled to a second tab, severed from the turn that made them. */
export function ArtifactsBehindTheirOwnTab() {
  return (
    <div className="w-full max-w-lg rounded-lg border">
      <div className="flex items-center gap-1 border-b p-1 text-sm">
        <span className="text-foreground rounded-md px-3 py-1.5">Chat</span>
        <span className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 font-medium">
          Artifacts
        </span>
      </div>
      <div className="p-4">
        <ArtifactGrid
          sessions={SESSION}
          filterable={false}
          className="[&_[data-slot=artifact-grid-items]]:grid-cols-1"
        />
      </div>
    </div>
  );
}
