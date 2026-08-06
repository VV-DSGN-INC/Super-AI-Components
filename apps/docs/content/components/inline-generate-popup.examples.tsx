"use client";

import { InlineGeneratePopup } from "@/registry/super-ai/inline-generate-popup";

/**
 * Live examples for inline-generate-popup.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence` and so on directly, so the docs module has to stay plain
 * server-evaluable data and cannot carry "use client" or handlers. Everything
 * interactive lives here and crosses over as a zero-prop element.
 *
 * Every live example opens from a trigger (`defaultOpen={false}`) rather than
 * on mount: the component's own default is open — it exists because someone
 * just clicked an empty line — and a docs page full of those would portal five
 * popups over itself on load. The two "don't" examples are static mock-ups for
 * the same reason.
 */

/** Do: the heading above the caret is the instruction, so the prompt stays short. */
export function ContextInsteadOfInstructions() {
  return (
    <InlineGeneratePopup
      defaultOpen={false}
      triggerLabel="Ask AI on this line"
      context="Q3 revenue drivers"
      contextLabel="Under"
      onSubmit={() => {}}
    />
  );
}

/** Do: a run in flight is announced and interruptible, with the prompt still readable. */
export function CancellableRun() {
  return (
    <InlineGeneratePopup
      state="generating"
      defaultOpen={false}
      triggerLabel="Show a run in flight"
      context="Q3 revenue drivers"
      defaultPrompt="Three bullets on why churn moved"
      onCancel={() => {}}
    />
  );
}

/** Do: the host measured the caret and flipped the popup above it. */
export function FlippedAboveTheCaret() {
  return (
    <InlineGeneratePopup
      placement="above"
      defaultOpen={false}
      triggerLabel="Open above the caret"
      context="Q3 revenue drivers"
      onSubmit={() => {}}
    />
  );
}

/**
 * Don't: the popup drawing the draft, with the accept verbs trapped inside a
 * transient overlay. Dismiss it and the work is gone.
 */
export function CommitsInsideThePopover() {
  return (
    <div className="bg-popover text-popover-foreground flex w-80 flex-col gap-2.5 rounded-lg p-2.5 text-sm shadow-md ring-1 ring-foreground/10">
      <p className="font-medium">Generate here</p>
      <p className="text-xs">
        Churn fell for three reasons: onboarding lost two steps, pricing collapsed to two plans, and
        first-response time halved.
      </p>
      <div className="flex justify-end gap-2 text-xs">
        <span className="rounded-lg border px-2 py-1">Discard</span>
        <span className="bg-primary text-primary-foreground rounded-lg px-2 py-1 font-medium">Insert</span>
      </div>
    </div>
  );
}

/**
 * Don't: no inherited context, and a placeholder that asks the user to retype
 * what the document already says.
 */
export function InstructionTemplatePlaceholder() {
  return (
    <div className="bg-popover text-popover-foreground flex w-80 flex-col gap-2.5 rounded-lg p-2.5 text-sm shadow-md ring-1 ring-foreground/10">
      <p className="font-medium">Generate here</p>
      <p className="text-muted-foreground min-h-14 rounded-lg border px-2.5 py-2 text-sm">
        Describe the topic, the tone, the audience, the length, and the section this paragraph
        belongs to&hellip;
      </p>
      <div className="flex justify-end text-xs">
        <span className="bg-primary text-primary-foreground rounded-lg px-2 py-1 font-medium">Generate</span>
      </div>
    </div>
  );
}
