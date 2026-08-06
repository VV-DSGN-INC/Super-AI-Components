"use client";

import * as React from "react";

import { InlineGeneratePopup, type InlineGeneratePopupState } from "@/registry/super-ai/inline-generate-popup";

const DRAFT =
  "Churn fell for three reasons: onboarding lost two steps, pricing collapsed to two plans, and first-response time halved.";

/**
 * The host owns everything this component refuses to own: where the caret is,
 * whether the model is running, and what happens to the text once it exists.
 * Here the generated paragraph lands below the heading as an ordinary document
 * node — in a real editor that node is a K1 `ai-doc-block` carrying the
 * approval verbs.
 */
export default function InlineGeneratePopupDemo() {
  const [state, setState] = React.useState<InlineGeneratePopupState>("idle");
  const [result, setResult] = React.useState<string | undefined>(undefined);
  const [committed, setCommitted] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(true);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const start = () => {
    setResult(undefined);
    setState("generating");
    timer.current = setTimeout(() => {
      setState("idle");
      setResult(DRAFT);
    }, 1600);
  };

  const cancel = () => {
    clearTimeout(timer.current);
    // Cancelled: the prompt stays, the output never arrives.
    setState("cancelled");
  };

  const reset = () => {
    clearTimeout(timer.current);
    setState("idle");
    setResult(undefined);
    setCommitted(null);
    setOpen(true);
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-4 p-4">
      {/* The structure the popup inherits. The heading is the instruction the
          user does not have to type. */}
      <h3 className="text-base font-medium">Q3 revenue drivers</h3>

      {committed ? (
        <p className="rounded-lg border p-3 text-sm">
          {committed}
          <span className="mt-2 block text-xs">
            K1 <code>ai-doc-block</code> renders this, with the approval verbs.
          </span>
        </p>
      ) : (
        <InlineGeneratePopup
          state={state}
          open={open}
          onOpenChange={setOpen}
          placement="below"
          context="Q3 revenue drivers"
          triggerLabel="Ask AI on this line"
          onSubmit={start}
          onCancel={cancel}
          result={result}
          onCommit={setCommitted}
        />
      )}

      <button type="button" onClick={reset} className="self-start text-xs underline underline-offset-4">
        Reset the demo
      </button>
    </div>
  );
}
