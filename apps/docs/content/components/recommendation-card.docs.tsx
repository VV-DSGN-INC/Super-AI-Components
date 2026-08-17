import type { ComponentDocs } from "@/lib/component-docs";
import {
  DismissOnlyNoMiddleOption,
  GoodBalancedActions,
  GoodNumberedStepsInModal,
  StepsAsProseParagraph,
} from "./recommendation-card.examples";

/**
 * Seeded from docs/design-system/component-specs.md#c5-recommendation-card.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples that need interactivity or
 * event handlers live in the ./recommendation-card.examples client sidecar
 * and get referenced here as zero-prop elements — see that file for why.
 */
export const RecommendationCardDocs: ComponentDocs = {
  whatItIs:
    "A \"Recommended for you\" card with two levels: a one-line row for the feed, and a modal that lays out the apps involved and the steps required — numbered, not prose — before the user commits.",
  whyItMatters:
    "Zapier's recommendation feed, Freepik's skills surface, and Manus's \"get started with\" cards all separate the pitch from the commitment: a compact row earns attention, the modal earns trust by showing exactly what will run before it runs. A recommendation you cannot audit is an instruction you should not follow. Pairing Save for later with Try it — rather than leaving Dismiss as the only way off the card — gives people a real middle option instead of training them to swipe everything away.",
  evidence: ["Zapier recommendations", "Freepik skills", "Manus \"get started with\""],
  anatomy: [
    { slot: "recommendation-card", note: "Root card wrapping the collapsed row." },
    { slot: "recommendation-card-dismiss", note: "Always-visible dismiss control, top-right." },
    { slot: "recommendation-card-icon", note: "Optional leading glyph on the row." },
    { slot: "recommendation-card-title", note: "Row title, reused as the modal's DialogTitle." },
    { slot: "recommendation-card-description", note: "One-line teaser, reused as the modal's description." },
    { slot: "recommendation-card-apps", note: "The tools this recommendation touches — the 'apps' in apps + steps." },
    { slot: "recommendation-card-trigger", note: "Try it — opens the modal. Carries real aria-expanded/aria-haspopup." },
    { slot: "recommendation-card-save", note: "Save for later — the middle option, mirrored in the row and the modal footer." },
    { slot: "recommendation-card-dialog", note: "The modal: apps, numbered steps, and the commit action." },
    { slot: "recommendation-card-steps", note: "Ordered list — 'How it works' as steps, never a paragraph." },
    { slot: "recommendation-card-commit", note: "The modal's actual commit action, after the steps are visible." },
  ],
  usage:
    "Reach for it wherever a feed or sidebar surfaces one suggested app or workflow at a time — not as a row inside a menu. Pass `steps` as short imperative strings; each renders as a numbered row in the modal, never as prose. `apps` is optional but pairs naturally with `steps` once the recommendation crosses tools. `dismissed`/`onDismiss` and `saved`/`onSaveForLater` are both controlled, the same convention promo-card uses: the component only renders the choice, the consuming app owns persisting it — across a reload, a recommendation that was dismissed or saved has to still read that way.",
  dos: [
    {
      text: "Give Save for later the same visual weight as Try it and Dismiss — three real options, not two plus an afterthought.",
      example: <GoodBalancedActions />,
    },
    {
      text: "Keep 'How it works' as a numbered list inside the modal, one concrete action per step.",
      example: <GoodNumberedStepsInModal />,
    },
  ],
  donts: [
    {
      text: "Don't ship Dismiss as the only way off the card — without Save for later, dismissal is the only outlet, and that trains people to dismiss everything.",
      example: <DismissOnlyNoMiddleOption />,
    },
    {
      text: "Don't write 'How it works' as a paragraph of prose — it reads as marketing copy, not steps a person can audit before committing.",
      example: <StepsAsProseParagraph />,
    },
  ],
  accessibility: {
    keyboard: [
      "Three tab stops on the collapsed row, in DOM order: Dismiss, Try it, Save for later. Dismiss is rendered first, so the tab order reaches the way off the card before either of the two useful options.",
      "The modal adds three more — Close, Save for later, Get started. Escape closes it, focus is trapped inside it while it is open, and Tab cycles within it; all of that comes from the vendored Base UI `Dialog`, not from this component.",
      "Both save buttons are the same element, so `saved` disables the row's and the footer's together. A disabled button leaves the tab order, and the collapsed row drops from three stops to two.",
      "There is no keyboard shortcut for dismiss, and no arrow-key movement between cards in a feed — each card is an independent cluster of buttons.",
    ],
    screenReader: [
      "The card root is a plain `<div>` with no role and no name, and the row title is a `<p>`, not a heading. A feed of these offers nothing to navigate by: no landmark, no heading, no list.",
      "The dismiss control's name is `dismissLabel`, default \"Dismiss\", identical on every card. Pass \"Dismiss <title>\" so a rotor list of buttons is not a column of the same word.",
      "Try it is a `DialogTrigger`, so it carries `aria-haspopup=\"dialog\"` and `aria-expanded`, and the dialog it opens is named by the same `title` the row shows — the modal announces as a continuation of the row rather than a new subject.",
      "The steps are a real `<ol>` and the visible digits are `aria-hidden`, so the numbering is announced once, by the list semantics, instead of twice.",
      "The save control renames itself: \"Save for later\" becomes \"Saved\", then goes disabled. That is the opposite convention to `rate-limit-banner`, which keeps a fixed label and puts the state on `aria-pressed` — here a returning user hears a control they have never heard of.",
      "Nothing announces the outcome of either choice. `dismissed` returns `null` and the card simply stops existing; there is no live region to say it was dismissed or saved.",
    ],
    focus: [
      "Dismissing unmounts the card, so the button that had focus disappears and focus falls to `<body>` — the next Tab restarts at the top of the page. In a feed, move focus to the next card inside your `onDismiss`.",
      "Saving is the same failure in miniature: feeding `saved` back in disables the button under the user's finger, and a focused element that becomes disabled is blurred, dropping focus to `<body>` again.",
      "The modal is the one place focus is handled for you: opening it moves focus inside, Escape or Get started closes it, and Base UI returns focus to the Try it trigger.",
      "Every control here is the shared `Button`, so all of them carry a visible focus ring.",
    ],
  },
  pitfalls: [
    "Wiring `onDismiss` to a local flag that resets on reload. Dismissal that doesn't persist reads as a bug, not a missing feature — same trap as promo-card.",
    "Letting the row's Try it button commit directly instead of opening the modal. The two-level split exists so a recommendation is auditable before it runs; skipping the modal turns a suggestion back into an instruction.",
    "Treating `saved` as fire-and-forget. The button only flips to its saved state because the consumer fed `saved={true}` back in after `onSaveForLater` fired — forgetting that wiring makes the save feel like it silently failed.",
  ],
};
