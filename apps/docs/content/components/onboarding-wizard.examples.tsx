"use client";

import { OnboardingWizard, type OnboardingWizardStep } from "@/registry/super-ai/onboarding-wizard";

/**
 * Live examples for onboarding-wizard.docs.tsx.
 *
 * Kept separate from the docs module on purpose: component-docs.tsx (a Server
 * Component) reads `docs.whatItIs`, `docs.evidence`, etc. directly, so
 * onboarding-wizard.docs.tsx has to stay plain server-evaluable data — it
 * cannot carry "use client" itself, because Next.js turns "use client" exports
 * into opaque client references and a plain object read through one of those
 * comes back with every field undefined. Every example lives here instead and
 * crosses into the docs module as a zero-prop element.
 */

const ANSWERED_STEPS: OnboardingWizardStep[] = [
  {
    id: "role",
    title: "What do you make?",
    choices: [
      { value: "marketing", label: "Marketing video", description: "Ads, social cuts" },
      { value: "film", label: "Film and story", description: "Scenes, longer edits" },
    ],
    effect: "Sets your default aspect ratio and opens the matching sample project.",
  },
  {
    id: "volume",
    title: "How much do you expect to make?",
    choices: [
      { value: "few", label: "A few a month" },
      { value: "daily", label: "Every day" },
    ],
    effect: "Picks your credit pack and whether the batch queue starts on.",
  },
];

export function AnswersChangeTheProduct() {
  return <OnboardingWizard steps={ANSWERED_STEPS} defaultAnswers={{ role: "marketing" }} />;
}

export function SkipOnEveryStep() {
  return <OnboardingWizard steps={ANSWERED_STEPS} defaultStep="volume" />;
}

const SPLIT_STEPS: OnboardingWizardStep[] = [
  {
    id: "brand",
    title: "Bring your brand in",
    description: "Optional — you can add this later from Settings.",
    content: <p className="text-foreground text-sm">Drop a logo and two brand colours.</p>,
    effect: "Applies your palette to every generated title card.",
    panel: (
      <div className="flex flex-col gap-1">
        <p className="text-foreground text-sm font-medium">Teams ship 3x faster with a brand kit</p>
        <p className="text-foreground/70 text-xs">Shared across the workspace, picked up by every template.</p>
      </div>
    ),
  },
];

export function SamePartsPlusAPane() {
  return <OnboardingWizard steps={SPLIT_STEPS} />;
}

export function SurveyThatChangesNothing() {
  // What NOT to do: a question with no stated consequence. Nothing downstream
  // reads the answer, so the only thing the step reliably produces is drop-off
  // between the splash screen and the product.
  return (
    <div
      aria-hidden
      className="w-full max-w-md rounded-lg border border-dashed p-4 text-sm"
    >
      <p className="text-foreground font-medium">How did you hear about us?</p>
      <ul className="text-foreground/70 mt-2 flex flex-col gap-1 text-xs">
        <li>A friend</li>
        <li>Search</li>
        <li>Social</li>
      </ul>
      <p className="text-foreground/70 mt-3 text-xs">
        No stated effect. Nothing in the product changes whichever one you pick.
      </p>
    </div>
  );
}

export function ColourOnlyDots() {
  // What NOT to do: five dots that differ only by fill. There is no position,
  // no total and no count of what is left — for a screen reader there is
  // nothing at all, and for anyone who cannot separate the two fills there is
  // no way to tell a two-question flow from a twelve-question one.
  return (
    <div aria-hidden className="flex items-center gap-1.5">
      {[0, 1, 2, 3, 4].map((index) => (
        <span
          key={index}
          className={index === 1 ? "bg-primary size-1.5 rounded-full" : "bg-border size-1.5 rounded-full"}
        />
      ))}
    </div>
  );
}

export function ChoiceCardsAsDivs() {
  // What NOT to do: card-shaped divs with a click handler. No role, no
  // aria-checked, no arrow-key movement between options, nothing a form or an
  // assistive technology can read — the selected card differs from the rest
  // by a border colour and nothing else.
  return (
    <div aria-hidden className="grid w-full max-w-md gap-2 sm:grid-cols-2">
      <div className="border-ring rounded-lg border p-3">
        <p className="text-foreground text-sm font-medium">Marketing video</p>
        <p className="text-foreground/70 text-xs">Ads, social cuts</p>
      </div>
      <div className="border-border rounded-lg border p-3">
        <p className="text-foreground text-sm font-medium">Film and story</p>
        <p className="text-foreground/70 text-xs">Scenes, longer edits</p>
      </div>
    </div>
  );
}
