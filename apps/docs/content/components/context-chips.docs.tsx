import type { ComponentDocs } from "@/lib/component-docs";
import {
  HorizontalScrollInsteadOfOverflow,
  MarksUnresolvedTargets,
  OverflowInsteadOfScroll,
  UnresolvedRenderedAsNormal,
} from "./context-chips.examples";

/**
 * Seeded from docs/design-system/component-specs.md#d3-context-chips.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples that need interactivity
 * live in the ./context-chips.examples client sidecar and get referenced
 * here as zero-prop elements — see that file for why.
 */
export const ContextChipsDocs: ComponentDocs = {
  whatItIs:
    "A row of removable reference chips that sit above a prompt or composer — one per file, text selection, URL, or @-mention attached to the message. Each chip is a live pointer to something outside the text box, not a piece of text inside it, which is why deleting a chip removes the context rather than editing a word.",
  whyItMatters:
    "Claude, Manus, Cursor and Lovable all attach context this way because a prompt full of pasted paths and quoted text is unreadable and unremovable — a chip is auditable at a glance and removable with one click. The state that earns this component its own spec entry is `unresolved`: an @-mention or file reference whose target moved, was deleted, or expired has to say so. Silently rendering a broken pointer as if it still works is worse than not showing a chip at all, because the user has no way to know the model is missing context it appears to have.",
  evidence: ["Claude", "Manus", "Cursor", "Lovable"],
  anatomy: [
    { slot: "context-chips", note: "Root — the wrapping, flex-wrapping row of chips." },
    { slot: "context-chip", note: "One reference: icon, label, and (optionally) a remove control." },
    { slot: "context-chip-remove", note: "Sibling remove button inside a chip — never the chip itself made clickable." },
    { slot: "context-chip-overflow", note: "The '+N' summary chip that collapses references past the visible set." },
  ],
  usage:
    "Reach for it anywhere a composer accepts attachments or @-mentions that the model resolves before or during generation. Pass a `kind` per chip (`file`, `selection`, `url`, `mention`) to pick its icon, and flip `unresolved` the moment a reference's target stops resolving — don't wait for the user to notice generation quality dropped. When the set of references grows past what a row can show, collapse the tail into a single `ContextChipOverflow` count rather than letting the row scroll.",
  dos: [
    {
      text: "Flip `unresolved` the moment a target stops resolving — icon, border, strike-through and the word \"unresolved\" all change together, not colour alone.",
      example: <MarksUnresolvedTargets />,
    },
    {
      text: "Collapse references past the visible set into one overflow count chip, so the row stays scannable instead of growing forever.",
      example: <OverflowInsteadOfScroll />,
    },
  ],
  donts: [
    {
      text: "Don't render a broken reference the same way as a live one — a chip with no removed-target signal is worse than no chip, because it claims context the model no longer has.",
      example: <UnresolvedRenderedAsNormal />,
    },
    {
      text: "Don't let the row overflow into horizontal scroll — a scrolled-off chip is context the user can no longer see or remove.",
      example: <HorizontalScrollInsteadOfOverflow />,
    },
  ],
  pitfalls: [
    "Treating `unresolved` as a class-name override instead of the prop — passing a red border via `className` alone drops the icon swap, strike-through and literal \"unresolved\" text, so the state fails an axe colour-contrast-only check for anyone using assistive tech or colour-vision-deficient sighted users.",
    "Making the whole chip a `<button>` so 'click to remove' feels natural — that nests an interactive remove button inside another interactive element, the same trap `filter-bar`'s `FilterChip` solves by keeping the remove control a sibling `<button>` next to a non-interactive label, not a child of one.",
    "Passing a full file path as `label` for a deeply nested file — the chip truncates at a fixed width, and mid-path truncation can hide the part of the name (the extension, the leaf filename) that actually identifies the reference. Pass the display name the user already recognizes, not the raw path.",
  ],
};
