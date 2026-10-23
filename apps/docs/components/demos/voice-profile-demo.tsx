"use client";

import * as React from "react";

import { ActiveVoiceChip, VoiceProfile, type Voice } from "@/registry/super-ai/voice-profile";

const INITIAL: Voice[] = [
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
  {
    id: "formal",
    name: "Formal",
    source: "system",
    scope: "global",
    rules: { tone: "Formal and measured." },
  },
];

export default function VoiceProfileDemo() {
  const [voices, setVoices] = React.useState(INITIAL);
  const [activeId, setActiveId] = React.useState<string | null>("docs");
  const active = voices.find((voice) => voice.id === activeId) ?? null;

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <div>
        <ActiveVoiceChip voice={active} />
      </div>
      <VoiceProfile
        voices={voices}
        activeId={activeId}
        activeProject="Docs site"
        description="How replies sound, and where each voice applies."
        onActiveChange={setActiveId}
        onSave={(next) => setVoices((all) => all.map((voice) => (voice.id === next.id ? next : voice)))}
        onScopeChange={(id, scope) =>
          setVoices((all) => all.map((voice) => (voice.id === id ? { ...voice, scope } : voice)))
        }
        onReset={() => setActiveId(null)}
        onPreview={(rules) =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(
                  `${rules.tone ?? "Default tone"}. We shipped the export fix, so large files now finish in one pass.`,
                ),
              400,
            ),
          )
        }
        conflict={
          activeId === "docs"
            ? {
                winnerId: "docs",
                otherId: "plain",
                reason: "A voice held to a project is more specific than one that follows you everywhere.",
              }
            : undefined
        }
      />
    </div>
  );
}
