"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

import { Feedback } from "@/registry/super-ai/feedback";

/**
 * Live examples for feedback.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so feedback.docs.tsx has to stay plain
 * server-evaluable data — it cannot carry "use client" itself, because
 * Next.js turns "use client" exports into opaque client references, and a
 * plain object read through one of those comes back with every field
 * undefined. Every example lives here instead and crosses into the docs
 * module as a zero-prop element (e.g. `<OneClickPositive />`), so a prop
 * like `onSubmit` never has to be serialized across the server/client
 * boundary — it's created and consumed entirely inside this client module.
 */

export function OneClickPositive() {
  const [state, setState] = useState<"idle" | "submitted">("idle");
  return (
    <Feedback
      state={state}
      value={state === "submitted" ? "up" : undefined}
      onRate={() => {}}
      onSubmit={() => setState("submitted")}
      onUndo={() => setState("idle")}
    />
  );
}

export function OptionalReasonChips() {
  const [reason, setReason] = useState("");
  return (
    <Feedback
      state="rating"
      value="down"
      reason={reason}
      onReasonChange={setReason}
      onRate={() => {}}
      onSubmit={() => {}}
    />
  );
}

// Hand-built mock, not the real component: Feedback always treats a
// thumbs-up as a one-click submit, it has no path that gates positive
// feedback behind the reason popover. This illustrates the anti-pattern a
// custom implementation could reach for by mistake.
export function ReasonGatedPraise() {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex w-fit items-stretch rounded-lg border">
        <button
          type="button"
          aria-pressed="true"
          className="bg-muted text-foreground inline-flex size-7 items-center justify-center rounded-l-lg"
        >
          <ThumbsUp aria-hidden className="size-3.5 fill-current" />
        </button>
        <button
          type="button"
          aria-pressed="false"
          className="text-muted-foreground inline-flex size-7 items-center justify-center rounded-r-lg border-l"
        >
          <ThumbsDown aria-hidden className="size-3.5" />
        </button>
      </div>
      <div className="bg-popover text-popover-foreground w-72 rounded-lg p-2.5 text-sm shadow-md ring-1 ring-foreground/10">
        <p className="mb-1.5 font-medium">Why was this helpful?</p>
        <p className="text-foreground text-xs">Praise now needs a reason before it counts — the signal gets suppressed.</p>
      </div>
    </div>
  );
}

// Hand-built mock: the real component always renders the undo affordance in
// "submitted" and has no prop that removes it. This shows what a
// hand-rolled confirmation without one looks like.
export function NoWayBack() {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>Thanks for the feedback!</span>
    </div>
  );
}
