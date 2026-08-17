import type { ComponentDocs } from "@/lib/component-docs";
import {
  EmptyCardOverTheClaim,
  MarkersCollectedIntoABar,
  QuoteCarriesThePassage,
  UnresolvedStaysVisible,
} from "./citation-ref.examples";

/**
 * Seeded from docs/design-system/component-specs.md#k6-citation-ref.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). Every do/don't here is about a marker sitting inside a
 * real sentence, and each one needs an `onJumpToSource` handler to be worth
 * opening, so the renders live in the ./citation-ref.examples client sidecar
 * and arrive here as zero-prop elements.
 */
export const CitationRefDocs: ComponentDocs = {
  whatItIs:
    "The inline marker that attaches a claim to the passage it came from — a small superscript index beside the sentence, opening a preview card that carries the quoted chunk itself. It has three states: `resolved` shows the card and can scroll a source panel to the same chunk, `loading` marks a citation whose source is still resolving, and `unresolved` marks one whose source could not be found.",
  whyItMatters:
    "A citation that only names a document asks the reader to go and find the sentence themselves, which in practice means nobody checks anything. Carrying the quoted chunk in the card is what makes the claim verifiable in place, and it is the detail NotebookLM, Spellbook and Manus all converge on. The second half of that argument is `unresolved`: a citation whose source cannot be found still renders, and still says so. Dropping it instead would leave a confident unsourced sentence behind, which is exactly how a document stops being verifiable while looking more trustworthy than before.",
  evidence: ["NotebookLM", "Spellbook", "Manus"],
  anatomy: [
    {
      slot: "citation-ref",
      note: "The marker itself — a button carrying `data-state`, superscript-aligned beside the claim.",
    },
    {
      slot: "citation-ref-source",
      note: "The document title line inside the card. Present only when `source` is passed.",
    },
    {
      slot: "citation-ref-quote",
      note: "The quoted chunk, as a blockquote. Present only when `quote` is passed — this is the part worth showing.",
    },
  ],
  usage:
    "Put a marker directly after the claim it supports, inside the sentence, rather than collecting markers into a bar under the paragraph — the sentence is the unit a reader wants to check. Always pass `quote` alongside `source`; the card is only worth opening if it holds the passage. Wire `onJumpToSource` to scroll your source panel to the same chunk the card quotes, so the card and the panel are two views of one location. When retrieval returns a reference you cannot resolve, pass `state=\"unresolved\"` rather than omitting the marker. For a whole answer's worth of claims, reach for `answer-block`, which places these markers per claim and reports coverage across them.",
  dos: [
    {
      text: "Pass the quoted chunk, not just the document name — the card exists so a reader can check the claim without leaving the answer.",
      example: <QuoteCarriesThePassage />,
    },
    {
      text: "Render an unresolvable citation as `unresolved` and leave it in place, so the gap in sourcing stays visible.",
      example: <UnresolvedStaysVisible />,
    },
  ],
  donts: [
    {
      text: "Don't gather markers into a citation bar under the paragraph — that tells a reader the paragraph came from somewhere without telling them which sentence.",
      example: <MarkersCollectedIntoABar />,
    },
    {
      text: "Don't pass `quote` without `source`, or neither: a resolved citation always opens a card, so omitting both ships an empty popup over the claim.",
      example: <EmptyCardOverTheClaim />,
    },
  ],
  accessibility: {
    keyboard: [
      "Every marker is one tab stop in every state. `loading` and `unresolved` markers are still real `<button>`s, just without an `onClick` — so Tab reaches a citation that does nothing when you press it, and nothing on the marker says so.",
      "A `resolved` marker opens its card on keyboard focus as well as on hover: the underlying preview card wires a focus interaction, so Tab is enough to bring the quote up after the primitive's open delay. Escape closes it again.",
      "There is no way into the card. The popup carries `tabIndex={-1}` and holds no controls, so the quote cannot be reached, selected or copied from the keyboard — Tab from the marker goes straight to the next word's citation.",
      "Space and Enter activate a `resolved` marker and fire `onJumpToSource`. That is the only key that does anything; there is no separate shortcut for opening the source panel without leaving the sentence.",
      "Markers are inline, so their tab stops are interleaved with the prose. A paragraph with eight citations is eight stops between it and whatever follows, and there is no way to skip them.",
    ],
    screenReader: [
      "A `resolved` marker's accessible name is `label` alone — usually a bare number, announced as \"1, button\". It carries no `aria-expanded`, no `aria-describedby` and no `aria-details`, so nothing tells a reader that a card exists or links the marker to it.",
      "The card is a portaled popup with no `role` — the preview-card primitive sets none and adds no relationship to the trigger. `source` and `quote` are announced only if the reader happens to browse to the end of the document where the portal lands, which in practice means the quote is invisible to assistive tech even though it is the reason the component exists.",
      "Only `unresolved` gets a written name: \"Citation 4 — source unavailable\". It interpolates `label` only when `label` is a string, so a ReactNode label produces \"Citation  — source unavailable\" with a hole where the number should be.",
      "`loading` announces as an ordinary button named by its label. There is no `aria-busy`, no `aria-disabled` and no live region, so a citation resolving from `loading` to `resolved` — or failing to `unresolved` — is announced as nothing.",
      "The superscript is `align-super` styling, not a `<sup>` element, so no superscript semantics reach the accessibility tree in any state.",
    ],
    focus: [
      "All three states ship `focus-visible:ring-2` on the marker, so every citation is visible on focus regardless of your global style.",
      "Focusing a resolved marker opens its card and blurring closes it. The card never takes focus, so there is nothing to restore and no focus trap to escape.",
      "`onJumpToSource` scrolls your source panel and moves no focus at all. Move it yourself to the chunk you scrolled to, or a keyboard user stays on the marker while the page moves underneath them.",
      "`disabled` reaches the marker through the native button props, and a disabled button takes no focus and dispatches no hover events — so a disabled `resolved` citation keeps its card mounted in the tree with no way to open it.",
    ],
  },
  pitfalls: [
    "Only `resolved` builds a preview card and only `resolved` calls `onJumpToSource`. In `loading` and `unresolved` the marker renders bare — but it is still a `<button>`, so it stays in the tab order and a keyboard user can focus a citation that does nothing on activation.",
    'The `unresolved` accessible name ("Citation 4 — source unavailable") only interpolates `label` when `label` is a string. Pass a plain string; a ReactNode label produces a name with a hole in it.',
    "`loading` and `unresolved` markers carry no `aria-disabled` or `disabled`, so assistive tech announces them as ordinary buttons. If your surface needs the inert-ness announced, set it yourself on the marker.",
    "The card's width comes from the underlying preview-card primitive (`w-64`), so the `max-w-sm` this component sets never actually binds. A long quote makes the card taller, never wider.",
    "`disabled` reaches the marker through the native button props, and browsers do not dispatch hover events on a disabled button — so a disabled `resolved` citation keeps its card in the tree but the reader can never open it. Prefer a non-interactive rendering to disabling a citation.",
    "There is no copy-quote affordance on this component despite the catalog entry naming one; the card is read-only. If you need copy-to-clipboard, wrap the quote yourself.",
  ],
};
