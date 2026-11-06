"use client";

import * as React from "react";

import { Textarea } from "@/components/ui/textarea";
import { PromptEnhancer } from "@/registry/super-ai/prompt-enhancer";

/**
 * Live examples for prompt-enhancer.docs.tsx.
 *
 * A client sidecar so the docs module stays plain data. The enhancer here is a
 * timer that appends words, not a model; it exists so the panel has something
 * to show.
 */

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function appendConstraints(value: string) {
  await wait(600);
  return `${value.trim()}, in four lines, with a calm tone`;
}

async function alwaysFails(): Promise<string> {
  await wait(400);
  throw new Error("The model did not respond");
}

export function HostKeepsItsField() {
  const [value, setValue] = React.useState("write a short poem about the sea");
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Textarea
        aria-label="Prompt"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-16"
      />
      <PromptEnhancer value={value} onEnhance={appendConstraints} onAccept={setValue} />
    </div>
  );
}

export function RevertAfterAccept() {
  const [value, setValue] = React.useState("summarise this changelog for customers");
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Textarea
        aria-label="Prompt"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-16"
      />
      <PromptEnhancer value={value} onEnhance={appendConstraints} onAccept={setValue} />
      <p className="text-foreground text-xs">
        Accept the rewrite, then use Revert to get the first sentence back.
      </p>
    </div>
  );
}

export function FailureLeavesPrompt() {
  const [value, setValue] = React.useState("explain this error to a new teammate");
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Textarea
        aria-label="Prompt"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-16"
      />
      <PromptEnhancer value={value} onEnhance={alwaysFails} onAccept={setValue} />
    </div>
  );
}

export function SilentReplace() {
  const [value, setValue] = React.useState("write a short poem about the sea");
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Textarea
        aria-label="Prompt"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-16"
      />
      <button
        type="button"
        onClick={async () => setValue(await appendConstraints(value))}
        className="border-border text-foreground focus-visible:ring-ring w-fit rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
      >
        Enhance and overwrite
      </button>
      <p className="text-foreground text-xs">
        The field changes under the cursor. There is no original to compare and no way back.
      </p>
    </div>
  );
}

export function EnhanceThenSubmit() {
  const [sent, setSent] = React.useState<string | null>(null);
  const [value, setValue] = React.useState("write a short poem about the sea");
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <Textarea
        aria-label="Prompt"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-16"
      />
      <button
        type="button"
        onClick={async () => {
          const next = await appendConstraints(value);
          setValue(next);
          setSent(next);
        }}
        className="border-border text-foreground focus-visible:ring-ring w-fit rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
      >
        Enhance and send
      </button>
      <p className="text-foreground text-xs">
        {sent ? `Sent: ${sent}` : "One click rewrites the prompt and sends it. Nobody read the rewrite."}
      </p>
    </div>
  );
}
