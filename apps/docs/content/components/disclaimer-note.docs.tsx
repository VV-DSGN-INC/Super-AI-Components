import type { ComponentDocs } from "@/lib/component-docs";
import {
  DismissibleWithCloseButton,
  FaintUnreadableText,
  PermanentInCard,
  ReadableUnderComposer,
} from "./disclaimer-note.examples";

/**
 * Seeded from docs/design-system/component-specs.md#n3-disclaimer-note.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. If a Do/Don't needs a live example,
 * define a zero-prop component in a sibling "disclaimer-note.examples.tsx"
 * client module ("use client" at the top of that file, not this one) and
 * reference it here as an element with no props, e.g.:
 *
 * // import { GoodExample } from "./disclaimer-note.examples";
 * // dos: [{ text: "...", example: <GoodExample /> }]
 *
 * An inline handler on an element created in *this* file — e.g.
 * `<DisclaimerNote onSelect={() => {}} />` passed straight into `dos`/`donts` —
 * cannot be serialized across the server/client boundary and breaks the
 * static export.
 */
export const DisclaimerNoteDocs: ComponentDocs = {
  whatItIs:
    "A short, permanent note that sits next to AI-generated output and says it can be wrong. It renders in three placements — directly under a composer, as a footer strip inside a card, and inline alongside other content — but carries the same non-negotiable property in all three: it never has a close button.",
  whyItMatters:
    "Claude, NotebookLM, Manus, and Freepik all ship one, and it has moved from a convention to something closer to a regulatory expectation for products that generate content. A disclaimer that can be dismissed only has to be seen once, which defeats the reason it exists — the user needs it available every time they're deciding whether to trust an output, not just the first time.",
  evidence: ["Manus", "Claude", "NotebookLM", "Freepik"],
  anatomy: [
    { slot: "disclaimer-note", note: "Root wrapper; carries the placement variant." },
    { slot: "disclaimer-note-icon", note: "Small, decorative marker — never the only signal, always paired with text." },
    { slot: "disclaimer-note-text", note: "The disclaimer copy itself, in full-contrast foreground text." },
    { slot: "disclaimer-note-link", note: "Optional 'learn more'-style link; always carries its own discernible label." },
  ],
  usage:
    "Place it directly adjacent to the output it qualifies — under the composer that produces a response, as the last element inside a card of generated content, or inline beside a piece of AI-written text — never on a settings or about page where the user has to go looking for it. Pick the variant that matches where it physically sits: `under-composer` for a persistent row beneath an input, `in-card` for a footer separated from generated content by a rule, `inline` for a compact mention beside other metadata. Override the default copy with children when a product needs specific wording (e.g. naming the model), and only pass `link` when there's somewhere real to send the user — a support article or settings page, not a bare '#'.",
  dos: [
    {
      text: "Keep the message permanent and readable — full-contrast text, findable the tenth time as easily as the first.",
      example: <ReadableUnderComposer />,
    },
    {
      text: "Separate it from the content above with a rule when it's inside a card, not a tinted background.",
      example: <PermanentInCard />,
    },
  ],
  donts: [
    {
      text: "Don't style the disclaimer so faintly it can't be read — muted text on a muted or accent surface fails contrast in this token set (4.34:1 against a 4.5:1 minimum) and defeats the point of a trust surface.",
      example: <FaintUnreadableText />,
    },
    {
      text: "Don't bolt on a dismiss control — a disclaimer the user can close after one viewing isn't doing the job it exists for.",
      example: <DismissibleWithCloseButton />,
    },
  ],
  pitfalls: [
    "Reaching for `text-muted-foreground` out of instinct because the copy is 'just a footnote'. In this token set it measures under the 4.5:1 minimum against `bg-muted`, `bg-accent`, and `bg-secondary` — use `text-foreground` and let size and placement carry the quietness instead.",
    "Adding state to make the note collapsible or auto-hiding after a timeout — both are dismissal in disguise and undo the 'permanent' requirement just as much as a close button would.",
    "Passing a `link` with generic text like 'here' or 'click this' — the link needs its own discernible name, since a screen reader user tabbing through links out of context will hear only the link text, not the sentence around it.",
  ],
};
