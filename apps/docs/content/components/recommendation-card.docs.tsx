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
  pitfalls: [
    "Wiring `onDismiss` to a local flag that resets on reload. Dismissal that doesn't persist reads as a bug, not a missing feature — same trap as promo-card.",
    "Letting the row's Try it button commit directly instead of opening the modal. The two-level split exists so a recommendation is auditable before it runs; skipping the modal turns a suggestion back into an instruction.",
    "Treating `saved` as fire-and-forget. The button only flips to its saved state because the consumer fed `saved={true}` back in after `onSaveForLater` fired — forgetting that wiring makes the save feel like it silently failed.",
  ],
};
