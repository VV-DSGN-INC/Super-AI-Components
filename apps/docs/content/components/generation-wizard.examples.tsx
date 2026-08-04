"use client";

import { CostChip } from "@/registry/super-ai/cost-chip";
import { GenerationWizard, type GenerationWizardStep } from "@/registry/super-ai/generation-wizard";

/**
 * Live examples for generation-wizard.docs.tsx.
 *
 * Kept separate from the docs module on purpose: component-docs.tsx (a
 * Server Component) reads `docs.whatItIs`, `docs.evidence`, etc. directly, so
 * generation-wizard.docs.tsx has to stay plain server-evaluable data — it
 * cannot carry "use client" itself, because Next.js turns "use client"
 * exports into opaque client references and a plain object read through one
 * of those comes back with every field undefined. Every example lives here
 * instead and crosses into the docs module as a zero-prop element (e.g.
 * `<PreviewUpdatesPerStep />`), so nothing here — event handlers included —
 * ever has to serialize across the server/client boundary.
 */

const TWO_STEPS: GenerationWizardStep[] = [
  {
    id: "model",
    title: "Model",
    content: <p className="text-sm">Fast · Quality</p>,
    preview: (
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-foreground text-sm font-medium">Fast model</p>
        <CostChip amount={2} className="text-foreground" />
      </div>
    ),
  },
  {
    id: "review",
    title: "Review",
    content: <p className="text-sm">Fast model, 1 clip</p>,
    preview: (
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-foreground text-sm font-medium">Total</p>
        <CostChip amount={2} className="text-foreground" />
      </div>
    ),
  },
];

export function PreviewUpdatesPerStep() {
  return <GenerationWizard steps={TWO_STEPS} />;
}

export function CompletedStepsStayClickable() {
  return <GenerationWizard steps={TWO_STEPS} defaultStep="review" />;
}

export function NoSkipOnFinalStep() {
  return <GenerationWizard steps={TWO_STEPS} defaultStep="review" />;
}

export function ForwardOnlyWizard() {
  // What NOT to do: a two-step flow with no Back and no Skip traps the user
  // the moment step one turns out to be wrong.
  return (
    <div className="flex w-full max-w-3xl items-center justify-between rounded-lg border border-dashed p-4">
      <p className="text-foreground text-sm">Step 1 of 2 — Model</p>
      <button
        type="button"
        disabled
        className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium opacity-50"
      >
        Next
      </button>
    </div>
  );
}

export function StepHiddenBehindColorOnly() {
  // What NOT to do: three identically-shaped grey dots that only turn blue
  // when active carry no signal for colorblind users or screen readers.
  return (
    <ol className="flex items-center gap-3" aria-hidden>
      {["Model", "Style", "Review"].map((label, index) => (
        <li key={label} className="flex items-center gap-2">
          <span className="bg-muted size-3 rounded-full" data-active={index === 0} />
          <span className="text-foreground/60 text-sm">{label}</span>
        </li>
      ))}
    </ol>
  );
}
