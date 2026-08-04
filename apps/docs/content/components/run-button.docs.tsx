import type { ComponentDocs } from "@/lib/component-docs";
import {
  CancelExposedWhileRunning,
  CostAndProgressTogether,
  DisabledWithNoShortfall,
  LockedSwapsInPlace,
  SeparateLockBanner,
  ShortfallSpelledOut,
} from "./run-button.examples";

/**
 * Seeded from docs/design-system/component-specs.md#e5-run-button.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples live in the sibling
 * "run-button.examples.tsx" client module and are referenced here as
 * zero-prop elements — see that file for why.
 */
export const RunButtonDocs: ComponentDocs = {
  whatItIs:
    "The single control that starts a generation: the trigger, its credit cost, and its progress live in one lifecycle, not three widgets scattered around the surface. It carries seven states end to end — idle, estimating, running, done, failed, insufficient-credits, and locked — and two of those, insufficient-credits and locked, are monetization gates rather than progress states.",
  whyItMatters:
    "Every reference product with a paid generation puts the price and the trigger in the same control — Freepik's \"Generate 55\" button, Tripo, Playground, and ElevenLabs all read the cost off the button itself rather than a separate estimate panel. Folding progress into the same control matters just as much: a progress bar rendered anywhere else makes people wonder whether the real button is still live. And because monetization is a state on this component rather than a kit bolted on later (finding F1), insufficient-credits and locked have to be first-class states here from day one, at the exact point the user is about to spend.",
  evidence: ["Freepik", "Tripo", "Playground", "ElevenLabs"],
  anatomy: [
    { slot: "run-button", note: "Root wrapper for every state; carries data-state and aria-busy." },
    { slot: "run-button-cost", note: "CostChip (A2), shown alongside the trigger whenever a cost is known." },
    { slot: "run-button-trigger", note: "The main action: Generate, Generating…, Run again, or Try again." },
    { slot: "run-button-progress", note: "Progress fill drawn inside the trigger while running — never a separate bar." },
    { slot: "run-button-cancel", note: "Always present next to the trigger while running; a generation you can't stop burns trust." },
    { slot: "run-button-error", note: "The failure reason as visible text, next to the retry trigger." },
    { slot: "run-button-insufficient", note: "Replaces the trigger when the estimate exceeds the user's balance." },
    { slot: "run-button-locked", note: "Replaces the trigger when the action is gated by plan, not by balance." },
    { slot: "run-button-status", note: "sr-only live region announcing the estimating/running transition." },
  ],
  usage:
    "Reach for it at the exact point a generation is triggered — inside a generation panel, a node's footer, a composer's send action — anywhere a click spends credits. Drive it as a controlled `state`: move to \"estimating\" while a fresh cost is computed, \"running\" once the job starts (with `progress` ticking if you have it, omitted for an indeterminate fill), and \"done\" or \"failed\" when it resolves. Check the balance against the estimate before you ever call `onRun` — if it's short, render \"insufficient-credits\" instead of letting a doomed request round-trip to the server. Reach for \"locked\" only when the gate is the user's plan, not their balance; the two read differently and drive different CTAs (buy credits vs. upgrade).",
  dos: [
    {
      text: "Keep the cost, the trigger, and the progress fill in one control — never split them into a separate estimate panel and a separate progress bar.",
      example: <CostAndProgressTogether />,
    },
    {
      text: "Give Cancel a visible seat right next to the busy trigger the moment a run starts.",
      example: <CancelExposedWhileRunning />,
    },
    {
      text: "Spell out the shortfall in numbers when credits are short — \"Need 6, you have 2\", not a silently disabled button.",
      example: <ShortfallSpelledOut />,
    },
    {
      text: "Swap the locked CTA in for the trigger itself, in the same spot — the same answer hero-omnibox gives for its own locked state.",
      example: <LockedSwapsInPlace />,
    },
  ],
  donts: [
    {
      text: "Don't just grey out the trigger when credits are short — a disabled button with no numbers gives the user nothing to act on.",
      example: <DisabledWithNoShortfall />,
    },
    {
      text: "Don't gate the feature with a separate banner next to a trigger that still looks live — now two places can disagree about whether the action is locked.",
      example: <SeparateLockBanner />,
    },
  ],
  pitfalls: [
    "Treating insufficient-credits as a disabled idle button. The point of the state is the number — how much is needed and how much the user has — not just refusing the click.",
    "Relabelling the trigger for estimating/running without announcing it. Screen reader users won't pick up a text change on an already-focused button by itself; that's what the sr-only status region and aria-busy are for.",
    "Recomputing the cost locally instead of passing through the same number the estimate (A2 cost-chip) and any parent generation panel already agreed on — two different prices for the same action is the exact failure mode the spec calls out.",
    "Confusing locked with insufficient-credits. One is a plan gate (fixed until upgrade), the other is a balance shortfall (fixed by a top-up) — collapsing them into a single disabled state loses the CTA the user actually needs.",
  ],
};
