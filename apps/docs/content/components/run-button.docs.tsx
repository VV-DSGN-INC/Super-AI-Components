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
    'Every reference product with a paid generation puts the price and the trigger in the same control — Freepik\'s "Generate 55" button, Tripo, Playground, and ElevenLabs all read the cost off the button itself rather than a separate estimate panel. Folding progress into the same control matters just as much: a progress bar rendered anywhere else makes people wonder whether the real button is still live. And because monetization is a state on this component rather than a kit bolted on later (finding F1), insufficient-credits and locked have to be first-class states here from day one, at the exact point the user is about to spend.',
  evidence: ["Freepik", "Tripo", "Playground", "ElevenLabs"],
  anatomy: [
    { slot: "run-button", note: "Root wrapper for every state; carries data-state and aria-busy." },
    { slot: "run-button-cost", note: "CostChip (A2), shown alongside the trigger whenever a cost is known." },
    { slot: "run-button-trigger", note: "The main action: Generate, Generating…, Run again, or Try again." },
    {
      slot: "run-button-progress",
      note: "Progress fill drawn inside the trigger while running — never a separate bar.",
    },
    {
      slot: "run-button-cancel",
      note: "Always present next to the trigger while running; a generation you can't stop burns trust.",
    },
    { slot: "run-button-error", note: "The failure reason as visible text, next to the retry trigger." },
    {
      slot: "run-button-insufficient",
      note: "Replaces the trigger when the estimate exceeds the user's balance.",
    },
    {
      slot: "run-button-locked",
      note: "Replaces the trigger when the action is gated by plan, not by balance.",
    },
    { slot: "run-button-status", note: "sr-only live region announcing the estimating/running transition." },
  ],
  usage:
    'Reach for it at the exact point a generation is triggered — inside a generation panel, a node\'s footer, a composer\'s send action — anywhere a click spends credits. Drive it as a controlled `state`: move to "estimating" while a fresh cost is computed, "running" once the job starts (with `progress` ticking if you have it, omitted for an indeterminate fill), and "done" or "failed" when it resolves. Check the balance against the estimate before you ever call `onRun` — if it\'s short, render "insufficient-credits" instead of letting a doomed request round-trip to the server. Reach for "locked" only when the gate is the user\'s plan, not their balance; the two read differently and drive different CTAs (buy credits vs. upgrade).',
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
      text: 'Spell out the shortfall in numbers when credits are short — "Need 6, you have 2", not a silently disabled button.',
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
  accessibility: {
    keyboard: [
      "The tab-stop count changes with every state, and one state has none. `idle`, `done` and `failed` are a single stop (the trigger — `CostChip` is a `span` and takes no focus). `running` is also one, but a different one: the trigger goes natively `disabled`, so the only reachable control is Cancel. `insufficient-credits` and `locked` are one stop each, on their own button.",
      "`estimating` is zero tab stops. The trigger is disabled and Cancel does not exist yet, so for the length of the estimate there is nothing in the component a keyboard can reach.",
      "Every control is a real `button`, so Space and Enter activate. There is no Escape handler anywhere — Escape does not cancel a run, and the only way to stop one from the keyboard is to Tab to the Cancel button.",
      'The trigger and Cancel sit in a `ButtonGroup`, which is a `role="group"` with no accessible name. It changes nothing about travel: Tab still visits the two buttons in order.',
    ],
    screenReader: [
      '`run-button-status` is an always-mounted `role="status"` `aria-live="polite"` region carrying `runningLabel` or `estimatingLabel`. It is why the busy transition is heard at all — a relabelled button that already has focus is not reliably re-announced on its own.',
      'That region is empty for every other state, so `done` and the return to `idle` are announced as nothing. A run finishing successfully is silent; only failure speaks, through `run-button-error`\'s `role="alert"`.',
      'The failure message is wired both ways: `role="alert"` announces it when it mounts, and the trigger takes `aria-describedby` pointing at it — but only when `state` is `failed` **and** `errorMessage` is set. A `failed` state with no message leaves "Try again" with no stated reason.',
      'While `running`, a `progressbar` sits behind the trigger named with `runningLabel` — the same string the trigger is displaying, so "Generating…" is announced twice. Omit `progress` and it is indeterminate, with no percentage to report.',
      "The cost leaves the accessible tree while the run is in flight: `CostChip` renders only in `idle`, `done` and `failed`, so a user who tabs back mid-run cannot re-check what the action costs.",
      'Neither gate message is associated with its button. `Add credits` is named "Add credits" and the shortfall ("Need 6 credits, you have 2") is an unlinked sibling `span`; `lockedReason` is the same shape. Both read in document order and neither is a description, so a screen-reader user who lands directly on the button gets the CTA without the reason.',
      "Every icon — `Coins`, `Lock`, `Check`, `AlertCircle`, the Cancel `X` — is `aria-hidden`, so names come from text alone. Cancel is icon-only and takes its name from `cancelLabel` via `aria-label`.",
      "`aria-busy` lands on the root wrapper while estimating or running. `data-state` is styling only and is not exposed to assistive tech.",
    ],
    focus: [
      "Starting a run drops focus. `onRun` fires on the trigger, your state change makes that same trigger natively `disabled`, and a disabled element cannot hold focus — so focus falls to `<body>` and the next Tab restarts from the top of the page. The Cancel button that just appeared is not focused. Move focus to it yourself if a run is cancellable.",
      "The same thing happens in reverse when a run ends: Cancel unmounts out from under the focus it was holding, and nothing catches it. Both transitions are worth handling at the call site.",
      "Every control here is a vendored `Button`, so all of them ship a `focus-visible` ring. Nothing in this component inherits an unstyled focus state.",
    ],
  },
  pitfalls: [
    "Treating insufficient-credits as a disabled idle button. The point of the state is the number — how much is needed and how much the user has — not just refusing the click.",
    "Relabelling the trigger for estimating/running without announcing it. Screen reader users won't pick up a text change on an already-focused button by itself; that's what the sr-only status region and aria-busy are for.",
    "Recomputing the cost locally instead of passing through the same number the estimate (A2 cost-chip) and any parent generation panel already agreed on — two different prices for the same action is the exact failure mode the spec calls out.",
    "Confusing locked with insufficient-credits. One is a plan gate (fixed until upgrade), the other is a balance shortfall (fixed by a top-up) — collapsing them into a single disabled state loses the CTA the user actually needs.",
  ],
};
