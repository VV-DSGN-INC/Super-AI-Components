"use client";

import { SelectionToolbar } from "@/registry/super-ai/selection-toolbar";

/**
 * Live examples for selection-toolbar.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose: the docs
 * module is plain data read by a Server Component, so it cannot carry
 * "use client" and cannot hold JSX with event handlers. Every example here is
 * zero-prop, so an `onIntent` callback is created and consumed entirely inside
 * this file and never crosses the boundary.
 */

const SELECTION =
  "It is our belief that the onboarding process is not optimal and could probably be improved.";

/** The bar as shipped: Improve filled and first, the rest plain verbs. */
export function ImproveFirst() {
  return <SelectionToolbar selectionText={SELECTION} onIntent={() => {}} />;
}

/**
 * The right end of the mechanism, sketched: the request comes back as a change
 * you can read and reject. K3 `diff-review` is the real component.
 */
export function ReturnsAReviewableDiff() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <SelectionToolbar selectionText={SELECTION} pending="shorten" onIntent={() => {}} />
      <div className="rounded-md border p-3 text-sm">
        <p className="text-foreground mb-2 text-xs font-medium">Proposed change · shorten</p>
        <p className="leading-relaxed">
          <span className="decoration-foreground/60 line-through">
            It is our belief that the onboarding process is not optimal
          </span>{" "}
          <span className="bg-primary/20 rounded-sm px-0.5 underline">
            Onboarding needs work
          </span>{" "}
          and could probably be improved.
        </p>
        <p className="text-muted-foreground mt-2 text-xs">
          Removed hedging; kept the claim. Accept or reject per change.
        </p>
      </div>
    </div>
  );
}

/**
 * The failure this component exists to prevent: the paragraph has already been
 * swapped and there is nothing left to compare it against.
 */
export function SilentReplacement() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <SelectionToolbar selectionText={SELECTION} tones={[]} onIntent={() => {}} />
      <div className="rounded-md border p-3 text-sm">
        <p className="text-foreground mb-2 text-xs font-medium">Rewritten</p>
        <p className="leading-relaxed">Onboarding needs work and could be improved.</p>
        <p className="text-muted-foreground mt-2 text-xs">
          No original, no rationale, no way back.
        </p>
      </div>
    </div>
  );
}

/**
 * Tone spread across the bar. Five buttons that are really one decision, and
 * the ceiling is spent before the product has added a verb of its own.
 */
export function ToneAsFiveButtons() {
  return (
    <div className="bg-popover text-popover-foreground flex w-fit items-center gap-0.5 rounded-lg border p-1 shadow-md">
      <span className="bg-primary text-primary-foreground rounded-lg px-2.5 py-1 text-[0.8rem] font-medium">
        Improve
      </span>
      {["Professional", "Friendly", "Casual", "Confident", "Direct"].map((tone) => (
        <span key={tone} className="rounded-lg px-2.5 py-1 text-[0.8rem] font-medium">
          {tone}
        </span>
      ))}
    </div>
  );
}
