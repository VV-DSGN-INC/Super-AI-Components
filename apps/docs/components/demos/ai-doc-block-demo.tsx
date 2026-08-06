"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { AiDocBlock, type AiDocBlockState } from "@/registry/super-ai/ai-doc-block";

const FIRST_DRAFT =
  "Revenue grew 14% quarter over quarter, driven mostly by the self-serve tier. Churn held flat at 2.1%. The number worth flagging is support volume, which rose 30% against a headcount that did not move.";

const SECOND_DRAFT =
  "Revenue is up 14% on the quarter, almost all of it self-serve. Churn is flat. Support volume rose 30% on unchanged headcount — that is the one to watch.";

type Outcome = "open" | "kept" | "discarded";

export default function AiDocBlockDemo() {
  const [outcome, setOutcome] = React.useState<Outcome>("open");
  const [state, setState] = React.useState<AiDocBlockState>("approval-verbs");
  const [text, setText] = React.useState(FIRST_DRAFT);
  const [prompt, setPrompt] = React.useState("");

  const restart = () => {
    setText(FIRST_DRAFT);
    setPrompt("");
    setOutcome("open");
    setState("streaming");
    // Stands in for the host's own stream finishing.
    setTimeout(() => setState("approval-verbs"), 900);
  };

  return (
    // The surrounding paragraphs are the point: the block is a node in this
    // document, and nothing it does moves them.
    <article className="text-foreground flex w-full max-w-xl flex-col gap-3 text-sm">
      <h3 className="font-heading text-base font-medium">Q3 summary</h3>
      <p>Here is where the quarter landed, ahead of Thursday&apos;s review.</p>

      {outcome === "kept" ? (
        // Kept: the passage is now ordinary document content. No chrome left.
        <p>{text}</p>
      ) : outcome === "discarded" ? (
        <div className="flex items-center gap-2">
          <span>Draft discarded.</span>
          <Button type="button" size="sm" variant="outline" onClick={restart}>
            Generate again
          </Button>
        </div>
      ) : (
        <AiDocBlock
          state={state}
          value={text}
          onValueChange={setText}
          prompt={prompt}
          onPromptChange={setPrompt}
          onRePrompt={() => {
            // A real host would await a request here. Whatever comes back lands
            // in this same block — the paragraphs either side never move.
            setText(SECOND_DRAFT);
            setPrompt("");
            setState("approval-verbs");
          }}
          onRePromptCancel={() => setState("approval-verbs")}
          onKeep={() => setOutcome("kept")}
          onEdit={() => setState(state === "editable" ? "approval-verbs" : "editable")}
          onRegenerate={() => setState("re-promptable")}
          onDiscard={() => setOutcome("discarded")}
        >
          <p>{text}</p>
        </AiDocBlock>
      )}

      <p>The rest of the document carries on below, exactly where it was.</p>
    </article>
  );
}
