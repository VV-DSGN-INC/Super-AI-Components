"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { ActiveVoiceChip, VoiceProfile, type Voice } from "@/registry/super-ai/voice-profile";

/**
 * Live examples for voice-profile.docs.tsx.
 *
 * A client sidecar on purpose: the docs module is read by a Server Component
 * and cannot carry handlers, so every example that owns state lives here and
 * crosses over as a zero-prop element.
 */

const VOICES: Voice[] = [
  {
    id: "plain",
    name: "Plain and direct",
    source: "personal",
    scope: "global",
    rules: {
      tone: "Plain and direct, no preamble.",
      use: ["because", "so"],
      avoid: ["leverage", "synergy"],
      formatting: "Short paragraphs. No bullet lists.",
      example: "We shipped it. Here is what changed.",
    },
  },
  {
    id: "docs",
    name: "Docs voice",
    source: "personal",
    scope: { project: "Docs site" },
    rules: { tone: "Second person, present tense.", avoid: ["simply", "just"] },
  },
  {
    id: "team",
    name: "Team style guide",
    source: "team",
    scope: "global",
    rules: { tone: "Friendly and exact.", avoid: ["utilize"] },
  },
];

const SAMPLE =
  "We shipped the export fix. Large files now finish in one pass, so you can stop splitting them.";

function preview() {
  return new Promise<string>((resolve) => setTimeout(() => resolve(SAMPLE), 400));
}

function Stateful({
  initial = "plain",
  project,
  withPreview,
  withConflict,
}: {
  initial?: string | null;
  project?: string;
  withPreview?: boolean;
  withConflict?: boolean;
}) {
  const [voices, setVoices] = React.useState(VOICES);
  const [activeId, setActiveId] = React.useState<string | null>(initial);
  return (
    <VoiceProfile
      voices={voices}
      activeId={activeId}
      activeProject={project}
      onActiveChange={setActiveId}
      onSave={(next) => setVoices((all) => all.map((v) => (v.id === next.id ? next : v)))}
      onScopeChange={(id, scope) => setVoices((all) => all.map((v) => (v.id === id ? { ...v, scope } : v)))}
      onReset={() => setActiveId(null)}
      onPreview={withPreview ? preview : undefined}
      conflict={
        withConflict && activeId === "docs"
          ? {
              winnerId: "docs",
              otherId: "plain",
              reason: "A voice held to a project is more specific than one that follows you everywhere.",
            }
          : undefined
      }
    />
  );
}

export function ChipBesideTheInput() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
        <span className="text-foreground flex-1">Draft a release note for the export fix</span>
        <ActiveVoiceChip voice={VOICES[1]} onOpen={() => setOpen((v) => !v)} />
      </div>
      {open ? <Stateful initial="docs" project="Docs site" /> : null}
    </div>
  );
}

export function RulesWithASample() {
  return <Stateful withPreview />;
}

export function ConflictNamesTheWinner() {
  return <Stateful initial="docs" project="Docs site" withConflict />;
}

export function ProjectVoiceHeldToItsProject() {
  return <Stateful initial="docs" project="Docs site" />;
}

export function ResetInOneStep() {
  return <Stateful />;
}

export function OneWordTone() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-2 rounded-lg border px-3 py-2 text-sm">
      <span className="text-foreground font-medium">Tone</span>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline">
          Casual
        </Button>
        <Button type="button" size="sm" variant="outline">
          Professional
        </Button>
        <Button type="button" size="sm" variant="outline">
          Friendly
        </Button>
      </div>
      <p className="text-foreground text-xs">Nothing says what the voice uses, avoids or looks like.</p>
    </div>
  );
}

export function ChipWithNoScope() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-2">
      <span className="bg-background text-foreground inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium">
        Docs voice
      </span>
      <p className="text-foreground text-xs">
        Is this voice global, or held to a project? The person cannot tell until the wrong tone appears.
      </p>
    </div>
  );
}

export function SilentOverride() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-2 rounded-lg border px-3 py-2 text-sm">
      <span className="text-foreground font-medium">Voice: Docs voice</span>
      <p className="text-foreground text-xs">
        Plain and direct is also switched on, but the reply ignores it and nothing says why.
      </p>
    </div>
  );
}
