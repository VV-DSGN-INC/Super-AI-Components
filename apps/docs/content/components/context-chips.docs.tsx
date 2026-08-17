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
  accessibility: {
    keyboard: [
      "A chip without `onRemove` is zero tab stops. `ContextChip` is a `<span>` — the icon, the label and the word \"unresolved\" are inert text, so a row of five non-removable references is something Tab passes straight over.",
      "A chip with `onRemove` is exactly one tab stop: the X. It is a real button, so Space and Enter activate it. There is no Delete or Backspace shortcut — removing a reference from the keyboard means tabbing to its X.",
      "`ContextChipOverflow` adds one more stop. It is a plain button with no `aria-expanded` and no `aria-controls`, so nothing tells a keyboard user whether activating it expands the row, opens a menu, or does something else entirely — that is your handler's decision and yours to describe.",
      "The row is a plain flex container with no roving tabindex. Left and Right do nothing; travel between chips is Tab and Shift+Tab only, and at six removable references that is six stops before the composer below.",
      "Nothing here opens what a chip points at. There is no activation on the chip body, so a file or URL reference can be removed from the keyboard but never followed.",
    ],
    screenReader: [
      "`ContextChips` is an unlabelled `<div>` with no list or group role, so the set is never announced as \"5 references\" — a screen-reader user meets the chips one at a time with no idea how many are attached. Wrap it in your own named region if the count matters.",
      "The remove button's name is built from `label`, which is typed as a required `string` — so unlike several chips in this registry it cannot silently collapse to a generic name. It reads \"Remove report.pdf\", or \"Remove unresolved reference report.pdf\" once `unresolved` is set.",
      "`unresolved` reaches assistive tech as words, not styling: a literal \"· unresolved\" text node sits after the label, and the remove button's name changes with it. The dashed border, the strike-through and the warning glyph are the sighted half of the same signal.",
      "Every icon — the kind glyph, the warning triangle, the X — is `aria-hidden`, so none of them contributes to a name.",
      "The overflow chip names itself \"3 more references\", correctly singular at one. That count is the only thing it announces; the hidden references themselves are announced as nothing until your handler renders them.",
      "There is no live region anywhere in this component. Removing a chip, or a reference flipping to `unresolved` mid-session because its target was deleted, is announced as nothing at all — which is the exact failure the `unresolved` state was added to prevent, reintroduced for anyone not looking at the screen.",
    ],
    focus: [
      "Removing a chip unmounts the button that had focus and nothing restores it, so focus falls to `<body>` and the next Tab restarts from the top of the page. Move focus to the neighbouring chip's X, or to the composer, inside your `onRemove`.",
      "Only the remove button and the overflow chip carry a `focus-visible` ring. Everything else in the row is unfocusable, so those two are the whole visible focus story.",
    ],
  },
  pitfalls: [
    "Treating `unresolved` as a class-name override instead of the prop — passing a red border via `className` alone drops the icon swap, strike-through and literal \"unresolved\" text, so the state fails an axe colour-contrast-only check for anyone using assistive tech or colour-vision-deficient sighted users.",
    "Making the whole chip a `<button>` so 'click to remove' feels natural — that nests an interactive remove button inside another interactive element, the same trap `filter-bar`'s `FilterChip` solves by keeping the remove control a sibling `<button>` next to a non-interactive label, not a child of one.",
    "Passing a full file path as `label` for a deeply nested file — the chip truncates at a fixed width, and mid-path truncation can hide the part of the name (the extension, the leaf filename) that actually identifies the reference. Pass the display name the user already recognizes, not the raw path.",
  ],
};
